"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type CreateClientInput = {
  firstName: string;
  lastName: string;
  phone?: string;

  registrationType: "WALK_IN" | "MEMBER";

  durationInDays?: number;
  amountPaid?: number;
};

export async function createClient(data: CreateClientInput) {
  // implementation later
}
