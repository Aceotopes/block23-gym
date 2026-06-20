import { prisma } from "@/lib/prisma";

import { AttendanceForm } from "@/components/attendance/attendance-form";
import { AttendanceTable } from "@/components/attendance/attendance-table";

export default async function AttendancePage() {
  const attendances = await prisma.attendance.findMany({
    where: {
      timeOut: null,
    },

    select: {
      id: true,
      visitType: true,
      timeIn: true,
      client: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },

    orderBy: {
      timeIn: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">
          {attendances.length === 0
            ? "No one is currently checked in"
            : `${attendances.length} ${attendances.length === 1 ? "person" : "people"} currently in the gym`}
        </p>
      </div>

      <AttendanceForm />

      <AttendanceTable attendances={attendances} />
    </div>
  );
}
