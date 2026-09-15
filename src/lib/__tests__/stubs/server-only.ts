/**
 * `server-only` tira si lo importa algo que no sea un Server Component, y eso
 * incluye a vitest. Es su función: evita que el cliente HTTP con la clave
 * interna termine en el bundle del navegador.
 *
 * Los tests de acá prueban funciones puras de `calc.ts`, que arrastra ese
 * import por la cadena. El stub lo desactiva solo dentro de los tests.
 */
export {};
