"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const num = (fd: FormData, key: string, def = 0): number => {
  const raw = String(fd.get(key) ?? "").replace(",", ".").trim();
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : def;
};
const str = (fd: FormData, key: string): string | null => {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
};
const reqStr = (fd: FormData, key: string): string =>
  String(fd.get(key) ?? "").trim();

const refresh = () => revalidatePath("/", "layout");

// ── Parámetros ───────────────────────────────────────────────────────
export async function updateSettings(fd: FormData) {
  await db.update(schema.settings)
    .set({
      businessName: reqStr(fd, "businessName"),
      startDate: reqStr(fd, "startDate"),
      fxRate: num(fd, "fxRate"),
      fxDate: str(fd, "fxDate"),
      printerWatts: num(fd, "printerWatts"),
      kwhPrice: num(fd, "kwhPrice"),
      hoursAvailable: num(fd, "hoursAvailable"),
      hoursProductive: num(fd, "hoursProductive"),
      failureRate: num(fd, "failureRate") / 100,
      defaultWaste: num(fd, "defaultWaste") / 100,
      assemblyRate: num(fd, "assemblyRate"),
      designRate: num(fd, "designRate"),
      targetMargin: num(fd, "targetMargin") / 100,
      wholesaleDiscount: num(fd, "wholesaleDiscount") / 100,
      iibbRate: num(fd, "iibbRate") / 100,
      otherTaxRate: num(fd, "otherTaxRate") / 100,
      billingPartner: str(fd, "billingPartner"),
      monotributoCategory: str(fd, "monotributoCategory"),
      monotributoCap: num(fd, "monotributoCap"),
      reinvestPercent: num(fd, "reinvestPercent"),
    })
    .where(eq(schema.settings.id, 1));
  refresh();
}

export async function updateChannel(fd: FormData) {
  await db.update(schema.channels)
    .set({
      commission: num(fd, "commission") / 100,
      fixedCost: num(fd, "fixedCost"),
    })
    .where(eq(schema.channels.id, num(fd, "id")));
  refresh();
}

// ── Activos ──────────────────────────────────────────────────────────
export async function createAsset(fd: FormData) {
  await db.insert(schema.assets)
    .values({
      code: reqStr(fd, "code"),
      name: reqStr(fd, "name"),
      purchaseDate: str(fd, "purchaseDate"),
      costArs: num(fd, "costArs"),
      usefulLifeHours: num(fd, "usefulLifeHours", 5000),
      residualArs: num(fd, "residualArs"),
      notes: str(fd, "notes"),
    });
  refresh();
}

export async function updateAsset(fd: FormData) {
  await db.update(schema.assets)
    .set({
      code: reqStr(fd, "code"),
      name: reqStr(fd, "name"),
      purchaseDate: str(fd, "purchaseDate"),
      costArs: num(fd, "costArs"),
      usefulLifeHours: num(fd, "usefulLifeHours", 5000),
      residualArs: num(fd, "residualArs"),
      notes: str(fd, "notes"),
    })
    .where(eq(schema.assets.id, num(fd, "id")));
  refresh();
}

export async function deleteAsset(fd: FormData) {
  await db.delete(schema.assets).where(eq(schema.assets.id, num(fd, "id")));
  refresh();
}

// ── Costos fijos ─────────────────────────────────────────────────────
export async function createFixedCost(fd: FormData) {
  await db.insert(schema.fixedCosts)
    .values({
      concept: reqStr(fd, "concept"),
      category: reqStr(fd, "category") || "Operación",
      monthlyArs: num(fd, "monthlyArs"),
      notes: str(fd, "notes"),
    });
  refresh();
}

export async function updateFixedCost(fd: FormData) {
  await db.update(schema.fixedCosts)
    .set({
      concept: reqStr(fd, "concept"),
      category: reqStr(fd, "category") || "Operación",
      monthlyArs: num(fd, "monthlyArs"),
      notes: str(fd, "notes"),
    })
    .where(eq(schema.fixedCosts.id, num(fd, "id")));
  refresh();
}

export async function deleteFixedCost(fd: FormData) {
  await db.delete(schema.fixedCosts)
    .where(eq(schema.fixedCosts.id, num(fd, "id")));
  refresh();
}

