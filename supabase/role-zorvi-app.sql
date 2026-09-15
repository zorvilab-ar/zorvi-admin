-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Zorvi Admin — rol de aplicación `zorvi_app` (§1.3 del ROADMAP)    ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Hoy la app se conecta como `postgres`: dueño de las tablas, con DDL y
-- bypass de RLS. Eso significa que un bug de inyección o una credencial
-- filtrada puede borrar el schema entero, no solo leer datos.
--
-- Este script crea un rol de runtime que puede leer y escribir los datos
-- pero NO puede crear, alterar ni borrar tablas. Es además el primer paso
-- de la separación admin / tienda: cuando exista `zorvi-backend`, va a
-- tener su propio rol sobre su propio schema y ninguno de los dos va a
-- poder escribir en el del otro.
--
-- ⚠️  IMPORTANTE — por qué hacen falta las policies de abajo
--     `supabase/setup.sql` dejó RLS activo en las 15 tablas SIN policies
--     (default-deny). La app funciona porque `postgres` es dueño de las
--     tablas y los dueños bypassan RLS. Un rol común NO lo bypassa: si
--     solo creás el rol y cambiás la URL, el admin deja de ver un solo
--     dato. Por eso cada tabla recibe acá una policy explícita para
--     `zorvi_app`. Se hace así, y no con ALTER ROLE ... BYPASSRLS, porque
--     BYPASSRLS necesita superusuario y en Supabase puede no estar
--     disponible.
--
-- Idempotente. Volvé a correrlo después de cada `db:push` que agregue
-- tablas nuevas — igual que `setup.sql`.

-- ════════════════════════════════════════════════════════════════════
-- PASO 1 — Reemplazá la contraseña de la línea de abajo
-- ════════════════════════════════════════════════════════════════════
-- Generá una larga y aleatoria (`openssl rand -base64 32`, o 1Password).
-- NO la commitees: va solo en las variables de entorno de Vercel.
-- Después de correr el script, borrá la password de la pestaña del editor.

begin;

-- ── Rol ──────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'zorvi_app') then
    create role zorvi_app login;
  end if;
end $$;

--                                    ↓↓↓ cambiá esto ↓↓↓
alter role zorvi_app with password 'PONE_UNA_PASSWORD_LARGA_ACA';

-- Sin DDL: puede tocar los datos, no la forma de la base.
alter role zorvi_app nosuperuser nocreatedb nocreaterole;

-- ── Permisos sobre los datos ─────────────────────────────────────────
grant usage on schema public to zorvi_app;
grant select, insert, update, delete on all tables    in schema public to zorvi_app;
grant usage, select                 on all sequences in schema public to zorvi_app;

-- Que las tablas que cree un futuro `db:push` hereden lo mismo.
alter default privileges in schema public
  grant select, insert, update, delete on tables    to zorvi_app;
alter default privileges in schema public
  grant usage, select                  on sequences to zorvi_app;

-- ── Policies de RLS ──────────────────────────────────────────────────
-- Una por tabla, en un loop, para que valga también para las tablas que
-- se agreguen más adelante sin tener que editar este archivo.
do $$
declare t record;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format(
      'drop policy if exists %I on public.%I', 'zorvi_app_full_access', t.tablename
    );
    execute format(
      'create policy %I on public.%I for all to zorvi_app using (true) with check (true)',
      'zorvi_app_full_access', t.tablename
    );
  end loop;
end $$;

commit;

-- ════════════════════════════════════════════════════════════════════
-- PASO 2 — Verificá ACÁ, antes de tocar Vercel
-- ════════════════════════════════════════════════════════════════════
-- `set role` cambia el current_user, así que esto prueba de verdad los
-- grants y las policies. Si algo devuelve 0 filas o tira permission
-- denied, NO cambies la URL todavía.
--
--   set role zorvi_app;
--   select count(*) from settings;          -- espera 1
--   select count(*) from products;          -- espera tus productos
--   insert into partner_movements (date, partner_id, type, amount_ars)
--     values ('2026-01-01', 1, 'Aporte', 1);   -- espera INSERT 0 1
--   delete from partner_movements where date = '2026-01-01' and amount_ars = 1;
--   create table prueba_ddl (id int);       -- espera: permission denied  ✅
--   reset role;
--
-- El `create table` TIENE que fallar. Si funciona, el rol quedó con más
-- permisos de los que debería.

-- ════════════════════════════════════════════════════════════════════
-- PASO 3 — Variables de entorno
-- ════════════════════════════════════════════════════════════════════
-- En Vercel quedan DOS urls, y el código ya las distingue:
--
--   DATABASE_URL  → zorvi_app   (la app en runtime, sin DDL)
--   DIRECT_URL    → postgres    (solo para `pnpm db:push`, nunca en la app)
--
-- `drizzle.config.ts` usa getDirectDatabaseUrl(), que prioriza DIRECT_URL;
-- `src/lib/db/pool.ts` usa getDatabaseUrl(), que prioriza DATABASE_URL.
-- No hay que tocar código.
--
-- ⚠️  Con el pooler de Supabase el usuario lleva el ref del proyecto
--     pegado con un punto. La URL queda así:
--
--   postgres://zorvi_app.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
--
--     Si usás el host directo db.<ref>.supabase.co, normalizeDatabaseUrl()
--     lo reescribe al pooler y le agrega el `.<ref>` solo.

-- ════════════════════════════════════════════════════════════════════
-- ROLLBACK — si algo sale mal
-- ════════════════════════════════════════════════════════════════════
-- Volvé DATABASE_URL al usuario `postgres` y la app anda como antes.
-- El rol podés dejarlo; si querés borrarlo del todo:
--
--   begin;
--   do $$ declare t record; begin
--     for t in select tablename from pg_tables where schemaname = 'public' loop
--       execute format('drop policy if exists %I on public.%I',
--                      'zorvi_app_full_access', t.tablename);
--     end loop;
--   end $$;
--   revoke all on all tables    in schema public from zorvi_app;
--   revoke all on all sequences in schema public from zorvi_app;
--   revoke all on schema public from zorvi_app;
--   alter default privileges in schema public revoke all on tables    from zorvi_app;
--   alter default privileges in schema public revoke all on sequences from zorvi_app;
--   drop role zorvi_app;
--   commit;
