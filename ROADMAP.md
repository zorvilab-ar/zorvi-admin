# Zorvi Admin — Auditoría & Roadmap

> Estado de la auditoría de seguridad y plan de mejoras del panel de administración.
> Última actualización: 2026-09-13.

---

## 0. Resumen ejecutivo

La app está bien construida: código limpio, cálculos defensivos y `assertAdmin()` en todas
las mutaciones. El RLS de Supabase ya está cerrado (§1.1). Quedan abiertos el TLS de la
conexión (§1.3) y tres tareas de consola de §1.2.

Los **ocho hallazgos de QA** (§8) están implementados en código; falta correr la migración
`supabase/qa-fixes.sql` y verificar en la app con datos reales.

**Prioridad inmediata:** aplicar §8 en prod, después §1.3 y los tests de §5.2.

---

## 1. 🔴 Seguridad — CRÍTICO (cerrar ya)

### 1.1 RLS de Supabase — **CERRADO ✅** (2026-09-12)
Se corrió `supabase/setup.sql` en el SQL Editor. Verificado en vivo con la publishable key:
todas las tablas devuelven `42501 permission denied` en lectura y escritura para el rol `anon`.
La app no se afecta (Drizzle usa el rol `postgres`, bypassa RLS); el realtime de `sales` sigue
disponible para usuarios logueados (`authenticated`).

- [x] Correr `supabase/setup.sql` en el **SQL Editor de Supabase**.
- [x] Verificado: lectura y escritura denegadas con la key pública.

> La app no se rompe: Drizzle se conecta como `postgres` (dueño de las tablas) y bypassa RLS.

### 1.2 Higiene de secretos — **PARCIAL**
- [x] **Scrub del `.env.example`** — emails, URL y key reales reemplazados por placeholders.
- [ ] **Rotar la publishable key** en Supabase (estuvo quemada en el repo público) y actualizar `NEXT_PUBLIC_SUPABASE_*` en Vercel.
- [ ] **Repo en privado** (el historial de git todavía tiene los valores viejos).
- [ ] **Desactivar signup público** en Supabase → Authentication → Providers (si no, un atacante se autoregistra y la policy `using(true)` de `sales` le deja leer todas las ventas).

### 1.3 Rol de aplicación sin DDL — **LISTO PARA APLICAR** (2026-09-15)
Hoy la app se conecta como `postgres`: dueño de las tablas, con DDL y bypass de RLS.
- [x] `supabase/role-zorvi-app.sql` — crea `zorvi_app` (select/insert/update/delete, **sin** DDL), con las policies de RLS que un rol no-dueño necesita, verificación previa y rollback.
- [x] **Probado contra Postgres 17 con el RLS de `setup.sql` puesto.** Verificado: lee y escribe las 15 tablas, `create table` / `drop table` / `alter table` fallan, `anon` sigue con `permission denied`, `authenticated` conserva solo el SELECT de `sales` para el realtime, y Drizzle conecta y hace transacciones con ese rol.
- [x] ⚠️ Confirmado el modo de falla que hay que evitar: un rol con grants pero **sin** las policies no da error — devuelve **0 filas**. La app se vería con todas las tablas vacías, como si se hubieran borrado los datos. Por eso las policies no son opcionales.
- [ ] **Correr en el SQL Editor** y dejar en Vercel `DATABASE_URL` → `zorvi_app` y `DIRECT_URL` → `postgres` (solo para `db:push`). No hace falta tocar código: `drizzle.config.ts` ya prioriza `DIRECT_URL`.
- Es además el primer paso de la separación admin / tienda: cada servicio con su rol sobre su schema.

### 1.4 TLS de la conexión a la DB — **PENDIENTE**
- [ ] `src/lib/db/pool.ts` usa `rejectUnauthorized: false` para toda DB remota → riesgo de MITM. Usar el CA real de Supabase en vez de desactivar la verificación.

---

## 2. ✅ Hecho (verificado)

### 2.1 Validación de input con zod — **APLICADO**
Antes, los `as "enum"` eran solo TypeScript y no validaban en runtime: un POST manipulado
metía strings arbitrarios en columnas enum. Ahora cada `FormData` se valida antes de tocar la DB.

