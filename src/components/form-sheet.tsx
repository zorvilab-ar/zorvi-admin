"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Pencil } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "@/components/ui/button";

/**
 * Panel lateral genérico para crear o editar registros.
 * Los campos llegan como children (renderizados en el server con defaultValues)
 * y el submit ejecuta la server action, muestra un toast y cierra el panel.
 */
export function FormSheet({
  title,
  description,
  action,
  children,
  triggerLabel,
  triggerVariant = "default",
  triggerSize = "default",
  mode = "create",
  submitLabel,
  successMessage = "Guardado ✔",
  wide = false,
}: {
  title: string;
  description?: string;
  action: (fd: FormData) => Promise<void>;
  children: React.ReactNode;
  triggerLabel?: string;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  triggerSize?: VariantProps<typeof buttonVariants>["size"];
  mode?: "create" | "edit";
  submitLabel?: string;
  successMessage?: string;
  wide?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const handleSubmit = (fd: FormData) => {
    startTransition(async () => {
      try {
        await action(fd);
        toast.success(successMessage);
        setOpen(false);
      } catch (e) {
        toast.error("No se pudo guardar. Revisá los datos.");
        console.error(e);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          mode === "create" ? (
            <Button variant={triggerVariant} size={triggerSize}>
              <Plus />
              {triggerLabel ?? "Agregar"}
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" title="Editar">
              <Pencil />
            </Button>
          )
        }
      />
      <SheetContent
        side="right"
        className={
          wide
            ? "w-full overflow-y-auto sm:max-w-2xl"
            : "w-full overflow-y-auto sm:max-w-md"
        }
      >
        <SheetHeader>
          <SheetTitle className="font-display text-xl">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <form action={handleSubmit} className="flex flex-1 flex-col gap-4 px-4 pb-6">
          <div className={wide ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>
            {children}
          </div>
          <div className="mt-auto flex gap-2 pt-4">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Guardando…" : (submitLabel ?? (mode === "create" ? "Agregar" : "Guardar cambios"))}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
