create extension if not exists "pgcrypto";

create table if not exists public.site_settings (
  id int primary key default 1,
  hero_title text not null default 'CAVA',
  hero_subtitle text not null default 'Drinks Experience',
  logo_url text,
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

alter table public.site_settings add column if not exists logo_url text;
alter table public.site_settings add column if not exists instagram_url text;
alter table public.site_settings add column if not exists facebook_url text;
alter table public.site_settings add column if not exists tiktok_url text;
alter table public.site_settings add column if not exists whatsapp_url text;

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

alter table public.menu_categories add column if not exists product_type text not null default 'bebidas';
alter table public.menu_items add column if not exists brand text;
do $$
begin
  alter table public.menu_categories
    add constraint menu_categories_product_type_check
    check (product_type in ('bebidas', 'tabaco'));
exception
  when duplicate_object then null;
end $$;
create unique index if not exists menu_categories_name_product_type_uidx on public.menu_categories (name, product_type);

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
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.event_banners alter column title drop not null;

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
begin
  create type reservation_status as enum ('pendiente', 'confirmada', 'cancelada');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  reservation_date date not null,
  reservation_time time not null,
  guests int not null check (guests >= 1 and guests <= 20),
  mesa int,
  source text not null default 'web' check (source in ('web', 'manual')),
  notes text,
  status reservation_status not null default 'pendiente',
  created_at timestamptz not null default now(),
  constraint reservations_mesa_range check (mesa is null or (mesa >= 1 and mesa <= 10))
);

alter table public.gallery_items alter column title drop not null;
alter table public.reservations drop column if exists selected_product;

alter table public.reservations add column if not exists mesa int;
alter table public.reservations add column if not exists source text not null default 'web';

alter table public.reservations drop constraint if exists reservations_guests_check;
alter table public.reservations add constraint reservations_guests_check check (guests >= 1 and guests <= 20);

do $$
begin
  alter table public.reservations add constraint reservations_mesa_range check (mesa is null or (mesa >= 1 and mesa <= 10));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.reservations add constraint reservations_source_check check (source in ('web', 'manual'));
exception
  when duplicate_object then null;
end $$;

create unique index if not exists reservations_confirmada_mesa_slot_uidx
on public.reservations (reservation_date, reservation_time, mesa)
where status = 'confirmada' and mesa is not null;

-- Perfiles de panel: administrador (todo) vs supervisor (solo reservas)
do $$ begin
  create type public.app_role as enum ('admin', 'supervisor');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);

insert into public.user_profiles (user_id, role)
select id, 'admin'::public.app_role from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_app_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  if not exists (select 1 from public.user_profiles where user_id = auth.uid()) then
    return true;
  end if;
  return exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and role = 'admin'::public.app_role
  );
end;
$$;

grant execute on function public.is_app_admin() to authenticated, anon;

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select" on public.user_profiles;
create policy "user_profiles_select"
on public.user_profiles for select
to authenticated
using (auth.uid() = user_id or public.is_app_admin());

alter table public.site_settings enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.promotions enable row level security;
alter table public.event_banners enable row level security;
alter table public.gallery_items enable row level security;
alter table public.reservations enable row level security;

drop policy if exists "Public read categories" on public.menu_categories;
create policy "Public read categories" on public.menu_categories for select using (is_active = true);

drop policy if exists "Public read items" on public.menu_items;
create policy "Public read items" on public.menu_items for select using (is_active = true);

drop policy if exists "Public read promotions" on public.promotions;
create policy "Public read promotions" on public.promotions for select using (is_active = true);

drop policy if exists "Public read gallery" on public.gallery_items;
create policy "Public read gallery" on public.gallery_items for select using (is_active = true);

drop policy if exists "Public read event banners" on public.event_banners;
create policy "Public read event banners" on public.event_banners for select using (is_active = true);

drop policy if exists "Public read site settings" on public.site_settings;
create policy "Public read site settings" on public.site_settings for select using (true);

drop policy if exists "Public create reservations" on public.reservations;
create policy "Public create reservations" on public.reservations for insert with check (true);

