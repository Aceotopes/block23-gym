import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditPaymentDialog } from "./edit-payment-dialog";

type Payment = {
  id: string;
  amount: number;
  type: "MEMBERSHIP" | "WALK_IN";
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  paymentMethod: "CASH" | "GCASH" | "PAYMAYA";
  createdAt: Date;
  client: {
    firstName: string;
    lastName: string;
  };
};

type Props = {
  payments: Payment[];
  isAdmin: boolean;
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PAID: { label: "Paid", variant: "default" },
  PENDING: { label: "Pending", variant: "outline" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "secondary" },
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  GCASH: "GCash",
  PAYMAYA: "PayMaya",
};

export function PaymentsTable({ payments, isAdmin }: Props) {
  if (payments.length === 0) {
    return (
      <div className="rounded-xl border bg-background py-16 text-center text-sm text-muted-foreground">
        No transactions found for this period.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          {isAdmin && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p) => {
          const statusConfig = STATUS_CONFIG[p.status] ?? {
            label: p.status,
            variant: "outline" as const,
          };

          return (
            <TableRow key={p.id}>
              <TableCell>
                <p className="text-sm">{format(p.createdAt, "MMM d, yyyy")}</p>
                <p className="text-xs text-muted-foreground">
                  {format(p.createdAt, "h:mm a")}
                </p>
              </TableCell>
              <TableCell className="font-medium">
                {p.client.firstName} {p.client.lastName}
              </TableCell>
              <TableCell>
                <Badge
                  variant={p.type === "MEMBERSHIP" ? "default" : "secondary"}
                >
                  {p.type === "MEMBERSHIP" ? "Membership" : "Walk-In"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
              </TableCell>
              <TableCell className="font-medium">
                ₱{p.amount.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </TableCell>
              {isAdmin && (
                <TableCell>
                  <EditPaymentDialog
                    payment={{
                      id: p.id,
                      status: p.status,
                      paymentMethod: p.paymentMethod,
                      type: p.type,
                      amount: p.amount,
                    }}
                  />
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
