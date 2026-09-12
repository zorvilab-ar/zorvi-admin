"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileUp, Loader2 } from "lucide-react";
import { importSlicerFile } from "@/lib/slicer-actions";

/**
 * Botón "Importar del slicer": sube un .gcode/.3mf de Bambu Studio, lo parsea
 * en el server y rellena los campos de horas y gramos del formulario que lo
 * contiene. Los inputs son no controlados, así que basta con setear su value.
 */
function setInputValue(form: HTMLFormElement, name: string, value: number) {
  const input = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, String(value));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function SlicerImport({
  printHoursField = "printHours",
  gramsField = "grams",
  span2 = true,
}: {
  printHoursField?: string;
  gramsField?: string;
  span2?: boolean;
}) {
  const [pending, startTransition] = React.useTransition();
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-subir el mismo archivo
    if (!file) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("file", file);
      const res = await importSlicerFile(fd);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const form = wrapRef.current?.closest("form");
      if (!form) return;
      setInputValue(form, printHoursField, res.printHours);
      setInputValue(form, gramsField, res.grams);

      const plates = res.plates > 1 ? ` · ${res.plates} placas` : "";
      toast.success(
        `Importado: ${res.printHours} h · ${res.grams} g${plates}`,
        { description: `Fuente: ${res.source.toUpperCase()}. Revisá y guardá.` },
      );
    });
  };

  return (
    <div ref={wrapRef} className={span2 ? "sm:col-span-2" : undefined}>
      <label
        className={`flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-border bg-[#FFF7EA] px-3 text-sm font-bold transition-colors hover:bg-muted ${
          pending ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="h-4 w-4" />
        )}
        {pending ? "Leyendo…" : "Importar del slicer (.gcode / .3mf)"}
        <input
          type="file"
          accept=".gcode,.gco,.g,.3mf"
          className="hidden"
          onChange={onFile}
          disabled={pending}
        />
      </label>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        Autocompleta horas y gramos desde el archivo de Bambu Studio / OrcaSlicer.
      </p>
    </div>
  );
}
