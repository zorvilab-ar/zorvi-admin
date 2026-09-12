import {
  pgTable,
  serial,
  integer,
  real,
  text,
  boolean,
  check,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Parámetros generales (fila única) ────────────────────────────────
export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey(),
    businessName: text("business_name").notNull().default("Zorvi Lab"),
    startDate: text("start_date").notNull().default("2026-09-07"),
    fxRate: real("fx_rate").notNull().default(1500),
    fxDate: text("fx_date"),
    printerWatts: real("printer_watts").notNull().default(100),
    kwhPrice: real("kwh_price").notNull().default(200),
    hoursAvailable: real("hours_available").notNull().default(300),
    hoursProductive: real("hours_productive").notNull().default(120),
    failureRate: real("failure_rate").notNull().default(0.15),
    defaultWaste: real("default_waste").notNull().default(0.1),
    assemblyRate: real("assembly_rate").notNull().default(6000),
    designRate: real("design_rate").notNull().default(10000),
    targetMargin: real("target_margin").notNull().default(0.45),
    wholesaleDiscount: real("wholesale_discount").notNull().default(0),
    iibbRate: real("iibb_rate").notNull().default(0),
    otherTaxRate: real("other_tax_rate").notNull().default(0),
    billingPartner: text("billing_partner"),
    monotributoCategory: text("monotributo_category"),
    monotributoCap: real("monotributo_cap").notNull().default(0),
    reinvestPercent: real("reinvest_percent").notNull().default(100),
  },
  (t) => [
    check("settings_fx_rate_pos", sql`${t.fxRate} > 0`),
    check(
      "settings_rates_frac",
      sql`${t.failureRate} >= 0 and ${t.failureRate} <= 1
        and ${t.defaultWaste} >= 0 and ${t.defaultWaste} <= 1
        and ${t.targetMargin} >= 0 and ${t.targetMargin} < 1
        and ${t.wholesaleDiscount} >= 0 and ${t.wholesaleDiscount} <= 1
        and ${t.iibbRate} >= 0 and ${t.iibbRate} <= 1
        and ${t.otherTaxRate} >= 0 and ${t.otherTaxRate} <= 1`,
    ),
    check(
      "settings_non_negative",
      sql`${t.printerWatts} >= 0 and ${t.kwhPrice} >= 0
        and ${t.hoursAvailable} >= 0 and ${t.hoursProductive} >= 0
        and ${t.monotributoCap} >= 0`,
    ),
  ],
);

// ── Canales de venta ─────────────────────────────────────────────────
export const channels = pgTable(
  "channels",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    commission: real("commission").notNull().default(0), // fracción sobre venta
    fixedCost: real("fixed_cost").notNull().default(0), // ARS por venta
    notes: text("notes"),
  },
  (t) => [
    check(
      "channels_commission_frac",
      sql`${t.commission} >= 0 and ${t.commission} <= 1`,
    ),
    check("channels_fixed_cost_non_neg", sql`${t.fixedCost} >= 0`),
  ],
);

// ── Socios ───────────────────────────────────────────────────────────
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const partnerMovements = pgTable(
  "partner_movements",
  {
    id: serial("id").primaryKey(),
    date: text("date").notNull(),
    partnerId: integer("partner_id")
      .notNull()
      .references(() => partners.id),
    type: text("type", { enum: ["Aporte", "Retiro"] }).notNull(),
    amountArs: real("amount_ars").notNull(),
    paymentMethod: text("payment_method"),
    notes: text("notes"),
  },
  (t) => [
    index("partner_movements_partner_idx").on(t.partnerId),
    index("partner_movements_date_idx").on(t.date),
    check("partner_movements_type_enum", sql`${t.type} in ('Aporte', 'Retiro')`),
    check("partner_movements_amount_non_neg", sql`${t.amountArs} >= 0`),
  ],
);

// ── Activos ──────────────────────────────────────────────────────────
export const assets = pgTable(
  "assets",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    purchaseDate: text("purchase_date"),
    costArs: real("cost_ars").notNull().default(0),
    usefulLifeHours: real("useful_life_hours").notNull().default(5000),
    residualArs: real("residual_ars").notNull().default(0),
    notes: text("notes"),
  },
  (t) => [
    check(
      "assets_non_negative",
      sql`${t.costArs} >= 0 and ${t.usefulLifeHours} > 0 and ${t.residualArs} >= 0`,
    ),
  ],
);

// ── Costos fijos mensuales ───────────────────────────────────────────
export const fixedCosts = pgTable(
  "fixed_costs",
  {
    id: serial("id").primaryKey(),
    concept: text("concept").notNull(),
    category: text("category").notNull().default("Operación"),
    monthlyArs: real("monthly_ars").notNull().default(0),
    notes: text("notes"),
  },
  (t) => [check("fixed_costs_monthly_non_neg", sql`${t.monthlyArs} >= 0`)],
);

