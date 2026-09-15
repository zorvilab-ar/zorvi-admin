"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, asc, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/session";
import { hexForFilamentColor } from "@/lib/filament-colors";
import {
  parseForm,
  ValidationError,
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
  productionRunUpdateSchema,
  saleCreateSchema,
  saleUpdateSchema,
  purchaseCreateSchema,
  purchaseUpdateSchema,
  type PurchaseInput,
  purchaseEffectsSchema,
  assetPurchaseSchema,
  partnerMovementCreateSchema,
  partnerMovementUpdateSchema,
  quoteCreateSchema,
  quoteUpdateSchema,
  quoteItemCreateSchema,
  quoteItemUpdateSchema,
  filamentRollCreateSchema,
  filamentRollUpdateSchema,
} from "@/lib/validation";

const refresh = () => revalidatePath("/", "layout");
const today = () => new Date().toISOString().slice(0, 10);

/** Handle de transacción de Drizzle: misma API que `db` dentro del bloque. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

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
  const data = parseForm(assetCreateSchema, fd);
  const { registerPurchase, paidBy } = parseForm(assetPurchaseSchema, fd);

  await db.transaction(async (tx) => {
    await tx.insert(schema.assets).values(data);
    // El activo entra al inventario; sin este asiento nunca sale de la caja.
    if (registerPurchase && data.costArs > 0) {
      await tx.insert(schema.purchases).values({
        date: data.purchaseDate ?? today(),
        supplier: null,
        type: "Activo",
        detail: `${data.code} — ${data.name}`,
        qty: 1,
        amountArs: data.costArs,
        paidBy,
        status: "Pagada",
        paymentDate: data.purchaseDate ?? today(),
        notes: "Compra registrada junto con el alta del activo.",
      });
    }
  });
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
  await db.transaction(async (tx) => {
    await tx.insert(schema.productionRuns).values(data);
    await consumeFilament(tx, data.filamentSupplyId, data.gramsReal);
  });
  refresh();
}

export async function updateProductionRun(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(productionRunUpdateSchema, fd);
  await db.transaction(async (tx) => {
    const [old] = await tx
      .select()
      .from(schema.productionRuns)
      .where(eq(schema.productionRuns.id, id));
    if (!old) throw new ValidationError("La tanda ya no existe.");

    await tx
      .update(schema.productionRuns)
      .set(data)
      .where(eq(schema.productionRuns.id, id));

    // Se deshace el consumo viejo y se aplica el nuevo: corregir los gramos
    // de una tanda no puede dejar el stock de rollos descuadrado.
    await restoreFilament(tx, old.filamentSupplyId, old.gramsReal);
    await consumeFilament(tx, data.filamentSupplyId, data.gramsReal);
  });
  refresh();
}

export async function deleteProductionRun(fd: FormData) {
  await assertAdmin();
  const { id } = parseForm(idOnly, fd);
  await db.transaction(async (tx) => {
    const [old] = await tx
      .select()
      .from(schema.productionRuns)
      .where(eq(schema.productionRuns.id, id));
    await tx
      .delete(schema.productionRuns)
      .where(eq(schema.productionRuns.id, id));
    if (old) await restoreFilament(tx, old.filamentSupplyId, old.gramsReal);
  });
  refresh();
}

/** Descuenta gramos de los rollos abiertos, del más viejo al más nuevo. */
async function consumeFilament(
  tx: Tx,
  supplyId: number | null,
  grams: number,
) {
  if (!supplyId || grams <= 0) return;
  const rolls = await tx
    .select()
    .from(schema.filamentRolls)
    .where(eq(schema.filamentRolls.supplyId, supplyId))
    .orderBy(asc(schema.filamentRolls.openedAt), asc(schema.filamentRolls.id));

  let left = grams;
  for (const roll of rolls) {
    if (left <= 0) break;
    if (roll.remainingGrams <= 0) continue;
    const take = Math.min(roll.remainingGrams, left);
    await tx
      .update(schema.filamentRolls)
      .set({ remainingGrams: roll.remainingGrams - take })
      .where(eq(schema.filamentRolls.id, roll.id));
    left -= take;
  }
}

/**
 * Devuelve gramos a los rollos, del más nuevo al más viejo — el inverso del
 * consumo. Nunca sube un rollo por encima de los gramos con los que se abrió.
 */
