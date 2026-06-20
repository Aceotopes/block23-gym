"use server";

import { prisma } from "@/lib/prisma";

export async function createWalkInAttendance(
  firstName: string,
  lastName?: string,
  phone?: string
) {
  if (!firstName.trim()) {
    throw new Error("First name is required");
  }

  await prisma.$transaction(async (tx) => {
    // Create client

    const client = await tx.client.create({
      data: {
        firstName,
        lastName: lastName ?? "",
        phone: phone ?? null,
      },
    });

    // Create attendance
    // ATT-02: visitType set to WALK_IN here as a minimal fix; full rebuild in Phase 2

    await tx.attendance.create({
      data: {
        clientId: client.id,
        visitType: "WALK_IN",
      },
    });

    // Create payment

    await tx.payment.create({
      data: {
        clientId: client.id,

        amount: 100,

        type: "WALK_IN",

        status: "PAID",
      },
    });
  });
}

export async function timeOutAttendance(attendanceId: string) {
  await prisma.attendance.update({
    where: {
      id: attendanceId,
    },

    data: {
      timeOut: new Date(),
    },
  });
}
