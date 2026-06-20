"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { format } from "date-fns";

import { getClientPayments, type ClientPayment } from "@/actions/payment";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
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

export function ClientPaymentHistoryDialog({ client }: { client: Client }) {
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleOpenChange(open: boolean) {
    if (open) {
      setIsLoading(true);
      try {
        const data = await getClientPayments(client.id);
        setPayments(data);
      } finally {
        setIsLoading(false);
      }
    } else {
      setPayments([]);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <CreditCard />
          Payment History
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Payment History — {client.firstName} {client.lastName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : payments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No payment records found.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {payments.map((p) => {
              const statusConfig = STATUS_CONFIG[p.status] ?? {
                label: p.status,
                variant: "outline" as const,
              };

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {format(p.createdAt, "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(p.createdAt, "h:mm a")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        p.type === "MEMBERSHIP" ? "default" : "secondary"
                      }
                    >
                      {p.type === "MEMBERSHIP" ? "Membership" : "Walk-In"}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
                    </span>
                    <span className="font-medium">
                      ₱{p.amount.toLocaleString()}
                    </span>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
