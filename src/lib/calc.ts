import { cache } from "react";
import { db, schema } from "@/lib/db";
import { isDbConnectionError } from "@/lib/db/status";
import { isSchemaMissingError } from "@/lib/db/errors";
import { redirect, unstable_rethrow } from "next/navigation";
import { getAdminUser } from "@/lib/auth/session";
import { isAuthRequired } from "@/lib/supabase/config";
import {
  customPrintCost,
  type CustomPrintCost,
} from "@/lib/print-cost";


export { customPrintCost, type CustomPrintCost } from "@/lib/print-cost";

type Settings = typeof schema.settings.$inferSelect;
type Supply = typeof schema.supplies.$inferSelect;
type Product = typeof schema.products.$inferSelect;
type RecipeItem = typeof schema.recipeItems.$inferSelect;
type Asset = typeof schema.assets.$inferSelect;
type Channel = typeof schema.channels.$inferSelect;
type Sale = typeof schema.sales.$inferSelect;
type Purchase = typeof schema.purchases.$inferSelect;
type ProductionRun = typeof schema.productionRuns.$inferSelect;
type PartnerMovement = typeof schema.partnerMovements.$inferSelect;
type Partner = typeof schema.partners.$inferSelect;
type FixedCost = typeof schema.fixedCosts.$inferSelect;
type QuoteItem = typeof schema.quoteItems.$inferSelect;
type FilamentRoll = typeof schema.filamentRolls.$inferSelect;

// ── Carga completa del estado ────────────────────────────────────────
export const loadAll = cache(async () => {
  const requireAuth = isAuthRequired();

  let loaded: Awaited<ReturnType<typeof fetchAll>>;
  try {
    const [user, rows] = await Promise.all([
      requireAuth ? getAdminUser() : Promise.resolve(null),
      fetchAll(),
    ]);
    if (requireAuth && !user) redirect("/login");
    loaded = rows;
  } catch (error) {
    unstable_rethrow(error);
    if (isDbConnectionError(error) || isSchemaMissingError(error)) {
      redirect("/conexion");
    }
    throw error;
  }

  const {
    settingsRows,
    channels,
    partners,
    assets,
    fixedCosts,
    supplies,
    products,
    recipeItems,
    productionRuns,
    sales,
    purchases,
    partnerMovements,
    quotes,
    quoteItems,
    filamentRolls,
  } = loaded;

  const settings = settingsRows[0];
  if (!settings) redirect("/conexion");

  return {
    settings,
    channels,
    partners,
    assets,
    fixedCosts,
    supplies,
    products,
    recipeItems,
    productionRuns,
    sales,
    purchases,
    partnerMovements,
    quotes,
    quoteItems,
    filamentRolls,
  };
});

async function fetchAll() {
  const [
    settingsRows,
    channels,
    partners,
    assets,
    fixedCosts,
    supplies,
    products,
    recipeItems,
    productionRuns,
    sales,
    purchases,
    partnerMovements,
    quotes,
    quoteItems,
    filamentRolls,
  ] = await Promise.all([
    db.select().from(schema.settings),
    db.select().from(schema.channels).orderBy(schema.channels.id),
    db.select().from(schema.partners).orderBy(schema.partners.id),
    db.select().from(schema.assets).orderBy(schema.assets.code),
    db.select().from(schema.fixedCosts).orderBy(schema.fixedCosts.id),
    db.select().from(schema.supplies).orderBy(schema.supplies.code),
    db.select().from(schema.products).orderBy(schema.products.code),
    db.select().from(schema.recipeItems).orderBy(schema.recipeItems.id),
    db.select().from(schema.productionRuns),
    db.select().from(schema.sales),
    db.select().from(schema.purchases),
    db.select().from(schema.partnerMovements),
    db.select().from(schema.quotes).orderBy(schema.quotes.id),
    db.select().from(schema.quoteItems).orderBy(schema.quoteItems.id),
    db.select().from(schema.filamentRolls).orderBy(schema.filamentRolls.id),
  ]);

  return {
    settingsRows,
    channels,
    partners,
    assets,
    fixedCosts,
    supplies,
    products,
    recipeItems,
    productionRuns,
    sales,
    purchases,
    partnerMovements,
    quotes,
    quoteItems,
    filamentRolls,
  };
}
export type AllData = Awaited<ReturnType<typeof loadAll>>;

