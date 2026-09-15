/**
 * Error de dato inválido.
 *
 * La validación completa vive en el backend, que es el dueño de los datos.
 * Acá queda solo la clase, para que el toast distinga un dato mal cargado
 * —que el usuario puede arreglar— de una falla de conexión.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
