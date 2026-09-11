"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HELP_STEPS } from "@/components/nav-config";
import { CircleHelp } from "lucide-react";

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="secondary" className="w-full">
            <CircleHelp />
            ¿Cómo se usa?
          </Button>
        }
      />
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Cómo se usa el admin
          </DialogTitle>
          <DialogDescription>
            Tres pasos, sin vueltas. Cualquier duda puntual está explicada
            arriba de cada página.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {HELP_STEPS.map((s) => (
            <div
              key={s.title}
              className="rounded-xl border-2 border-border bg-background p-3"
            >
              <div className="font-display text-sm">{s.title}</div>
              <p className="mt-1 text-[13px] font-semibold leading-snug text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
