import { describe, it, expect } from "vitest";
import {
  unitCost,
  filamentPricePerKg,
  assetAmortPerHour,
  totalAmortPerHour,
  printerAssets,
  allProductCosts,
  channelPrices,
  computeSale,
  allSalesComputed,
  productStocks,
  supplyStocks,
  monthlySummary,
  partnerAccounts,
  dashboard,
  invoicedLast12Months,
} from "@/lib/calc";
import * as f from "./fixtures";
import { LAMP } from "./fixtures";

describe("costo unitario de insumos", () => {
  it("divide el precio del pack por lo que trae el pack", () => {
    expect(unitCost(f.supply())).toBeCloseTo(19.99, 6);
    expect(filamentPricePerKg(f.supply())).toBeCloseTo(19_990, 6);
  });

  it("no divide por cero si el pack quedó en 0", () => {
    expect(unitCost(f.supply({ packQty: 0 }))).toBe(0);
  });
});

describe("amortización de activos", () => {
  it("reparte costo menos residual sobre la vida útil", () => {
    expect(assetAmortPerHour(f.asset())).toBeCloseTo(293, 6);
    expect(
      assetAmortPerHour(f.asset({ costArs: 1000, residualArs: 200, usefulLifeHours: 100 })),
    ).toBeCloseTo(8, 6);
  });

  // Regresión del hallazgo 6 de QA: el soplador de calor no imprime, así que su
  // desgaste no puede entrar en el costo por hora de impresión.
  it("solo suma impresoras, nunca herramientas", () => {
    const assets = [
      f.asset(),
      f.asset({ id: 2, code: "HERR-001", name: "Soplador de calor", type: "Herramienta", costArs: 50_000, usefulLifeHours: 500 }),
    ];
    expect(printerAssets(assets)).toHaveLength(1);
    expect(totalAmortPerHour(assets)).toBeCloseTo(293, 6);
  });

  it("suma varias impresoras", () => {
    const assets = [f.asset(), f.asset({ id: 2, code: "IMP-002" })];
    expect(totalAmortPerHour(assets)).toBeCloseTo(586, 6);
  });
});

describe("ficha de costo del producto", () => {
  const cost = () => allProductCosts(f.allData()).get(1)!;

  it("desglosa cada componente por su categoría de insumo", () => {
    const c = cost();
    expect(c.filament).toBeCloseTo(LAMP.filament, 6);
    expect(c.components).toBeCloseTo(LAMP.components, 6);
    expect(c.packaging).toBeCloseTo(LAMP.packaging, 6);
    expect(c.energy).toBeCloseTo(LAMP.energy, 6);
    expect(c.amortization).toBeCloseTo(LAMP.amortization, 6);
    expect(c.labor).toBeCloseTo(LAMP.labor, 6);
  });

  it("aplica el desperdicio de la receta sobre la línea", () => {
    const data = f.allData({
      recipeItems: [f.recipeItem({ wastePct: 0.1 })],
    });
    expect(allProductCosts(data).get(1)!.filament).toBeCloseTo(
      286 * 19.99 * 1.1,
      6,
    );
  });

  it("suma las fallas al costo variable y los fijos al costo total", () => {
    const c = cost();
    expect(c.failureAdj).toBeCloseTo(LAMP.subtotal * 0.15, 6);
    expect(c.variableCost).toBeCloseTo(LAMP.variableCost, 6);
    expect(c.fixedAllocated).toBeCloseTo(LAMP.fixedAllocated, 6);
    expect(c.totalCost).toBeCloseTo(LAMP.totalCost, 6);
  });

  it("el precio sugerido deja exactamente el margen objetivo", () => {
    const c = cost();
    expect(c.suggestedPrice).toBeCloseTo(LAMP.totalCost / 0.55, 6);
    // Si se vendiera al sugerido, el margen neto sería el objetivo.
    const margin = (c.suggestedPrice - c.totalCost) / c.suggestedPrice;
    expect(margin).toBeCloseTo(0.45, 9);
  });

  // Regresión del hallazgo 6: una herramienta en el inventario no puede
  // encarecer la lámpara.
  it("no cambia si se agrega una herramienta al inventario", () => {
    const base = allProductCosts(f.allData()).get(1)!;
    const conSoplador = allProductCosts(
      f.allData({
        assets: [f.asset(), f.asset({ id: 2, code: "HERR-001", type: "Herramienta", costArs: 50_000, usefulLifeHours: 500 })],
      }),
    ).get(1)!;
    expect(conSoplador.totalCost).toBeCloseTo(base.totalCost, 9);
  });

  it("no revienta con un producto sin receta ni horas", () => {
    const c = allProductCosts(
      f.allData({
        products: [f.product({ printHours: 0, assemblyMinutes: 0, listPrice: 0 })],
        recipeItems: [],
      }),
    ).get(1)!;
    expect(c.variableCost).toBe(0);
    expect(c.contributionPct).toBe(0);
    expect(Number.isFinite(c.suggestedPrice)).toBe(true);
  });
});

