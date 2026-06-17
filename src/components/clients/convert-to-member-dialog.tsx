"use client";

import { useState, useEffect } from "react";
import { convertToMember } from "@/actions/client";
import { toast } from "sonner";

import { CircleFadingArrowUp } from "lucide-react";
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

type Props = {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    createdAt: Date;
    attendances: {
      id: string;
      timeIn: Date;
    }[];
  };
};

export function ConvertToMemberDialog({ client }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [durationInDays, setDurationInDays] = useState(30);
  const [monthlyFee, setMonthlyFee] = useState(1200);
  const [membershipPlan, setMembershipPlan] = useState<
    "ONE_MONTH" | "TWO_MONTHS" | "THREE_MONTHS"
  >("ONE_MONTH");

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

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationInDays);

  const totalAmount = monthlyFee * (durationInDays / 30);
  const months = durationInDays / 30;
  const lastVisit = client.attendances[0];

  async function handleSubmit() {
    try {
      setIsSubmitting(true);

      await convertToMember({
        clientId: client.id,

        durationInDays,

        amountPaid: totalAmount,

        startDate,
        endDate,
      });

      toast.success(`${client.firstName} ${client.lastName} is now a member`, {
        description: "The client has been converted successfully.",
      });

      setOpen(false);
    } catch (error) {
      console.error(error);

      toast.error("Failed to convert client to member");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-sky-500"
        >
          <CircleFadingArrowUp />
          Convert To Member
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Convert To Member</DialogTitle>

          <DialogDescription>
            Create a membership for this walk-in client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {client.firstName} {client.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">Walk-In Client</p>
              </div>

              <Badge variant="secondary">Walk-In</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Contact Number</p>
                <p>{client.phone ?? "—"}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Total Visits</p>

                <p>{client.attendances.length}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Last Visit</p>

                <p>
                  {lastVisit ? lastVisit.timeIn.toLocaleDateString() : "Never"}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Registered</p>

                <p>{client.createdAt.toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <h4 className="font-medium">Membership Setup</h4>

              <p className="text-sm text-muted-foreground">
                Configure the membership plan.
              </p>
            </div>

            {/* Plan + Fee */}
            <div className="grid grid-cols-2 gap-4">
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

              {/* Membership Fee */}
              <div>
                <Label>Monthly Membership Fee</Label>

                <Input
                  type="number"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          {/* Summary */}
          <div className="rounded-lg border bg-secondary p-4">
            <h4 className="font-medium">Membership Summary</h4>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Duration</span>
                <span>{durationInDays} days</span>
              </div>

              <div className="flex justify-between">
                <span>Start Date</span>
                <span>{startDate.toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Expiry Date</span>
                <span>{endDate.toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total Amount</span>
                <span>₱{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Converting..." : "Convert To Member"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
