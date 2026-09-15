import "server-only";
import { cache } from "react";
import { redirect, unstable_rethrow } from "next/navigation";
import { getAdminUser } from "@/lib/auth/session";
import { isAuthRequired } from "@/lib/supabase/config";
import { getVista } from "@/lib/shop/client";

/**
 * Vistas: lo que cada pantalla necesita, ya calculado por el backend.
 *
 * Reemplazan a `loadAll()` página por página. La diferencia no es solo el
 * tamaño del payload: como los números vienen hechos, el admin deja de
 * necesitar su copia de `calc.ts`.
 */

async function vista<T>(nombre: string): Promise<T> {
  if (isAuthRequired() && !(await getAdminUser())) redirect("/login");
  try {
    return await getVista<T>(nombre);
  } catch (error) {
    unstable_rethrow(error);
    redirect("/conexion");
  }
}

// ── Tablero ──────────────────────────────────────────────────────────
export interface VistaTablero {
  kpis: {
    assetInvestment: number; assetInvestmentUsd: number;
    assetPurchases: number; assetsUnbooked: number;
    capital: number; withdrawals: number; cashBalance: number;
    unitsSold: number; salesTotal: number; avgTicket: number;
    contribution: number; avgContribMargin: number;
    fixedAccum: number; resultAccum: number; fixedBudget: number;
    breakEvenSales: number; breakEvenUnits: number;
    avgHoursPerUnit: number; breakEvenHours: number; capacityUse: number;
    hoursAccum: number; unitsProduced: number; unitsFailed: number;
    failRateReal: number; contribPerHour: number; gramsUsed: number;
    hoursDeviation: number; monthsWithSales: number; avgMonthlyResult: number;
    paybackMonths: number | null; stockValue: number;
    invoiced12m: number; capUse: number | null;
  };
  settings: { failureRate: number; monotributoCap: number; fxRate: number };
  productos: {
    code: string; name: string; listPrice: number; printHours: number;
    variableCost: number; totalCost: number;
    contribution: number; contributionPct: number; contributionPerHour: number;
  }[];
}
export const loadTablero = cache(() => vista<VistaTablero>("dashboard"));

// ── Stock ────────────────────────────────────────────────────────────
export interface VistaStock {
  productos: {
    id: number; code: string; name: string;
    initial: number; produced: number; sold: number; current: number;
    unitCost: number; stockValue: number;
  }[];
  insumos: {
    id: number; code: string; name: string; category: string; unit: string;
    initial: number; purchased: number; consumed: number; manualAdjust: number;
    current: number; unitCost: number; stockValue: number;
    reorderPoint: number; alert: boolean;
  }[];
  rollos: {
    id: number; supplyId: number; color: string | null; colorHex: string;
    brand: string | null; initialGrams: number; remainingGrams: number;
    costArs: number; openedAt: string | null; notes: string | null;
    supplyCode: string | null; supplyName: string | null; valor: number;
  }[];
  filamentos: { id: number; code: string; name: string; unitCost: number }[];
}
export const loadStock = cache(() => vista<VistaStock>("stock"));

// ── Resumen mensual ──────────────────────────────────────────────────
export interface VistaResumen {
  meses: {
    month: string; units: number; netSales: number; commissions: number;
    shipping: number; taxes: number; netIncome: number; variableCost: number;
    contribution: number; contributionPct: number;
    fixedReal: number; fixedBudget: number; result: number;
    cashIn: number; cashOut: number; cashFlow: number; cashBalance: number;
  }[];
  settings: { startDate: string };
}
export const loadResumen = cache(() => vista<VistaResumen>("resumen"));

// ── Catálogo y configuración ─────────────────────────────────────────
type Insumo = {
  id: number; code: string; name: string; category: string; unit: string;
  purchasePrice: number; packQty: number; supplier: string | null;
  updatedAt: string | null; initialStock: number; manualAdjust: number;
  reorderPoint: number; notes: string | null; unitCost: number;
};
export const loadInsumos = cache(() => vista<{ insumos: Insumo[] }>("insumos"));

