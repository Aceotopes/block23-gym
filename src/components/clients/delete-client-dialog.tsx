"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteClient } from "@/actions/client";

import {
  AlertTriangle,
  User,
  CreditCard,
  CalendarDays,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

type Props = {
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export function DeleteClientDialog({ client }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    try {
      setIsSubmitting(true);

      await deleteClient(client.id);

      toast.success("Client deleted successfully");
    } catch (error) {
      console.error(error);

      toast.error("Failed to delete client");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-destructive"
        >
          <Trash2 />
          Delete Client
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>

          <AlertDialogTitle className="w-full text-center text-xl">
            Permanently Delete Client
          </AlertDialogTitle>
          <AlertDialogDescription className="w-full text-center">
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Client Preview */}

        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-3 ">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5" />
            </div>

            <div>
              <p className="font-medium">
                {client.firstName} {client.lastName}
              </p>

              <p className="text-sm text-muted-foreground">Client Profile</p>
            </div>
          </div>
        </div>

        {/* Consequences */}

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <h4 className="mb-3 flex items-center gap-2 font-medium text-destructive">
            <Trash2 className="h-4 w-4" />
            Data That Will Be Deleted
          </h4>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />

              <span className="text-sm">Client profile information</span>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />

              <span className="text-sm">Membership history</span>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />

              <span className="text-sm">Payment records</span>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />

              <span className="text-sm">Attendance records</span>
            </div>
          </div>
        </div>

        {/* Warning */}

        <div className="rounded-lg border-l-4 border-destructive bg-muted/100 p-3">
          <p className="text-sm">
            Once deleted, this client's history cannot be recovered.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            <Trash2 className="mr-2 h-4 w-4" />

            {isSubmitting ? "Deleting..." : "Delete Client"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
