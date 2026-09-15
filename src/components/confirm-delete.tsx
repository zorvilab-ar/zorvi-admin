"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { errorToast, esErrorDeConexion } from "@/lib/errors";

/** Botón de borrar con confirmación en modal. */
export function ConfirmDelete({
  action,
  id,
  what,
}: {
  action: (fd: FormData) => Promise<void>;
  id: number;
  what: string; // ej: "la venta del 12/09", "el insumo FIL-001"
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const handleDelete = () => {
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      try {
        await action(fd);
        toast.success("Eliminado");
        setOpen(false);
      } catch (e) {
        toast.error(
          esErrorDeConexion(e)
            ? errorToast(e)
            : "No se pudo eliminar (puede tener datos vinculados).",
        );
        console.error(e);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            title="Eliminar"
          >
            <Trash2 />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">¿Eliminar?</DialogTitle>
          <DialogDescription>
            Vas a eliminar {what}. Esto no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="bg-destructive text-primary-foreground hover:bg-destructive/85"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending ? "Eliminando…" : "Sí, eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