- ✅ `src/lib/validation.ts` — schemas zod por entidad + `parseForm()`.
- ✅ `src/lib/actions.ts` — **37 actions, 37 `parseForm`, 37 `assertAdmin`** (cobertura 1:1).
- ✅ `src/lib/db/errors.ts` — el toast muestra el mensaje real del `ValidationError`.
- ✅ `tsc` limpio, lint limpio en los archivos tocados, test de runtime OK.
- ✅ Sin mutaciones fuera de `actions.ts` ni route handlers que se salteen la validación.

---

## 3. 🎯 Alto impacto / bajo esfuerzo (siguiente sprint)

### 3.1 Constraints e índices en la DB — **HECHO ✅** (código) / ⏳ aplicar en prod
- [x] **26 `CHECK`** de integridad en `schema.ts` (montos no-negativos, `qty > 0`, fracciones `0..1`, `remaining_grams <= initial_grams`, enums). Validado en Postgres local: rechaza montos negativos y enums inválidos.
- [x] **14 índices** en FKs + columnas de filtro/orden (`sales.date`, `purchases.date`, etc.).
- [x] Enums validados vía `CHECK` en vez de `pgEnum` — misma garantía a nivel DB, cero riesgo de migración de tipos sobre datos vivos; `text({enum})` queda como fuente TS.
- [ ] **Aplicar en prod**: `pnpm db:push` (con `DATABASE_URL` de prod) **o** correr `supabase/constraints-indexes.sql` en el SQL Editor (incluye un pre-flight que detecta filas que violarían un CHECK).

### 3.2 Carga selectiva en `loadAll`
`loadAll` trae las 15 tablas enteras en cada render (`force-dynamic`, sin paginación).
- [ ] Cargar por vista solo lo necesario + paginar ventas/compras. Cuello de botella #1 al crecer.

### 3.3 Backup automático
No hay backup de la base contable.
- [ ] Cron de Vercel (`/api/backup` diario) → `pg_dump` a Vercel Blob / Google Drive.

### 3.4 Transacciones en operaciones multi-paso — **HECHO ✅** (2026-09-13)
- [x] `createProductionRun` / `updateProductionRun` / `deleteProductionRun`, `createPurchase` / `updatePurchase` y `createAsset` corren dentro de `db.transaction()`.
- [x] Borrar o editar una tanda ahora **devuelve** el filamento a los rollos (antes se descontaba al crear y no se reponía nunca).

---

## 4. 📊 Features de producto

### 4.1 Alertas de stock accionables
`reorder_point` en `supplies` hoy es un dato muerto.
- [ ] Widget "insumos bajo punto de reposición" en el resumen + notificación (realtime / sonner).

### 4.2 Dashboard temporal / tendencias
El resumen ya calcula break-even, ticket promedio, margen y ROI — le falta el eje tiempo.
- [ ] Gráficos (Recharts) de ventas por mes, margen mensual y evolución del FX sobre datos que ya computa `calc.ts`.

### 4.3 Exportaciones serias
- [ ] Export contable por rango de fechas (ventas + compras + movimientos de socios).
- [ ] **PDF de presupuestos** desde `/presupuestos/[id]` para mandar al cliente.

### 4.4 Facturación / monotributo
Ya se trackea `invoiced`, `monotributo_cap` y `monotributo_category`.
- [ ] Tablero "facturado vs. tope de categoría" con semáforo.
- [ ] (Proyecto aparte) Integración AFIP/ARCA para emisión.

---

## 5. 🛠️ Robustez / plataforma

### 5.1 Audit log
App con plata real y varios admins (agus, nico, juanchi, mariano), sin rastro de quién cambió qué.
- [ ] Tabla `audit_log` (user, action, table, row_id, diff, timestamp) escrita desde los server actions.

