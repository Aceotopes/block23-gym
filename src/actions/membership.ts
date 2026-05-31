"use server";

import { prisma } from "@/lib/prisma";

export async function createMembership(clientId: string) {
  const startDate = new Date();

  const endDate = new Date();

  endDate.setMonth(endDate.getMonth() + 1);

  await prisma.membership.create({
    data: {
      clientId,

      startDate,

      endDate,

      status: "ACTIVE",
    },
  });
}
