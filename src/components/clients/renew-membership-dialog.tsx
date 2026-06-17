"use client";

import { useState, useEffect } from "react";
import { renewMembership } from "@/actions/client";

import { Repeat } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Client = {
  id: string;

  firstName: string;
  lastName: string;

  phone: string | null;

  memberships: {
    status: string;
    startDate: Date;
    endDate: Date;
    amountPaid: number;
    createdAt: Date;
  }[];
};

type Props = {
  client: Client;
};

export function RenewMembershipDialog({ client }: Props) {
  const [open, setOpen] = useState(false);
  const [membershipPlan, setMembershipPlan] = useState<
    "ONE_MONTH" | "TWO_MONTHS" | "THREE_MONTHS"
  >("ONE_MONTH");
  const [durationInDays, setDurationInDays] = useState(30);
  const [monthlyFee, setMonthlyFee] = useState(1200);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    switch (membershipPlan) {
      case "ONE_MONTH":
        setDurationInDays(30);
        break;

      case "TWO_MONTHS":
        setDurationInDays(60);
        break;

      case "THREE_MONTHS":
        setDurationInDays(90);
        break;
    }
  }, [membershipPlan]);

  const latestMembership = client.memberships[0];
  if (!latestMembership) {
    return null;
  }
  const today = new Date();
  const renewalStartDate =
    latestMembership.endDate > today ? latestMembership.endDate : today;

  const renewalEndDate = new Date(renewalStartDate);
  renewalEndDate.setDate(renewalEndDate.getDate() + durationInDays);

  const totalAmount = monthlyFee * (durationInDays / 30);

  const isExpired = latestMembership.endDate < new Date();

  const planLabel =
    membershipPlan === "ONE_MONTH"
      ? "1 Month"
      : membershipPlan === "TWO_MONTHS"
      ? "2 Months"
      : "3 Months";

  function resetForm() {
    setMembershipPlan("ONE_MONTH");
    setDurationInDays(30);
    setMonthlyFee(1200);
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true);

      await renewMembership({
        clientId: client.id,

        durationInDays,

        amountPaid: totalAmount,

        startDate: renewalStartDate,
        endDate: renewalEndDate,
      });

      toast.success(
        `${client.firstName} ${client.lastName}'s membership has been renewed`
      );

      setOpen(false);
    } catch (error) {
      console.error(error);

      toast.error("Failed to renew membership");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);

        if (!open) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Repeat />
          Renew Membership
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Renew Membership</DialogTitle>
          <DialogDescription>
            Renew membership for this client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {client.firstName} {client.lastName}
                </h3>

                <p className="text-sm text-muted-foreground">
                  Membership Renewal
                </p>
              </div>

              <Badge
                variant={
                  latestMembership.status === "ACTIVE"
                    ? "default"
                    : "destructive"
                }
              >
                {latestMembership.status}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Current Expiry</p>

                <p>{latestMembership.endDate.toLocaleDateString()}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Last Payment</p>

                <p>₱{latestMembership.amountPaid.toLocaleString()}</p>
              </div>
            </div>
          </div>
          {isExpired ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
              Membership expired on{" "}
              {latestMembership.endDate.toLocaleDateString()}. Renewal will
              start immediately.
            </div>
          ) : (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm">
              Membership is still active. Renewal will extend the current expiry
              date.
            </div>
          )}

          {/* MEMBERSHIP SETUP */}
          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <h4 className="font-medium">Membership Setup</h4>

              <p className="text-sm text-muted-foreground">
                Select a renewal plan and fee.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Plan */}
              <div>
                <Label>Membership Plan</Label>
                <Select
                  value={membershipPlan}
                  onValueChange={(value) =>
                    setMembershipPlan(
                      value as "ONE_MONTH" | "TWO_MONTHS" | "THREE_MONTHS"
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ONE_MONTH">1 Month</SelectItem>
                    <SelectItem value="TWO_MONTHS">2 Months</SelectItem>
                    <SelectItem value="THREE_MONTHS">3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fee */}
              <div>
                <Label>Monthly Fee</Label>
                <Input
                  type="number"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="rounded-lg border p-4 bg-secondary">
            <h3 className="font-medium">Renewal Summary</h3>

            <div className="space-y-1 text-sm">
              <div className="mt-1 ">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Current Expiry
                    </p>

                    <p className="font-medium">
                      {latestMembership.endDate.toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-muted-foreground">→</div>

                  <div>
                    <p className="text-xs text-muted-foreground">New Expiry</p>

                    <p className="font-medium">
                      {renewalEndDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span>{planLabel}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Fee</span>
                <span>₱{monthlyFee.toLocaleString()}</span>
              </div>

              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Total Amount</span>
                <span className="text-lg">₱{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? "Renewing..." : "Renew Membership"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