describe("precios por canal", () => {
  const ml = f.channel({ id: 2, name: "MercadoLibre", commission: 0.13, fixedCost: 2000 });

  it("el sugerido del canal cubre comisión, fijo e impuestos", () => {
    const c = allProductCosts(f.allData()).get(1)!;
    const [directo, mercado] = channelPrices(
      c,
      35_000,
      [f.channel(), ml],
      f.settings(),
    );
    expect(directo.suggestedPrice).toBeCloseTo(c.totalCost / 0.55, 6);
    expect(mercado.suggestedPrice).toBeCloseTo((c.totalCost + 2000) / 0.42, 6);
    // Vender en ML tiene que costar más que vender en directo.
    expect(mercado.suggestedPrice).toBeGreaterThan(directo.suggestedPrice);
  });

  it("vender al sugerido de un canal deja el margen objetivo en ese canal", () => {
    const c = allProductCosts(f.allData()).get(1)!;
    const [mercado] = channelPrices(c, 35_000, [ml], f.settings());
    const [check] = channelPrices(
      c,
      mercado.suggestedPrice,
      [ml],
      f.settings(),
    );
    expect(check.netMarginAtList).toBeCloseTo(0.45, 9);
  });

  // Regresión del hallazgo 7: 35.000 deja bastante menos que el 45% objetivo.
  it("al precio de lista actual el margen queda muy por debajo del objetivo", () => {
    const c = allProductCosts(f.allData()).get(1)!;
    const [directo] = channelPrices(c, 35_000, [f.channel()], f.settings());
    expect(directo.netMarginAtList).toBeLessThan(0.45);
    expect(directo.netMarginAtList).toBeCloseTo(
      (35_000 - LAMP.totalCost) / 35_000,
      6,
    );
  });

  it("con comisiones en cero todos los canales dan el mismo número", () => {
    const c = allProductCosts(f.allData()).get(1)!;
    const canales = [f.channel(), f.channel({ id: 2, name: "Tienda web" }), f.channel({ id: 3, name: "Feria" })];
    const precios = channelPrices(c, 35_000, canales, f.settings());
    const unico = new Set(precios.map((p) => p.suggestedPrice.toFixed(6)));
    expect(unico.size).toBe(1);
  });
});

describe("cálculo de una venta", () => {
  const ml = f.channel({ id: 2, name: "MercadoLibre", commission: 0.13, fixedCost: 2000 });
  const costs = () => allProductCosts(f.allData());

  it("descuenta comisión, fijo del canal, envío e impuestos", () => {
    const s = computeSale(
      f.sale({ channelId: 2, qty: 2, unitPrice: 35_000, discount: 5000, shipping: 3000 }),
      new Map([[2, ml]]),
      costs(),
      f.settings(),
    );
    expect(s.subtotal).toBe(70_000);
    expect(s.totalNet).toBe(65_000);
    expect(s.commission).toBeCloseTo(65_000 * 0.13 + 2000, 6);
    expect(s.netIncome).toBeCloseTo(65_000 - (65_000 * 0.13 + 2000) - 3000, 6);
    expect(s.variableCost).toBeCloseTo(LAMP.variableCost * 2, 6);
    expect(s.contribution).toBeCloseTo(s.netIncome - s.variableCost, 9);
  });

  it("aplica IIBB y otros impuestos sobre la venta neta", () => {
    const s = computeSale(
      f.sale(),
      new Map([[1, f.channel()]]),
      costs(),
      f.settings({ iibbRate: 0.03, otherTaxRate: 0.02 }),
    );
    expect(s.taxes).toBeCloseTo(35_000 * 0.05, 6);
  });

  it("da contribución negativa si se vende por debajo del costo variable", () => {
    const s = computeSale(
      f.sale({ unitPrice: 20_000 }),
      new Map([[1, f.channel()]]),
      costs(),
      f.settings(),
    );
    expect(s.contribution).toBeLessThan(0);
  });

  it("no divide por cero si la venta quedó en cero", () => {
    const s = computeSale(
      f.sale({ unitPrice: 0 }),
      new Map([[1, f.channel()]]),
      costs(),
      f.settings(),
    );
    expect(s.marginPct).toBe(0);
  });
});

