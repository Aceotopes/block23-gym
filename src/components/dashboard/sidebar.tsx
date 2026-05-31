"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation } from "@/constants/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-58 border-r bg-background md:flex md:flex-col">
      <div className="border-b p-5">
        <h1 className="text-xl font-bold">Block23 Gym</h1>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />

              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