// ── Insumos ──────────────────────────────────────────────────────────
export const supplies = pgTable(
  "supplies",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    category: text("category", {
      enum: ["Filamento", "Componente", "Packaging", "Otro"],
    }).notNull(),
    unit: text("unit").notNull().default("u"), // unidad de consumo: g | u | cm...
    purchasePrice: real("purchase_price").notNull().default(0), // ARS del pack
    packQty: real("pack_qty").notNull().default(1), // cantidad que trae el pack
    supplier: text("supplier"),
    updatedAt: text("updated_at"),
    initialStock: real("initial_stock").notNull().default(0),
    manualAdjust: real("manual_adjust").notNull().default(0),
    reorderPoint: real("reorder_point").notNull().default(0),
    notes: text("notes"),
  },
  (t) => [
    check(
      "supplies_category_enum",
      sql`${t.category} in ('Filamento', 'Componente', 'Packaging', 'Otro')`,
    ),
    check("supplies_pack_qty_pos", sql`${t.packQty} > 0`),
    check(
      "supplies_non_negative",
      sql`${t.purchasePrice} >= 0 and ${t.initialStock} >= 0 and ${t.reorderPoint} >= 0`,
    ),
  ],
);

// ── Productos ────────────────────────────────────────────────────────
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    model: text("model"), // archivo / modelo 3D
    status: text("status", {
      enum: ["Activo", "En desarrollo", "Discontinuado"],
    })
      .notNull()
      .default("En desarrollo"),
    printHours: real("print_hours").notNull().default(0),
    grams: real("grams").notNull().default(0), // gramos según slicer
    assemblyMinutes: real("assembly_minutes").notNull().default(0),
    listPrice: real("list_price").notNull().default(0),
    initialStock: real("initial_stock").notNull().default(0),
    notes: text("notes"),
  },
  (t) => [
    check(
      "products_status_enum",
      sql`${t.status} in ('Activo', 'En desarrollo', 'Discontinuado')`,
    ),
    check(
      "products_non_negative",
      sql`${t.printHours} >= 0 and ${t.grams} >= 0 and ${t.assemblyMinutes} >= 0
        and ${t.listPrice} >= 0 and ${t.initialStock} >= 0`,
    ),
  ],
);

// ── Recetas (BOM) ────────────────────────────────────────────────────
export const recipeItems = pgTable(
  "recipe_items",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    supplyId: integer("supply_id")
      .notNull()
      .references(() => supplies.id),
    qty: real("qty").notNull().default(0),
    wastePct: real("waste_pct").notNull().default(0), // fracción (0.1 = 10%)
    note: text("note"),
  },
  (t) => [
    index("recipe_items_product_idx").on(t.productId),
    index("recipe_items_supply_idx").on(t.supplyId),
    check(
      "recipe_items_non_negative",
      sql`${t.qty} >= 0 and ${t.wastePct} >= 0`,
    ),
  ],
);

