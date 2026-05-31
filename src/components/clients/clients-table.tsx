import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateMembershipButton } from "./create-membership-button";

type Client = {
  id: string;

  firstName: string;

  lastName: string | null;

  phone: string | null;

  memberships: {
    status: string;
  }[];
};

type Props = {
  clients: Client[];
};

export function ClientsTable({ clients }: Props) {
  return (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Membership</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {clients.map((client) => {
            const activeMembership = client.memberships.find(
              (membership) => membership.status === "ACTIVE"
            );

            return (
              <TableRow key={client.id}>
                <TableCell>
                  {client.firstName} {client.lastName}
                </TableCell>

                <TableCell>{client.phone ?? "-"}</TableCell>

                <TableCell>
                  {activeMembership ? "Active" : "No Membership"}
                </TableCell>

                <TableCell>
                  {!activeMembership && (
                    <CreateMembershipButton clientId={client.id} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
