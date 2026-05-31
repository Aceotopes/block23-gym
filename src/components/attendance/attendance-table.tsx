import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TimeOutButton } from "./time-out-button";

type Attendance = {
  id: string;

  timeIn: Date;

  client: {
    firstName: string;

    lastName: string | null;

    phone: string | null;
  };
};

type Props = {
  attendances: Attendance[];
};

export function AttendanceTable({ attendances }: Props) {
  return (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>

            <TableHead>Phone</TableHead>

            <TableHead>Time In</TableHead>

            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {attendances.map((attendance) => (
            <TableRow key={attendance.id}>
              <TableCell>
                {attendance.client.firstName} {attendance.client.lastName}
              </TableCell>

              <TableCell>{attendance.client.phone ?? "-"}</TableCell>

              <TableCell>{attendance.timeIn.toLocaleString()}</TableCell>

              <TableCell>
                <TimeOutButton attendanceId={attendance.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
