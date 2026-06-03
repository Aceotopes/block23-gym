"use client";

import { useState, useEffect } from "react";
import { createWalkInClient } from "@/actions/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateClientDialog() {
  async function handleSubmit() {
    if (registrationType !== "WALK_IN") {
      return;
    }

    try {
      await createWalkInClient({
        firstName,
        lastName,
        phone,
      });

      setOpen(false);

      setFirstName("");
      setLastName("");
      setPhone("");
    } catch (error) {
      console.error(error);

      alert("Please check form.");
    }
  }
  const [open, setOpen] = useState(false);

  const [registrationType, setRegistrationType] = useState<
    "WALK_IN" | "MEMBER"
  >("WALK_IN");

  //   TEMP VALUES FOR MEMBERSHIP (HARD CODED. CONNECT TO GYM SETTINGS LATER)
  const [membershipPlan, setMembershipPlan] = useState<
    "ONE_MONTH" | "TWO_MONTHS" | "THREE_MONTHS"
  >("ONE_MONTH");
  const [durationInDays, setDurationInDays] = useState(30);
  const [monthlyFee, setMonthlyFee] = useState(1200);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // MEMBERSHIP SUMMARY
  const startDate = new Date();

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationInDays);

  const formattedStartDate = startDate.toLocaleDateString();
  const formattedEndDate = endDate.toLocaleDateString();

  const months = durationInDays / 30;
  const totalAmount = monthlyFee * months;

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Client</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register Client</DialogTitle>
          <DialogDescription>
            Create a walk-in client or register a new member.
          </DialogDescription>
        </DialogHeader>

        {/* REGISTRATION FORM */}
        <div className="space-y-6 ">
          <div>
            <Tabs
              value={registrationType}
              onValueChange={(value) =>
                setRegistrationType(value as "WALK_IN" | "MEMBER")
              }
            >
              <TabsList className="grid w-full grid-cols-2" variant="line">
                <TabsTrigger value="WALK_IN">Walk-In</TabsTrigger>

                <TabsTrigger value="MEMBER">Member</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="space-y-4 ">
            <div>
              <h3 className="font-medium">Client Information</h3>

              <p className="text-sm text-muted-foreground">
                Basic client details
              </p>
            </div>

            {/*WALK-IN REGISTRATION*/}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Juan"
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dela Cruz"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09171234567"
              />
            </div>
          </div>
          {/* MEMBER REGISTRATION */}
          <div className="space-y-2">
            {registrationType === "MEMBER" && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <h3 className="font-medium">Membership Information</h3>

                  <p className="text-sm text-muted-foreground">
                    Membership setup and payment
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <Label>Membership Fee (₱)</Label>
                    <Input
                      type="number"
                      value={monthlyFee}
                      onChange={(e) => setMonthlyFee(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* MEMBERSHIP SUMMARY */}
                <div className="rounded-lg border bg-secondary p-4">
                  <h3 className="font-medium">Membership Summary</h3>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date</span>
                      <span>{formattedStartDate}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date</span>
                      <span>{formattedEndDate}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span>
                        {months} Month{months > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Fee</span>
                      <span>₱{monthlyFee.toLocaleString()}</span>
                    </div>

                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>Total Amount</span>
                      <span>₱{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleSubmit}>
              {registrationType === "MEMBER"
                ? "Register Member"
                : "Register Walk-In"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
