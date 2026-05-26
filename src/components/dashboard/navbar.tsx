"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <h2 className="text-lg font-semibold">Dashboard</h2>

      <Button
        variant="outline"
        onClick={() =>
          signOut({
            callbackUrl: "/login",
          })
        }
      >
        Logout
      </Button>
    </header>
  );
}
