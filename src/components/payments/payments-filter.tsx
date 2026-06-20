"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
] as const;

export function PaymentsFilter({ currentPeriod }: { currentPeriod: string }) {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      {PERIODS.map((p) => (
        <Button
          key={p.value}
          variant={currentPeriod === p.value ? "default" : "outline"}
          size="sm"
          onClick={() => router.push(`/payments?period=${p.value}`)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
