import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientActionsMenu } from "./client-actions-menu";

import { getClientStatus, getClientType } from "@/lib/client-status";

import { format } from "date-fns";
type Client = {
  id: string;

  firstName: string;
  lastName: string;

  phone: string | null;

  memberships: {
    status: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    amountPaid: number;
  }[];
  attendances: {
    id: string;
    timeIn: Date;
  }[];

  createdAt: Date;
};

type Props = {
  clients: Client[];
};

// VARIANT MAPPING FOR CLIENT TYPE
function getTypeVariant(type: string) {
  switch (type) {
    case "MEMBER":
      return "default";

    case "WALK_IN":
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

    case "INACTIVE":
      return "warning";

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
            const expiry = latestMembership?.endDate;

            const type = getClientType(Boolean(latestMembership));
            const status = getClientStatus(client);

            return (
              <TableRow key={client.id}>
                <TableCell>
                  {client.firstName} {client.lastName}
                </TableCell>

                <TableCell>{client.phone ?? "-"}</TableCell>

                <TableCell>
                  <Badge variant={getTypeVariant(type)}>
                    {" "}
                    {type === "MEMBER" ? "Member" : "Walk-In"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge variant={getStatusVariant(status)}>{status}</Badge>
                </TableCell>

                <TableCell>
                  {expiry ? format(expiry, "MMM, dd, yyyy") : "N/A"}
                </TableCell>

                <TableCell>
                  <ClientActionsMenu client={client} type={type} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
