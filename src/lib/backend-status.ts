import "server-only";
import { cache } from "react";
import { shopConfigurada, ShopError, getVista } from "@/lib/shop/client";

/**
 * Estado del backend, para la pantalla de /conexion.
 *
 * Antes esto diagnosticaba la base: el admin se conectaba a Postgres y sabía
 * si faltaba la URL, si no respondía o si faltaba el schema. Ya no toca la
 * base, así que lo que puede fallar ahora es la otra pieza: que falte
 * configurar el backend, que no responda, o que rechace la credencial.
 */

export type BackendStatus =
  | { ok: true }
  | { ok: false; title: string; hint: string };

export const getBackendStatus = cache(async (): Promise<BackendStatus> => {
  if (!shopConfigurada()) {
    return {
      ok: false,
      title: "Falta configurar el backend",
      hint: "Definí SHOP_API_URL y SHOP_INTERNAL_KEY en las variables de entorno. En local, el backend se levanta con `pnpm dev` en zorvi-backend.",
    };
  }

  try {
    await getVista<unknown>("parametros");
    return { ok: true };
  } catch (e) {
    if (e instanceof ShopError && /credencial/i.test(e.message)) {
      return {
        ok: false,
        title: "El backend rechazó la credencial",
        hint: "SHOP_INTERNAL_KEY del admin tiene que coincidir con INTERNAL_API_KEY del backend.",
      };
    }
    if (e instanceof ShopError && /conectar/i.test(e.message)) {
      return {
        ok: false,
        title: "El backend no responde",
        hint: "Revisá que zorvi-backend esté levantado y que SHOP_API_URL apunte ahí. Si está en Railway, mirá /api/health/db, que dice si el problema es la base.",
      };
    }
    return {
      ok: false,
      title: "El backend respondió con un error",
      hint: e instanceof Error ? e.message : "Revisá los logs del backend.",
    };
  }
});
