-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Zorvi Admin — Seguridad de Postgres (correr en SQL Editor)        ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Correr DESPUÉS de `pnpm db:push`, y de nuevo cada vez que `db:push`
-- cree tablas nuevas (drizzle-kit las crea con RLS OFF).
--
-- Modelo de acceso:
--   • La app (Drizzle) se conecta por DATABASE_URL con el rol `postgres`,
--     dueño de las tablas → bypassa RLS. No se rompe nada.
--   • La REST API de Supabase (PostgREST) usa los roles `anon` /
--     `authenticated`. A esos les REVOCAMOS todo: sin RLS abierto ni
--     grants, la publishable key no puede leer ni escribir la base.
--   • Única excepción: `sales`, que el admin escucha por Realtime con el
--     cliente del browser (rol authenticated). Solo SELECT, solo esa tabla.

begin;

-- ── 1. RLS ON en todas las tablas (default-deny, sin policies) ───────
alter table settings          enable row level security;
alter table channels          enable row level security;
alter table partners          enable row level security;
alter table partner_movements enable row level security;
alter table assets            enable row level security;
alter table fixed_costs       enable row level security;
alter table supplies          enable row level security;
alter table products          enable row level security;
alter table recipe_items      enable row level security;
alter table production_runs   enable row level security;
alter table sales             enable row level security;
alter table purchases         enable row level security;
alter table quotes            enable row level security;
alter table quote_items       enable row level security;
alter table filament_rolls    enable row level security;

-- ── 2. Revocar acceso de la REST API a TODO el schema public ─────────
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- Tablas futuras (próximos `db:push`): que NO hereden grants para la API.
alter default privileges in schema public
  revoke all on tables    from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;

-- ── 3. Realtime de ventas (lo único que necesita la publishable key) ─
-- Idempotente: no falla si `sales` ya está en la publicación.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sales'
  ) then
    alter publication supabase_realtime add table sales;
  end if;
end $$;

-- authenticated necesita el grant de tabla + una policy de SELECT para
-- que el Realtime del admin reciba los INSERT de la tienda web.
grant select on sales to authenticated;

drop policy if exists "admins can read sales" on sales;
drop policy if exists "authenticated can read sales" on sales;
create policy "authenticated can read sales"
  on sales
  for select
  to authenticated
  using (true);

commit;

-- ── Verificación ─────────────────────────────────────────────────────
-- Tras correr esto, desde afuera con la publishable key:
--   curl '.../rest/v1/partner_movements?select=*' -H 'apikey: <key>'
-- debe devolver  {"code":"42501", ... "permission denied ..."}  (o []).
--
-- RECORDÁ además: rotar la publishable key en Supabase, repo en privado,
-- y desactivar el signup público en Authentication → Providers.