async function restoreFilament(
  tx: Tx,
  supplyId: number | null,
  grams: number,
) {
  if (!supplyId || grams <= 0) return;
  const rolls = await tx
    .select()
    .from(schema.filamentRolls)
    .where(eq(schema.filamentRolls.supplyId, supplyId))
    .orderBy(
      desc(schema.filamentRolls.openedAt),
      desc(schema.filamentRolls.id),
    );

  let left = grams;
  for (const roll of rolls) {
    if (left <= 0) break;
    const room = roll.initialGrams - roll.remainingGrams;
    if (room <= 0) continue;
    const give = Math.min(room, left);
    await tx
      .update(schema.filamentRolls)
      .set({ remainingGrams: roll.remainingGrams + give })
      .where(eq(schema.filamentRolls.id, roll.id));
    left -= give;
  }
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

export async function updateSale(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(saleUpdateSchema, fd);
  await db
    .update(schema.sales)
    .set({
      ...data,
      collectionDate:
        data.collectionDate ?? (data.status === "Cobrada" ? data.date : null),
    })
    .where(eq(schema.sales.id, id));
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
  const effects = parseForm(purchaseEffectsSchema, fd);

  await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(schema.purchases)
      .values({
        ...data,
        paymentDate:
          data.paymentDate ?? (data.status === "Pagada" ? data.date : null),
      })
      .returning({ id: schema.purchases.id });
    if (!row) throw new Error("No se pudo registrar la compra");
    await applySupplyCost(tx, data, effects.updateSupplyCost);
    await syncPurchaseContribution(tx, row.id, data, effects.registerContribution);
  });
  refresh();
}

export async function updatePurchase(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(purchaseUpdateSchema, fd);
  const effects = parseForm(purchaseEffectsSchema, fd);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.purchases)
      .set({
        ...data,
        paymentDate:
          data.paymentDate ?? (data.status === "Pagada" ? data.date : null),
      })
      .where(eq(schema.purchases.id, id));
    await applySupplyCost(tx, data, effects.updateSupplyCost);
    await syncPurchaseContribution(tx, id, data, effects.registerContribution);
  });
  refresh();
}

/**
 * Lleva el precio pagado al insumo. El insumo guarda precio y cantidad *del
 * pack* — `unitCost()` divide uno por otro — así que la compra entera es el
 * pack nuevo: 1 kg a $21.670 queda como purchasePrice 21670 / packQty 1000.
 */
async function applySupplyCost(
  tx: Tx,
  data: PurchaseInput,
  enabled: boolean,
) {
  if (!enabled) return;
  if (!data.supplyId || !data.qty || data.qty <= 0 || data.amountArs <= 0) return;
  await tx
    .update(schema.supplies)
    .set({
      purchasePrice: data.amountArs,
      packQty: data.qty,
      updatedAt: today(),
    })
    .where(eq(schema.supplies.id, data.supplyId));
}

/**
 * Mantiene el aporte del socio en línea con la compra que lo generó: lo crea,
 * lo actualiza si cambió el monto o la fecha, y lo borra si se destildó. Sin
 * esta sincronización, editar la compra dejaba un aporte viejo y la caja
 * volvía a mostrar plata que no existe.
 */
async function syncPurchaseContribution(
  tx: Tx,
  purchaseId: number,
  data: PurchaseInput,
  enabled: boolean,
) {
  const [existing] = await tx
    .select({ id: schema.partnerMovements.id })
    .from(schema.partnerMovements)
    .where(eq(schema.partnerMovements.purchaseId, purchaseId));

  const wanted = enabled && !!data.paidBy && data.amountArs > 0;
  if (!wanted) {
    if (existing) {
      await tx
        .delete(schema.partnerMovements)
        .where(eq(schema.partnerMovements.id, existing.id));
    }
    return;
  }

  const [partner] = await tx
    .select({ id: schema.partners.id })
    .from(schema.partners)
    .where(eq(schema.partners.name, data.paidBy!));
  if (!partner) {
    throw new ValidationError(
      `"${data.paidBy}" no figura como socio, así que no se puede registrar el aporte. Elegí un socio o destildá la opción.`,
    );
  }

  const values = {
    date: data.date,
    partnerId: partner.id,
    type: "Aporte" as const,
    amountArs: data.amountArs,
    paymentMethod: data.paymentMethod ?? null,
    purchaseId,
    notes: `Aporte por la compra: ${data.detail ?? data.supplier ?? "sin detalle"}`,
  };

  if (existing) {
    await tx
      .update(schema.partnerMovements)
      .set(values)
      .where(eq(schema.partnerMovements.id, existing.id));
  } else {
    await tx.insert(schema.partnerMovements).values(values);
  }
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

export async function updatePartnerMovement(fd: FormData) {
  await assertAdmin();
  const { id, ...data } = parseForm(partnerMovementUpdateSchema, fd);
  // Los aportes generados por una compra se editan desde Compras: tocarlos
  // acá los dejaría diciendo algo distinto de la compra que los originó.
  const [linked] = await db
    .select({ purchaseId: schema.partnerMovements.purchaseId })
    .from(schema.partnerMovements)
    .where(eq(schema.partnerMovements.id, id));
  if (linked?.purchaseId) {
    throw new ValidationError(
      "Este aporte lo generó una compra. Editalo desde Compras y gastos.",
    );
  }
  await db
    .update(schema.partnerMovements)
    .set(data)
    .where(eq(schema.partnerMovements.id, id));
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
