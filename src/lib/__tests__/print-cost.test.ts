import { describe, it, expect } from "vitest";
import { customPrintCost } from "@/lib/print-cost";

/**
 * Costeo de piezas a medida: la calculadora y los ítems de presupuesto.
 * Los valores base son los de Parámetros (filamento a 19.990 el kilo, 100 W,
 * 200 $/kWh, 15% de fallas, 45% de margen, desgaste de la Bambu a 293 $/h).
 */
const base = {
  grams: 286,
  hours: 8,
  filamentPricePerKg: 19_990,
  failureRate: 0.15,
  printerWatts: 100,
  kwhPrice: 200,
  amortPerHour: 293,
  targetMargin: 0.45,
};

describe("costeo de una pieza a medida", () => {
  it("cobra material, luz y desgaste por unidad", () => {
    const c = customPrintCost({ ...base, qty: 3 });
    expect(c.material).toBeCloseTo(0.286 * 19_990 * 3, 6);
    expect(c.energy).toBeCloseTo(((8 * 100 * 200) / 1000) * 3, 6);
    expect(c.wear).toBeCloseTo(8 * 293 * 3, 6);
  });

  it("qty ausente o cero cuenta como una unidad", () => {
    const una = customPrintCost(base);
    expect(customPrintCost({ ...base, qty: 0 }).totalCost).toBeCloseTo(una.totalCost, 9);
  });

  it("el precio a cobrar deja exactamente el margen objetivo", () => {
    const c = customPrintCost(base);
    expect((c.charge - c.totalCost) / c.charge).toBeCloseTo(0.45, 9);
  });

  it("con margen objetivo imposible no devuelve infinito", () => {
    const c = customPrintCost({ ...base, targetMargin: 1 });
    expect(Number.isFinite(c.charge)).toBe(true);
    expect(c.charge).toBe(c.totalCost);
  });
});

// Regresión del hallazgo 3 de QA: la calculadora no cobraba la mano de obra,
// aunque la ficha de producto sí lo hacía. Toda pieza a medida salía barata.
describe("mano de obra", () => {
  const conObra = {
    ...base,
    qty: 2,
    assemblyMinutes: 30,
    designHours: 2,
    assemblyRate: 6000,
    designRate: 10_000,
  };

  it("el armado se cobra por unidad", () => {
    expect(customPrintCost(conObra).assembly).toBeCloseTo((30 / 60) * 6000 * 2, 6);
  });

  it("el diseño se cobra una sola vez para todo el pedido", () => {
    const dos = customPrintCost(conObra);
    const diez = customPrintCost({ ...conObra, qty: 10 });
    expect(dos.design).toBeCloseTo(2 * 10_000, 6);
    expect(diez.design).toBeCloseTo(dos.design, 9); // no escala con la cantidad
  });

  it("entra antes del margen de falla, igual que en la ficha de producto", () => {
    const sin = customPrintCost({ ...base, qty: 2 });
    const con = customPrintCost(conObra);
    expect(con.totalCost).toBeCloseTo(sin.totalCost + con.labor * 1.15, 6);
  });

  it("sin datos de mano de obra el costo no cambia", () => {
    const sin = customPrintCost({ ...base, qty: 2 });
    const cero = customPrintCost({ ...base, qty: 2, assemblyMinutes: 0, designHours: 0, assemblyRate: 6000, designRate: 10_000 });
    expect(cero.labor).toBe(0);
    expect(cero.totalCost).toBeCloseTo(sin.totalCost, 9);
  });
});

describe("insumos extra", () => {
  it("se cobran por unidad y quedan fuera del margen de falla", () => {
    const c = customPrintCost({ ...base, qty: 2, extraSuppliesArs: 10_000 });
    expect(c.extras).toBe(20_000);
    expect(c.totalCost).toBeCloseTo(c.costWithoutSupplies + 20_000, 6);
  });

  it("avisa cuando los extras pesan más del 30% de la impresión", () => {
    expect(customPrintCost({ ...base, extraSuppliesArs: 1000 }).extrasHigh).toBe(false);
    expect(customPrintCost({ ...base, extraSuppliesArs: 50_000 }).extrasHigh).toBe(true);
  });
});

describe("precio de MercadoLibre", () => {
  it("con comisión cargada, el neto después de comisión es el precio a cobrar", () => {
    const c = customPrintCost({ ...base, marketCommission: 0.13, marketFixed: 2000 });
    expect((c.market - 2000) * (1 - 0.13)).toBeCloseTo(c.charge, 6);
  });

  it("sin comisión cargada cae en el estimado de +22,5%", () => {
    const c = customPrintCost(base);
    expect(c.market).toBeCloseTo(c.charge * 1.225, 6);
  });
});
