/**
 * Talles y colores se cargan como texto libre en la sección Tienda, una
 * variante por línea. Son funciones puras y viven aparte del server action
 * porque son la única entrada sin tipar que llega al catálogo público: acá se
 * testean solas, sin arrastrar el cliente HTTP ni `server-only`.
 */

/**
 * Convierte el texto libre del formulario en las listas que espera la API.
 * Una variante por línea, con `|` separando el valor del recargo:
 *
 *     Mediana · 22 cm | 0
 *     Grande · 30 cm  | 6000
 *
 * Es un textarea y no un repetidor de campos porque son listas cortas que se
 * cargan de una sentada; un repetidor sería más UI para el mismo resultado.
 */
function parseLineas(raw: string | null): { izq: string; der: string }[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.lastIndexOf("|");
      return i === -1
        ? { izq: l.trim(), der: "" }
        : { izq: l.slice(0, i).trim(), der: l.slice(i + 1).trim() };
    })
    .filter((x) => x.izq.length > 0);
}

export function parseSizes(raw: string | null) {
  return parseLineas(raw).map((x) => ({
    label: x.izq,
    extra: Math.max(0, parseFloat(x.der.replace(",", ".")) || 0),
  }));
}

export function parseColors(raw: string | null) {
  return parseLineas(raw).map((x) => ({
    name: x.izq,
    hex: /^#[0-9a-f]{3,8}$/i.test(x.der) ? x.der : "#3B2A22",
  }));
}