drop policy if exists "Admin full access categories" on public.menu_categories;
drop policy if exists "Admin manage categories" on public.menu_categories;
create policy "Admin manage categories" on public.menu_categories
for all to authenticated
using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin full access items" on public.menu_items;
drop policy if exists "Admin manage items" on public.menu_items;
create policy "Admin manage items" on public.menu_items
for all to authenticated
using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin full access promotions" on public.promotions;
drop policy if exists "Admin manage promotions" on public.promotions;
create policy "Admin manage promotions" on public.promotions
for all to authenticated
using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin full access event banners" on public.event_banners;
drop policy if exists "Admin manage event banners" on public.event_banners;
create policy "Admin manage event banners" on public.event_banners
for all to authenticated
using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin full access gallery" on public.gallery_items;
drop policy if exists "Admin manage gallery" on public.gallery_items;
create policy "Admin manage gallery" on public.gallery_items
for all to authenticated
using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Admin full access reservations" on public.reservations;
drop policy if exists "Staff manage reservations" on public.reservations;
create policy "Staff manage reservations" on public.reservations
for all to authenticated
using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Admin full access settings" on public.site_settings;
drop policy if exists "Admin manage settings" on public.site_settings;
create policy "Admin manage settings" on public.site_settings
for all to authenticated
using (public.is_app_admin()) with check (public.is_app_admin());

insert into public.site_settings (id, hero_title, hero_subtitle, about_text, address, phone, email, opening_hours)
values (
  1,
  'CAVA',
  'Drinks Experience',
  'Un refugio sofisticado para amantes del vino, destilados y tabaco premium en San Pedro Sula.',
  'Plaza Las Terrazas, Local #201, 5 Calle, 21 Avenida, San Pedro Sula, Honduras',
  '+504 0000-0000',
  'reservas@cavahn.com',
  '[{"day":"Lunes a Jueves","hours":"5:00 PM - 12:00 AM"},{"day":"Viernes y Sabado","hours":"5:00 PM - 2:00 AM"},{"day":"Domingo","hours":"Cerrado"}]'::jsonb
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('cava-assets', 'cava-assets', true)
on conflict (id) do nothing;

insert into public.menu_categories (name, product_type, sort_order)
values
  ('Vino', 'bebidas', 1),
  ('Ron', 'bebidas', 2),
  ('Whisky', 'bebidas', 3),
  ('Ginebra', 'bebidas', 4),
  ('Tequila', 'bebidas', 5),
  ('Cocteles', 'bebidas', 6)
on conflict (name, product_type) do nothing;

drop policy if exists "Public can read cava assets" on storage.objects;
create policy "Public can read cava assets"
on storage.objects for select
using (bucket_id = 'cava-assets');

drop policy if exists "Authenticated can upload cava assets" on storage.objects;
drop policy if exists "Admin can upload cava assets" on storage.objects;
create policy "Admin can upload cava assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'cava-assets' and public.is_app_admin());

drop policy if exists "Admin can update cava assets" on storage.objects;
create policy "Admin can update cava assets"
on storage.objects for update
to authenticated
using (bucket_id = 'cava-assets' and public.is_app_admin());

drop policy if exists "Admin can delete cava assets" on storage.objects;
create policy "Admin can delete cava assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'cava-assets' and public.is_app_admin());

-- Reservas: area (Climatizado / Terraza) y hasta 20 personas (BD existente: ejecutar en Supabase SQL)
alter table public.reservations add column if not exists area text;
update public.reservations set area = 'climatizado' where area is null;
alter table public.reservations alter column area set default 'climatizado';
alter table public.reservations alter column area set not null;

do $$
begin
  alter table public.reservations add constraint reservations_area_check check (area in ('climatizado', 'terraza'));
exception
  when duplicate_object then null;
end $$;

alter table public.reservations drop constraint if exists reservations_guests_check;
alter table public.reservations add constraint reservations_guests_check check (guests >= 1 and guests <= 20);
