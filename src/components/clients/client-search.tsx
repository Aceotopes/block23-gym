"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import { Input } from "@/components/ui/input";

export function ClientSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    router.push(`/clients?${params.toString()}`);
  }, 300);

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-2 h-4 w-4 text-muted-foreground " />

      <Input
        placeholder="Search clients..."
        className="pl-9"
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}
