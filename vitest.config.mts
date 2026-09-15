import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Tests de la lógica de negocio (`calc.ts`, `print-cost.ts`).
 *
 * Son funciones puras que reciben datos y devuelven números, así que no hace
 * falta base ni entorno de Next: alcanza con el alias `@/` para que resuelvan
 * los imports como en la app.
 */
export default defineConfig({
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
