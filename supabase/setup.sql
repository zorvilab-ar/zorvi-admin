-- Corré esto en el SQL Editor de Supabase después del primer `pnpm db:push`.
-- Habilita Realtime para que el admin reciba las compras de la tienda web.

alter publication supabase_realtime add table sales;

alter table sales enable row level security;

drop policy if exists "admins can read sales" on sales;
create policy "admins can read sales"
on sales
for select
to authenticated
using (true);