### 5.2 Tests sobre la lógica de negocio — **HECHO ✅** (2026-09-15)
- [x] Vitest (`pnpm test`). **50 tests** sobre `calc.ts` y `print-cost.ts`: ficha de costo, precios por canal, cálculo de venta, stock, caja mensual, cuentas de socios, tablero y monotributo.
- [x] Fixtures con los números reales del negocio (`src/lib/__tests__/fixtures.ts`): 19,99 $/g de filamento, 293 $/h de desgaste, 35.000 de precio de lista. Cuando un test falla, el número que aparece significa algo.
- [x] Regresiones con nombre para los hallazgos de QA 3, 6, 7 y 8, para que no vuelvan.
- [x] Verificado por mutación: rompiendo a propósito el filtro de impresoras y el tope del aviso del Tablero, los tests fallan. No son tests vacíos.

### 5.3 CI en GitHub Actions
- [ ] `tsc + eslint + test` en cada PR.

### 5.4 Deuda menor
- [x] `src/components/mobile-nav.tsx` — resuelto ajustando el estado durante el render en vez de en un efecto. **`eslint` ahora da 0 errores y 0 warnings.**
- [x] Warnings de vars sin usar: eliminados (`Purchase`, `PartnerMovement`, `FixedCost`; `allProductCosts` pasó a usarse de verdad en Ventas).
- [ ] `esbuild` moderate (dev-only, vía `drizzle-kit`) → `pnpm up drizzle-kit`.

---

## 6. 💡 UX / detalle

- [ ] Optimistic UI + estados de error más ricos en los formularios (base ya puesta con `useTransition`).
- [ ] Búsqueda / filtros en tablas grandes (ventas, compras) — hoy es scroll plano.
- [ ] Toggle ARS/USD consistente usando el `fx_rate` que ya se guarda.

---

## 7. Roadmap sugerido (orden de ejecución)

1. **Seguridad** (§1) — RLS + rotar key + repo privado. *Bloqueante.*
2. **Constraints + índices + carga selectiva + backup** (§3.1–3.3) — evitan romper o perder datos al crecer.
3. **Audit log** (§5.1) — temprano si los socios tocan números en paralelo.
4. **Transacciones + tests + CI** (§3.4, §5.2, §5.3) — red de seguridad para iterar.
5. **Features** (§4) — alertas de stock, dashboard temporal, PDF de presupuestos.
6. **UX** (§6) — filtros, optimistic UI, multi-moneda.

---

## 8. 🐛 Hallazgos de QA (2026-09-13) — implementados

Los ocho puntos del reporte de QA, con lo que se hizo en cada uno.

> ⚠️ **Requiere migración.** Tres columnas nuevas: correr `supabase/qa-fixes.sql`
> en el SQL Editor **o** `pnpm db:push` con el `DATABASE_URL` de prod. Sin eso la
> app rompe, porque el código ya las usa.
>
> **Probada (2026-09-15)** sobre una base con el schema anterior (commit `1415952`):
> corre sin errores, el backfill deja `HERR-001` como Herramienta e `IMP-001` como
> Impresora, las columnas quedan idénticas a un `db:push` limpio del schema nuevo,
> la FK del aporte borra en cascada, el CHECK rechaza un tipo inválido y una
> segunda corrida no rompe nada.

| # | Hallazgo | Estado |
| --- | --- | --- |
| 1 | Editar una compra sin eliminarla | ✅ |
| 2 | Subir PDF/foto del comprobante (OCR) | ⏸️ pendiente |
| 3 | Falta la hora de mano de obra en la calculadora | ✅ |
| 4 | La compra no actualiza el costo del insumo ni el aporte del socio | ✅ |
| 5 | El precio de venta arranca vacío y sin referencia | ✅ |
| 6 | El selector de equipo ofrece el soplador de calor | ✅ |
| 7 | Precio de lista por debajo del margen objetivo | ✅ (el aviso; las comisiones son carga de datos) |
| 8 | El Tablero muestra plata que ya se gastó | ✅ |

### 8.1 Edición en las cuatro páginas de uso diario — **HECHO ✅**
No era solo compras: no existía `update` para ventas, producción ni socios.
- [x] `updateSale`, `updatePurchase`, `updateProductionRun`, `updatePartnerMovement` + botón de lápiz en las cuatro tablas.
- [x] Editar o borrar una tanda **devuelve el filamento** a los rollos. Antes "borrar y recargar" desangraba el stock en cada corrección.
- [x] Los aportes generados por una compra no se editan desde Socios (se muestran con badge y se editan en Compras), para que no digan algo distinto de su compra.

