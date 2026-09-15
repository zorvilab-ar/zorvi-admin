"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/session";
import { ValidationError } from "@/lib/validation-error";
import { loadTiendaAdmin } from "@/lib/views/client";
import {
  putListings,
  postPedidosImportados,
  ejecutarAccion,
  ShopError,
  type ListingTienda,
} from "./client";

const refresh = () => revalidatePath("/", "layout");

/**
 * Publica la ficha de venta de un producto.
 *
 * El formulario viaja tal cual al backend: él valida, busca el precio de
 * lista y el stock, y hace el upsert. Acá no se interpreta nada — si el
 * precio se armara de este lado, se podría publicar uno que no es el de la
 * ficha.
 */
export async function publishListing(fd: FormData) {
  await assertAdmin();
  const datos: Record<string, string> = {};
  for (const [k, v] of fd.entries()) datos[k] = String(v);

  try {
    await ejecutarAccion("publishListing", datos);
  } catch (e) {
    if (e instanceof ShopError) throw new ValidationError(e.message);
    throw e;
  }
  refresh();
}

/** Vuelve a mandar precio y stock de todo lo que ya está en la tienda. */
export async function syncListings(fd: FormData) {
  await assertAdmin();
  const codes = String(fd.get("codes") ?? "").split(",").filter(Boolean);
  if (codes.length === 0) return;

  const { productos } = await loadTiendaAdmin();
  const porCodigo = new Map(productos.map((p) => [p.code, p]));
  const actuales: ListingTienda[] = JSON.parse(String(fd.get("listings") ?? "[]"));

  try {
    await putListings(
      actuales
        .filter((l) => codes.includes(l.code))
        .map((l) => {
          const p = porCodigo.get(l.code);
          return {
            ...l,
            price: p?.listPrice ?? l.price,
            disponible: Math.max(0, p?.stock ?? 0),
            engraving: l.engraving ?? undefined,
            subtitle: l.subtitle ?? undefined,
            description: l.description ?? undefined,
            care: l.care ?? undefined,
            badge: l.badge ?? undefined,
            image: l.image ?? undefined,
            lampType: l.lampType ?? undefined,
          };
        }),
    );
  } catch (e) {
    if (e instanceof ShopError) throw new ValidationError(e.message);
    throw e;
  }

  refresh();
}

/**
 * Convierte pedidos web en ventas.
 *
 * Antes esto eran dos pasos entre dos servicios: asentar las ventas con
 * Drizzle y después avisarle a la tienda que liberara las reservas. Si lo
 * segundo fallaba quedaba a medias, y había que cuidarlo con un candado por
 * número de pedido y un reintento.
 *
 * Ahora el backend es dueño de las dos mitades y lo hace en una transacción,
 * así que ese problema dejó de existir. Acá quedó una llamada.
 */
export async function importarPedidos(fd: FormData) {
  await assertAdmin();
  const numeros = String(fd.get("numbers") ?? "").split(",").filter(Boolean);
  if (numeros.length === 0) return;

  try {
    await postPedidosImportados(numeros);
  } catch (e) {
    if (e instanceof ShopError) throw new ValidationError(e.message);
    throw e;
  }
  refresh();
}
