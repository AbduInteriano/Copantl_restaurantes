-- =============================================================================
-- Copantl Reservaciones — Script completo para Supabase (producción)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
--
-- RE-EJECUTABLE antes de producción: puedes correrlo otra vez en la misma base.
-- Ajusta esquema, políticas, funciones, índices y datos base sin duplicar tablas.
-- No borra reservas ni contenido del panel; solo corrige lo que falte o esté viejo.
--
-- Incluye COMMIT tras ampliar app_role (requerido por PostgreSQL). Ejecuta TODO el archivo
-- de una vez en SQL Editor. Si falla solo el enum, corre el bloque "Enum app_role" y vuelve a correr todo.
--
-- Mesas por restaurante (producción):
--   la_posada = 20 | cbari = 10 | la_churrasqueria = 10
-- (el upsert de restaurant_profiles actualiza table_count en cada ejecución)
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.restaurant_key as enum ('la_churrasqueria', 'la_posada', 'cbari');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.reservation_status as enum ('pendiente', 'confirmada', 'cancelada');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.app_role as enum (
    'super_admin',
    'admin',
    'supervisor',
    'reservaciones',
    'reporteria'
  );
exception when duplicate_object then null;
end $$;

-- Si el enum ya existía solo con admin/supervisor, agrega valores nuevos.
-- PostgreSQL exige COMMIT antes de usar valores recién añadidos al enum (error 55P04).
alter type public.app_role add value if not exists 'super_admin';
alter type public.app_role add value if not exists 'reservaciones';
alter type public.app_role add value if not exists 'reporteria';

commit;

