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
