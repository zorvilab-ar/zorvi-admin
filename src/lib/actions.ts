"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/session";
import { hexForFilamentColor } from "@/lib/filament-colors";
import {
  parseForm,
  idOnly,
  settingsSchema,
  channelSchema,
  assetCreateSchema,
  assetUpdateSchema,
  fixedCostCreateSchema,
  fixedCostUpdateSchema,
  supplyCreateSchema,
  supplyUpdateSchema,
  supplyStockSchema,
  productCreateSchema,
  productUpdateSchema,
  recipeItemCreateSchema,
  recipeItemUpdateSchema,
  productionRunCreateSchema,
  saleCreateSchema,
  purchaseCreateSchema,
  partnerMovementCreateSchema,
  quoteCreateSchema,
  quoteUpdateSchema,
  quoteItemCreateSchema,
  quoteItemUpdateSchema,
  filamentRollCreateSchema,
  filamentRollUpdateSchema,
} from "@/lib/validation";

const refresh = () => revalidatePath("/", "layout");
const today = () => new Date().toISOString().slice(0, 10);

// ── Parámetros ───────────────────────────────────────────────────────
export async function updateSettings(fd: FormData) {
  await assertAdmin();
  const data = parseForm(settingsSchema, fd);
  await db.update(schema.settings).set(data).where(eq(schema.settings.id, 1));
  refresh();
}

export async function updateChannel(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(channelSchema, fd);
  await db.update(schema.channels).set(data).where(eq(schema.channels.id, id));
  refresh();
}

// ── Activos ──────────────────────────────────────────────────────────
export async function createAsset(fd: FormData) {
  await assertAdmin();
  await db.insert(schema.assets).values(parseForm(assetCreateSchema, fd));
  refresh();
}

export async function updateAsset(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(assetUpdateSchema, fd);
  await db.update(schema.assets).set(data).where(eq(schema.assets.id, id));
  refresh();
}

export async function deleteAsset(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.delete(schema.assets).where(eq(schema.assets.id, id));
  refresh();
}

// ── Costos fijos ─────────────────────────────────────────────────────
export async function createFixedCost(fd: FormData) {
  await assertAdmin();
  await db.insert(schema.fixedCosts).values(parseForm(fixedCostCreateSchema, fd));
  refresh();
}

export async function updateFixedCost(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(fixedCostUpdateSchema, fd);
  await db.update(schema.fixedCosts).set(data).where(eq(schema.fixedCosts.id, id));
  refresh();
}

export async function deleteFixedCost(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.delete(schema.fixedCosts).where(eq(schema.fixedCosts.id, id));
  refresh();
}

// ── Insumos ──────────────────────────────────────────────────────────
export async function createSupply(fd: FormData) {
  await assertAdmin();
  const data = parseForm(supplyCreateSchema, fd);
  await db.insert(schema.supplies).values({ ...data, updatedAt: today() });
  refresh();
}

export async function updateSupply(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(supplyUpdateSchema, fd);
  await db
    .update(schema.supplies)
    .set({ ...data, updatedAt: today() })
    .where(eq(schema.supplies.id, id));
  refresh();
}

export async function deleteSupply(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.delete(schema.supplies).where(eq(schema.supplies.id, id));
  refresh();
}

export async function updateSupplyStock(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(supplyStockSchema, fd);
  await db.update(schema.supplies).set(data).where(eq(schema.supplies.id, id));
  refresh();
}

// ── Productos ────────────────────────────────────────────────────────
export async function createProduct(fd: FormData) {
  await assertAdmin();
  await db.insert(schema.products).values(parseForm(productCreateSchema, fd));
  refresh();
}

export async function updateProduct(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(productUpdateSchema, fd);
  await db.update(schema.products).set(data).where(eq(schema.products.id, id));
  refresh();
}

export async function deleteProduct(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.delete(schema.products).where(eq(schema.products.id, id));
  refresh();
}

// ── Recetas ──────────────────────────────────────────────────────────
export async function createRecipeItem(fd: FormData) {
  await assertAdmin();
  await db.insert(schema.recipeItems).values(parseForm(recipeItemCreateSchema, fd));
  refresh();
}

export async function updateRecipeItem(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(recipeItemUpdateSchema, fd);
  await db
    .update(schema.recipeItems)
    .set(data)
    .where(eq(schema.recipeItems.id, id));
  refresh();
}

export async function deleteRecipeItem(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.delete(schema.recipeItems).where(eq(schema.recipeItems.id, id));
  refresh();
}

