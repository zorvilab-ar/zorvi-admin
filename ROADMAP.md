# Zorvi Admin — Auditoría & Roadmap

> Estado de la auditoría de seguridad y plan de mejoras del panel de administración.
> Última actualización: 2026-09-12.

---

## 0. Resumen ejecutivo

La app está bien construida: código limpio, cálculos defensivos y `assertAdmin()` en todas
las mutaciones. Hay **un problema crítico de seguridad abierto** (RLS de Supabase sin aplicar)
que deja la base de datos leíble, editable y borrable desde internet. El resto es higiene y
features de crecimiento.

**Prioridad inmediata:** cerrar seguridad (§1) antes que cualquier feature.

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

### 1.3 TLS de la conexión a la DB — **PENDIENTE**
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

### 3.1 Constraints e índices en la DB
El schema no tiene ni un `CHECK` ni índices más allá de PK/unique.
- [ ] `CHECK` de integridad: `amount_ars >= 0`, `qty > 0`, `commission between 0 and 1`, `remaining_grams <= initial_grams`.
- [ ] Índices en columnas de filtro/orden: `sales.date`, `purchases.date` y todas las FKs.
- [ ] Migrar enums `text` a `pgEnum` reales de Drizzle (validación a nivel DB).

### 3.2 Carga selectiva en `loadAll`
`loadAll` trae las 15 tablas enteras en cada render (`force-dynamic`, sin paginación).
- [ ] Cargar por vista solo lo necesario + paginar ventas/compras. Cuello de botella #1 al crecer.

### 3.3 Backup automático
No hay backup de la base contable.
- [ ] Cron de Vercel (`/api/backup` diario) → `pg_dump` a Vercel Blob / Google Drive.

### 3.4 Transacciones en operaciones multi-paso
- [ ] `createProductionRun` inserta la corrida y descuenta filamento en llamadas sueltas. Envolver en `db.transaction()` para atomicidad.

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

### 5.2 Tests sobre la lógica de negocio
`calc.ts` / `print-cost.ts` (pricing, márgenes, break-even) no tienen un solo test.
- [ ] Vitest sobre los cálculos clave.

### 5.3 CI en GitHub Actions
- [ ] `tsc + eslint + test` en cada PR.

### 5.4 Deuda menor
- [ ] `src/components/mobile-nav.tsx:23` — error de lint `setState-in-effect` (único error que impide lint 100% limpio).
- [ ] `esbuild` moderate (dev-only, vía `drizzle-kit`) → `pnpm up drizzle-kit`.
- [ ] Limpiar warnings de vars sin usar (`allProductCosts`, `Purchase`, `PartnerMovement`, `FixedCost`).

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
