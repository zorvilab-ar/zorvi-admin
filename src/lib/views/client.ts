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
