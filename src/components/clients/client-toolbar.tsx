"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ClientToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`/clients?${params.toString()}`);
  }

  return (
    <div className="flex gap-2">
      <Select
        value={searchParams.get("type") ?? "ALL"}
        onValueChange={(value) => updateFilter("type", value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>

          <SelectItem value="MEMBER">Members</SelectItem>

          <SelectItem value="WALK_IN">Walk-Ins</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") ?? "ALL"}
        onValueChange={(value) => updateFilter("status", value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>

          <SelectItem value="ACTIVE">Active</SelectItem>

          <SelectItem value="EXPIRED">Expired</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
