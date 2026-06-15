"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClientSchema } from "@/lib/validations/client";

// type CreateWalkInClientInput = {
//   firstName: string;
//   lastName: string;
//   phone?: string;
// };

// export async function CreateWalkInClient(data: CreateWalkInClientInput) {
//   await prisma.client.create({
//     data: {
//       firstName: data.firstName,
//       lastName: data.lastName,
//       phone: data.phone || null,
//     },
//   });

//   revalidatePath("/clients");
// }

export async function createWalkInClient(data: unknown) {
  const validated = createClientSchema.parse(data);

  await prisma.client.create({
    data: {
      firstName: validated.firstName,
      lastName: validated.lastName,
      phone: validated.phone || null,
    },
  });

  revalidatePath("/clients");
}

type CreateMemberInput = {
  firstName: string;
  lastName: string;
  phone?: string;

  durationInDays: number;
  amountPaid: number;

  startDate: Date;
  endDate: Date;
};

export async function createMember(data: CreateMemberInput) {
  await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
      },
    });

    await tx.membership.create({
      data: {
        clientId: client.id,

        durationInDays: data.durationInDays,

        amountPaid: data.amountPaid,

        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  });

  revalidatePath("/clients");
}

export async function updateClient(data: {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  createClientSchema.parse({
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
  });

  await prisma.client.update({
    where: {
      id: data.id,
    },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
    },
  });

  revalidatePath("/clients");
}
