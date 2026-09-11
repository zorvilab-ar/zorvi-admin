export interface CustomPrintCost {
  material: number;
  energy: number;
  wear: number;
  errorMargin: number;
  costWithoutSupplies: number;
  extras: number;
  extrasHigh: boolean;
  totalCost: number;
  charge: number;
  market: number;
}

/** Costeo de una pieza a medida (calculadora / presupuesto). */
export function customPrintCost(opts: {
  grams: number;
  hours: number;
  qty?: number;
  filamentPricePerKg: number;
  extraSuppliesArs?: number;
  failureRate: number;
  printerWatts: number;
  kwhPrice: number;
  amortPerHour: number;
  targetMargin: number;
  marketCommission?: number;
  marketFixed?: number;
}): CustomPrintCost {
  const qty = opts.qty && opts.qty > 0 ? opts.qty : 1;
  const material = (opts.grams / 1000) * opts.filamentPricePerKg * qty;
  const energy =
    ((opts.hours * opts.printerWatts * opts.kwhPrice) / 1000) * qty;
  const wear = opts.hours * opts.amortPerHour * qty;
  const subtotal = material + energy + wear;
  const errorMargin = subtotal * opts.failureRate;
  const costWithoutSupplies = subtotal + errorMargin;
  const extras = (opts.extraSuppliesArs ?? 0) * qty;
  const extrasHigh =
    extras > 0 && extras / Math.max(costWithoutSupplies, 1) > 0.3;
  const totalCost = costWithoutSupplies + extras;
  const charge =
    opts.targetMargin < 1 ? totalCost / (1 - opts.targetMargin) : totalCost;
  const comm = opts.marketCommission ?? 0;
  const market =
    comm > 0 && comm < 1
      ? charge / (1 - comm) + (opts.marketFixed ?? 0)
      : charge * 1.225;
  return {
    material,
    energy,
    wear,
    errorMargin,
    costWithoutSupplies,
    extras,
    extrasHigh,
    totalCost,
    charge,
    market,
  };
}
