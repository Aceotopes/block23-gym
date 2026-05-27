"use server";

import { prisma } from "@/lib/prisma";

export async function createWalkInAttendance(guestName: string) {
  if (!guestName.trim()) {
    throw new Error("Guest name is required");
  }

  await prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.create({
      data: {
        guestName,
        type: "WALK_IN",
      },
    });

    await tx.payment.create({
      data: {
        attendanceId: attendance.id,

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
