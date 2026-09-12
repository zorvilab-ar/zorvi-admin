"use server";

import { assertAdmin } from "@/lib/auth/session";
import { parseSlicerFile, type SlicerImportResult } from "@/lib/slicer-import";

const MAX_BYTES = 80 * 1024 * 1024; // 80 MB: un .gcode de una lámpara entra sobrado

export async function importSlicerFile(fd: FormData): Promise<SlicerImportResult> {
  await assertAdmin();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No se recibió ningún archivo." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "El archivo es demasiado grande (máx. 80 MB)." };
  }

  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    return parseSlicerFile(file.name, buf);
  } catch {
    return { ok: false, error: "No se pudo leer el archivo." };
  }
}
