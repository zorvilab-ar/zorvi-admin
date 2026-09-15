/**
 * Mensajes de error para los toasts de los formularios.
 *
 * Antes miraban errores de Postgres, porque el admin escribía directo. Ahora
 * las mutaciones viajan al backend, así que lo que puede fallar es la llamada
 * — o los datos, que es lo más común y lo que el usuario puede arreglar.
 */

export function esErrorDeConexion(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "ShopError" ||
    /no se pudo conectar|no responde|credencial/i.test(error.message)
  );
}

export function errorToast(error: unknown): string {
  if (error instanceof Error && error.name === "ValidationError") {
    // El mensaje del backend ya dice qué campo y por qué.
    return error.message;
  }
  if (esErrorDeConexion(error)) {
    return "No se pudo hablar con el backend. Revisá que esté levantado.";
  }
  return "No se pudo guardar. Revisá los datos.";
}
