"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);

  const [registrationType, setRegistrationType] = useState<
    "WALK_IN" | "MEMBER"
  >("WALK_IN");

  //   TEMP VALUES FOR MEMBERSHIP (HARD CODED. CONNECT TO GYM SETTINGS LATER)
  const [durationInDays, setDurationInDays] = useState(30);
  const [amountPaid, setAmountPaid] = useState(1200);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

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
                    <Label>Duration (Days)</Label>
                    <Input
                      type="number"
                      value={durationInDays}
                      onChange={(e) =>
                        setDurationInDays(Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <Label>Membership Fee (₱)</Label>
                    <Input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={() => {
                console.log({
                  firstName,
                  lastName,
                  phone,
                  registrationType,
                  durationInDays,
                  amountPaid,
                });
              }}
            >
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