// ── Insumos ──────────────────────────────────────────────────────────
export async function createSupply(fd: FormData) {
  await db.insert(schema.supplies)
    .values({
      code: reqStr(fd, "code"),
      name: reqStr(fd, "name"),
      category: reqStr(fd, "category") as "Filamento" | "Componente" | "Packaging" | "Otro",
      unit: reqStr(fd, "unit") || "u",
      purchasePrice: num(fd, "purchasePrice"),
      packQty: num(fd, "packQty", 1),
      supplier: str(fd, "supplier"),
      updatedAt: new Date().toISOString().slice(0, 10),
      initialStock: num(fd, "initialStock"),
      reorderPoint: num(fd, "reorderPoint"),
      notes: str(fd, "notes"),
    });
  refresh();
}

export async function updateSupply(fd: FormData) {
  await db.update(schema.supplies)
    .set({
      code: reqStr(fd, "code"),
      name: reqStr(fd, "name"),
      category: reqStr(fd, "category") as "Filamento" | "Componente" | "Packaging" | "Otro",
      unit: reqStr(fd, "unit") || "u",
      purchasePrice: num(fd, "purchasePrice"),
      packQty: num(fd, "packQty", 1),
      supplier: str(fd, "supplier"),
      updatedAt: new Date().toISOString().slice(0, 10),
      initialStock: num(fd, "initialStock"),
      reorderPoint: num(fd, "reorderPoint"),
      notes: str(fd, "notes"),
    })
    .where(eq(schema.supplies.id, num(fd, "id")));
  refresh();
}

export async function deleteSupply(fd: FormData) {
  await db.delete(schema.supplies)
    .where(eq(schema.supplies.id, num(fd, "id")));
  refresh();
}

export async function updateSupplyStock(fd: FormData) {
  await db.update(schema.supplies)
    .set({
      initialStock: num(fd, "initialStock"),
      manualAdjust: num(fd, "manualAdjust"),
      reorderPoint: num(fd, "reorderPoint"),
    })
    .where(eq(schema.supplies.id, num(fd, "id")));
  refresh();
}

// ── Productos ────────────────────────────────────────────────────────
export async function createProduct(fd: FormData) {
  await db.insert(schema.products)
    .values({
      code: reqStr(fd, "code"),
      name: reqStr(fd, "name"),
      model: str(fd, "model"),
      status: (reqStr(fd, "status") || "En desarrollo") as "Activo" | "En desarrollo" | "Discontinuado",
      printHours: num(fd, "printHours"),
      grams: num(fd, "grams"),
      assemblyMinutes: num(fd, "assemblyMinutes"),
      listPrice: num(fd, "listPrice"),
      initialStock: num(fd, "initialStock"),
      notes: str(fd, "notes"),
    });
  refresh();
}

export async function updateProduct(fd: FormData) {
  await db.update(schema.products)
    .set({
      code: reqStr(fd, "code"),
      name: reqStr(fd, "name"),
      model: str(fd, "model"),
      status: (reqStr(fd, "status") || "En desarrollo") as "Activo" | "En desarrollo" | "Discontinuado",
      printHours: num(fd, "printHours"),
      grams: num(fd, "grams"),
      assemblyMinutes: num(fd, "assemblyMinutes"),
      listPrice: num(fd, "listPrice"),
      initialStock: num(fd, "initialStock"),
      notes: str(fd, "notes"),
    })
    .where(eq(schema.products.id, num(fd, "id")));
  refresh();
}

export async function deleteProduct(fd: FormData) {
  await db.delete(schema.products)
    .where(eq(schema.products.id, num(fd, "id")));
  refresh();
}

// ── Recetas ──────────────────────────────────────────────────────────
export async function createRecipeItem(fd: FormData) {
  await db.insert(schema.recipeItems)
    .values({
      productId: num(fd, "productId"),
      supplyId: num(fd, "supplyId"),
      qty: num(fd, "qty"),
      wastePct: num(fd, "wastePct") / 100,
      note: str(fd, "note"),
    });
  refresh();
}

export async function updateRecipeItem(fd: FormData) {
  await db.update(schema.recipeItems)
    .set({
      supplyId: num(fd, "supplyId"),
      qty: num(fd, "qty"),
      wastePct: num(fd, "wastePct") / 100,
      note: str(fd, "note"),
    })
    .where(eq(schema.recipeItems.id, num(fd, "id")));
  refresh();
}

export async function deleteRecipeItem(fd: FormData) {
  await db.delete(schema.recipeItems)
    .where(eq(schema.recipeItems.id, num(fd, "id")));
  refresh();
}

