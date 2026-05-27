"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { timeOutAttendance } from "@/actions/attendance";

import { Button } from "@/components/ui/button";

type Props = {
  attendanceId: string;
};

export function TimeOutButton({ attendanceId }: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  function handleTimeOut() {
    startTransition(async () => {
      await timeOutAttendance(attendanceId);

      router.refresh();
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleTimeOut}
      disabled={isPending}
    >
      {isPending ? "Processing..." : "Time Out"}
    </Button>
  );
}
