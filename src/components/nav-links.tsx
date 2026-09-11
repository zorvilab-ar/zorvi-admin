"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/components/nav-config";

export function NavLinks({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className={cn("space-y-4", compact ? "px-3 py-3" : "px-3 py-4")}>
      {NAV_GROUPS.map((g) => (
        <div key={g.label}>
          <div className="px-2 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {g.label}
          </div>
          <div className="space-y-0.5">
            {g.items.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onMouseEnter={() => router.prefetch(item.href)}
                  onFocus={() => router.prefetch(item.href)}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-full px-3 text-sm font-bold transition-colors",
                    compact ? "py-2.5" : "py-1.5",
                    active
                      ? "border-2 border-border bg-secondary text-foreground shadow-[2px_2px_0_var(--border)]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
