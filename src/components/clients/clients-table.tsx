import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateMembershipButton } from "./create-membership-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { format } from "date-fns";
type Client = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  memberships: {
    status: string;
    endDate: Date;
    createdAt: Date;
  }[];
};

type Props = {
  clients: Client[];
};

// VARIANT MAPPING FOR CLIENT TYPE
function getTypeVariant(type: string) {
  switch (type) {
    case "Member":
      return "default";

    case "Walk-In":
      return "secondary";

    default:
      return "outline";
  }
}

// VARIANT MAPPING FOR CLIENT STATUS
function getStatusVariant(status: string) {
  switch (status) {
    case "ACTIVE":
      return "default";

    case "EXPIRED":
      return "destructive";

    case "CANCELLED":
      return "secondary";

    default:
      return "outline";
  }
}

export function ClientsTable({ clients }: Props) {
  return (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact Number</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {clients.map((client) => {
            const latestMembership = client.memberships[0];
            const type = latestMembership ? "Member" : "Walk-In";
            const status = latestMembership?.status ?? "N/A";
            const expiry = latestMembership?.endDate;

            return (
              <TableRow key={client.id}>
                <TableCell>
                  {client.firstName} {client.lastName}
                </TableCell>

                <TableCell>{client.phone ?? "-"}</TableCell>

                <TableCell>
                  <Badge variant={getTypeVariant(type)}>{type}</Badge>
                </TableCell>

                <TableCell>
                  <Badge variant={getStatusVariant(status)}>{status}</Badge>
                </TableCell>

                <TableCell>
                  {expiry ? format(expiry, "MMM, dd, yyyy") : "-"}
                </TableCell>

                <TableCell>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
