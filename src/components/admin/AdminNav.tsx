"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/admin/actions";

const TABS = [
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/import", label: "Import" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`border-b-2 px-3 py-3.5 text-sm font-semibold ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAdmin}>
          <button type="submit" className="text-sm font-medium text-muted hover:text-foreground">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