### 8.2 Comprobante adjunto — **PENDIENTE**
Requiere storage, que hoy el proyecto no tiene. El patrón de subida ya está resuelto
en `slicer-actions.ts` (server action con `assertAdmin` y tope de tamaño).
- [ ] Bucket privado en Supabase Storage + columna `receipt_url` + dropzone arriba del drawer.
- [ ] OCR: ticket aparte. Adjuntar sin OCR ya entrega la mitad del valor.

### 8.3 Mano de obra en el costeo a medida — **HECHO ✅**
`assemblyRate` y `designRate` ya existían en Parámetros y ya los usaba `productCost`
para el catálogo — la calculadora los ignoraba, así que toda pieza a medida salía barata.
- [x] `customPrintCost()` suma armado (por unidad) y diseño (una vez por pedido), **antes** del margen de falla, igual que `productCost`.
- [x] Campos nuevos en la calculadora y en los ítems de presupuesto (`quote_items.assembly_minutes`, `design_hours`).

### 8.4 + 8.8 La compra ahora cierra los dos asientos — **HECHO ✅**
Eran el mismo agujero visto desde dos pantallas.
- [x] Dos checkboxes en el drawer, con el número ya calculado: «Actualizar el costo de FIL-001 a $21,67/g» y «Registrar también como aporte de Juanchi».
- [x] El costo se escribe como `purchasePrice = monto` / `packQty = cantidad`, que es la forma en que el modelo guarda el precio del pack.
- [x] El aporte queda **enlazado** a la compra (`partner_movements.purchase_id`, `on delete cascade`): editar la compra lo actualiza, destildar lo borra, borrar la compra se lo lleva. Sin ese enlace, editar la compra volvía a descuadrar la caja.
- [x] Alta de activo: checkbox «Registrar también la compra», para que el activo no vuelva a entrar al inventario sin salir de la caja.
- [x] El Tablero avisa cuando la inversión en activos supera las compras de tipo Activo, acotado por el capital aportado.

### 8.5 Precio de venta con referencia en vivo — **HECHO ✅**
- [x] El precio llega precargado con el de lista **llevado al canal** (`(lista + fijo) / (1 − comisión − impuestos)`), editable.
- [x] Debajo, en vivo: «te quedan $X, margen Y%», con el desglose de comisión, impuestos, envío y costo variable.
- [x] En rojo si el precio cae por debajo del costo variable del producto.
- [x] Misma fórmula que `computeSale()` en el server, para que lo que se ve al cargar sea lo que después muestra la tabla.

### 8.6 Tipo de activo — **HECHO ✅**
- [x] `assets.type` (Impresora / Herramienta / Otro). El select de Producción filtra por Impresora.
- [x] **Efecto que QA no podía ver desde la pantalla:** `totalAmortPerHour()` sumaba el desgaste de *todos* los activos a cada hora de impresión, así que el soplador de calor ya estaba inflando el costo de cada lámpara. Ahora solo suman impresoras.
- [x] Gramos y horas vienen precargados desde la receta × unidades, y el hint muestra el desvío contra lo estimado. Si se escribe el número real, la receta deja de pisarlo.
- [x] El importador de slicer quedó enganchado también acá y en los ítems de presupuesto (antes solo en el alta de productos).

### 8.7 Margen contra el objetivo — **HECHO ✅** (el aviso)
El cálculo estaba bien; el problema es que un 24,1% contra un objetivo de 45% se pintaba verde.
- [x] El margen se pinta **ámbar** cuando queda por debajo del objetivo y rojo cuando es negativo.
- [x] Aviso arriba si todos los canales siguen en comisión 0 (por eso los seis dan el mismo precio).
- [x] Aviso con los productos que hoy están por debajo del margen objetivo.
- [ ] **Carga de datos, no código:** cargar las comisiones reales de MercadoLibre, Tienda web y Mayorista en Parámetros → Canales.
