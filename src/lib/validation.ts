import { z } from "zod";

/**
 * Validación de FormData para los Server Actions.
 *
 * Los `as "enum"` de actions.ts eran solo TypeScript: no validaban en runtime,
 * así que un POST manipulado metía cualquier string en columnas enum. Acá cada
 * campo se valida y se transforma a la forma exacta que espera la DB.
 */

/** Error de validación: lo distingue el toast del form para mostrar el detalle. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// ── Helpers de campo (mismas semánticas que los viejos num/str/reqStr) ──

/** Número desde FormData: admite coma decimal; vacío o NaN → `def`. */
const fdNumber = (def = 0) =>
  z.preprocess((v) => {
    const n = parseFloat(String(v ?? "").replace(",", ".").trim());
    return Number.isFinite(n) ? n : def;
  }, z.number());

/** Porcentaje de UI (15) → fracción de DB (0.15). */
const fdPercent = (def = 0) =>
  z.preprocess((v) => {
    const n = parseFloat(String(v ?? "").replace(",", ".").trim());
    return Number.isFinite(n) ? n / 100 : def;
  }, z.number());

/** Texto opcional: vacío → null. */
const fdText = z.preprocess(
  (v) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  },
  z.string().nullable(),
);

/** Texto requerido (no vacío). */
const fdReqText = (label = "Este campo") =>
  z.preprocess(
    (v) => String(v ?? "").trim(),
    z.string().min(1, `${label} es obligatorio`),
  );

/** Texto con valor por defecto si viene vacío. */
const fdTextDefault = (fallback: string) =>
  z.preprocess((v) => {
    const s = String(v ?? "").trim();
    return s === "" ? fallback : s;
  }, z.string());

/** Enum requerido: valida pertenencia; vacío → `def` si se provee. */
function fdEnum<const T extends readonly [string, ...string[]]>(
  values: T,
  opts: { def?: T[number]; label?: string } = {},
) {
  return z.preprocess((v) => {
    const s = String(v ?? "").trim();
    return s === "" && opts.def !== undefined ? opts.def : s;
  }, z.enum(values, { message: `${opts.label ?? "El valor"}: opción inválida` }));
}

/** Booleano desde checkbox (value="on"). */
const fdCheckbox = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

/** Id entero positivo requerido (FK / where). */
const fdId = z.preprocess((v) => {
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isNaN(n) ? undefined : n;
}, z.number().int().positive({ message: "Falta un identificador válido" }));

/** Número opcional: vacío → null (admite coma decimal). */
const fdOptNumber = z.preprocess((v) => {
  const raw = String(v ?? "").replace(",", ".").trim();
  if (raw === "") return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}, z.number().nullable());

/** Id opcional: vacío → null. */
const fdOptId = z.preprocess((v) => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}, z.number().int().positive().nullable());

// ── Parser ─────────────────────────────────────────────────────────────

/** Valida un FormData contra un schema; tira ValidationError con el detalle. */
export function parseForm<T extends z.ZodType>(
  schema: T,
  fd: FormData,
): z.infer<T> {
  const obj: Record<string, FormDataEntryValue> = {};
  for (const [k, v] of fd.entries()) obj[k] = v;
  const result = schema.safeParse(obj);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join(".");
    throw new ValidationError(
      first ? `${first.message}${path ? ` (${path})` : ""}` : "Datos inválidos",
    );
  }
  return result.data;
}

// ── Schemas por entidad ──────────────────────────────────────────────────
const idOnly = z.object({ id: fdId });

export const settingsSchema = z.object({
  businessName: fdReqText("El nombre"),
  startDate: fdReqText("La fecha de inicio"),
  fxRate: fdNumber(),
  fxDate: fdText,
  printerWatts: fdNumber(),
  kwhPrice: fdNumber(),
  hoursAvailable: fdNumber(),
  hoursProductive: fdNumber(),
  failureRate: fdPercent(),
  defaultWaste: fdPercent(),
  assemblyRate: fdNumber(),
  designRate: fdNumber(),
  targetMargin: fdPercent(),
  wholesaleDiscount: fdPercent(),
  iibbRate: fdPercent(),
  otherTaxRate: fdPercent(),
  billingPartner: fdText,
  monotributoCategory: fdText,
  monotributoCap: fdNumber(),
  reinvestPercent: fdNumber(),
});

export const channelSchema = z.object({
  id: fdId,
  commission: fdPercent(),
  fixedCost: fdNumber(),
});

const assetFields = {
  code: fdReqText("El código"),
  name: fdReqText("El nombre"),
  purchaseDate: fdText,
  costArs: fdNumber(),
  usefulLifeHours: fdNumber(5000),
  residualArs: fdNumber(),
  notes: fdText,
};
export const assetCreateSchema = z.object(assetFields);
export const assetUpdateSchema = z.object({ id: fdId, ...assetFields });

const fixedCostFields = {
  concept: fdReqText("El concepto"),
  category: fdTextDefault("Operación"),
  monthlyArs: fdNumber(),
  notes: fdText,
};
export const fixedCostCreateSchema = z.object(fixedCostFields);
export const fixedCostUpdateSchema = z.object({ id: fdId, ...fixedCostFields });