// ── Insumos ──────────────────────────────────────────────────────────
export function unitCost(s: Supply): number {
  return s.packQty > 0 ? s.purchasePrice / s.packQty : 0;
}

export function filamentPricePerKg(s: Supply): number {
  return unitCost(s) * 1000;
}

export function mercadoLibreChannel(channels: Channel[]) {
  return channels.find((c) => /mercado/i.test(c.name)) ?? null;
}

export function quoteItemCost(
  item: QuoteItem,
  suppliesById: Map<number, Supply>,
  st: Settings,
  amortPerHour: number,
  marketCommission: number,
  marketFixed: number,
): CustomPrintCost {
  const supply = item.filamentSupplyId
    ? suppliesById.get(item.filamentSupplyId)
    : undefined;
  return customPrintCost({
    grams: item.grams,
    hours: item.printHours,
    qty: item.qty,
    filamentPricePerKg: supply ? filamentPricePerKg(supply) : 0,
    extraSuppliesArs: item.extraSuppliesArs,
    failureRate: st.failureRate,
    printerWatts: st.printerWatts,
    kwhPrice: st.kwhPrice,
    amortPerHour,
    targetMargin: st.targetMargin,
    marketCommission,
    marketFixed,
  });
}

export function rollStockValue(roll: FilamentRoll, supply?: Supply): number {
  if (roll.costArs > 0 && roll.initialGrams > 0) {
    return (roll.remainingGrams / roll.initialGrams) * roll.costArs;
  }
  if (supply) return roll.remainingGrams * unitCost(supply);
  return 0;
}

// ── Activos ──────────────────────────────────────────────────────────
export function assetAmortPerHour(a: Asset): number {
  return a.usefulLifeHours > 0
    ? (a.costArs - a.residualArs) / a.usefulLifeHours
    : 0;
}

export function assetHoursUsed(a: Asset, runs: ProductionRun[]): number {
  return runs
    .filter((r) => r.assetId === a.id)
    .reduce((acc, r) => acc + r.hoursReal, 0);
}

export function totalAmortPerHour(assets: Asset[]): number {
  return assets.reduce((acc, a) => acc + assetAmortPerHour(a), 0);
}

// ── Ficha de costo del producto ──────────────────────────────────────
export interface ProductCost {
  filament: number;
  components: number;
  packaging: number;
  otherMaterials: number;
  energy: number;
  amortization: number;
  labor: number;
  subtotal: number;
  failureAdj: number;
  variableCost: number;
  fixedAllocated: number;
  totalCost: number;
  suggestedPrice: number;
  contribution: number; // sobre precio de lista
  contributionPct: number;
  unitResult: number; // precio lista - costo total
  netMarginPct: number;
}

export function productCost(
  p: Product,
  recipe: RecipeItem[],
  suppliesById: Map<number, Supply>,
  st: Settings,
  amortPerHour: number,
  fixedMonthlyTotal: number,
): ProductCost {
  let filament = 0,
    components = 0,
    packaging = 0,
    otherMaterials = 0;

  for (const r of recipe.filter((r) => r.productId === p.id)) {
    const s = suppliesById.get(r.supplyId);
    if (!s) continue;
    const line = r.qty * unitCost(s) * (1 + r.wastePct);
    if (s.category === "Filamento") filament += line;
    else if (s.category === "Componente") components += line;
    else if (s.category === "Packaging") packaging += line;
    else otherMaterials += line;
  }

  const energy = (p.printHours * st.printerWatts * st.kwhPrice) / 1000;
  const amortization = p.printHours * amortPerHour;
  const labor = (p.assemblyMinutes / 60) * st.assemblyRate;
  const subtotal =
    filament + components + packaging + otherMaterials + energy + amortization + labor;
  const failureAdj = subtotal * st.failureRate;
  const variableCost = subtotal + failureAdj;
  const fixedAllocated =
    st.hoursProductive > 0
      ? (fixedMonthlyTotal / st.hoursProductive) * p.printHours
      : 0;
  const totalCost = variableCost + fixedAllocated;
  const suggestedPrice =
    st.targetMargin < 1 ? totalCost / (1 - st.targetMargin) : 0;
  const list = p.listPrice;
  const contribution = list - variableCost;
  const contributionPct = list > 0 ? contribution / list : 0;
  const unitResult = list - totalCost;
  const netMarginPct = list > 0 ? unitResult / list : 0;

  return {
    filament,
    components,
    packaging,
    otherMaterials,
    energy,
    amortization,
    labor,
    subtotal,
    failureAdj,
    variableCost,
    fixedAllocated,
    totalCost,
    suggestedPrice,
    contribution,
    contributionPct,
    unitResult,
    netMarginPct,
  };
}

