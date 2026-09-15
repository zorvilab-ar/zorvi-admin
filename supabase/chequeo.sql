-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Zorvi Admin — chequeo de estado de la base (solo lectura)         ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Pegalo entero en el SQL Editor. No modifica nada: dice qué scripts de
-- `supabase/` ya están aplicados y qué falta. Sirve para correr cuando
-- quieras, y sobre todo antes de cambiar DATABASE_URL en Vercel.

select * from (

  -- ── 1. Migración de los hallazgos de QA ────────────────────────────
  select 1::numeric as orden,
    'Columnas de qa-fixes.sql' as chequeo,
    case when count(*) = 4 then 'OK'
         else 'FALTA -> corré supabase/qa-fixes.sql' end as estado,
    count(*)::text || ' de 4 columnas' as detalle
  from information_schema.columns
  where table_schema = 'public' and (
       (table_name = 'assets'            and column_name = 'type')
    or (table_name = 'partner_movements' and column_name = 'purchase_id')
    or (table_name = 'quote_items'       and column_name in ('assembly_minutes', 'design_hours'))
  )

  union all
  select 2,
    'Aporte enlazado borra en cascada',
    case when count(*) = 1 then 'OK' else 'FALTA' end,
    coalesce(string_agg(case confdeltype when 'c' then 'on delete cascade'
                                         else 'mal: ' || confdeltype::text end, ', '), '—')
  from pg_constraint
  where conname = 'partner_movements_purchase_id_purchases_id_fk'

  -- ── 2. Rol de aplicación ───────────────────────────────────────────
  union all
  select 3,
    'Rol zorvi_app',
    case when count(*) = 1 then 'OK'
         else 'FALTA -> corré supabase/role-zorvi-app.sql' end,
    coalesce(string_agg('super=' || rolsuper || ' createdb=' || rolcreatedb
                        || ' createrole=' || rolcreaterole || ' login=' || rolcanlogin, ''), '—')
  from pg_roles where rolname = 'zorvi_app'

  union all
  select 4,
    'Atributos de zorvi_app',
    case when not exists (select 1 from pg_roles where rolname = 'zorvi_app') then 'N/A'
         when exists (select 1 from pg_roles where rolname = 'zorvi_app'
                        and not rolsuper and not rolcreatedb and not rolcreaterole and rolcanlogin)
         then 'OK' else 'REVISAR -> tiene privilegios de más' end,
    'sin DDL, solo login'

  union all
  select 5,
    'Policies de zorvi_app',
    case when (select count(*) from pg_policies
                where schemaname = 'public' and policyname = 'zorvi_app_full_access')
              = (select count(*) from pg_tables where schemaname = 'public')
         then 'OK' else 'FALTA -> volvé a correr role-zorvi-app.sql' end,
    (select count(*)::text from pg_policies
       where schemaname = 'public' and policyname = 'zorvi_app_full_access')
    || ' de ' || (select count(*)::text from pg_tables where schemaname = 'public')
    || ' tablas'

  -- ── 3. Candado de seguridad de setup.sql ───────────────────────────
  -- ── 2b. Integridad a nivel motor (§3.1) ───────────────────────────
  union all
  select 5.5,
    'CHECK constraints (§3.1)',
    case when count(*) >= 27 then 'OK'
         else 'FALTA -> corré supabase/constraints-indexes.sql' end,
    count(*)::text || ' de 27'
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public' and c.contype = 'c'
    and c.conname not like '%not_null%'

  union all
  select 5.6,
    'Índices de filtro y orden (§3.1)',
    case when count(*) >= 15 then 'OK'
         else 'FALTA -> corré supabase/constraints-indexes.sql' end,
    count(*)::text || ' de 15'
  from pg_indexes
  where schemaname = 'public' and indexname like '%\_idx'

  union all
  select 6,
    'RLS activo en todas las tablas',
    case when count(*) filter (where not c.relrowsecurity) = 0 then 'OK'
         else 'FALTA -> corré supabase/setup.sql' end,
    count(*) filter (where c.relrowsecurity)::text || ' de ' || count(*)::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'

  union all
  select 7,
    'anon / authenticated sin acceso',
    case when count(*) = 0 then 'OK'
         else 'REVISAR -> la key pública puede leer tablas' end,
    case when count(*) = 0 then 'ninguna tabla expuesta'
         else string_agg(distinct table_name, ', ') end
  from information_schema.role_table_grants
  where table_schema = 'public'
    and grantee in ('anon', 'authenticated')
    and table_name <> 'sales'   -- excepción a propósito: realtime del admin

  -- ── 4. Datos que dependen de decisiones humanas ────────────────────
  union all
  select 8,
    'Activos clasificados por tipo',
    case when not exists (select 1 from information_schema.columns
                            where table_schema='public' and table_name='assets' and column_name='type')
         then 'N/A'
         when exists (select 1 from assets where type = 'Impresora' and code not ilike 'IMP%')
         then 'REVISAR -> hay algo marcado Impresora que no parece serlo'
         else 'OK' end,
    coalesce((select string_agg(code || '=' || type, ', ' order by code) from assets), 'sin activos')

  union all
  select 9,
    'Activos con su compra registrada',
    case when coalesce((select sum(cost_ars) from assets), 0)
            <= coalesce((select sum(amount_ars) from purchases where type = 'Activo'), 0)
         then 'OK'
         when coalesce((select sum(amount_ars) from partner_movements where type = 'Aporte'), 0) > 0
         then 'FALTA -> hay activos sin su compra y el saldo de caja está inflado'
         else 'FALTA -> hay activos sin su compra (todavía no infla la caja: no hay aportes)' end,
    'activos ' || coalesce((select sum(cost_ars)::bigint from assets), 0)::text
    || ' vs compras ' || coalesce((select sum(amount_ars)::bigint from purchases where type = 'Activo'), 0)::text

  union all
  select 10,
    'Comisiones de canal cargadas',
    case when exists (select 1 from channels where commission > 0 or fixed_cost > 0)
         then 'OK'
         else 'FALTA -> todos los canales en 0, los precios no son reales' end,
    (select count(*) filter (where commission > 0 or fixed_cost > 0)::text
       || ' de ' || count(*)::text || ' canales' from channels)

) t order by orden;