// ── Producción ───────────────────────────────────────────────────────
export async function createProductionRun(fd: FormData) {
  await db.insert(schema.productionRuns)
    .values({
      date: reqStr(fd, "date"),
      productId: num(fd, "productId"),
      unitsOk: num(fd, "unitsOk"),
      unitsFailed: num(fd, "unitsFailed"),
      hoursReal: num(fd, "hoursReal"),
      gramsReal: num(fd, "gramsReal"),
      filamentSupplyId: fd.get("filamentSupplyId") ? num(fd, "filamentSupplyId") : null,
      assetId: fd.get("assetId") ? num(fd, "assetId") : null,
      notes: str(fd, "notes"),
    });
  refresh();
}

export async function deleteProductionRun(fd: FormData) {
  await db.delete(schema.productionRuns)
    .where(eq(schema.productionRuns.id, num(fd, "id")));
  refresh();
}

// ── Ventas ───────────────────────────────────────────────────────────
export async function createSale(fd: FormData) {
  const status = (reqStr(fd, "status") || "Cobrada") as "Cobrada" | "Pendiente";
  await db.insert(schema.sales)
    .values({
      date: reqStr(fd, "date"),
      receipt: str(fd, "receipt"),
      customer: str(fd, "customer"),
      channelId: num(fd, "channelId"),
      productId: num(fd, "productId"),
      qty: num(fd, "qty", 1),
      unitPrice: num(fd, "unitPrice"),
      discount: num(fd, "discount"),
      shipping: num(fd, "shipping"),
      paymentMethod: str(fd, "paymentMethod"),
      status,
      collectionDate: str(fd, "collectionDate") ?? (status === "Cobrada" ? reqStr(fd, "date") : null),
      invoiced: fd.get("invoiced") === "on",
      notes: str(fd, "notes"),
    });
  refresh();
}

export async function markSaleCollected(fd: FormData) {
  await db.update(schema.sales)
    .set({
      status: "Cobrada",
      collectionDate: new Date().toISOString().slice(0, 10),
    })
    .where(eq(schema.sales.id, num(fd, "id")));
  refresh();
}

export async function deleteSale(fd: FormData) {
  await db.delete(schema.sales).where(eq(schema.sales.id, num(fd, "id")));
  refresh();
}

// ── Compras ──────────────────────────────────────────────────────────
export async function createPurchase(fd: FormData) {
  const status = (reqStr(fd, "status") || "Pagada") as "Pagada" | "Pendiente";
  await db.insert(schema.purchases)
    .values({
      date: reqStr(fd, "date"),
      supplier: str(fd, "supplier"),
      type: reqStr(fd, "type") as "Insumo" | "Costo fijo" | "Activo" | "Otro",
      category: str(fd, "category"),
      detail: str(fd, "detail"),
      supplyId: fd.get("supplyId") ? num(fd, "supplyId") : null,
      qty: num(fd, "qty"),
      amountArs: num(fd, "amountArs"),
      paymentMethod: str(fd, "paymentMethod"),
      paidBy: str(fd, "paidBy"),
      status,
      paymentDate: str(fd, "paymentDate") ?? (status === "Pagada" ? reqStr(fd, "date") : null),
      receipt: str(fd, "receipt"),
      notes: str(fd, "notes"),
    });
  refresh();
}

export async function markPurchasePaid(fd: FormData) {
  await db.update(schema.purchases)
    .set({
      status: "Pagada",
      paymentDate: new Date().toISOString().slice(0, 10),
    })
    .where(eq(schema.purchases.id, num(fd, "id")));
  refresh();
}

export async function deletePurchase(fd: FormData) {
  await db.delete(schema.purchases)
    .where(eq(schema.purchases.id, num(fd, "id")));
  refresh();
}

// ── Socios ───────────────────────────────────────────────────────────
export async function createPartnerMovement(fd: FormData) {
  await db.insert(schema.partnerMovements)
    .values({
      date: reqStr(fd, "date"),
      partnerId: num(fd, "partnerId"),
      type: reqStr(fd, "type") as "Aporte" | "Retiro",
      amountArs: num(fd, "amountArs"),
      paymentMethod: str(fd, "paymentMethod"),
      notes: str(fd, "notes"),
    });
  refresh();
}

export async function deletePartnerMovement(fd: FormData) {
  await db.delete(schema.partnerMovements)
    .where(eq(schema.partnerMovements.id, num(fd, "id")));
  refresh();
}