export function allProductCosts(data: AllData): Map<number, ProductCost> {
  const suppliesById = new Map(data.supplies.map((s) => [s.id, s]));
  const amort = totalAmortPerHour(data.assets);
  const fixedTotal = data.fixedCosts.reduce((a, f) => a + f.monthlyArs, 0);
  return new Map(
    data.products.map((p) => [
      p.id,
      productCost(p, data.recipeItems, suppliesById, data.settings, amort, fixedTotal),
    ]),
  );
}

// ── Precios por canal ────────────────────────────────────────────────
export interface ChannelPrice {
  channel: Channel;
  suggestedPrice: number; // para llegar al margen objetivo en ese canal
  netMarginAtList: number; // margen real vendiendo a precio de lista
}

export function channelPrices(
  cost: ProductCost,
  listPrice: number,
  chs: Channel[],
  st: Settings,
): ChannelPrice[] {
  const taxes = st.iibbRate + st.otherTaxRate;
  return chs.map((c) => {
    const denom = 1 - st.targetMargin - c.commission - taxes;
    const suggestedPrice = denom > 0 ? (cost.totalCost + c.fixedCost) / denom : 0;
    const netMarginAtList =
      listPrice > 0
        ? (listPrice * (1 - c.commission - taxes) - c.fixedCost - cost.totalCost) /
          listPrice
        : 0;
    return { channel: c, suggestedPrice, netMarginAtList };
  });
}

// ── Ventas: fila calculada ───────────────────────────────────────────
export interface SaleComputed {
  sale: Sale;
  subtotal: number;
  totalNet: number; // subtotal - descuento
  commission: number;
  taxes: number;
  netIncome: number; // total - comisión - envío - impuestos
  variableCost: number;
  contribution: number;
  marginPct: number;
}

export function computeSale(
  sale: Sale,
  channelsById: Map<number, Channel>,
  costs: Map<number, ProductCost>,
  st: Settings,
): SaleComputed {
  const ch = channelsById.get(sale.channelId);
  const subtotal = sale.qty * sale.unitPrice;
  const totalNet = subtotal - sale.discount;
  const commission = ch ? totalNet * ch.commission + ch.fixedCost : 0;
  const taxes = totalNet * (st.iibbRate + st.otherTaxRate);
  const netIncome = totalNet - commission - sale.shipping - taxes;
  const vc = (costs.get(sale.productId)?.variableCost ?? 0) * sale.qty;
  const contribution = netIncome - vc;
  const marginPct = totalNet > 0 ? contribution / totalNet : 0;
  return {
    sale,
    subtotal,
    totalNet,
    commission,
    taxes,
    netIncome,
    variableCost: vc,
    contribution,
    marginPct,
  };
}

export function allSalesComputed(data: AllData): SaleComputed[] {
  const chById = new Map(data.channels.map((c) => [c.id, c]));
  const costs = allProductCosts(data);
  return data.sales.map((s) => computeSale(s, chById, costs, data.settings));
}

