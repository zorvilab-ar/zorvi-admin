-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Zorvi Admin — CHECK constraints + índices (§3.1 del ROADMAP)       ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Integridad a nivel motor (la validación zod protege la app; esto protege
-- la DB de cualquier otra vía) + índices para que las consultas no escaneen
-- tabla entera al crecer.
--
-- Add-only e idempotente. Los nombres de constraints/índices coinciden con los
-- que espera Drizzle, así un futuro `pnpm db:push` los ve como ya presentes.
--
-- ⚠️  ANTES DE CORRER: ejecutá el PRE-FLIGHT de abajo. Si devuelve filas, esas
--     violan un CHECK y el ADD fallaría — corregilas primero.

-- ════════════════════════════════════════════════════════════════════
-- PRE-FLIGHT (solo lectura — corré esto primero y revisá que dé 0 filas)
-- ════════════════════════════════════════════════════════════════════
-- select 'settings' t, count(*) from settings where not (fx_rate > 0 and failure_rate between 0 and 1 and default_waste between 0 and 1 and target_margin >= 0 and target_margin < 1 and wholesale_discount between 0 and 1 and iibb_rate between 0 and 1 and other_tax_rate between 0 and 1 and printer_watts >= 0 and kwh_price >= 0 and hours_available >= 0 and hours_productive >= 0 and monotributo_cap >= 0)
-- union all select 'channels', count(*) from channels where not (commission between 0 and 1 and fixed_cost >= 0)
-- union all select 'partner_movements', count(*) from partner_movements where not (type in ('Aporte','Retiro') and amount_ars >= 0)
-- union all select 'assets', count(*) from assets where not (cost_ars >= 0 and useful_life_hours > 0 and residual_ars >= 0)
-- union all select 'fixed_costs', count(*) from fixed_costs where not (monthly_ars >= 0)
-- union all select 'supplies', count(*) from supplies where not (category in ('Filamento','Componente','Packaging','Otro') and pack_qty > 0 and purchase_price >= 0 and initial_stock >= 0 and reorder_point >= 0)
-- union all select 'products', count(*) from products where not (status in ('Activo','En desarrollo','Discontinuado') and print_hours >= 0 and grams >= 0 and assembly_minutes >= 0 and list_price >= 0 and initial_stock >= 0)
-- union all select 'recipe_items', count(*) from recipe_items where not (qty >= 0 and waste_pct >= 0)
-- union all select 'production_runs', count(*) from production_runs where not (units_ok >= 0 and units_failed >= 0 and hours_real >= 0 and grams_real >= 0)
-- union all select 'sales', count(*) from sales where not (status in ('Cobrada','Pendiente') and qty > 0 and unit_price >= 0 and discount >= 0 and shipping >= 0)
-- union all select 'purchases', count(*) from purchases where not (type in ('Insumo','Costo fijo','Activo','Otro') and status in ('Pagada','Pendiente') and qty >= 0 and amount_ars >= 0)
-- union all select 'quotes', count(*) from quotes where not (status in ('Borrador','Enviado','Aceptado','Rechazado'))
-- union all select 'quote_items', count(*) from quote_items where not (qty >= 0 and print_hours >= 0 and grams >= 0 and extra_supplies_ars >= 0)
-- union all select 'filament_rolls', count(*) from filament_rolls where not (initial_grams >= 0 and remaining_grams >= 0 and remaining_grams <= initial_grams and cost_ars >= 0);

-- ════════════════════════════════════════════════════════════════════
-- CHECK constraints
-- ════════════════════════════════════════════════════════════════════
begin;

alter table settings drop constraint if exists settings_fx_rate_pos;
alter table settings add constraint settings_fx_rate_pos check (fx_rate > 0);
alter table settings drop constraint if exists settings_rates_frac;
alter table settings add constraint settings_rates_frac check (
  failure_rate >= 0 and failure_rate <= 1
  and default_waste >= 0 and default_waste <= 1
  and target_margin >= 0 and target_margin < 1
  and wholesale_discount >= 0 and wholesale_discount <= 1
  and iibb_rate >= 0 and iibb_rate <= 1
  and other_tax_rate >= 0 and other_tax_rate <= 1);
alter table settings drop constraint if exists settings_non_negative;
alter table settings add constraint settings_non_negative check (
  printer_watts >= 0 and kwh_price >= 0
  and hours_available >= 0 and hours_productive >= 0 and monotributo_cap >= 0);

alter table channels drop constraint if exists channels_commission_frac;
alter table channels add constraint channels_commission_frac check (commission >= 0 and commission <= 1);
alter table channels drop constraint if exists channels_fixed_cost_non_neg;
alter table channels add constraint channels_fixed_cost_non_neg check (fixed_cost >= 0);

