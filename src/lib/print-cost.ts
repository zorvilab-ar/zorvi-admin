/**
 * Copia deliberada de la del backend.
 *
 * La calculadora recalcula en cada tecla que se toca: gramos, horas, margen.
 * Hacer eso por HTTP sería una llamada por pulsación, así que esta cuenta
 * corre en el navegador. Es el único cálculo que el admin conserva, y es de
 * presentación — el costeo que vale, el de los presupuestos guardados, lo
 * hace el backend con esta misma fórmula.
 *
 * Si se toca una, hay que tocar la otra. Los tests están del lado del backend.
 */
export interface CustomPrintCost {
  material: number;
  energy: number;
  wear: number;
  assembly: number;
  design: number;
  labor: number;
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
  assemblyMinutes?: number;
  designHours?: number;
  assemblyRate?: number;
  designRate?: number;
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
  // El armado se paga por pieza; el diseño se hace una sola vez para todo el
  // pedido, así que no se multiplica por la cantidad.
  const assembly =
    ((opts.assemblyMinutes ?? 0) / 60) * (opts.assemblyRate ?? 0) * qty;
  const design = (opts.designHours ?? 0) * (opts.designRate ?? 0);
  const labor = assembly + design;
  const subtotal = material + energy + wear + labor;
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
    assembly,
    design,
    labor,
    errorMargin,
    costWithoutSupplies,
    extras,
    extrasHigh,
    totalCost,
    charge,
    market,
  };
}