type Activo = {
  id: number; code: string; name: string; type: string;
  purchaseDate: string | null; costArs: number; usefulLifeHours: number;
  residualArs: number; notes: string | null;
  amortPerHour: number; hoursUsed: number; bookValue: number;
};
export const loadActivos = cache(() =>
  vista<{
    activos: Activo[];
    amortTotalPorHora: number;
    socios: { id: number; name: string }[];
    settings: { fxRate: number };
  }>("activos"),
);

type CostoFijo = {
  id: number; concept: string; category: string; monthlyArs: number; notes: string | null;
};
export const loadCostosFijos = cache(() =>
  vista<{ costos: CostoFijo[]; settings: { hoursProductive: number; fxRate: number } }>("costos-fijos"),
);

export interface Settings {
  id: number; businessName: string; startDate: string; fxRate: number;
  fxDate: string | null; printerWatts: number; kwhPrice: number;
  hoursAvailable: number; hoursProductive: number; failureRate: number;
  defaultWaste: number; assemblyRate: number; designRate: number;
  targetMargin: number; wholesaleDiscount: number; iibbRate: number;
  otherTaxRate: number; billingPartner: string | null;
  monotributoCategory: string | null; monotributoCap: number; reinvestPercent: number;
}
export const loadParametros = cache(() =>
  vista<{
    settings: Settings;
    canales: { id: number; name: string; commission: number; fixedCost: number; notes: string | null }[];
  }>("parametros"),
);

// ── Uso diario ───────────────────────────────────────────────────────
type Compra = {
  id: number; date: string; supplier: string | null; type: string;
  category: string | null; detail: string | null; supplyId: number | null;
  qty: number; amountArs: number; paymentMethod: string | null;
  paidBy: string | null; status: string; paymentDate: string | null;
  receipt: string | null; notes: string | null; supplyCode: string | null;
};
export const loadCompras = cache(() =>
  vista<{
    compras: Compra[];
    insumos: { id: number; code: string; name: string; unit: string; purchasePrice: number; packQty: number }[];
    socios: string[];
    conAporte: number[];
  }>("compras"),
);

type Movimiento = {
  id: number; date: string; partnerId: number; type: string; amountArs: number;
  paymentMethod: string | null; purchaseId: number | null; notes: string | null;
  partnerName: string | null;
};
export const loadSocios = cache(() =>
  vista<{
    cuentas: {
      id: number; name: string; contributions: number; withdrawals: number;
      balance: number; capitalPct: number; diffVsEqual: number;
    }[];
    movimientos: Movimiento[];
    socios: { id: number; name: string }[];
  }>("socios"),
);

export const loadCalculadora = cache(() =>
  vista<{
    filamentos: { id: number; name: string; pricePerKg: number }[];
    impresoras: { id: number; name: string; amortPerHour: number; usefulLifeHours: number; costArs: number }[];
    settings: {
      printerWatts: number; kwhPrice: number; failureRate: number;
      targetMargin: number; assemblyRate: number; designRate: number;
    };
    marketCommission: number;
    marketFixed: number;
  }>("calculadora"),
);

// ── Costeo ───────────────────────────────────────────────────────────
/** La ficha de costo de un producto, tal como la calcula el backend. */
export interface CostoProducto {
  filament: number; components: number; packaging: number; otherMaterials: number;
  energy: number; amortization: number; labor: number; subtotal: number;
  failureAdj: number; variableCost: number; fixedAllocated: number; totalCost: number;
  suggestedPrice: number; contribution: number; contributionPct: number;
  unitResult: number; netMarginPct: number;
}

type Producto = {
  id: number; code: string; name: string; model: string | null; status: string;
  printHours: number; grams: number; assemblyMinutes: number; listPrice: number;
  initialStock: number; notes: string | null;
};

export const loadProductos = cache(() =>
  vista<{ productos: (Producto & { stock: number; costo: CostoProducto })[] }>("productos"),
);

