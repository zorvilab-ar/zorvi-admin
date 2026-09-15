-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Zorvi Admin — columnas nuevas de las correcciones de QA            ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Tres cambios de schema, todos add-only e idempotentes:
--
--   1. assets.type          → separa impresoras de herramientas, para que el
--                             soplador de calor no aparezca en Producción ni
--                             sume desgaste al costo de cada lámpara.
--   2. partner_movements.purchase_id → enlaza el aporte del socio con la
--                             compra que lo generó, así editar o borrar la
--                             compra no deja la caja descuadrada.
--   3. quote_items.assembly_minutes / design_hours → mano de obra en los
--                             presupuestos, que hasta ahora no se cobraba.
--
-- Equivale a `pnpm db:push` con el schema nuevo. Se puede correr tal cual en
-- el SQL Editor de Supabase; los nombres coinciden con los que espera Drizzle.

begin;

-- ── 1 · Tipo de activo ──────────────────────────────────────────────
alter table assets
  add column if not exists type text not null default 'Impresora';

-- Backfill por convención de código: HERR-* son herramientas.
-- Revisá el resultado y corregí a mano lo que haga falta desde /activos.
update assets set type = 'Herramienta'
 where type = 'Impresora' and code ilike 'HERR%';

alter table assets drop constraint if exists assets_type_enum;
alter table assets add constraint assets_type_enum
  check (type in ('Impresora', 'Herramienta', 'Otro'));

-- ── 2 · Aporte enlazado a su compra ─────────────────────────────────
alter table partner_movements
  add column if not exists purchase_id integer;

alter table partner_movements
  drop constraint if exists partner_movements_purchase_id_purchases_id_fk;
alter table partner_movements
  add constraint partner_movements_purchase_id_purchases_id_fk
  foreign key (purchase_id) references purchases(id) on delete cascade;

create index if not exists partner_movements_purchase_idx
  on partner_movements (purchase_id);

-- ── 3 · Mano de obra en presupuestos ────────────────────────────────
alter table quote_items
  add column if not exists assembly_minutes real not null default 0;
alter table quote_items
  add column if not exists design_hours real not null default 0;

alter table quote_items drop constraint if exists quote_items_non_negative;
alter table quote_items add constraint quote_items_non_negative check (
  qty >= 0 and print_hours >= 0 and grams >= 0
  and assembly_minutes >= 0 and design_hours >= 0
  and extra_supplies_ars >= 0
);

commit;

-- ════════════════════════════════════════════════════════════════════
-- DESPUÉS DE CORRER: el asiento que falta del Tablero
-- ════════════════════════════════════════════════════════════════════
-- La impresora está en `assets` y como aporte del socio, pero nunca como
-- compra: por eso la caja muestra plata que ya se gastó. Este select dice
-- cuánto falta; el Tablero ahora avisa solo cuando la diferencia es > 0.
--
--   select
--     (select coalesce(sum(cost_ars), 0) from assets)                        as en_activos,
--     (select coalesce(sum(amount_ars), 0) from purchases where type = 'Activo') as como_compra;
--
-- Cargá la diferencia desde /compras (tipo Activo, pagada por quien puso la
-- plata) o, más cómodo, borrá el activo y volvé a darlo de alta con el
-- checkbox «Registrar también la compra» tildado.
