"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ViewClientDialog } from "./view-client-dialog";
import { EditClientDialog } from "./edit-client-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

export function ClientActionsMenu({ client }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <ViewClientDialog client={client} />

        <EditClientDialog client={client} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
