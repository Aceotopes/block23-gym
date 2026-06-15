"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getClientStatus, getClientType } from "@/lib/client-status";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  client: {
    id: string;

    firstName: string;
    lastName: string;

    phone: string | null;

    createdAt: Date;

    memberships: {
      status: string;
      startDate: Date;
      endDate: Date;
      amountPaid: number;
    }[];

    attendances: {
      id: string;
      timeIn: Date;
    }[];
  };
};

export function ViewClientDialog({ client }: Props) {
  const latestMembership = client.memberships[0];
  const expiry = latestMembership?.endDate;
  const membershipStart = latestMembership?.startDate;
  const registerDate = client?.createdAt;

  const type = getClientType(Boolean(latestMembership));
  const status = getClientStatus(client);

  const totalVisits = client.attendances.length;
  const lastVisit = client.attendances[0];

  const durationLeft = latestMembership
    ? Math.max(
        0,
        Math.floor(
          (latestMembership.endDate.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          View Client
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Client Information</DialogTitle>
          <DialogDescription>
            View client details and membership information.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {client.firstName} {client.lastName}
            </h2>

            <p className="text-sm text-muted-foreground">
              Registered {format(registerDate, "MMMM dd, yyyy")}
            </p>
          </div>

          <div className="flex gap-2">
            <Badge variant="secondary">
              {type === "MEMBER" ? "MEMBER" : "WALK-IN"}
            </Badge>

            <Badge
              variant={
                status === "ACTIVE"
                  ? "default"
                  : status === "EXPIRED"
                  ? "destructive"
                  : "warning"
              }
            >
              {status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase">
                Total Visits
              </p>

              <p className="mt-2 text-3xl font-bold">{totalVisits}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase">
                Last Visit
              </p>

              <p className="mt-2 font-medium">
                {lastVisit ? format(lastVisit.timeIn, "MMM dd, yyyy") : "Never"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase">
                Days Left
              </p>

              <p className="mt-2 text-3xl font-bold">{durationLeft ?? "-"}</p>
            </CardContent>
          </Card>
        </div>
        {latestMembership && (
          <Card>
            <CardHeader>
              <CardTitle>Membership Information</CardTitle>

              <CardDescription>
                Current membership details and validity.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Start Date */}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Membership Start
                  </p>

                  <p className="font-medium">
                    {format(membershipStart!, "MMMM dd, yyyy")}
                  </p>
                </div>

                {/* Expiry Date */}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Membership Expiry
                  </p>

                  <p className="font-medium">
                    {format(expiry!, "MMMM dd, yyyy")}
                  </p>
                </div>

                {/* Amount Paid */}
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>

                  <p className="font-medium">
                    ₱{latestMembership.amountPaid.toLocaleString()}
                  </p>
                </div>

                {/* Duration Left */}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Days Remaining
                  </p>

                  <p
                    className={
                      durationLeft === 0
                        ? "font-medium text-destructive"
                        : "font-medium"
                    }
                  >
                    {durationLeft === 0 ? "Expired" : `${durationLeft} days`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}

{
  /* <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>

            <p>
              {client.firstName} {client.lastName}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Contact Number</p>

            <p>{client.phone ?? "—"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Type</p>

            <p>{type === "MEMBER" ? "Member" : "Walk-In"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Status</p>

            <p>{status}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Total Visits</p>

            <p>{totalVisits}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Last Visit</p>
            <p>
              {lastVisit ? format(lastVisit.timeIn, "MMM dd, yyyy") : "Never"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Registration Date</p>

            <p>{registerDate ? format(registerDate, "MMM dd, yyyy") : "-"}</p>
          </div>

          {latestMembership && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">
                  Membership Start
                </p>

                <p>
                  {membershipStart
                    ? format(membershipStart, "MMM dd, yyyy")
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Membership Expiry
                </p>

                <p>{expiry ? format(expiry, "MMM dd, yyyy") : "-"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Duration Left</p>

                <p>{durationLeft} days</p>
              </div>
            </>
          )}
        </div> */
}
