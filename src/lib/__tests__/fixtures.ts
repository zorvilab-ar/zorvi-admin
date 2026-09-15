import type { AllData } from "@/lib/calc";

/**
 * Datos de prueba con los números reales de Zorvi (los del seed), para que
 * cuando un test falle el número que aparece signifique algo: 19,99 $/g es el
 * filamento, 293 $/h es el desgaste de la Bambu, 35.000 es el precio de lista
 * de la LAMP-001.
 *
 * Cada builder trae todos los campos y acepta overrides parciales, así los
 * tests nombran solo lo que les importa.
 */

type Table<T> = (over?: Partial<T>) => T;

export const settings: Table<AllData["settings"]> = (over = {}) => ({
  id: 1,
  businessName: "Zorvi Lab",
  startDate: "2026-09-01",
  fxRate: 1500,
  fxDate: "2026-09-01",
  printerWatts: 100,
  kwhPrice: 200,
  hoursAvailable: 300,
  hoursProductive: 120,
  failureRate: 0.15,
  defaultWaste: 0.1,
  assemblyRate: 6000,
  designRate: 10000,
  targetMargin: 0.45,
  wholesaleDiscount: 0,
  iibbRate: 0,
  otherTaxRate: 0,
  billingPartner: null,
  monotributoCategory: null,
  monotributoCap: 0,
  reinvestPercent: 100,
  ...over,
});

export const channel: Table<AllData["channels"][number]> = (over = {}) => ({
  id: 1,
  name: "Directo",
  commission: 0,
  fixedCost: 0,
  notes: null,
  ...over,
});

export const partner: Table<AllData["partners"][number]> = (over = {}) => ({
  id: 1,
  name: "Juanchi",
  ...over,
});

export const movement: Table<AllData["partnerMovements"][number]> = (
  over = {},
) => ({
  id: 1,
  date: "2026-09-02",
  partnerId: 1,
  type: "Aporte",
  amountArs: 0,
  paymentMethod: null,
  purchaseId: null,
  notes: null,
  ...over,
});

/** Bambu Lab A1: 1.465.000 ÷ 5.000 h = 293 $/h de desgaste. */
export const asset: Table<AllData["assets"][number]> = (over = {}) => ({
  id: 1,
  code: "IMP-001",
  name: "Bambu Lab A1 Combo",
  type: "Impresora",
  purchaseDate: "2026-09-02",
  costArs: 1_465_000,
  usefulLifeHours: 5000,
  residualArs: 0,
  notes: null,
  ...over,
});

export const fixedCost: Table<AllData["fixedCosts"][number]> = (over = {}) => ({
  id: 1,
  concept: "Costos fijos del mes",
  category: "Operación",
  monthlyArs: 117_500,
  notes: null,
  ...over,
});

/** FIL-001: 19.990 el kilo → 19,99 $/g. */
export const supply: Table<AllData["supplies"][number]> = (over = {}) => ({
  id: 1,
  code: "FIL-001",
  name: "Filamento Negro",
  category: "Filamento",
  unit: "g",
  purchasePrice: 19_990,
  packQty: 1000,
  supplier: "ProyectoColor",
  updatedAt: "2026-09-09",
  initialStock: 0,
  manualAdjust: 0,
  reorderPoint: 0,
  notes: null,
  ...over,
});

export const product: Table<AllData["products"][number]> = (over = {}) => ({
  id: 1,
  code: "LAMP-001",
  name: "Lámpara Velador Negra",
  model: null,
  status: "Activo",
  printHours: 8,
  grams: 286,
  assemblyMinutes: 30,
  listPrice: 35_000,
  initialStock: 0,
  notes: null,
  ...over,
});

export const recipeItem: Table<AllData["recipeItems"][number]> = (
  over = {},
) => ({
  id: 1,
  productId: 1,
  supplyId: 1,
  qty: 286,
  wastePct: 0,
  note: null,
  ...over,
});

export const productionRun: Table<AllData["productionRuns"][number]> = (
  over = {},
) => ({
  id: 1,
  date: "2026-09-10",
  productId: 1,
  unitsOk: 1,
  unitsFailed: 0,
  hoursReal: 8,
  gramsReal: 286,
  filamentSupplyId: 1,
  assetId: 1,
  notes: null,
  ...over,
});

export const sale: Table<AllData["sales"][number]> = (over = {}) => ({
  id: 1,
  date: "2026-09-15",
  receipt: null,
  customer: null,
  channelId: 1,
  productId: 1,
  qty: 1,
  unitPrice: 35_000,
  discount: 0,
  shipping: 0,
  paymentMethod: null,
  status: "Cobrada",
  collectionDate: null,
  invoiced: false,
  notes: null,
  ...over,
});

export const purchase: Table<AllData["purchases"][number]> = (over = {}) => ({
  id: 1,
  date: "2026-09-02",
  supplier: null,
  type: "Insumo",
  category: null,
  detail: null,
  supplyId: null,
  qty: 0,
  amountArs: 0,
  paymentMethod: null,
  paidBy: null,
  status: "Pagada",
  paymentDate: null,
  receipt: null,
  notes: null,
  ...over,
});

/** Estado completo: por defecto, un catálogo que costea y nada de movimiento. */
export function allData(over: Partial<AllData> = {}): AllData {
  return {
    settings: settings(),
    channels: [channel()],
    partners: [partner()],
    assets: [asset()],
    fixedCosts: [fixedCost()],
    supplies: [
      supply(),
      supply({ id: 2, code: "COMP-001", name: "Portalámpara", category: "Componente", unit: "u", purchasePrice: 10_000, packQty: 1 }),
      supply({ id: 3, code: "PACK-001", name: "Caja de cartón", category: "Packaging", unit: "u", purchasePrice: 100_000, packQty: 100 }),
    ],
    products: [product()],
    recipeItems: [
      recipeItem(),
      recipeItem({ id: 2, supplyId: 2, qty: 1 }),
      recipeItem({ id: 3, supplyId: 3, qty: 1 }),
    ],
    productionRuns: [],
    sales: [],
    purchases: [],
    partnerMovements: [],
    quotes: [],
    quoteItems: [],
    filamentRolls: [],
    ...over,
  };
}

// ── Números esperados de la ficha de LAMP-001 ────────────────────────
// Escritos como la fórmula, no como la constante: si un test falla, el
// renglón de al lado dice de dónde tendría que haber salido el número.
const filament = 286 * 19.99; //                5.717,14
const components = 10_000;
const packaging = 100_000 / 100; //             1.000
const energy = (8 * 100 * 200) / 1000; //         160  (8 h × 100 W × 200 $/kWh)
const amortization = 8 * (1_465_000 / 5000); // 2.344  (8 h × 293 $/h)
const labor = (30 / 60) * 6000; //              3.000  (media hora de armado)
const subtotal =
  filament + components + packaging + energy + amortization + labor;
const variableCost = subtotal * 1.15; //        + 15% de fallas
const fixedAllocated = (117_500 / 120) * 8; //  fijos por hora productiva

export const LAMP = {
  filament,
  components,
  packaging,
  energy,
  amortization,
  labor,
  subtotal,
  variableCost,
  fixedAllocated,
  totalCost: variableCost + fixedAllocated,
} as const;
