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

  guestName: string | null;

  type: string;

  timeIn: Date;
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

            <TableHead>Type</TableHead>

            <TableHead>Time In</TableHead>

            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {attendances.map((attendance) => (
            <TableRow key={attendance.id}>
              <TableCell>{attendance.guestName ?? "Member"}</TableCell>

              <TableCell>{attendance.type}</TableCell>

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
