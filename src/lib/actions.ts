"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/session";
import { hexForFilamentColor } from "@/lib/filament-colors";

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
  await assertAdmin();
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
  await assertAdmin();
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
  await assertAdmin();
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
  await assertAdmin();
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
  await assertAdmin();
  await db.delete(schema.assets).where(eq(schema.assets.id, num(fd, "id")));
  refresh();
}

// ── Costos fijos ─────────────────────────────────────────────────────
export async function createFixedCost(fd: FormData) {
  await assertAdmin();
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
  await assertAdmin();
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
  await assertAdmin();
  await db.delete(schema.fixedCosts)
    .where(eq(schema.fixedCosts.id, num(fd, "id")));
  refresh();
}

// ── Insumos ──────────────────────────────────────────────────────────
export async function createSupply(fd: FormData) {
  await assertAdmin();
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
  await assertAdmin();
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
  await assertAdmin();
  await db.delete(schema.supplies)
    .where(eq(schema.supplies.id, num(fd, "id")));
  refresh();
}

export async function updateSupplyStock(fd: FormData) {
  await assertAdmin();
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
  await assertAdmin();
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
  await assertAdmin();
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
  await assertAdmin();
  await db.delete(schema.products)
    .where(eq(schema.products.id, num(fd, "id")));
  refresh();
}

// ── Recetas ──────────────────────────────────────────────────────────
export async function createRecipeItem(fd: FormData) {
  await assertAdmin();
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
  await assertAdmin();
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
  await assertAdmin();
  await db.delete(schema.recipeItems)
    .where(eq(schema.recipeItems.id, num(fd, "id")));
  refresh();
}

// ── Producción ───────────────────────────────────────────────────────
export async function createProductionRun(fd: FormData) {
  await assertAdmin();
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
  const grams = num(fd, "gramsReal");
  const filamentId = fd.get("filamentSupplyId")
    ? num(fd, "filamentSupplyId")
    : null;
  if (filamentId && grams > 0) {
    try {
      await deductFilamentRolls(filamentId, grams);
    } catch {
      // filament_rolls todavía no existe en esta base
    }
  }
  refresh();
}

async function deductFilamentRolls(supplyId: number, grams: number) {
  const rolls = await db.select().from(schema.filamentRolls)
    .where(eq(schema.filamentRolls.supplyId, supplyId))
    .orderBy(asc(schema.filamentRolls.openedAt), asc(schema.filamentRolls.id));
  let left = grams;
  for (const roll of rolls) {
    if (left <= 0) break;
    if (roll.remainingGrams <= 0) continue;
    const take = Math.min(roll.remainingGrams, left);
    await db.update(schema.filamentRolls)
      .set({ remainingGrams: roll.remainingGrams - take })
      .where(eq(schema.filamentRolls.id, roll.id));
    left -= take;
  }
}

export async function deleteProductionRun(fd: FormData) {
  await assertAdmin();
  await db.delete(schema.productionRuns)
    .where(eq(schema.productionRuns.id, num(fd, "id")));
  refresh();
}

// ── Ventas ───────────────────────────────────────────────────────────
export async function createSale(fd: FormData) {
  await assertAdmin();
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
  await assertAdmin();
  await db.update(schema.sales)
    .set({
      status: "Cobrada",
      collectionDate: new Date().toISOString().slice(0, 10),
    })
    .where(eq(schema.sales.id, num(fd, "id")));
  refresh();
}

export async function deleteSale(fd: FormData) {
  await assertAdmin();
  await db.delete(schema.sales).where(eq(schema.sales.id, num(fd, "id")));
  refresh();
}

// ── Compras ──────────────────────────────────────────────────────────
export async function createPurchase(fd: FormData) {
  await assertAdmin();
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
  await assertAdmin();
  await db.update(schema.purchases)
    .set({
      status: "Pagada",
      paymentDate: new Date().toISOString().slice(0, 10),
    })
    .where(eq(schema.purchases.id, num(fd, "id")));
  refresh();
}

export async function deletePurchase(fd: FormData) {
  await assertAdmin();
  await db.delete(schema.purchases)
    .where(eq(schema.purchases.id, num(fd, "id")));
  refresh();
}

// ── Socios ───────────────────────────────────────────────────────────
export async function createPartnerMovement(fd: FormData) {
  await assertAdmin();
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
  await assertAdmin();
  await db.delete(schema.partnerMovements)
    .where(eq(schema.partnerMovements.id, num(fd, "id")));
  refresh();
}