// ── Stock ────────────────────────────────────────────────────────────
export interface ProductStock {
  product: Product;
  initial: number;
  produced: number;
  sold: number;
  current: number;
  unitCost: number; // costo variable
  stockValue: number;
}

export interface SupplyStock {
  supply: Supply;
  initial: number;
  purchased: number;
  consumed: number;
  manualAdjust: number;
  current: number;
  unitCost: number;
  stockValue: number;
  reorderPoint: number;
  alert: boolean;
}

export function productStocks(data: AllData): ProductStock[] {
  const costs = allProductCosts(data);
  return data.products.map((p) => {
    const produced = data.productionRuns
      .filter((r) => r.productId === p.id)
      .reduce((a, r) => a + r.unitsOk, 0);
    const sold = data.sales
      .filter((s) => s.productId === p.id)
      .reduce((a, s) => a + s.qty, 0);
    const current = p.initialStock + produced - sold;
    const uc = costs.get(p.id)?.variableCost ?? 0;
    return {
      product: p,
      initial: p.initialStock,
      produced,
      sold,
      current,
      unitCost: uc,
      stockValue: current * uc,
    };
  });
}

export function supplyStocks(data: AllData): SupplyStock[] {
  return data.supplies.map((s) => {
    const purchased = data.purchases
      .filter((c) => c.type === "Insumo" && c.supplyId === s.id)
      .reduce((a, c) => a + c.qty, 0);

    let consumed = 0;
    if (s.category === "Filamento") {
      // gramos reales registrados en producción con este filamento
      consumed = data.productionRuns
        .filter((r) => r.filamentSupplyId === s.id)
        .reduce((a, r) => a + r.gramsReal, 0);
    } else {
      // componentes y packaging: unidades OK producidas × cantidad en receta
      for (const r of data.productionRuns) {
        const recipeQty = data.recipeItems
          .filter((ri) => ri.productId === r.productId && ri.supplyId === s.id)
          .reduce((a, ri) => a + ri.qty, 0);
        consumed += r.unitsOk * recipeQty;
      }
    }

    const uc = unitCost(s);
    const current = s.initialStock + purchased - consumed + s.manualAdjust;
    return {
      supply: s,
      initial: s.initialStock,
      purchased,
      consumed,
      manualAdjust: s.manualAdjust,
      current,
      unitCost: uc,
      stockValue: current * uc,
      reorderPoint: s.reorderPoint,
      alert: s.reorderPoint > 0 && current <= s.reorderPoint,
    };
  });
}

// ── Resumen mensual ──────────────────────────────────────────────────
export interface MonthRow {
  month: string; // "2026-09"
  units: number;
  netSales: number;
  commissions: number;
  shipping: number;
  taxes: number;
  netIncome: number;
  variableCost: number;
  contribution: number;
  contributionPct: number;
  fixedReal: number;
  fixedBudget: number;
  result: number;
  cashIn: number;
  cashOut: number;
  cashFlow: number;
  cashBalance: number;
}

const monthKey = (dateStr: string) => dateStr.slice(0, 7);