export const loadProducto = cache((id: number) =>
  vista<{
    producto: Producto;
    costo: CostoProducto;
    stock: number;
    receta: {
      id: number; productId: number; supplyId: number; qty: number;
      wastePct: number; note: string | null;
      supplyCode: string | null; supplyName: string | null;
      supplyUnit: string | null; supplyCategory: string | null;
      unitCost: number; lineCost: number;
    }[];
    insumos: { id: number; code: string; name: string; unit: string }[];
    precios: {
      channelId: number; channelName: string;
      suggestedPrice: number; netMarginAtList: number;
    }[];
    settings: { targetMargin: number; defaultWaste: number };
  } | null>(`producto/${id}`),
);

export const loadPrecios = cache(() =>
  vista<{
    canales: { id: number; name: string }[];
    targetMargin: number;
    sinComisiones: boolean;
    bajoObjetivo: string[];
    productos: {
      id: number; code: string; name: string;
      listPrice: number; variableCost: number; totalCost: number;
      porCanal: { channelId: number; suggestedPrice: number; netMarginAtList: number }[];
    }[];
  }>("precios"),
);

// ── Uso diario ───────────────────────────────────────────────────────
type Venta = {
  id: number; date: string; receipt: string | null; customer: string | null;
  channelId: number; productId: number; qty: number; unitPrice: number;
  discount: number; shipping: number; paymentMethod: string | null;
  status: string; collectionDate: string | null; invoiced: boolean; notes: string | null;
};

export const loadVentas = cache(() =>
  vista<{
    ventas: {
      sale: Venta;
      productCode: string | null; channelName: string | null;
      totalNet: number; commission: number; netIncome: number; contribution: number;
    }[];
    productos: {
      id: number; code: string; name: string;
      listPrice: number; variableCost: number; stock: number;
    }[];
    canales: { id: number; name: string; commission: number; fixedCost: number }[];
    taxRate: number;
  }>("ventas"),
);

export const loadProduccion = cache(() =>
  vista<{
    tandas: {
      id: number; date: string; productId: number; unitsOk: number; unitsFailed: number;
      hoursReal: number; gramsReal: number; filamentSupplyId: number | null;
      assetId: number | null; notes: string | null;
      productCode: string | null; productName: string | null;
      estimatedHours: number; filamentCode: string | null; assetCode: string | null;
    }[];
    productos: {
      id: number; code: string; name: string;
      printHours: number; grams: number; filamentSupplyId: number | null;
    }[];
    filamentos: { id: number; code: string; name: string }[];
    impresoras: { id: number; code: string; name: string }[];
    hayActivos: boolean;
    settings: { failureRate: number };
  }>("produccion"),
);

export const loadTiendaAdmin = cache(() =>
  vista<{
    productos: { id: number; code: string; name: string; listPrice: number; stock: number }[];
  }>("tienda"),
);

// ── Presupuestos ─────────────────────────────────────────────────────
type CostoPieza = {
  material: number; energy: number; wear: number;
  assembly: number; design: number; labor: number;
  errorMargin: number; costWithoutSupplies: number;
  extras: number; extrasHigh: boolean;
  totalCost: number; charge: number; market: number;
};

export const loadPresupuestos = cache(() =>
  vista<{
    presupuestos: {
      id: number; date: string; clientName: string; notes: string | null;
      status: string; items: number; total: number;
    }[];
  }>("presupuestos"),
);

export const loadPresupuesto = cache((id: number) =>
  vista<{
    presupuesto: { id: number; date: string; clientName: string; notes: string | null; status: string };
    items: {
      item: {
        id: number; quoteId: number; name: string; description: string | null;
        qty: number; printHours: number; grams: number;
        assemblyMinutes: number; designHours: number;
        filamentSupplyId: number | null; extraSuppliesArs: number; note: string | null;
      };
      filamentName: string | null;
      costo: CostoPieza;
    }[];
    filamentos: { id: number; code: string; name: string }[];
    settings: { targetMargin: number };
  } | null>(`presupuesto/${id}`),
);