// ── Producción ───────────────────────────────────────────────────────
export const productionRuns = pgTable(
  "production_runs",
  {
    id: serial("id").primaryKey(),
    date: text("date").notNull(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    unitsOk: real("units_ok").notNull().default(0),
    unitsFailed: real("units_failed").notNull().default(0),
    hoursReal: real("hours_real").notNull().default(0),
    gramsReal: real("grams_real").notNull().default(0),
    filamentSupplyId: integer("filament_supply_id").references(
      () => supplies.id,
    ),
    assetId: integer("asset_id").references(() => assets.id),
    notes: text("notes"),
  },
  (t) => [
    index("production_runs_product_idx").on(t.productId),
    index("production_runs_date_idx").on(t.date),
    index("production_runs_filament_idx").on(t.filamentSupplyId),
    check(
      "production_runs_non_negative",
      sql`${t.unitsOk} >= 0 and ${t.unitsFailed} >= 0
        and ${t.hoursReal} >= 0 and ${t.gramsReal} >= 0`,
    ),
  ],
);

// ── Ventas ───────────────────────────────────────────────────────────
export const sales = pgTable(
  "sales",
  {
    id: serial("id").primaryKey(),
    date: text("date").notNull(),
    receipt: text("receipt"),
    customer: text("customer"),
    channelId: integer("channel_id")
      .notNull()
      .references(() => channels.id),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    qty: real("qty").notNull().default(1),
    unitPrice: real("unit_price").notNull().default(0),
    discount: real("discount").notNull().default(0), // ARS
    shipping: real("shipping").notNull().default(0), // ARS a cargo nuestro
    paymentMethod: text("payment_method"),
    status: text("status", { enum: ["Cobrada", "Pendiente"] })
      .notNull()
      .default("Cobrada"),
    collectionDate: text("collection_date"),
    invoiced: boolean("invoiced").notNull().default(false),
    notes: text("notes"),
  },
  (t) => [
    index("sales_date_idx").on(t.date),
    index("sales_channel_idx").on(t.channelId),
    index("sales_product_idx").on(t.productId),
    check("sales_status_enum", sql`${t.status} in ('Cobrada', 'Pendiente')`),
    check("sales_qty_pos", sql`${t.qty} > 0`),
    check(
      "sales_non_negative",
      sql`${t.unitPrice} >= 0 and ${t.discount} >= 0 and ${t.shipping} >= 0`,
    ),
  ],
);

// ── Compras y gastos ─────────────────────────────────────────────────
export const purchases = pgTable(
  "purchases",
  {
    id: serial("id").primaryKey(),
    date: text("date").notNull(),
    supplier: text("supplier"),
    type: text("type", {
      enum: ["Insumo", "Costo fijo", "Activo", "Otro"],
    }).notNull(),
    category: text("category"),
    detail: text("detail"),
    supplyId: integer("supply_id").references(() => supplies.id),
    qty: real("qty").notNull().default(0), // en unidad de consumo del insumo
    amountArs: real("amount_ars").notNull().default(0),
    paymentMethod: text("payment_method"),
    paidBy: text("paid_by"), // socio que puso la plata
    status: text("status", { enum: ["Pagada", "Pendiente"] })
      .notNull()
      .default("Pagada"),
    paymentDate: text("payment_date"),
    receipt: text("receipt"),
    notes: text("notes"),
  },
  (t) => [
    index("purchases_date_idx").on(t.date),
    index("purchases_supply_idx").on(t.supplyId),
    check(
      "purchases_type_enum",
      sql`${t.type} in ('Insumo', 'Costo fijo', 'Activo', 'Otro')`,
    ),
    check("purchases_status_enum", sql`${t.status} in ('Pagada', 'Pendiente')`),
    check(
      "purchases_non_negative",
      sql`${t.qty} >= 0 and ${t.amountArs} >= 0`,
    ),
  ],
);

// ── Presupuestos (trabajos a medida) ─────────────────────────────────
export const quotes = pgTable(
  "quotes",
  {
    id: serial("id").primaryKey(),
    date: text("date").notNull(),
    clientName: text("client_name").notNull(),
    notes: text("notes"),
    status: text("status", {
      enum: ["Borrador", "Enviado", "Aceptado", "Rechazado"],
    })
      .notNull()
      .default("Borrador"),
  },
  (t) => [
    check(
      "quotes_status_enum",
      sql`${t.status} in ('Borrador', 'Enviado', 'Aceptado', 'Rechazado')`,
    ),
  ],
);

export const quoteItems = pgTable(
  "quote_items",
  {
    id: serial("id").primaryKey(),
    quoteId: integer("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    qty: real("qty").notNull().default(1),
    printHours: real("print_hours").notNull().default(0),
    grams: real("grams").notNull().default(0),
    filamentSupplyId: integer("filament_supply_id").references(
      () => supplies.id,
    ),
    extraSuppliesArs: real("extra_supplies_ars").notNull().default(0),
    note: text("note"),
  },
  (t) => [
    index("quote_items_quote_idx").on(t.quoteId),
    check(
      "quote_items_non_negative",
      sql`${t.qty} >= 0 and ${t.printHours} >= 0 and ${t.grams} >= 0
        and ${t.extraSuppliesArs} >= 0`,
    ),
  ],
);

// ── Rollos de filamento (stock físico) ───────────────────────────────
export const filamentRolls = pgTable(
  "filament_rolls",
  {
    id: serial("id").primaryKey(),
    supplyId: integer("supply_id")
      .notNull()
      .references(() => supplies.id),
    color: text("color"),
    colorHex: text("color_hex").notNull().default("#3B2A22"),
    brand: text("brand"),
    initialGrams: real("initial_grams").notNull().default(1000),
    remainingGrams: real("remaining_grams").notNull().default(1000),
    costArs: real("cost_ars").notNull().default(0),
    openedAt: text("opened_at"),
    notes: text("notes"),
  },
  (t) => [
    index("filament_rolls_supply_idx").on(t.supplyId),
    check(
      "filament_rolls_grams_valid",
      sql`${t.initialGrams} >= 0 and ${t.remainingGrams} >= 0
        and ${t.remainingGrams} <= ${t.initialGrams}`,
    ),
    check("filament_rolls_cost_non_neg", sql`${t.costArs} >= 0`),
  ],
);
