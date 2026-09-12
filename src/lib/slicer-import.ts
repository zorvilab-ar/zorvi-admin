import { unzipSync, strFromU8 } from "fflate";

/**
 * Extrae horas de impresión y gramos de filamento de los archivos que exporta
 * Bambu Studio / OrcaSlicer: `.gcode` (comentarios) y `.3mf` (ZIP con
 * `Metadata/slice_info.config`). No hay API oficial de Bambu; estos metadatos
 * son la fuente estable del tiempo y el peso estimados.
 */

export type SlicerImportResult =
  | {
      ok: true;
      printHours: number;
      grams: number;
      source: "gcode" | "3mf";
      plates: number;
    }
  | { ok: false; error: string };

const round = (n: number, d = 2) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

/** "1d 2h 3m 4s" / "1h 23m" / "45m 10s" → segundos. */
function durationToSeconds(raw: string): number {
  let total = 0;
  const re = /(\d+(?:\.\d+)?)\s*([dhms])/gi;
  let m: RegExpExecArray | null;
  let matched = false;
  while ((m = re.exec(raw))) {
    matched = true;
    const v = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    total += unit === "d" ? v * 86400 : unit === "h" ? v * 3600 : unit === "m" ? v * 60 : v;
  }
  // Formato plano en segundos (ej. Cura ";TIME:3723").
  if (!matched) {
    const n = parseFloat(raw);
    if (Number.isFinite(n)) total = n;
  }
  return total;
}

function parseGcodeText(text: string): { seconds: number; grams: number } {
  let seconds = 0;
  const timePatterns = [
    /total estimated time[:=]\s*([0-9hdms.\s]+)/i,
    /estimated printing time[^:=\n]*[:=]\s*([0-9hdms.\s]+)/i,
    /model printing time[:=]\s*([0-9hdms.\s]+)/i,
    /;TIME:\s*(\d+)/i,
  ];
  for (const re of timePatterns) {
    const m = text.match(re);
    if (m) {
      seconds = durationToSeconds(m[1].trim());
      if (seconds > 0) break;
    }
  }

  let grams = 0;
  // Preferimos el "total ..." explícito; si no está, sumamos todas las líneas
  // "filament (used|weight) [g]" (una por filamento en prints multicolor).
  const totalG = text.match(/total filament (?:used|weight) \[g\]\s*[:=]\s*([\d.]+)/i);
  if (totalG) {
    grams = parseFloat(totalG[1]);
  } else {
    const re = /filament (?:used|weight) \[g\]\s*[:=]\s*([\d.]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) grams += parseFloat(m[1]);
  }

  return { seconds, grams };
}

function parseSliceInfo(xml: string): { seconds: number; grams: number; plates: number } {
  let seconds = 0;
  let grams = 0;
  const plateBlocks = xml.match(/<plate\b[\s\S]*?<\/plate>/gi) ?? [];

  const collect = (block: string) => {
    const pred = block.match(/key="prediction"\s+value="([\d.]+)"/i);
    const weight = block.match(/key="weight"\s+value="([\d.]+)"/i);
    if (pred) seconds += parseFloat(pred[1]);
    if (weight) {
      grams += parseFloat(weight[1]);
    } else {
      // Fallback: sumar used_g de cada filamento de la placa.
      const re = /used_g="([\d.]+)"/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(block))) grams += parseFloat(m[1]);
    }
  };

  if (plateBlocks.length) {
    plateBlocks.forEach(collect);
  } else {
    collect(xml); // documento sin <plate> explícito
  }

  return { seconds, grams, plates: Math.max(plateBlocks.length, 1) };
}

function parse3mf(buf: Uint8Array): SlicerImportResult {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(buf);
  } catch {
    return { ok: false, error: "No se pudo abrir el .3mf (¿archivo corrupto?)." };
  }

  const key = Object.keys(files).find(
    (f) => f.toLowerCase() === "metadata/slice_info.config",
  );
  if (key) {
    const { seconds, grams, plates } = parseSliceInfo(strFromU8(files[key]));
    if (seconds > 0 || grams > 0) {
      return { ok: true, printHours: round(seconds / 3600), grams: round(grams), source: "3mf", plates };
    }
  }

  // Fallback: algún .gcode embebido dentro del 3mf.
  const gcodeKey = Object.keys(files).find((f) => f.toLowerCase().endsWith(".gcode"));
  if (gcodeKey) {
    const { seconds, grams } = parseGcodeText(strFromU8(files[gcodeKey]));
    if (seconds > 0 || grams > 0) {
      return { ok: true, printHours: round(seconds / 3600), grams: round(grams), source: "3mf", plates: 1 };
    }
  }

  return {
    ok: false,
    error: "El .3mf no tiene datos de slicing. Guardalo ya sliceado desde Bambu Studio (Archivo → Guardar proyecto).",
  };
}

export function parseSlicerFile(filename: string, buf: Uint8Array): SlicerImportResult {
  const ext = filename.toLowerCase().split(".").pop() ?? "";

  if (ext === "3mf") return parse3mf(buf);

  if (ext === "gcode" || ext === "gco" || ext === "g") {
    const { seconds, grams } = parseGcodeText(strFromU8(buf));
    if (seconds === 0 && grams === 0) {
      return { ok: false, error: "No encontré tiempo ni gramos en el .gcode." };
    }
    return { ok: true, printHours: round(seconds / 3600), grams: round(grams), source: "gcode", plates: 1 };
  }

  return { ok: false, error: "Formato no soportado. Subí un .gcode o un .3mf." };
}