export function monthlySummary(data: AllData): MonthRow[] {
  const salesC = allSalesComputed(data);
  const fixedBudget = data.fixedCosts.reduce((a, f) => a + f.monthlyArs, 0);

  const start = monthKey(data.settings.startDate);
  const allDates = [
    ...data.sales.map((s) => s.date),
    ...data.sales.map((s) => s.collectionDate ?? ""),
    ...data.purchases.map((p) => p.date),
    ...data.purchases.map((p) => p.paymentDate ?? ""),
    ...data.productionRuns.map((r) => r.date),
    ...data.partnerMovements.map((m) => m.date),
  ].filter(Boolean);
  const today = new Date().toISOString().slice(0, 7);
  let end = today > start ? today : start;
  for (const d of allDates) {
    const k = monthKey(d);
    if (k > end) end = k;
  }

  const months: string[] = [];
  let [y, m] = start.split("-").map(Number);
  while (true) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    months.push(key);
    if (key >= end || months.length > 60) break;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  let cashBalance = 0;
  return months.map((key) => {
    const inMonth = salesC.filter((s) => monthKey(s.sale.date) === key);
    const units = inMonth.reduce((a, s) => a + s.sale.qty, 0);
    const netSales = inMonth.reduce((a, s) => a + s.totalNet, 0);
    const commissions = inMonth.reduce((a, s) => a + s.commission, 0);
    const shipping = inMonth.reduce((a, s) => a + s.sale.shipping, 0);
    const taxes = inMonth.reduce((a, s) => a + s.taxes, 0);
    const netIncome = inMonth.reduce((a, s) => a + s.netIncome, 0);
    const variableCost = inMonth.reduce((a, s) => a + s.variableCost, 0);
    const contribution = inMonth.reduce((a, s) => a + s.contribution, 0);

    const fixedReal = data.purchases
      .filter((p) => p.type === "Costo fijo" && monthKey(p.date) === key)
      .reduce((a, p) => a + p.amountArs, 0);

    // Caja: cobros por fecha de cobro, pagos por fecha de pago
    const cashIn = salesC
      .filter(
        (s) =>
          s.sale.status === "Cobrada" &&
          monthKey(s.sale.collectionDate || s.sale.date) === key,
      )
      .reduce((a, s) => a + s.netIncome, 0);
    const partnerIn = data.partnerMovements
      .filter((mv) => mv.type === "Aporte" && monthKey(mv.date) === key)
      .reduce((a, mv) => a + mv.amountArs, 0);
    const partnerOut = data.partnerMovements
      .filter((mv) => mv.type === "Retiro" && monthKey(mv.date) === key)
      .reduce((a, mv) => a + mv.amountArs, 0);
    const cashOut = data.purchases
      .filter(
        (p) =>
          p.status === "Pagada" && monthKey(p.paymentDate || p.date) === key,
      )
      .reduce((a, p) => a + p.amountArs, 0);

    const cashFlow = cashIn + partnerIn - cashOut - partnerOut;
    cashBalance += cashFlow;

    const result = contribution - fixedReal;
    return {
      month: key,
      units,
      netSales,
      commissions,
      shipping,
      taxes,
      netIncome,
      variableCost,
      contribution,
      contributionPct: netSales > 0 ? contribution / netSales : 0,
      fixedReal,
      fixedBudget,
      result,
      cashIn: cashIn + partnerIn,
      cashOut: cashOut + partnerOut,
      cashFlow,
      cashBalance,
    };
  });
}

// ── Socios ───────────────────────────────────────────────────────────
export interface PartnerAccount {
  partner: Partner;
  contributions: number;
  withdrawals: number;
  balance: number;
  capitalPct: number;
  diffVsEqual: number;
}

export function partnerAccounts(data: AllData): PartnerAccount[] {
  const rows = data.partners.map((p) => {
    const contributions = data.partnerMovements
      .filter((m) => m.partnerId === p.id && m.type === "Aporte")
      .reduce((a, m) => a + m.amountArs, 0);
    const withdrawals = data.partnerMovements
      .filter((m) => m.partnerId === p.id && m.type === "Retiro")
      .reduce((a, m) => a + m.amountArs, 0);
    return { partner: p, contributions, withdrawals, balance: contributions - withdrawals };
  });
  const totalBalance = rows.reduce((a, r) => a + r.balance, 0);
  const equal = rows.length > 0 ? totalBalance / rows.length : 0;
  return rows.map((r) => ({
    ...r,
    capitalPct: totalBalance > 0 ? r.balance / totalBalance : 0,
    diffVsEqual: r.balance - equal,
  }));
}

// ── Monotributo ──────────────────────────────────────────────────────
export function invoicedLast12Months(data: AllData): number {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return allSalesComputed(data)
    .filter((s) => s.sale.invoiced && s.sale.date >= cutoffStr)
    .reduce((a, s) => a + s.totalNet, 0);
}

