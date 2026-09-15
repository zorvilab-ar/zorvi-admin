"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/session";
import { parseForm, shopListingSchema, ValidationError } from "@/lib/validation";
import { loadAll, productStocks } from "@/lib/calc";
import { parseSizes, parseColors } from "./parse";
import {
  putListings,
  postPedidosImportados,
  ShopError,
  type ListingTienda,
} from "./client";

const refresh = () => revalidatePath("/", "layout");

/**
 * Publica la ficha de venta de un producto.
 *
 * El stock que se manda no se tipea: sale de `productStocks()`, que es el
 * mismo cálculo que muestra la página de Stock. Si se cargara a mano, la
 * tienda y el admin dirían cosas distintas al día siguiente.
 */
export async function publishListing(fd: FormData) {
  await assertAdmin();
  const data = parseForm(shopListingSchema, fd);

  const all = await loadAll();
  const producto = all.products.find((p) => p.code === data.code);
  if (!producto) {
    throw new ValidationError(`No existe el producto ${data.code} en el catálogo.`);
  }
  if (producto.listPrice <= 0 && data.published) {
    throw new ValidationError(
      `${data.code} no tiene precio de lista. Cargalo en Productos antes de publicarlo.`,
    );
  }

  const stock = productStocks(all).find((s) => s.product.code === data.code);

  try {
    await putListings([
      {
        code: data.code,
        slug: data.slug,
        name: data.name,
        subtitle: data.subtitle ?? undefined,
        description: data.description ?? undefined,
        care: data.care ?? undefined,
        category: data.category,
        // El precio y el stock son del admin: la tienda no los inventa.
        price: producto.listPrice,
        disponible: Math.max(0, stock?.current ?? 0),
        badge: data.badge ?? undefined,
        image: data.image ?? undefined,
        lampType: data.lampType ?? undefined,
        availability: data.availability,
        engraving: data.engravingLabel
          ? { label: data.engravingLabel, extra: data.engravingExtra }
          : undefined,
        published: data.published,
        sortOrder: data.sortOrder,
        sizes: parseSizes(data.sizesRaw),
        colors: parseColors(data.colorsRaw),
      },
    ]);
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

  const all = await loadAll();
  const stocks = new Map(productStocks(all).map((s) => [s.product.code, s.current]));
  const actuales: ListingTienda[] = JSON.parse(String(fd.get("listings") ?? "[]"));

  try {
    await putListings(
      actuales
        .filter((l) => codes.includes(l.code))
        .map((l) => {
          const p = all.products.find((x) => x.code === l.code);
          return {
            ...l,
            price: p?.listPrice ?? l.price,
            disponible: Math.max(0, stocks.get(l.code) ?? 0),
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
 * Convierte pedidos web en ventas del admin.
 *
 * El asiento contable se hace acá y recién después se le avisa a la tienda,
 * junto con el stock nuevo. Si se avisara primero y fallara la venta, la
 * tienda liberaría una reserva de algo que nunca se asentó.
 */
export async function importarPedidos(fd: FormData) {
  await assertAdmin();
  const numeros = String(fd.get("numbers") ?? "").split(",").filter(Boolean);
  if (numeros.length === 0) return;

  const { db, schema } = await import("@/lib/db");
  const pedidos: {
    number: string;
    customerName: string;
    paidAt: string | null;
    shippingCost: number;
    items: { code: string; qty: number; unitPrice: number }[];
  }[] = JSON.parse(String(fd.get("pedidos") ?? "[]"));

  const all = await loadAll();
  const canal =
    all.channels.find((c) => /tienda web/i.test(c.name)) ?? all.channels[0];
  if (!canal) throw new ValidationError("No hay canales de venta configurados.");

  const porCodigo = new Map(all.products.map((p) => [p.code, p]));

  /**
   * Si las ventas se asientan pero después falla el aviso a la tienda, hay
   * que poder reintentar. El número de pedido queda en `receipt`, así que
   * sirve para no volver a asentar lo mismo: el reintento solo completa el
   * aviso que faltó.
   */
  const yaAsentados = new Set(
    all.sales.map((s) => s.receipt).filter(Boolean) as string[],
  );

  await db.transaction(async (tx) => {
    for (const pedido of pedidos.filter(
      (p) => numeros.includes(p.number) && !yaAsentados.has(p.number),
    )) {
      const fecha = (pedido.paidAt ?? new Date().toISOString()).slice(0, 10);
      for (const item of pedido.items) {
        const producto = porCodigo.get(item.code);
        if (!producto) {
          throw new ValidationError(
            `El pedido ${pedido.number} trae ${item.code}, que no existe en Productos.`,
          );
        }
        await tx.insert(schema.sales).values({
          date: fecha,
          receipt: pedido.number,
          customer: pedido.customerName,
          channelId: canal.id,
          productId: producto.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
          shipping: 0,
          status: "Cobrada",
          collectionDate: fecha,
          notes: `Pedido web ${pedido.number}`,
        });
      }
    }
  });

  // Recién ahora, con las ventas ya asentadas, se le avisa a la tienda.
  const stocks = productStocks(await loadAll());
  const codigos = new Set(
    pedidos.filter((p) => numeros.includes(p.number)).flatMap((p) => p.items.map((i) => i.code)),
  );
  try {
    await postPedidosImportados(
      numeros,
      stocks
        .filter((s) => codigos.has(s.product.code))
        .map((s) => ({ code: s.product.code, disponible: Math.max(0, s.current) })),
    );
  } catch (e) {
    if (e instanceof ShopError) {
      throw new ValidationError(
        `Las ventas quedaron asentadas, pero no se pudo avisar a la tienda: ${e.message} Reintentá desde la bandeja.`,
      );
    }
    throw e;
  }

  refresh();
}
