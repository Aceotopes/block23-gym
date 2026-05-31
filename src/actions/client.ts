"use server";

import { prisma } from "@/lib/prisma";

export async function findClientByPhone(phone: string) {
  return prisma.client.findFirst({
    where: {
      phone,
    },

    include: {
      memberships: true,
    },
  });
}
