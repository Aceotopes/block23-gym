import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TimeOutButton } from "./time-out-button";
import { format } from "date-fns";

type Attendance = {
  id: string;
  visitType: string;
  timeIn: Date;
  client: {
    firstName: string;
    lastName: string;
    phone: string | null;
  };
};

type Props = {
  attendances: Attendance[];
};

function VisitTypeBadge({ visitType }: { visitType: string }) {
  if (visitType === "MEMBER")
    return <Badge variant="default">Member</Badge>;
  return <Badge variant="secondary">Walk-In</Badge>;
}

export function AttendanceTable({ attendances }: Props) {
  if (attendances.length === 0) {
    return (
      <div className="rounded-xl border bg-background py-16 text-center text-sm text-muted-foreground">
        No one is currently checked in.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Time In</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {attendances.map((attendance) => (
            <TableRow key={attendance.id}>
              <TableCell className="font-medium">
                {attendance.client.firstName} {attendance.client.lastName}
              </TableCell>

              <TableCell className="text-muted-foreground">
                {attendance.client.phone ?? "—"}
              </TableCell>

              <TableCell>
                <VisitTypeBadge visitType={attendance.visitType} />
              </TableCell>

              <TableCell className="text-muted-foreground">
                {format(attendance.timeIn, "h:mm a")}
              </TableCell>

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
