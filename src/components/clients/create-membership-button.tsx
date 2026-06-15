// NOT USED

"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { createMembership } from "@/actions/membership";

import { Button } from "@/components/ui/button";

type Props = {
  clientId: string;
};

export function CreateMembershipButton({ clientId }: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  function handleCreateMembership() {
    startTransition(async () => {
      await createMembership(clientId);

      router.refresh();
    });
  }

  return (
    <Button size="sm" onClick={handleCreateMembership} disabled={isPending}>
      {isPending ? "Creating..." : "Create Membership"}
    </Button>
  );
}