alter table partner_movements drop constraint if exists partner_movements_type_enum;
alter table partner_movements add constraint partner_movements_type_enum check (type in ('Aporte', 'Retiro'));
alter table partner_movements drop constraint if exists partner_movements_amount_non_neg;
alter table partner_movements add constraint partner_movements_amount_non_neg check (amount_ars >= 0);

alter table assets drop constraint if exists assets_non_negative;
alter table assets add constraint assets_non_negative check (cost_ars >= 0 and useful_life_hours > 0 and residual_ars >= 0);

alter table fixed_costs drop constraint if exists fixed_costs_monthly_non_neg;
alter table fixed_costs add constraint fixed_costs_monthly_non_neg check (monthly_ars >= 0);

alter table supplies drop constraint if exists supplies_category_enum;
alter table supplies add constraint supplies_category_enum check (category in ('Filamento', 'Componente', 'Packaging', 'Otro'));
alter table supplies drop constraint if exists supplies_pack_qty_pos;
alter table supplies add constraint supplies_pack_qty_pos check (pack_qty > 0);
alter table supplies drop constraint if exists supplies_non_negative;
alter table supplies add constraint supplies_non_negative check (purchase_price >= 0 and initial_stock >= 0 and reorder_point >= 0);

alter table products drop constraint if exists products_status_enum;
alter table products add constraint products_status_enum check (status in ('Activo', 'En desarrollo', 'Discontinuado'));
alter table products drop constraint if exists products_non_negative;
alter table products add constraint products_non_negative check (
  print_hours >= 0 and grams >= 0 and assembly_minutes >= 0 and list_price >= 0 and initial_stock >= 0);

alter table recipe_items drop constraint if exists recipe_items_non_negative;
alter table recipe_items add constraint recipe_items_non_negative check (qty >= 0 and waste_pct >= 0);

alter table production_runs drop constraint if exists production_runs_non_negative;
alter table production_runs add constraint production_runs_non_negative check (
  units_ok >= 0 and units_failed >= 0 and hours_real >= 0 and grams_real >= 0);

alter table sales drop constraint if exists sales_status_enum;
alter table sales add constraint sales_status_enum check (status in ('Cobrada', 'Pendiente'));
alter table sales drop constraint if exists sales_qty_pos;
alter table sales add constraint sales_qty_pos check (qty > 0);
alter table sales drop constraint if exists sales_non_negative;
alter table sales add constraint sales_non_negative check (unit_price >= 0 and discount >= 0 and shipping >= 0);

alter table purchases drop constraint if exists purchases_type_enum;
alter table purchases add constraint purchases_type_enum check (type in ('Insumo', 'Costo fijo', 'Activo', 'Otro'));
alter table purchases drop constraint if exists purchases_status_enum;
alter table purchases add constraint purchases_status_enum check (status in ('Pagada', 'Pendiente'));
alter table purchases drop constraint if exists purchases_non_negative;
alter table purchases add constraint purchases_non_negative check (qty >= 0 and amount_ars >= 0);

alter table quotes drop constraint if exists quotes_status_enum;
alter table quotes add constraint quotes_status_enum check (status in ('Borrador', 'Enviado', 'Aceptado', 'Rechazado'));

alter table quote_items drop constraint if exists quote_items_non_negative;
alter table quote_items add constraint quote_items_non_negative check (
  qty >= 0 and print_hours >= 0 and grams >= 0 and extra_supplies_ars >= 0);

alter table filament_rolls drop constraint if exists filament_rolls_grams_valid;
alter table filament_rolls add constraint filament_rolls_grams_valid check (
  initial_grams >= 0 and remaining_grams >= 0 and remaining_grams <= initial_grams);
alter table filament_rolls drop constraint if exists filament_rolls_cost_non_neg;
alter table filament_rolls add constraint filament_rolls_cost_non_neg check (cost_ars >= 0);

-- ════════════════════════════════════════════════════════════════════
-- Índices (FKs + columnas de filtro/orden)
-- ════════════════════════════════════════════════════════════════════
create index if not exists partner_movements_partner_idx on partner_movements (partner_id);
create index if not exists partner_movements_date_idx    on partner_movements (date);
create index if not exists recipe_items_product_idx       on recipe_items (product_id);
create index if not exists recipe_items_supply_idx        on recipe_items (supply_id);
create index if not exists production_runs_product_idx     on production_runs (product_id);
create index if not exists production_runs_date_idx        on production_runs (date);
create index if not exists production_runs_filament_idx    on production_runs (filament_supply_id);
create index if not exists sales_date_idx     on sales (date);
create index if not exists sales_channel_idx  on sales (channel_id);
create index if not exists sales_product_idx  on sales (product_id);
create index if not exists purchases_date_idx    on purchases (date);
create index if not exists purchases_supply_idx  on purchases (supply_id);
create index if not exists quote_items_quote_idx  on quote_items (quote_id);
create index if not exists filament_rolls_supply_idx on filament_rolls (supply_id);

commit;
