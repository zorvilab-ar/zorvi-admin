"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth/session";
import { ejecutarAccion } from "@/lib/shop/client";

/**
 * Las mutaciones de la contabilidad.
 *
 * Ya no tocan la base: la lógica vive en `zorvi-backend`, que es su dueño.
 * Acá quedan como server actions porque es lo que los formularios esperan —
 * misma firma `(fd: FormData)`, mismo nombre— así que ninguna página cambió.
 *
 * Cada una hace tres cosas: verifica que quien llama sea admin, manda las
 * entradas del formulario al backend, y refresca el caché de Next.
 *
 * La autorización se queda de este lado a propósito: el admin ya sabe quién
 * es el usuario por Supabase Auth, y la llamada al backend es de servidor a
 * servidor con el secreto compartido. Montar JWT entre dos servicios nuestros
 * para un solo consumidor sería plomería sin beneficio.
 */

const refresh = () => revalidatePath("/", "layout");

/** FormData -> objeto plano. El backend valida; acá no se interpreta nada. */
function aObjeto(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) out[k] = String(v);
  return out;
}

async function accion(nombre: string, fd: FormData) {
  await assertAdmin();
  const r = await ejecutarAccion(nombre, aObjeto(fd));
  refresh();
  return r;
}

export async function updateSettings(fd: FormData) {
  await accion("updateSettings", fd);
}

export async function updateChannel(fd: FormData) {
  await accion("updateChannel", fd);
}

export async function createAsset(fd: FormData) {
  await accion("createAsset", fd);
}

export async function updateAsset(fd: FormData) {
  await accion("updateAsset", fd);
}

export async function deleteAsset(fd: FormData) {
  await accion("deleteAsset", fd);
}

export async function createFixedCost(fd: FormData) {
  await accion("createFixedCost", fd);
}

export async function updateFixedCost(fd: FormData) {
  await accion("updateFixedCost", fd);
}

export async function deleteFixedCost(fd: FormData) {
  await accion("deleteFixedCost", fd);
}

export async function createSupply(fd: FormData) {
  await accion("createSupply", fd);
}

export async function updateSupply(fd: FormData) {
  await accion("updateSupply", fd);
}

export async function deleteSupply(fd: FormData) {
  await accion("deleteSupply", fd);
}

export async function updateSupplyStock(fd: FormData) {
  await accion("updateSupplyStock", fd);
}

export async function createProduct(fd: FormData) {
  await accion("createProduct", fd);
}

export async function updateProduct(fd: FormData) {
  await accion("updateProduct", fd);
}

export async function deleteProduct(fd: FormData) {
  await accion("deleteProduct", fd);
}

export async function createRecipeItem(fd: FormData) {
  await accion("createRecipeItem", fd);
}

export async function updateRecipeItem(fd: FormData) {
  await accion("updateRecipeItem", fd);
}

export async function deleteRecipeItem(fd: FormData) {
  await accion("deleteRecipeItem", fd);
}

export async function createProductionRun(fd: FormData) {
  await accion("createProductionRun", fd);
}

export async function updateProductionRun(fd: FormData) {
  await accion("updateProductionRun", fd);
}

export async function deleteProductionRun(fd: FormData) {
  await accion("deleteProductionRun", fd);
}

export async function createSale(fd: FormData) {
  await accion("createSale", fd);
}

export async function updateSale(fd: FormData) {
  await accion("updateSale", fd);
}

export async function markSaleCollected(fd: FormData) {
  await accion("markSaleCollected", fd);
}

export async function deleteSale(fd: FormData) {
  await accion("deleteSale", fd);
}

export async function createPurchase(fd: FormData) {
  await accion("createPurchase", fd);
}

export async function updatePurchase(fd: FormData) {
  await accion("updatePurchase", fd);
}

export async function markPurchasePaid(fd: FormData) {
  await accion("markPurchasePaid", fd);
}

export async function deletePurchase(fd: FormData) {
  await accion("deletePurchase", fd);
}

export async function createPartnerMovement(fd: FormData) {
  await accion("createPartnerMovement", fd);
}

export async function updatePartnerMovement(fd: FormData) {
  await accion("updatePartnerMovement", fd);
}

export async function deletePartnerMovement(fd: FormData) {
  await accion("deletePartnerMovement", fd);
}

/** Crea el presupuesto y lleva a su ficha para cargarle las piezas. */
export async function createQuote(fd: FormData) {
  const r = (await accion("createQuote", fd)) as { id?: number };
  if (r?.id) redirect(`/presupuestos/${r.id}`);
}

export async function updateQuote(fd: FormData) {
  await accion("updateQuote", fd);
}

export async function deleteQuote(fd: FormData) {
  await accion("deleteQuote", fd);
}

export async function createQuoteItem(fd: FormData) {
  await accion("createQuoteItem", fd);
}

export async function updateQuoteItem(fd: FormData) {
  await accion("updateQuoteItem", fd);
}

export async function deleteQuoteItem(fd: FormData) {
  await accion("deleteQuoteItem", fd);
}

export async function createFilamentRoll(fd: FormData) {
  await accion("createFilamentRoll", fd);
}

export async function updateFilamentRoll(fd: FormData) {
  await accion("updateFilamentRoll", fd);
}

export async function deleteFilamentRoll(fd: FormData) {
  await accion("deleteFilamentRoll", fd);
}
