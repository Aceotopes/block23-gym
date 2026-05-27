import { prisma } from "@/lib/prisma";

import { AttendanceForm } from "@/components/attendance/attendance-form";

import { AttendanceTable } from "@/components/attendance/attendance-table";

export default async function AttendancePage() {
  const attendances = await prisma.attendance.findMany({
    where: {
      timeOut: null,
    },

    orderBy: {
      timeIn: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>

        <p className="text-muted-foreground">Live gym attendance monitoring</p>
      </div>

      <AttendanceForm />

      <AttendanceTable attendances={attendances} />
    </div>
  );
}