// ── Producción ───────────────────────────────────────────────────────
export async function createProductionRun(fd: FormData) {
  await assertAdmin();
  const data = parseForm(productionRunCreateSchema, fd);
  await db.insert(schema.productionRuns).values(data);
  if (data.filamentSupplyId && data.gramsReal > 0) {
    try {
      await deductFilamentRolls(data.filamentSupplyId, data.gramsReal);
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
  const { id } = parseForm(idOnly, fd);
  await db.delete(schema.productionRuns).where(eq(schema.productionRuns.id, id));
  refresh();
}

// ── Ventas ───────────────────────────────────────────────────────────
export async function createSale(fd: FormData) {
  await assertAdmin();
  const data = parseForm(saleCreateSchema, fd);
  await db.insert(schema.sales).values({
    ...data,
    collectionDate:
      data.collectionDate ?? (data.status === "Cobrada" ? data.date : null),
  });
  refresh();
}

export async function markSaleCollected(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.update(schema.sales)
    .set({ status: "Cobrada", collectionDate: today() })
    .where(eq(schema.sales.id, id));
  refresh();
}

export async function deleteSale(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.delete(schema.sales).where(eq(schema.sales.id, id));
  refresh();
}

// ── Compras ──────────────────────────────────────────────────────────
export async function createPurchase(fd: FormData) {
  await assertAdmin();
  const data = parseForm(purchaseCreateSchema, fd);
  await db.insert(schema.purchases).values({
    ...data,
    paymentDate:
      data.paymentDate ?? (data.status === "Pagada" ? data.date : null),
  });
  refresh();
}

export async function markPurchasePaid(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.update(schema.purchases)
    .set({ status: "Pagada", paymentDate: today() })
    .where(eq(schema.purchases.id, id));
  refresh();
}

export async function deletePurchase(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.delete(schema.purchases).where(eq(schema.purchases.id, id));
  refresh();
}

// ── Socios ───────────────────────────────────────────────────────────
export async function createPartnerMovement(fd: FormData) {
  await assertAdmin();
  await db
    .insert(schema.partnerMovements)
    .values(parseForm(partnerMovementCreateSchema, fd));
  refresh();
}

export async function deletePartnerMovement(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db
    .delete(schema.partnerMovements)
    .where(eq(schema.partnerMovements.id, id));
  refresh();
}

// ── Presupuestos ─────────────────────────────────────────────────────
export async function createQuote(fd: FormData) {
  await assertAdmin();
  const data = parseForm(quoteCreateSchema, fd);
  const [row] = await db.insert(schema.quotes)
    .values({ ...data, status: "Borrador" })
    .returning({ id: schema.quotes.id });
  if (!row) throw new Error("No se pudo crear el presupuesto");
  redirect(`/presupuestos/${row.id}`);
}

export async function updateQuote(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(quoteUpdateSchema, fd);
  await db.update(schema.quotes).set(data).where(eq(schema.quotes.id, id));
  refresh();
}

export async function deleteQuote(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.delete(schema.quotes).where(eq(schema.quotes.id, id));
  refresh();
}

export async function createQuoteItem(fd: FormData) {
  await assertAdmin();
  await db.insert(schema.quoteItems).values(parseForm(quoteItemCreateSchema, fd));
  refresh();
}

export async function updateQuoteItem(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(quoteItemUpdateSchema, fd);
  await db.update(schema.quoteItems).set(data).where(eq(schema.quoteItems.id, id));
  refresh();
}

export async function deleteQuoteItem(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.delete(schema.quoteItems).where(eq(schema.quoteItems.id, id));
  refresh();
}

// ── Rollos de filamento ──────────────────────────────────────────────
export async function createFilamentRoll(fd: FormData) {
  await assertAdmin();
  const { remainingGrams, color, ...data } = parseForm(
    filamentRollCreateSchema,
    fd,
  );
  await db.insert(schema.filamentRolls).values({
    ...data,
    color,
    colorHex: hexForFilamentColor(color),
    remainingGrams: remainingGrams ?? data.initialGrams,
  });
  refresh();
}

export async function updateFilamentRoll(fd: FormData) {
  await assertAdmin();
  const { id, color, ...data } = parseForm(filamentRollUpdateSchema, fd);
  await db.update(schema.filamentRolls)
    .set({ ...data, color, colorHex: hexForFilamentColor(color) })
    .where(eq(schema.filamentRolls.id, id));
  refresh();
}

export async function deleteFilamentRoll(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.delete(schema.filamentRolls).where(eq(schema.filamentRolls.id, id));
  refresh();
}
