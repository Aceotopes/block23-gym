"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { Search, UserPlus, ArrowLeft, User, Phone } from "lucide-react";
import { format } from "date-fns";

import {
  searchClients,
  checkIn,
  type ClientSearchResult,
} from "@/actions/attendance";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PaymentMethod = "CASH" | "GCASH" | "PAYMAYA";

type Mode =
  | { type: "search" }
  | { type: "confirm"; client: ClientSearchResult }
  | { type: "new-walkin" };

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "GCASH", label: "GCash" },
  { value: "PAYMAYA", label: "PayMaya" },
];

const WALK_IN_FEE = 100;

function ClientStatusBadge({ client }: { client: ClientSearchResult }) {
  if (client.isActiveMember)
    return <Badge variant="default">Active Member</Badge>;
  if (client.isExpiredMember)
    return <Badge variant="destructive">Expired</Badge>;
  return <Badge variant="secondary">Walk-In</Badge>;
}

function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PaymentMethod | null;
  onChange: (v: PaymentMethod) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Payment Method</Label>
      <div className="flex gap-2">
        {PAYMENT_METHODS.map((method) => (
          <Button
            key={method.value}
            type="button"
            variant={value === method.value ? "default" : "outline"}
            className="flex-1"
            onClick={() => onChange(method.value)}
          >
            {method.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function AttendanceForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<Mode>({ type: "search" });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 250);
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [newWalkIn, setNewWalkIn] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    searchClients(debouncedQuery)
      .then((data) => {
        if (!cancelled) setSearchResults(data);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  function resetForm() {
    setMode({ type: "search" });
    setSearchQuery("");
    setSearchResults([]);
    setPaymentMethod(null);
    setNewWalkIn({ firstName: "", lastName: "", phone: "" });
  }

  function handleSelectClient(client: ClientSearchResult) {
    setMode({ type: "confirm", client });
    setPaymentMethod(null);
  }

  function handleNewWalkIn() {
    setMode({ type: "new-walkin" });
    setPaymentMethod(null);
    // Pre-fill first name from current search query
    if (searchQuery.trim()) {
      setNewWalkIn((prev) => ({ ...prev, firstName: searchQuery.trim() }));
    }
  }

  function handleCheckIn() {
    if (mode.type === "confirm") {
      const needsPayment = !mode.client.isActiveMember;
      if (needsPayment && !paymentMethod) {
        toast.error("Please select a payment method");
        return;
      }
    } else if (mode.type === "new-walkin") {
      if (!newWalkIn.firstName.trim()) {
        toast.error("First name is required");
        return;
      }
      if (!paymentMethod) {
        toast.error("Please select a payment method");
        return;
      }
    } else {
      return;
    }

    const pm = paymentMethod;

    startTransition(async () => {
      try {
        if (mode.type === "confirm") {
          await checkIn({
            clientId: mode.client.id,
            paymentMethod: pm ?? undefined,
          });
        } else if (mode.type === "new-walkin") {
          await checkIn({
            firstName: newWalkIn.firstName.trim(),
            lastName: newWalkIn.lastName.trim(),
            phone: newWalkIn.phone.trim() || undefined,
            paymentMethod: pm!,
          });
        }

        toast.success("Checked in successfully");
        resetForm();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Check-in failed");
      }
    });
  }

  const showSearchResults =
    mode.type === "search" && debouncedQuery.trim().length >= 2;

  return (
    <Card className="max-w-md">
      <CardHeader className="pb-4">
        <CardTitle>
          {mode.type === "search" && "Check In"}
          {mode.type === "confirm" && "Confirm Check-In"}
          {mode.type === "new-walkin" && "New Walk-In"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── SEARCH MODE ── */}
        {mode.type === "search" && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {/* Results */}
            {showSearchResults && (
              <div className="space-y-1">
                {isSearching && (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    Searching...
                  </p>
                )}

                {!isSearching && searchResults.length === 0 && (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    No clients found
                  </p>
                )}

                {!isSearching &&
                  searchResults.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="flex w-full items-center justify-between rounded-lg border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client.phone ?? "No phone"}
                          </p>
                        </div>
                      </div>
                      <ClientStatusBadge client={client} />
                    </button>
                  ))}
              </div>
            )}

            {/* New walk-in option */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleNewWalkIn}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              New Walk-In
            </Button>
          </>
        )}

        {/* ── CONFIRM EXISTING CLIENT ── */}
        {mode.type === "confirm" && (
          <>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Change client
            </button>

            {/* Client card */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {mode.client.firstName} {mode.client.lastName}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {mode.client.phone ?? "No phone"}
                    </p>
                    {mode.client.isActiveMember &&
                      mode.client.membershipEndDate && (
                        <p className="text-xs text-muted-foreground">
                          Expires{" "}
                          {format(mode.client.membershipEndDate, "MMM d, yyyy")}
                        </p>
                      )}
                  </div>
                </div>
                <ClientStatusBadge client={mode.client} />
              </div>
            </div>

            {/* Check-in type summary */}
            {mode.client.isActiveMember ? (
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                <p className="font-medium">Member Check-In</p>
                <p className="text-muted-foreground">No payment required</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                  <p className="font-medium">
                    {mode.client.isExpiredMember
                      ? "Walk-In (expired member)"
                      : "Walk-In"}
                  </p>
                  <p className="text-muted-foreground">
                    Fee: ₱{WALK_IN_FEE.toLocaleString()}.00
                  </p>
                </div>

                <PaymentMethodSelector
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                />
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleCheckIn}
              disabled={isPending}
            >
              {isPending ? "Checking in..." : "Confirm Check-In"}
            </Button>
          </>
        )}

        {/* ── NEW WALK-IN ── */}
        {mode.type === "new-walkin" && (
          <>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to search
            </button>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={newWalkIn.firstName}
                  onChange={(e) =>
                    setNewWalkIn((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last name (optional)"
                  value={newWalkIn.lastName}
                  onChange={(e) =>
                    setNewWalkIn((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Phone (optional)"
                  value={newWalkIn.phone}
                  onChange={(e) =>
                    setNewWalkIn((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium">Walk-In Fee</p>
              <p className="text-muted-foreground">
                ₱{WALK_IN_FEE.toLocaleString()}.00
              </p>
            </div>

            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
            />

            <Button
              className="w-full"
              onClick={handleCheckIn}
              disabled={isPending}
            >
              {isPending ? "Checking in..." : "Confirm Check-In"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
