# Zorvi Admin

Admin de contabilidad y costos para **Zorvi Lab** (lámparas 3D). Reemplaza el
`Libro_Contabilidad_Lamparas_3D.xlsx`: todas las fórmulas del Excel se calculan
solas. Usa el sistema de diseño de la tienda Zorvi (crema/tinta/rojo, Lilita
One + Nunito, bordes gruesos y sombras duras).

## Arrancar (un solo comando)

```bash
make up
```

Eso hace todo: instala dependencias, levanta **Postgres 17 en Docker**, crea el
schema, carga los datos iniciales del Excel y arranca la app en
http://localhost:3000. Requiere Docker Desktop abierto.

## Otros comandos

```bash
make dev      # solo la app (la base ya tiene que estar arriba)
make down     # apagar la base (los datos quedan guardados)
make reset    # ⚠ borra TODO y vuelve al seed inicial (pide confirmación)
make logs     # logs de Postgres
make studio   # explorar la base con Drizzle Studio
```

## Base de datos

- **Postgres 17** en Docker (`docker-compose.yml`), puerto **5433** local.
- Los datos persisten en el volumen `zorvi_pgdata` — sobreviven a `make down`
  y a reinicios; solo `make reset` (o `docker compose down -v`) los borra.
- Conexión por defecto: `postgres://zorvi:zorvi@localhost:5433/zorvi`
  (se puede pisar con la variable `DATABASE_URL`).
- ORM: Drizzle. Schema en `src/lib/db/schema.ts`; fórmulas del Excel en
  `src/lib/calc.ts`; server actions en `src/lib/actions.ts`.

## Cómo se usa (el flujo)

1. **Configurar una sola vez**: Parámetros → Activos → Costos fijos → Insumos →
   Productos (con su receta).
2. **Uso diario, solo 4 páginas**: Producción, Ventas, Compras y Socios.
3. **El resto se calcula solo**: Stock, Precios por canal, Resumen mensual y el
   Tablero.

La misma guía está dentro de la app: botón **«¿Cómo se usa?»** abajo del menú.
Cada página tiene su explicación arriba y cada campo de los formularios tiene
su ayuda abajo.

## Stack

Next.js 16 (App Router, Server Actions) · Tailwind 4 · shadcn/ui ·
Drizzle + Postgres (Docker) · pnpm

## Módulos (equivalencia con el Excel)

| Página | Hoja del Excel |
| --- | --- |
| Tablero | Tablero |
| Parámetros (+canales) | Parametros |
| Activos | Activos |
| Costos fijos | CostosFijos |
| Insumos | Insumos |
| Productos + ficha/receta | Productos + Recetas |
| Precios por canal | Precios |
| Producción | Produccion |
| Ventas | Ventas |
| Compras y gastos | Compras |
| Socios | Socios |
| Stock | Stock |
| Resumen mensual | Resumen |

## Diferencias (mejoras) vs. el Excel

- Consumo de componentes/packaging en stock: automático desde Producción
  (unidades OK × receta); en el Excel era manual. El ajuste manual sigue en Stock.
- Margen objetivo seedeado en 45% (el Excel lo tenía en 0). Se cambia en Parámetros.
- Porcentajes se cargan como enteros en los formularios (15 = 15%).
