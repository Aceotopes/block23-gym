"use client";

import { useState, useTransition } from "react";
import { createWalkInAttendance } from "@/actions/attendance";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AttendanceForm() {
  const [guestName, setGuestName] = useState("");

  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  function handleSubmit() {
    startTransition(async () => {
      await createWalkInAttendance(guestName);

      setGuestName("");
      router.refresh();
    });
  }

  return (
    <div className="max-w-md space-y-4 rounded-xl border bg-background p-6">
      <Input
        placeholder="Guest name"
        value={guestName}
        onChange={(event) => setGuestName(event.target.value)}
      />

      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Checking in..." : "Check In"}
      </Button>
    </div>
  );
}
