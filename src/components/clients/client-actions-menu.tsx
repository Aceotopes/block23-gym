"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ViewClientDialog } from "./view-client-dialog";
import { EditClientDialog } from "./edit-client-dialog";
import { ConvertToMemberDialog } from "./convert-to-member-dialog";
import { RenewMembershipDialog } from "./renew-membership-dialog";
import { DeleteClientDialog } from "./delete-client-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type Client = {
  id: string;

  firstName: string;
  lastName: string;

  phone: string | null;

  createdAt: Date;

  memberships: {
    status: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    amountPaid: number;
  }[];

  attendances: {
    id: string;
    timeIn: Date;
  }[];
};
type Props = {
  client: Client;

  type: "WALK_IN" | "MEMBER";
};

export function ClientActionsMenu({ client, type }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-45">
        <ViewClientDialog client={client} />

        <EditClientDialog client={client} />
        <DeleteClientDialog client={client} />

        <DropdownMenuSeparator />
        {type === "WALK_IN" && <ConvertToMemberDialog client={client} />}
        {type === "MEMBER" && <RenewMembershipDialog client={client} />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
