"use client";

import { SquarePen, User, Phone, Save } from "lucide-react";

import { useState } from "react";
import { updateClient } from "@/actions/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

type Props = {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
};

export function EditClientDialog({ client }: Props) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(client.firstName);
  const [lastName, setLastName] = useState(client.lastName);
  const [phone, setPhone] = useState(client.phone ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});

  function resetForm() {
    setFirstName(client.firstName);
    setLastName(client.lastName ?? "");
    setPhone(client.phone ?? "");

    setErrors({});
  }

  async function handleSubmit() {
    try {
      setErrors({});
      setIsSubmitting(true);

      const newErrors: {
        firstName?: string;
        lastName?: string;
      } = {};

      if (!firstName.trim()) {
        newErrors.firstName = "First name is required";
      }

      if (!lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }

      await updateClient({
        id: client.id,

        firstName,
        lastName,
        phone,
      });

      toast.success("Client updated successfully");

      setOpen(false);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "Failed to update client"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);

        if (!open) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <SquarePen />
          Edit Client
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <SquarePen className="h-6 w-6 text-primary" />
          </div>

          <DialogTitle className="text-center text-xl">
            Edit Client Profile
          </DialogTitle>

          <DialogDescription className="text-center">
            Update personal and contact information.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value.replace(/[^a-zA-Z\s'-]/g, ""));

                  if (errors.firstName) {
                    setErrors((prev) => ({
                      ...prev,
                      firstName: undefined,
                    }));
                  }
                }}
              />

              {errors.firstName && (
                <p className="text-xs text-destructive mt-1">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <Label>Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value.replace(/[^a-zA-Z\s'-]/g, ""));

                  if (errors.lastName) {
                    setErrors((prev) => ({
                      ...prev,
                      lastName: undefined,
                    }));
                  }
                }}
              />

              {errors.lastName && (
                <p className="text-xs text-destructive mt-1">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button
            className="w-full"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