-- -----------------------------------------------------------------------------
-- Tablas
-- -----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id int primary key default 1,
  hero_title text not null default 'Copantl Reservaciones',
  hero_subtitle text not null default 'By Copantl',
  logo_url text,
  logo_url_2 text,
  logo_url_3 text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  whatsapp_url text,
  about_text text not null,
  address text not null,
  phone text not null,
  email text not null,
  opening_hours jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  product_type text not null default 'bebidas',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  brand text,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.event_banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  event_date date,
  reservation_start_time time,
  reservation_end_time time,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.event_banner_restaurants (
  event_id uuid not null references public.event_banners(id) on delete cascade,
  restaurant public.restaurant_key not null,
  primary key (event_id, restaurant)
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_menu_images (
  id uuid primary key default gen_random_uuid(),
  restaurant public.restaurant_key not null,
  image_url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  reservation_date date not null,
  reservation_time time not null,
  guests int not null,
  mesa int,
  area text not null default 'cbari',
  event_id uuid references public.event_banners(id) on delete set null,
  source text not null default 'web',
  notes text,
  status public.reservation_status not null default 'pendiente',
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_profiles (
  restaurant public.restaurant_key primary key,
  reservation_start_time time not null default '13:00',
  reservation_end_time time not null default '22:00',
  display_hours_text text not null default '',
  table_count int not null default 10 check (table_count >= 1 and table_count <= 99),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_login_lockouts (
  email text primary key,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Migraciones re-ejecutables (esquema en bases ya existentes)
-- -----------------------------------------------------------------------------
alter table public.site_settings add column if not exists logo_url text;
alter table public.site_settings add column if not exists logo_url_2 text;
alter table public.site_settings add column if not exists logo_url_3 text;
alter table public.site_settings add column if not exists instagram_url text;
alter table public.site_settings add column if not exists facebook_url text;
alter table public.site_settings add column if not exists tiktok_url text;
alter table public.site_settings add column if not exists whatsapp_url text;

alter table public.event_banners alter column title drop not null;
alter table public.event_banners add column if not exists event_date date;
alter table public.event_banners add column if not exists reservation_start_time time;
alter table public.event_banners add column if not exists reservation_end_time time;

alter table public.gallery_items alter column title drop not null;
alter table public.reservations drop column if exists selected_product;
alter table public.reservations add column if not exists mesa int;
alter table public.reservations add column if not exists source text not null default 'web';
alter table public.reservations add column if not exists area text;
alter table public.reservations add column if not exists event_id uuid references public.event_banners(id) on delete set null;

update public.reservations set area = 'cbari' where area is null or area in ('climatizado', 'terraza');
alter table public.reservations alter column area set default 'cbari';
alter table public.reservations alter column area set not null;

alter table public.menu_categories add column if not exists product_type text not null default 'bebidas';
alter table public.menu_items add column if not exists brand text;

do $$
begin
  alter table public.menu_categories
    add constraint menu_categories_product_type_check
    check (product_type in ('bebidas', 'tabaco'));
exception when duplicate_object then null;
end $$;

alter table public.reservations drop constraint if exists reservations_guests_check;
alter table public.reservations add constraint reservations_guests_check check (guests >= 1 and guests <= 20);

-- restaurant_profiles: columnas y mesas configurables por restaurante
alter table public.restaurant_profiles add column if not exists display_hours_text text not null default '';
alter table public.restaurant_profiles add column if not exists updated_at timestamptz not null default now();
alter table public.restaurant_profiles add column if not exists table_count int;

update public.restaurant_profiles
set table_count = 10
where table_count is null or table_count < 1 or table_count > 99;

alter table public.restaurant_profiles alter column table_count set default 10;
alter table public.restaurant_profiles alter column table_count set not null;

alter table public.restaurant_profiles drop constraint if exists restaurant_profiles_table_count_check;
alter table public.restaurant_profiles add constraint restaurant_profiles_table_count_check
  check (table_count >= 1 and table_count <= 99);

-- Quitar tope fijo de mesa 1–10 (ahora depende de table_count por restaurante)
alter table public.reservations drop constraint if exists reservations_mesa_range;
alter table public.reservations add constraint reservations_mesa_range check (mesa is null or mesa >= 1);

alter table public.reservations drop constraint if exists reservations_source_check;
alter table public.reservations add constraint reservations_source_check check (source in ('web', 'manual'));

alter table public.reservations drop constraint if exists reservations_area_check;
alter table public.reservations add constraint reservations_area_check
  check (area in ('cbari', 'la_posada', 'la_churrasqueria'));

alter table public.admin_login_lockouts drop constraint if exists admin_login_lockouts_failed_attempts_check;
alter table public.admin_login_lockouts add constraint admin_login_lockouts_failed_attempts_check
  check (failed_attempts >= 0);

create unique index if not exists menu_categories_name_product_type_uidx
  on public.menu_categories (name, product_type);

-- Índice de mesa ocupada: por restaurante (area) + fecha + hora + mesa
drop index if exists public.reservations_confirmada_mesa_slot_uidx;
create unique index reservations_confirmada_mesa_slot_uidx
  on public.reservations (reservation_date, reservation_time, area, mesa)
  where status = 'confirmada' and mesa is not null;

-- -----------------------------------------------------------------------------
-- Funciones de roles (antes de políticas RLS)
-- -----------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.app_role;
  uemail text;
begin
  if auth.uid() is null then
    return null;
  end if;
  select email into uemail from auth.users where id = auth.uid();
  if lower(coalesce(uemail, '')) = 'abdu.interiano@copantl.com' then
    return 'super_admin'::public.app_role;
  end if;
  select role into r from public.user_profiles where user_id = auth.uid();
  if r is null then
    return 'admin'::public.app_role;
  end if;
  return r;
end;
$$;

create or replace function public.is_app_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.app_role;
begin
  r := public.current_app_role();
  if r is null then
    return false;
  end if;
  return r in (
    'super_admin'::public.app_role,
    'admin'::public.app_role,
    'supervisor'::public.app_role
  );
end;
$$;

create or replace function public.can_staff_reservations()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.app_role;
begin
  r := public.current_app_role();
  if r is null then
    return false;
  end if;
  return r in (
    'super_admin'::public.app_role,
    'admin'::public.app_role,
    'reservaciones'::public.app_role
  );
end;
$$;

create or replace function public.can_access_reports()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.app_role;
begin
  r := public.current_app_role();
  if r is null then
    return false;
  end if;
  return r in (
    'super_admin'::public.app_role,
    'admin'::public.app_role,
    'supervisor'::public.app_role,
    'reporteria'::public.app_role
  );
end;
$$;

grant execute on function public.current_app_role() to authenticated, anon;
grant execute on function public.is_app_admin() to authenticated, anon;
grant execute on function public.can_staff_reservations() to authenticated, anon;
grant execute on function public.can_access_reports() to authenticated, anon;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.site_settings enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.promotions enable row level security;
alter table public.event_banners enable row level security;
alter table public.event_banner_restaurants enable row level security;
alter table public.gallery_items enable row level security;
alter table public.restaurant_menu_images enable row level security;
alter table public.reservations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.restaurant_profiles enable row level security;
alter table public.admin_login_lockouts enable row level security;

-- Lectura pública
drop policy if exists "Public read site settings" on public.site_settings;
create policy "Public read site settings" on public.site_settings for select using (true);

drop policy if exists "Public read categories" on public.menu_categories;
create policy "Public read categories" on public.menu_categories for select using (is_active = true);

drop policy if exists "Public read items" on public.menu_items;
create policy "Public read items" on public.menu_items for select using (is_active = true);

drop policy if exists "Public read promotions" on public.promotions;
create policy "Public read promotions" on public.promotions for select using (is_active = true);

drop policy if exists "Public read event banners" on public.event_banners;
create policy "Public read event banners" on public.event_banners for select using (is_active = true);

drop policy if exists "Public read event restaurants" on public.event_banner_restaurants;
create policy "Public read event restaurants" on public.event_banner_restaurants for select using (true);

drop policy if exists "Public read gallery" on public.gallery_items;
create policy "Public read gallery" on public.gallery_items for select using (is_active = true);

drop policy if exists "Public read restaurant menus" on public.restaurant_menu_images;
create policy "Public read restaurant menus" on public.restaurant_menu_images for select using (is_active = true);

drop policy if exists "Public read restaurant profiles" on public.restaurant_profiles;
create policy "Public read restaurant profiles" on public.restaurant_profiles for select using (true);

drop policy if exists "Public create reservations" on public.reservations;
create policy "Public create reservations" on public.reservations for insert with check (true);

-- Admin / contenido
drop policy if exists "Admin manage settings" on public.site_settings;
create policy "Admin manage settings" on public.site_settings
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin manage categories" on public.menu_categories;
create policy "Admin manage categories" on public.menu_categories
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin manage items" on public.menu_items;
create policy "Admin manage items" on public.menu_items
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin manage promotions" on public.promotions;
create policy "Admin manage promotions" on public.promotions
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin manage event banners" on public.event_banners;
create policy "Admin manage event banners" on public.event_banners
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin manage event restaurants" on public.event_banner_restaurants;
create policy "Admin manage event restaurants" on public.event_banner_restaurants
  for all using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin manage gallery" on public.gallery_items;
create policy "Admin manage gallery" on public.gallery_items
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin manage restaurant menus" on public.restaurant_menu_images;
create policy "Admin manage restaurant menus" on public.restaurant_menu_images
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin manage restaurant profiles" on public.restaurant_profiles;
create policy "Admin manage restaurant profiles" on public.restaurant_profiles
  for all using (public.is_app_admin()) with check (public.is_app_admin());

-- Reservas (staff)
drop policy if exists "Staff manage reservations" on public.reservations;
create policy "Staff manage reservations" on public.reservations
  for all to authenticated using (public.can_staff_reservations()) with check (public.can_staff_reservations());

drop policy if exists "Staff read reservations for reports" on public.reservations;
create policy "Staff read reservations for reports" on public.reservations
  for select to authenticated using (public.can_access_reports());

-- Perfiles de usuario
drop policy if exists "user_profiles_select" on public.user_profiles;
create policy "user_profiles_select" on public.user_profiles for select to authenticated
  using (auth.uid() = user_id or public.is_app_admin());

-- Bloqueos de login (solo service role desde la API)
drop policy if exists "Service role lockouts" on public.admin_login_lockouts;
create policy "Service role lockouts" on public.admin_login_lockouts
  for all using (false) with check (false);

-- -----------------------------------------------------------------------------
-- Datos iniciales
-- -----------------------------------------------------------------------------
insert into public.site_settings (id, hero_title, hero_subtitle, about_text, address, phone, email, opening_hours)
values (
  1,
  'Copantl Reservaciones',
  'By Copantl',
  'Reserva tu mesa en los restaurantes del Hotel Copantl. Experiencia gastronomica premium en San Pedro Sula.',
  'Hotel Copantl, San Pedro Sula, Honduras',
  '+504 0000-0000',
  'reservas@copantl.com',
  '[{"day":"Lunes a Jueves","hours":"5:00 PM - 12:00 AM"},{"day":"Viernes y Sabado","hours":"5:00 PM - 2:00 AM"},{"day":"Domingo","hours":"Cerrado"}]'::jsonb
)
on conflict (id) do nothing;

-- Perfiles de restaurante + mesas de producción (re-ejecutar actualiza table_count)
insert into public.restaurant_profiles (
  restaurant,
  reservation_start_time,
  reservation_end_time,
  display_hours_text,
  table_count
)
values
  ('cbari', '13:00', '22:00', '', 10),
  ('la_posada', '13:00', '22:00', '', 20),
  ('la_churrasqueria', '13:00', '22:00', '', 10)
on conflict (restaurant) do update set
  table_count = excluded.table_count,
  reservation_start_time = coalesce(
    public.restaurant_profiles.reservation_start_time,
    excluded.reservation_start_time
  ),
  reservation_end_time = coalesce(
    public.restaurant_profiles.reservation_end_time,
    excluded.reservation_end_time
  ),
  display_hours_text = coalesce(
    nullif(trim(public.restaurant_profiles.display_hours_text), ''),
    excluded.display_hours_text
  ),
  updated_at = now();

insert into public.menu_categories (name, product_type, sort_order)
values
  ('Vino', 'bebidas', 1),
  ('Ron', 'bebidas', 2),
  ('Whisky', 'bebidas', 3),
  ('Ginebra', 'bebidas', 4),
  ('Tequila', 'bebidas', 5),
  ('Cocteles', 'bebidas', 6)
on conflict (name, product_type) do nothing;

-- Perfiles: usuarios auth existentes → admin por defecto
insert into public.user_profiles (user_id, role)
select id, 'admin'::public.app_role from auth.users
on conflict (user_id) do nothing;

-- Super admin fijo
insert into public.user_profiles (user_id, role)
select id, 'super_admin'::public.app_role
from auth.users
where lower(email) = 'abdu.interiano@copantl.com'
on conflict (user_id) do update set role = excluded.role;

-- -----------------------------------------------------------------------------
-- Storage (imágenes: menús, eventos, galería, logos)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'copantl_assets',
  'copantl_assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read copantl assets" on storage.objects;
create policy "Public can read copantl assets"
  on storage.objects for select using (bucket_id = 'copantl_assets');

drop policy if exists "Admin can upload copantl assets" on storage.objects;
create policy "Admin can upload copantl assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'copantl_assets' and public.is_app_admin());

drop policy if exists "Admin can update copantl assets" on storage.objects;
create policy "Admin can update copantl assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'copantl_assets' and public.is_app_admin());

drop policy if exists "Admin can delete copantl assets" on storage.objects;
create policy "Admin can delete copantl assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'copantl_assets' and public.is_app_admin());

-- -----------------------------------------------------------------------------
-- Realtime (notificaciones de nuevas reservas en el panel)
-- Ejecutar aparte si falla: ya puede estar agregada.
-- -----------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.reservations;
exception
  when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Verificación post-deploy (revisa la pestaña Results)
-- -----------------------------------------------------------------------------
select
  restaurant,
  table_count as mesas,
  reservation_start_time::text as inicio_reservas,
  reservation_end_time::text as fin_reservas
from public.restaurant_profiles
order by restaurant;

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and indexname = 'reservations_confirmada_mesa_slot_uidx';

-- =============================================================================
-- FIN — Checklist manual después del SQL:
-- 1. Auth: usuarios del panel creados en Supabase Authentication
-- 2. .env producción: NEXT_PUBLIC_SUPABASE_*, NEXT_PUBLIC_SITE_URL,
--    NEXT_PUBLIC_ADMIN_PANEL_SLUG, EmailJS (opcional)
-- 3. Storage: bucket copantl_assets con políticas (este script las aplica)
-- 4. Realtime: si el bloque DO falló, agrega public.reservations en Publications
-- 5. Panel → Horario de reservaciones: confirma mesas 20 / 10 / 10
-- =============================================================================
