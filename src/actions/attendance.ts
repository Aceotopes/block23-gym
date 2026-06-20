"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { formatName } from "@/lib/format-name";


export type ClientSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActiveMember: boolean;
  isExpiredMember: boolean;
  membershipEndDate: Date | null;
};

export async function searchClients(
  query: string
): Promise<ClientSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const clients = await prisma.client.findMany({
    where: {
      deletedAt: null,
      OR: [
        { firstName: { contains: trimmed, mode: "insensitive" } },
        { lastName: { contains: trimmed, mode: "insensitive" } },
        { phone: { contains: trimmed } },
      ],
    },
    include: {
      memberships: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, endDate: true },
      },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 10,
  });

  const now = new Date();

  return clients.map((client) => {
    const latest = client.memberships[0];
    const isActiveMember = Boolean(
      latest && latest.status === "ACTIVE" && latest.endDate > now
    );
    const isExpiredMember = Boolean(latest && !isActiveMember);

    return {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      isActiveMember,
      isExpiredMember,
      membershipEndDate: latest?.endDate ?? null,
    };
  });
}

export type CheckInInput =
  | { clientId: string; paymentMethod?: "CASH" | "GCASH" | "PAYMAYA" }
  | {
      firstName: string;
      lastName: string;
      phone?: string;
      paymentMethod: "CASH" | "GCASH" | "PAYMAYA";
    };

export async function checkIn(data: CheckInInput) {
  const settings = await prisma.gymSettings.findUniqueOrThrow({
    where: { id: "default-settings" },
    select: { defaultWalkInFee: true },
  });
  const walkInFee = Number(settings.defaultWalkInFee);

  await prisma.$transaction(async (tx) => {
    let clientId: string;
    let displayName: string;

    if ("clientId" in data) {
      const client = await tx.client.findUniqueOrThrow({
        where: { id: data.clientId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
      });
      clientId = client.id;
      displayName = `${client.firstName} ${client.lastName}`.trim();
    } else {
      const firstName = formatName(data.firstName);
      const lastName = data.lastName ? formatName(data.lastName) : "";

      // Reuse existing client if name matches — prevents duplicate records
      const existing = await tx.client.findFirst({
        where: { firstName, lastName, deletedAt: null },
      });

      if (existing) {
        clientId = existing.id;
        displayName = `${existing.firstName} ${existing.lastName}`.trim();
      } else {
        const created = await tx.client.create({
          data: { firstName, lastName, phone: data.phone ?? null },
        });
        clientId = created.id;
        displayName = `${firstName} ${lastName}`.trim();
      }
    }

    // Guard: prevent double check-in
    const alreadyIn = await tx.attendance.findFirst({
      where: { clientId, timeOut: null },
    });
    if (alreadyIn) {
      throw new Error(`${displayName} is already checked in`);
    }

    // Determine visit type from current membership status
    const latestMembership = await tx.membership.findFirst({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      select: { status: true, endDate: true },
    });

    const isActiveMember = Boolean(
      latestMembership &&
        latestMembership.status === "ACTIVE" &&
        latestMembership.endDate > new Date()
    );

    const visitType = isActiveMember ? "MEMBER" : "WALK_IN";

    await tx.attendance.create({
      data: { clientId, visitType },
    });

    if (visitType === "WALK_IN") {
      const pm = data.paymentMethod;
      if (!pm) throw new Error("Payment method is required for walk-ins");

      await tx.payment.create({
        data: {
          clientId,
          amount: walkInFee,
          type: "WALK_IN",
          status: "PAID",
          paymentMethod: pm,
        },
      });
    }
  });

  revalidatePath("/attendance");
}

export async function timeOutAttendance(attendanceId: string) {
  await prisma.attendance.update({
    where: { id: attendanceId },
    data: { timeOut: new Date() },
  });

  revalidatePath("/attendance");
}
