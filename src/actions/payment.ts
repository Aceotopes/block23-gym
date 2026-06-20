"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function editPayment(data: {
  id: string;
  status?: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  paymentMethod?: "CASH" | "GCASH" | "PAYMAYA";
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Only admins can edit payment records");
  }

  const userId = session.user.id ?? null;

  await prisma.$transaction(async (tx) => {
    const before = await tx.payment.findUniqueOrThrow({
      where: { id: data.id },
    });

    await tx.payment.update({
      where: { id: data.id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.paymentMethod !== undefined && {
          paymentMethod: data.paymentMethod,
        }),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "EDIT_PAYMENT",
        entityType: "Payment",
        entityId: data.id,
        beforeState: {
          id: before.id,
          clientId: before.clientId,
          amount: before.amount.toString(),
          type: before.type,
          status: before.status,
          paymentMethod: before.paymentMethod,
          createdAt: before.createdAt.toISOString(),
        },
      },
    });
  });

  revalidatePath("/payments");
}

export type ClientPayment = {
  id: string;
  amount: number;
  type: "MEMBERSHIP" | "WALK_IN";
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  paymentMethod: "CASH" | "GCASH" | "PAYMAYA";
  createdAt: Date;
};

export async function getClientPayments(
  clientId: string
): Promise<ClientPayment[]> {
  const payments = await prisma.payment.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      type: true,
      status: true,
      paymentMethod: true,
      createdAt: true,
    },
  });

  return payments.map((p) => ({ ...p, amount: Number(p.amount) }));
}
