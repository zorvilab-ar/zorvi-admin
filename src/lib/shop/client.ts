import "server-only";

/**
 * Cliente del backend de la tienda (`zorvi-backend`).
 *
 * Esta es la única costura entre los dos servicios. El admin sigue siendo
 * dueño de su contabilidad y la escribe con Drizzle; lo de la tienda —
 * catálogo publicado y pedidos — vive del otro lado y se habla por HTTP.
 *
 * Corre solo en el servidor (`server-only`): la clave interna nunca tiene
 * que llegar al navegador.
 */

export interface ListingTienda {
  code: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  care: string | null;
  category: "lamparas" | "deco-hogar" | "cocina" | "llaveros";
  price: number;
  badge: "bestseller" | "new" | "on-demand" | null;
  image: string | null;
  lampType: "mesa" | "colgante" | "velador" | null;
  availability: "stock" | "on-demand";
  engraving: { label: string; extra: number } | null;
  stockPublished: number;
  reserved: number;
  published: boolean;
  sortOrder: number;
  updatedAt: string;
  sizes: { label: string; extra: number }[];
  colors: { name: string; hex: string }[];
}

export interface PedidoWeb {
  number: string;
  paidAt: string | null;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  items: { code: string; name: string; qty: number; unitPrice: number }[];
}

/** La tienda puede no estar configurada todavía: el admin funciona igual. */
export function shopConfigurada(): boolean {
  return Boolean(process.env.SHOP_API_URL && process.env.SHOP_INTERNAL_KEY);
}

export class ShopError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopError";
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.SHOP_API_URL?.replace(/\/$/, "");
  const key = process.env.SHOP_INTERNAL_KEY;
  if (!base || !key) {
    throw new ShopError(
      "Falta configurar la tienda: SHOP_API_URL y SHOP_INTERNAL_KEY.",
    );
  }

  let res: Response;
  try {
    res = await fetch(`${base}/api/internal${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": key,
        ...init?.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ShopError(
      "No se pudo conectar con la tienda. ¿Está levantado zorvi-backend?",
    );
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new ShopError("La tienda rechazó la credencial (SHOP_INTERNAL_KEY).");
    }
    const detalle = await res.text().catch(() => "");
    throw new ShopError(
      `La tienda respondió ${res.status}. ${detalle.slice(0, 200)}`,
    );
  }
  return res.json() as Promise<T>;
}

/**
 * Estado completo de la contabilidad. Reemplaza la consulta directa que hacía
 * `loadAll()`: la forma es idéntica, así las páginas no cambian.
 */
export function getEstado<T>(): Promise<T> {
  return call<T>("/state");
}

/** Una vista ya calculada: `dashboard`, `stock`, `resumen`… */
export function getVista<T>(nombre: string): Promise<T> {
  return call<T>(`/view/${nombre}`);
}

/** Catálogo completo de la tienda, borradores incluidos. */
export function getListings() {
  return call<ListingTienda[]>("/catalog");
}

/** Publica (o actualiza) la ficha de venta de uno o varios productos. */
export function putListings(productos: unknown[]) {
  return call<{ productos: { code: string; accion: string }[] }>("/catalog", {
    method: "PUT",
    body: JSON.stringify({ productos }),
  });
}

/** Pedidos pagados que todavía no se asentaron como venta. */
export function getPedidosPendientes() {
  return call<PedidoWeb[]>("/orders/pending");
}

/** Avisa que esos pedidos ya son ventas y manda el stock fresco. */
export function postPedidosImportados(
  numbers: string[],
  stock: { code: string; disponible: number }[],
) {
  return call<{ importados: string[]; stockActualizado: number }>(
    "/orders/imported",
    { method: "POST", body: JSON.stringify({ numbers, stock }) },
  );
}
