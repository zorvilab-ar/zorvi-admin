import { db, schema } from "./index";

const {
  settings,
  channels,
  partners,
  assets,
  fixedCosts,
  supplies,
  products,
  recipeItems,
} = schema;

async function main() {
  const [settingRows, channelRows, supplyRows, productRows] = await Promise.all([
    db.select({ id: settings.id }).from(settings),
    db.select({ id: channels.id }).from(channels),
    db.select({ id: supplies.id }).from(supplies),
    db.select({ id: products.id }).from(products),
  ]);

  if (
    settingRows.length > 0 &&
    channelRows.length > 0 &&
    supplyRows.length > 0 &&
    productRows.length > 0
  ) {
    console.log(
      `Seed omitido: la base ya tiene datos (settings ${settingRows.length}, canales ${channelRows.length}, insumos ${supplyRows.length}, productos ${productRows.length}).`,
    );
    console.log(
      "Miralos en Supabase → Table Editor → schema public: settings, channels, partners, supplies, products.",
    );
    console.log(
      "sales, purchases, quotes y filament_rolls empiezan vacías a propósito.",
    );
    return;
  }

  if (settingRows.length > 0) {
    console.log(
      "Hay settings pero falta catálogo. Completando el resto del seed…",
    );
  }

  if (settingRows.length === 0) {
    await db.insert(settings).values({
    id: 1,
    businessName: "Zorvi Lab",
    startDate: "2026-09-07",
    fxRate: 1500,
    fxDate: "2026-09-07",
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
    reinvestPercent: 100,
    });
  }

  await db.insert(channels).values([
    { name: "Directo", commission: 0, fixedCost: 0, notes: "Venta cara a cara, sin comisión." },
    { name: "Instagram/WhatsApp", commission: 0, fixedCost: 0, notes: "Costo de pasarela si cobrás con link de pago." },
    { name: "MercadoLibre", commission: 0, fixedCost: 0, notes: "Comisión + costo fijo por unidad. Sumá acá el envío gratis." },
    { name: "Tienda web", commission: 0, fixedCost: 0, notes: "Comisión de la plataforma y del medio de pago." },
    { name: "Feria", commission: 0, fixedCost: 0, notes: "Prorrateá el costo del stand por venta esperada." },
    { name: "Mayorista", commission: 0, fixedCost: 0, notes: "Revendedores. Se usa junto con el descuento mayorista." },
  ]);

  await db.insert(partners).values([
    { name: "Agustín" },
    { name: "Nico" },
    { name: "Juanchi" },
    { name: "Mariano" },
  ]);

  await db.insert(assets).values({
    code: "IMP-001",
    name: "Bambu Lab A1 Combo (con AMS lite)",
    type: "Impresora",
    purchaseDate: "2026-09-02",
    costArs: 1465000,
    usefulLifeHours: 5000,
    residualArs: 0,
    notes: "ProyectoColor",
  });

  await db.insert(fixedCosts).values([
    { concept: "Espacio y electricidad (pago a Mariano)", category: "Estructura", monthlyArs: 37500, notes: "Lo que se le paga por tener la impresora en su casa." },
    { concept: "Internet", category: "Estructura", monthlyArs: 0 },
    { concept: "Monotributo (cuota mensual)", category: "Impuestos", monthlyArs: 50000, notes: "Cuota del socio que factura." },
    { concept: "Publicidad y contenido", category: "Comercial", monthlyArs: 0, notes: "Ads de Instagram, fotos, muestras." },
    { concept: "Software y suscripciones", category: "Operación", monthlyArs: 30000, notes: "Slicer pago, diseño, hosting de la web." },
    { concept: "Mantenimiento y repuestos de impresora", category: "Operación", monthlyArs: 0, notes: "Boquillas, placa, correas, lubricante." },
  ]);

  const sup = await db
    .insert(supplies)
    .values([
      { code: "FIL-001", name: "Filamento Negro", category: "Filamento", unit: "g", purchasePrice: 19990, packQty: 1000, supplier: "ProyectoColor", updatedAt: "2026-09-09" },
      { code: "FIL-002", name: "Filamento Blanco", category: "Filamento", unit: "g", purchasePrice: 19990, packQty: 1000, supplier: "ProyectoColor", updatedAt: "2026-09-09" },
      { code: "FIL-003", name: "Filamento Gris", category: "Filamento", unit: "g", purchasePrice: 19990, packQty: 1000, supplier: "ProyectoColor", updatedAt: "2026-09-09" },
      { code: "COMP-001", name: "Portalámpara Velador Blanco", category: "Componente", unit: "u", purchasePrice: 10000, packQty: 1, supplier: "Mercado Libre", updatedAt: "2026-09-10" },
      { code: "COMP-002", name: "Portalámpara Velador Negro", category: "Componente", unit: "u", purchasePrice: 10000, packQty: 1, supplier: "Mercado Libre", updatedAt: "2026-09-10" },
      { code: "COMP-003", name: "Portalámpara Velador x15", category: "Componente", unit: "u", purchasePrice: 83000, packQty: 15, supplier: "Mercado Libre", updatedAt: "2026-09-10" },
      { code: "COMP-004", name: "Lámpara Led x25 CANDELA", category: "Componente", unit: "u", purchasePrice: 29000, packQty: 25, supplier: "Mercado Libre", updatedAt: "2026-09-10" },
      { code: "COMP-005", name: "Lámpara Led x20 Osram Ledvance", category: "Componente", unit: "u", purchasePrice: 19000, packQty: 20, supplier: "Mercado Libre", updatedAt: "2026-09-10" },
      { code: "PACK-001", name: "Caja de cartón", category: "Packaging", unit: "u", purchasePrice: 100000, packQty: 100, supplier: "Mercado Libre", updatedAt: "2026-09-11" },
      { code: "PACK-002", name: "Papel burbuja", category: "Packaging", unit: "u", purchasePrice: 22000, packQty: 100, supplier: "Mercado Libre", updatedAt: "2026-09-11" },
      { code: "PACK-003", name: "Etiqueta/tarjeta de marca", category: "Packaging", unit: "u", purchasePrice: 21000, packQty: 100, supplier: "Mercado Libre", updatedAt: "2026-09-11" },
    ])
    .returning();

  const byCode = Object.fromEntries(sup.map((s) => [s.code, s.id]));

  const prods = await db
    .insert(products)
    .values([
      { code: "LAMP-001", name: "Lámpara Velador Negra", status: "En desarrollo", grams: 286 },
      { code: "LAMP-002", name: "Lámpara Velador Blanca", status: "En desarrollo", grams: 238.65 },
    ])
    .returning();
  const pByCode = Object.fromEntries(prods.map((p) => [p.code, p.id]));

  await db.insert(recipeItems).values([
    { productId: pByCode["LAMP-001"], supplyId: byCode["FIL-001"], qty: 286, wastePct: 0, note: "Base y estructura" },
    { productId: pByCode["LAMP-001"], supplyId: byCode["COMP-001"], qty: 1, wastePct: 0, note: "Cable y rosca" },
    { productId: pByCode["LAMP-001"], supplyId: byCode["PACK-001"], qty: 1, wastePct: 0, note: "Caja embale" },
    { productId: pByCode["LAMP-001"], supplyId: byCode["PACK-002"], qty: 1, wastePct: 0, note: "Papel embale" },
    { productId: pByCode["LAMP-001"], supplyId: byCode["PACK-003"], qty: 1, wastePct: 0, note: "Etiqueta de Zorvi" },
    { productId: pByCode["LAMP-002"], supplyId: byCode["FIL-002"], qty: 139.16, wastePct: 0, note: "Estructura" },
    { productId: pByCode["LAMP-002"], supplyId: byCode["FIL-002"], qty: 99.49, wastePct: 0, note: "Base" },
    { productId: pByCode["LAMP-002"], supplyId: byCode["COMP-003"], qty: 1, wastePct: 0, note: "Portalámpara" },
    { productId: pByCode["LAMP-002"], supplyId: byCode["COMP-005"], qty: 1, wastePct: 0, note: "Lámpara" },
    { productId: pByCode["LAMP-002"], supplyId: byCode["PACK-001"], qty: 1, wastePct: 0, note: "Caja cartón x1" },
    { productId: pByCode["LAMP-002"], supplyId: byCode["PACK-002"], qty: 1, wastePct: 0, note: "Papel burbuja x50 cm" },
    { productId: pByCode["LAMP-002"], supplyId: byCode["PACK-003"], qty: 1, wastePct: 0, note: "Tarjetita" },
  ]);

  console.log("Seed completado: parámetros, canales, socios, activos, costos fijos, insumos, productos y recetas.");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