// ── Tablero ──────────────────────────────────────────────────────────
export function dashboard(data: AllData) {
  const st = data.settings;
  const salesC = allSalesComputed(data);
  const summary = monthlySummary(data);
  const pStocks = productStocks(data);
  const sStocks = supplyStocks(data);
  const accounts = partnerAccounts(data);

  const assetInvestment = data.assets.reduce((a, x) => a + x.costArs, 0);
  const capital = accounts.reduce((a, x) => a + x.contributions, 0);
  const withdrawals = accounts.reduce((a, x) => a + x.withdrawals, 0);
  const cashBalance = summary.length ? summary[summary.length - 1].cashBalance : 0;

  const unitsSold = salesC.reduce((a, s) => a + s.sale.qty, 0);
  const salesTotal = salesC.reduce((a, s) => a + s.totalNet, 0);
  const avgTicket = unitsSold > 0 ? salesTotal / unitsSold : 0;
  const contribution = salesC.reduce((a, s) => a + s.contribution, 0);
  const avgContribMargin = salesTotal > 0 ? contribution / salesTotal : 0;
  const fixedAccum = summary.reduce((a, r) => a + r.fixedReal, 0);
  const resultAccum = contribution - fixedAccum;

  const fixedBudget = data.fixedCosts.reduce((a, f) => a + f.monthlyArs, 0);
  const breakEvenSales = avgContribMargin > 0 ? fixedBudget / avgContribMargin : 0;
  const breakEvenUnits = avgTicket > 0 ? breakEvenSales / avgTicket : 0;

  const runs = data.productionRuns;
  const hoursAccum = runs.reduce((a, r) => a + r.hoursReal, 0);
  const unitsProduced = runs.reduce((a, r) => a + r.unitsOk, 0);
  const unitsFailed = runs.reduce((a, r) => a + r.unitsFailed, 0);
  const failRateReal =
    unitsProduced + unitsFailed > 0 ? unitsFailed / (unitsProduced + unitsFailed) : 0;
  const contribPerHour = hoursAccum > 0 ? contribution / hoursAccum : 0;
  const gramsUsed = runs.reduce((a, r) => a + r.gramsReal, 0);

  const productsById = new Map(data.products.map((p) => [p.id, p]));
  const hoursDeviation = runs.reduce((a, r) => {
    const p = productsById.get(r.productId);
    const estimated = p ? (r.unitsOk + r.unitsFailed) * p.printHours : 0;
    return a + (r.hoursReal - estimated);
  }, 0);

  const avgHoursPerUnit = unitsProduced > 0 ? hoursAccum / unitsProduced : 0;
  const breakEvenHours = breakEvenUnits * avgHoursPerUnit;
  const capacityUse =
    st.hoursAvailable > 0 ? breakEvenHours / st.hoursAvailable : 0;

  const monthsWithSales = summary.filter((r) => r.netSales > 0).length;
  const avgMonthlyResult = monthsWithSales > 0 ? resultAccum / monthsWithSales : 0;
  const paybackMonths =
    avgMonthlyResult > 0 ? assetInvestment / avgMonthlyResult : null;

  const stockValue =
    pStocks.reduce((a, s) => a + s.stockValue, 0) +
    sStocks.reduce((a, s) => a + s.stockValue, 0);

  const invoiced12m = invoicedLast12Months(data);
  const capUse = st.monotributoCap > 0 ? invoiced12m / st.monotributoCap : null;

  return {
    assetInvestment,
    assetInvestmentUsd: st.fxRate > 0 ? assetInvestment / st.fxRate : 0,
    capital,
    withdrawals,
    cashBalance,
    unitsSold,
    salesTotal,
    avgTicket,
    contribution,
    avgContribMargin,
    fixedAccum,
    resultAccum,
    fixedBudget,
    breakEvenSales,
    breakEvenUnits,
    avgHoursPerUnit,
    breakEvenHours,
    capacityUse,
    hoursAccum,
    unitsProduced,
    unitsFailed,
    failRateReal,
    contribPerHour,
    gramsUsed,
    hoursDeviation,
    monthsWithSales,
    avgMonthlyResult,
    paybackMonths,
    stockValue,
    invoiced12m,
    capUse,
  };
}
