import { describe, it, expect } from "vitest";
import { parseSizes, parseColors } from "@/lib/shop/parse";

/**
 * Talles y colores se cargan como texto libre, una variante por línea. Es la
 * única entrada de la sección Tienda que no es un campo tipado, así que es
 * donde se puede colar basura hacia el catálogo público.
 */

describe("talles", () => {
  it("separa etiqueta y recargo", () => {
    expect(parseSizes("Mediana · 22 cm | 0\nGrande · 30 cm | 6000")).toEqual([
      { label: "Mediana · 22 cm", extra: 0 },
      { label: "Grande · 30 cm", extra: 6000 },
    ]);
  });

  it("sin recargo, cuenta como 0", () => {
    expect(parseSizes("Única")).toEqual([{ label: "Única", extra: 0 }]);
  });

  it("acepta coma decimal", () => {
    expect(parseSizes("Grande | 6000,50")[0]!.extra).toBeCloseTo(6000.5);
  });

  // El `|` puede aparecer en el nombre; el separador es el último.
  it("parte por el último separador", () => {
    expect(parseSizes("Pack | 2 unidades | 3000")).toEqual([
      { label: "Pack | 2 unidades", extra: 3000 },
    ]);
  });

  it("ignora líneas vacías y espacios de más", () => {
    expect(parseSizes("\n  Mediana | 0  \n\n   \nGrande | 100\n")).toHaveLength(2);
  });

  it("un recargo negativo o basura no baja el precio", () => {
    expect(parseSizes("Raro | -5000")[0]!.extra).toBe(0);
    expect(parseSizes("Raro | abc")[0]!.extra).toBe(0);
  });

  it("vacío o null devuelve lista vacía", () => {
    expect(parseSizes(null)).toEqual([]);
    expect(parseSizes("   ")).toEqual([]);
  });
});

describe("colores", () => {
  it("separa nombre y hexadecimal", () => {
    expect(parseColors("Negro | #3B2A22\nCrema | #FBEFD9")).toEqual([
      { name: "Negro", hex: "#3B2A22" },
      { name: "Crema", hex: "#FBEFD9" },
    ]);
  });

  it("un hexadecimal inválido cae al color por defecto en vez de romper la tienda", () => {
    expect(parseColors("Negro | rojo")[0]!.hex).toBe("#3B2A22");
    expect(parseColors("Negro | #ZZZ")[0]!.hex).toBe("#3B2A22");
    expect(parseColors("Negro")[0]!.hex).toBe("#3B2A22");
  });

  it("acepta las formas cortas y con alfa", () => {
    expect(parseColors("A | #fff")[0]!.hex).toBe("#fff");
    expect(parseColors("B | #3B2A22FF")[0]!.hex).toBe("#3B2A22FF");
  });
});
