"use client";

import { UserMenu } from "@/components/user-menu";
import { NavLinks } from "@/components/nav-links";
import { HelpDialog } from "@/components/help-dialog";

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r-3 border-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b-3 border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-border bg-primary font-display text-lg text-primary-foreground shadow-[3px_3px_0_var(--border)]">
          Z
        </div>
        <div className="leading-tight">
          <div className="font-display text-lg tracking-wide">Zorvi Admin</div>
          <div className="text-[11px] font-bold text-muted-foreground">
            Lámparas 3D
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavLinks />
      </div>
      <div className="border-t-3 border-border p-3">
        <UserMenu />
        <HelpDialog />
        <div className="mt-2 px-2 text-center text-[10px] font-bold text-muted-foreground">
          Zorvi Lab · Agustín, Nico, Juanchi y Mariano
        </div>
      </div>
    </aside>
  );
}
