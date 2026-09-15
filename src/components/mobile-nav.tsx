"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLinks } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";
import { HelpDialog } from "@/components/help-dialog";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Navegar cierra el menú. Se ajusta durante el render en vez de en un
  // efecto: el efecto provocaba un render extra con el panel todavía abierto.
  const [lastPath, setLastPath] = React.useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 flex w-full items-center gap-3 border-b-3 border-border bg-sidebar px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              aria-label="Abrir menú"
              className="shrink-0"
            >
              <Menu />
            </Button>
          }
        />
        <SheetContent
          side="left"
          className="w-[min(18.5rem,88vw)] gap-0 overflow-hidden p-0 sm:max-w-[18.5rem]"
        >
          <SheetHeader className="border-b-3 border-border px-5 py-4">
            <SheetTitle className="flex items-center gap-2.5 text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-border bg-primary font-display text-lg text-primary-foreground shadow-[3px_3px_0_var(--border)]">
                Z
              </span>
              <span className="leading-tight">
                <span className="block font-display text-lg tracking-wide">
                  Zorvi Admin
                </span>
                <span className="block text-[11px] font-bold text-muted-foreground">
                  Lámparas 3D
                </span>
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <NavLinks compact />
            <div className="mt-auto border-t-3 border-border p-3">
              <UserMenu />
              <HelpDialog />
              <div className="mt-2 px-2 text-center text-[10px] font-bold text-muted-foreground">
                Zorvi Lab · Agustín, Nico, Juanchi y Mariano
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-primary font-display text-sm text-primary-foreground shadow-[2px_2px_0_var(--border)]">
          Z
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate font-display text-base tracking-wide">
            Zorvi Admin
          </div>
        </div>
      </div>
    </header>
  );
}
