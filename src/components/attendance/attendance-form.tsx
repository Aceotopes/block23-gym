"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { createWalkInAttendance } from "@/actions/attendance";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AttendanceForm() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [phone, setPhone] = useState("");

  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      await createWalkInAttendance(firstName, lastName, phone);

      setFirstName("");
      setLastName("");
      setPhone("");

      router.refresh();
    });
  }

  return (
    <div className="max-w-md space-y-4 rounded-xl border bg-background p-6">
      <Input
        placeholder="First name"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
      />

      <Input
        placeholder="Last name (optional)"
        value={lastName}
        onChange={(event) => setLastName(event.target.value)}
      />

      <Input
        placeholder="Phone (optional)"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />

      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Checking in..." : "Check In"}
      </Button>
    </div>
  );
}
