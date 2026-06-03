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