const supplyFields = {
  code: fdReqText("El código"),
  name: fdReqText("El nombre"),
  category: fdEnum(["Filamento", "Componente", "Packaging", "Otro"], {
    label: "La categoría",
  }),
  unit: fdTextDefault("u"),
  purchasePrice: fdNumber(),
  packQty: fdNumber(1),
  supplier: fdText,
  initialStock: fdNumber(),
  reorderPoint: fdNumber(),
  notes: fdText,
};
export const supplyCreateSchema = z.object(supplyFields);
export const supplyUpdateSchema = z.object({ id: fdId, ...supplyFields });
export const supplyStockSchema = z.object({
  id: fdId,
  initialStock: fdNumber(),
  manualAdjust: fdNumber(),
  reorderPoint: fdNumber(),
});

const productFields = {
  code: fdReqText("El código"),
  name: fdReqText("El nombre"),
  model: fdText,
  status: fdEnum(["Activo", "En desarrollo", "Discontinuado"], {
    def: "En desarrollo",
    label: "El estado",
  }),
  printHours: fdNumber(),
  grams: fdNumber(),
  assemblyMinutes: fdNumber(),
  listPrice: fdNumber(),
  initialStock: fdNumber(),
  notes: fdText,
};
export const productCreateSchema = z.object(productFields);
export const productUpdateSchema = z.object({ id: fdId, ...productFields });

export const recipeItemCreateSchema = z.object({
  productId: fdId,
  supplyId: fdId,
  qty: fdNumber(),
  wastePct: fdPercent(),
  note: fdText,
});
export const recipeItemUpdateSchema = z.object({
  id: fdId,
  supplyId: fdId,
  qty: fdNumber(),
  wastePct: fdPercent(),
  note: fdText,
});

export const productionRunCreateSchema = z.object({
  date: fdReqText("La fecha"),
  productId: fdId,
  unitsOk: fdNumber(),
  unitsFailed: fdNumber(),
  hoursReal: fdNumber(),
  gramsReal: fdNumber(),
  filamentSupplyId: fdOptId,
  assetId: fdOptId,
  notes: fdText,
});

export const saleCreateSchema = z.object({
  date: fdReqText("La fecha"),
  receipt: fdText,
  customer: fdText,
  channelId: fdId,
  productId: fdId,
  qty: fdNumber(1),
  unitPrice: fdNumber(),
  discount: fdNumber(),
  shipping: fdNumber(),
  paymentMethod: fdText,
  status: fdEnum(["Cobrada", "Pendiente"], {
    def: "Cobrada",
    label: "El estado",
  }),
  collectionDate: fdText,
  invoiced: fdCheckbox,
  notes: fdText,
});

export const purchaseCreateSchema = z.object({
  date: fdReqText("La fecha"),
  supplier: fdText,
  type: fdEnum(["Insumo", "Costo fijo", "Activo", "Otro"], {
    label: "El tipo",
  }),
  category: fdText,
  detail: fdText,
  supplyId: fdOptId,
  qty: fdNumber(),
  amountArs: fdNumber(),
  paymentMethod: fdText,
  paidBy: fdText,
  status: fdEnum(["Pagada", "Pendiente"], {
    def: "Pagada",
    label: "El estado",
  }),
  paymentDate: fdText,
  receipt: fdText,
  notes: fdText,
});

export const partnerMovementCreateSchema = z.object({
  date: fdReqText("La fecha"),
  partnerId: fdId,
  type: fdEnum(["Aporte", "Retiro"], { label: "El tipo" }),
  amountArs: fdNumber(),
  paymentMethod: fdText,
  notes: fdText,
});

export const quoteCreateSchema = z.object({
  date: fdReqText("La fecha"),
  clientName: fdReqText("El cliente"),
  notes: fdText,
});
export const quoteUpdateSchema = z.object({
  id: fdId,
  date: fdReqText("La fecha"),
  clientName: fdReqText("El cliente"),
  notes: fdText,
  status: fdEnum(["Borrador", "Enviado", "Aceptado", "Rechazado"], {
    label: "El estado",
  }),
});

const quoteItemFields = {
  name: fdReqText("El nombre"),
  description: fdText,
  qty: fdNumber(),
  printHours: fdNumber(),
  grams: fdNumber(),
  filamentSupplyId: fdOptId,
  extraSuppliesArs: fdNumber(),
  note: fdText,
};
export const quoteItemCreateSchema = z.object({
  quoteId: fdId,
  ...quoteItemFields,
});
export const quoteItemUpdateSchema = z.object({ id: fdId, ...quoteItemFields });

export const filamentRollCreateSchema = z.object({
  supplyId: fdId,
  color: fdReqText("El color"),
  brand: fdText,
  initialGrams: fdNumber(),
  // vacío → se iguala a initialGrams en la action
  remainingGrams: fdOptNumber,
  costArs: fdNumber(),
  openedAt: fdText,
  notes: fdText,
});
export const filamentRollUpdateSchema = z.object({
  id: fdId,
  supplyId: fdId,
  color: fdReqText("El color"),
  brand: fdText,
  initialGrams: fdNumber(),
  remainingGrams: fdNumber(),
  costArs: fdNumber(),
  openedAt: fdText,
  notes: fdText,
});

export { idOnly };