describe("stock", () => {
  it("producto = inicial + producido − vendido", () => {
    const data = f.allData({
      products: [f.product({ initialStock: 2 })],
      productionRuns: [f.productionRun({ unitsOk: 5, unitsFailed: 2 })],
      sales: [f.sale({ qty: 3 })],
    });
    const stock = productStocks(data)[0];
    expect(stock.produced).toBe(5); // las falladas no suman
    expect(stock.sold).toBe(3);
    expect(stock.current).toBe(4);
    expect(stock.stockValue).toBeCloseTo(4 * LAMP.variableCost, 6);
  });

  it("el filamento se consume por gramos reales de producción", () => {
    const data = f.allData({
      supplies: [f.supply({ initialStock: 1000 })],
      recipeItems: [f.recipeItem()],
      purchases: [f.purchase({ type: "Insumo", supplyId: 1, qty: 500, amountArs: 10_000 })],
      productionRuns: [f.productionRun({ gramsReal: 300 })],
    });
    const s = supplyStocks(data)[0];
    expect(s.purchased).toBe(500);
    expect(s.consumed).toBe(300);
    expect(s.current).toBe(1200);
  });

  it("componentes y packaging se consumen por receta × unidades OK", () => {
    const data = f.allData({
      productionRuns: [f.productionRun({ unitsOk: 4, unitsFailed: 3 })],
    });
    const comp = supplyStocks(data).find((s) => s.supply.code === "COMP-001")!;
    expect(comp.consumed).toBe(4); // solo las que salieron bien
  });

  it("marca alerta cuando se cae bajo el punto de reposición", () => {
    const data = f.allData({
      supplies: [f.supply({ initialStock: 100, reorderPoint: 200 })],
    });
    expect(supplyStocks(data)[0].alert).toBe(true);
  });

  it("sin punto de reposición cargado no alerta nunca", () => {
    const data = f.allData({ supplies: [f.supply({ initialStock: 0, reorderPoint: 0 })] });
    expect(supplyStocks(data)[0].alert).toBe(false);
  });
});

describe("resumen mensual y caja", () => {
  it("imputa el cobro por fecha de cobro, no por fecha de venta", () => {
    const data = f.allData({
      sales: [f.sale({ date: "2026-09-20", status: "Cobrada", collectionDate: "2026-10-05" })],
    });
    const rows = monthlySummary(data);
    const sep = rows.find((r) => r.month === "2026-09")!;
    const oct = rows.find((r) => r.month === "2026-10")!;
    expect(sep.netSales).toBe(35_000); // la venta es de septiembre
    expect(sep.cashIn).toBe(0); //        pero la plata entra en octubre
    expect(oct.cashIn).toBeGreaterThan(0);
  });

  it("una venta pendiente no entra a la caja", () => {
    const data = f.allData({ sales: [f.sale({ status: "Pendiente" })] });
    const sep = monthlySummary(data).find((r) => r.month === "2026-09")!;
    expect(sep.netSales).toBe(35_000);
    expect(sep.cashIn).toBe(0);
  });

  it("el saldo de caja se acumula mes a mes", () => {
    const data = f.allData({
      partnerMovements: [
        f.movement({ date: "2026-09-02", amountArs: 100_000 }),
        f.movement({ id: 2, date: "2026-10-02", amountArs: 50_000 }),
      ],
    });
    const rows = monthlySummary(data);
    expect(rows.find((r) => r.month === "2026-09")!.cashBalance).toBe(100_000);
    expect(rows.find((r) => r.month === "2026-10")!.cashBalance).toBe(150_000);
  });
});