// ── Presupuestos ─────────────────────────────────────────────────────
export async function createQuote(fd: FormData) {
  await assertAdmin();
  const [row] = await db.insert(schema.quotes)
    .values({
      date: reqStr(fd, "date"),
      clientName: reqStr(fd, "clientName"),
      notes: str(fd, "notes"),
      status: "Borrador",
    })
    .returning({ id: schema.quotes.id });
  if (!row) throw new Error("No se pudo crear el presupuesto");
  redirect(`/presupuestos/${row.id}`);
}

export async function updateQuote(fd: FormData) {
  await assertAdmin();
  await db.update(schema.quotes)
    .set({
      date: reqStr(fd, "date"),
      clientName: reqStr(fd, "clientName"),
      notes: str(fd, "notes"),
      status: reqStr(fd, "status") as
        | "Borrador"
        | "Enviado"
        | "Aceptado"
        | "Rechazado",
    })
    .where(eq(schema.quotes.id, num(fd, "id")));
  refresh();
}

export async function deleteQuote(fd: FormData) {
  await assertAdmin();
  await db.delete(schema.quotes)
    .where(eq(schema.quotes.id, num(fd, "id")));
  refresh();
}

export async function createQuoteItem(fd: FormData) {
  await assertAdmin();
  await db.insert(schema.quoteItems)
    .values({
      quoteId: num(fd, "quoteId"),
      name: reqStr(fd, "name"),
      description: str(fd, "description"),
      qty: num(fd, "qty"),
      printHours: num(fd, "printHours"),
      grams: num(fd, "grams"),
      filamentSupplyId: fd.get("filamentSupplyId")
        ? num(fd, "filamentSupplyId")
        : null,
      extraSuppliesArs: num(fd, "extraSuppliesArs"),
      note: str(fd, "note"),
    });
  refresh();
}

export async function updateQuoteItem(fd: FormData) {
  await assertAdmin();
  await db.update(schema.quoteItems)
    .set({
      name: reqStr(fd, "name"),
      description: str(fd, "description"),
      qty: num(fd, "qty"),
      printHours: num(fd, "printHours"),
      grams: num(fd, "grams"),
      filamentSupplyId: fd.get("filamentSupplyId")
        ? num(fd, "filamentSupplyId")
        : null,
      extraSuppliesArs: num(fd, "extraSuppliesArs"),
      note: str(fd, "note"),
    })
    .where(eq(schema.quoteItems.id, num(fd, "id")));
  refresh();
}

export async function deleteQuoteItem(fd: FormData) {
  await assertAdmin();
  await db.delete(schema.quoteItems)
    .where(eq(schema.quoteItems.id, num(fd, "id")));
  refresh();
}

// ── Rollos de filamento ──────────────────────────────────────────────
export async function createFilamentRoll(fd: FormData) {
  await assertAdmin();
  const initial = num(fd, "initialGrams");
  const remainingRaw = String(fd.get("remainingGrams") ?? "").trim();
  await db.insert(schema.filamentRolls)
    .values({
      supplyId: num(fd, "supplyId"),
      color: reqStr(fd, "color"),
      colorHex: hexForFilamentColor(reqStr(fd, "color")),
      brand: str(fd, "brand"),
      initialGrams: initial,
      remainingGrams: remainingRaw === "" ? initial : num(fd, "remainingGrams"),
      costArs: num(fd, "costArs"),
      openedAt: str(fd, "openedAt"),
      notes: str(fd, "notes"),
    });
  refresh();
}

export async function updateFilamentRoll(fd: FormData) {
  await assertAdmin();
  await db.update(schema.filamentRolls)
    .set({
      supplyId: num(fd, "supplyId"),
      color: reqStr(fd, "color"),
      colorHex: hexForFilamentColor(reqStr(fd, "color")),
      brand: str(fd, "brand"),
      initialGrams: num(fd, "initialGrams"),
      remainingGrams: num(fd, "remainingGrams"),
      costArs: num(fd, "costArs"),
      openedAt: str(fd, "openedAt"),
      notes: str(fd, "notes"),
    })
    .where(eq(schema.filamentRolls.id, num(fd, "id")));
  refresh();
}

export async function deleteFilamentRoll(fd: FormData) {
  await assertAdmin();
  await db.delete(schema.filamentRolls)
    .where(eq(schema.filamentRolls.id, num(fd, "id")));
  refresh();
}