describe("cuentas de los socios", () => {
  it("saldo = aportes − retiros, y el % sobre el capital total", () => {
    const data = f.allData({
      partners: [f.partner(), f.partner({ id: 2, name: "Nico" })],
      partnerMovements: [
        f.movement({ id: 1, partnerId: 1, type: "Aporte", amountArs: 300_000 }),
        f.movement({ id: 2, partnerId: 1, type: "Retiro", amountArs: 100_000 }),
        f.movement({ id: 3, partnerId: 2, type: "Aporte", amountArs: 200_000 }),
      ],
    });
    const [juanchi, nico] = partnerAccounts(data);
    expect(juanchi.balance).toBe(200_000);
    expect(nico.balance).toBe(200_000);
    expect(juanchi.capitalPct).toBeCloseTo(0.5, 9);
    expect(juanchi.diffVsEqual).toBe(0); // están parejos
  });

  it("detecta al que puso de más", () => {
    const data = f.allData({
      partners: [f.partner(), f.partner({ id: 2, name: "Nico" })],
      partnerMovements: [f.movement({ partnerId: 1, amountArs: 100_000 })],
    });
    const [juanchi, nico] = partnerAccounts(data);
    expect(juanchi.diffVsEqual).toBe(50_000);
    expect(nico.diffVsEqual).toBe(-50_000);
  });
});

describe("tablero", () => {
  // Regresión del hallazgo 8 de QA: el socio aportó la plata de la impresora y
  // el activo se cargó, pero nunca se registró la compra. La caja muestra plata
  // que ya se gastó.
  const conAporteSinCompra = f.allData({
    partnerMovements: [f.movement({ amountArs: 1_465_000 })],
  });

  it("avisa cuando hay un activo sin su compra", () => {
    const d = dashboard(conAporteSinCompra);
    expect(d.cashBalance).toBe(1_465_000); // plata que en realidad ya salió
    expect(d.assetsUnbooked).toBe(1_465_000);
  });

  it("deja de avisar cuando se carga el asiento que falta", () => {
    const d = dashboard({
      ...conAporteSinCompra,
      purchases: [
        f.purchase({ type: "Activo", amountArs: 1_465_000, status: "Pagada", paymentDate: "2026-09-02" }),
      ],
    });
    expect(d.cashBalance).toBe(0); // entró el aporte, salió la compra
    expect(d.assetsUnbooked).toBe(0);
  });

  // Base recién sembrada: hay activo pero nadie aportó todavía. No hay caja
  // inflada, así que el aviso no tiene que dispararse.
  it("no da falso positivo sin aportes", () => {
    expect(dashboard(f.allData()).assetsUnbooked).toBe(0);
  });

  it("calcula el punto de equilibrio con el margen real", () => {
    const d = dashboard(f.allData({ sales: [f.sale()] }));
    expect(d.avgContribMargin).toBeCloseTo((35_000 - LAMP.variableCost) / 35_000, 6);
    expect(d.breakEvenSales).toBeCloseTo(117_500 / d.avgContribMargin, 6);
    expect(d.breakEvenUnits).toBeCloseTo(d.breakEvenSales / 35_000, 6);
  });

  it("sin ventas no divide por cero", () => {
    const d = dashboard(f.allData());
    expect(d.avgTicket).toBe(0);
    expect(d.breakEvenSales).toBe(0);
    expect(d.paybackMonths).toBeNull();
  });

  it("contribución por hora sale de las horas realmente impresas", () => {
    const d = dashboard(
      f.allData({ sales: [f.sale()], productionRuns: [f.productionRun({ hoursReal: 10 })] }),
    );
    expect(d.contribPerHour).toBeCloseTo(d.contribution / 10, 6);
  });
});

describe("control de monotributo", () => {
  it("suma solo las ventas facturadas", () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const data = f.allData({
      sales: [
        f.sale({ id: 1, date: hoy, invoiced: true, unitPrice: 35_000 }),
        f.sale({ id: 2, date: hoy, invoiced: false, unitPrice: 50_000 }),
      ],
    });
    expect(invoicedLast12Months(data)).toBe(35_000);
  });

  it("ignora lo facturado hace más de un año", () => {
    const data = f.allData({
      sales: [f.sale({ date: "2020-01-01", invoiced: true })],
    });
    expect(invoicedLast12Months(data)).toBe(0);
  });
});

describe("todas las ventas juntas", () => {
  it("la contribución total es la suma fila por fila", () => {
    const data = f.allData({
      sales: [f.sale({ id: 1 }), f.sale({ id: 2, qty: 2 })],
    });
    const rows = allSalesComputed(data);
    expect(rows).toHaveLength(2);
    expect(rows.reduce((a, r) => a + r.contribution, 0)).toBeCloseTo(
      dashboard(data).contribution,
      6,
    );
  });
});
