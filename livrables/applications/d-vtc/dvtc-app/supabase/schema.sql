-- ============================================================
-- D-VTC Platform — Schéma Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE : drivers
-- ============================================================
create table if not exists public.drivers (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  phone       text,
  vehicle_model    text,
  vehicle_plate    text,
  vehicle_capacity int default 4,
  slug        text not null unique, -- ex: "patrick-vtc"
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLE : pricing
-- ============================================================
create table if not exists public.pricing (
  id                  uuid primary key default uuid_generate_v4(),
  driver_id           uuid references public.drivers(id) on delete cascade not null,
  base_fare           numeric(10,2) default 5.00,
  price_per_km        numeric(10,2) default 1.66,
  night_surcharge     numeric(4,2) default 0.30,  -- 30%
  dispo_2h            numeric(10,2) default 70.00,
  dispo_day           numeric(10,2) default 250.00,
  km_included_dispo   int default 80,
  loyalty_threshold   int default 5,              -- 5ème course
  loyalty_discount    numeric(4,2) default 0.10,  -- 10%
  updated_at          timestamptz default now(),
  unique(driver_id)
);

-- ============================================================
-- TABLE : clients
-- ============================================================
create table if not exists public.clients (
  id          uuid primary key default uuid_generate_v4(),
  driver_id   uuid references public.drivers(id) on delete cascade not null,
  name        text not null,
  phone       text,
  email       text,
  total_rides int default 0,
  is_loyal    boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLE : reservations
-- ============================================================
create table if not exists public.reservations (
  id                uuid primary key default uuid_generate_v4(),
  driver_id         uuid references public.drivers(id) on delete cascade not null,
  client_id         uuid references public.clients(id) on delete set null,
  client_name       text not null,
  client_phone      text not null,
  client_email      text not null,
  ride_type         text not null check (ride_type in ('standard', 'dispo')),
  pickup_address    text not null,
  dropoff_address   text,              -- null si ride_type = 'dispo'
  distance_km       numeric(8,2),
  scheduled_at      timestamptz not null,
  passengers        int default 1,
  notes             text,
  status            text default 'pending' check (status in ('pending', 'accepted', 'refused', 'completed')),
  price_estimate    numeric(10,2),
  applied_discount  boolean default false,
  created_at        timestamptz default now()
);

-- ============================================================
-- SÉCURITÉ : Row Level Security (RLS)
-- ============================================================

alter table public.drivers enable row level security;
alter table public.pricing enable row level security;
alter table public.clients enable row level security;
alter table public.reservations enable row level security;

-- Chauffeurs : chaque conducteur voit uniquement ses propres données
create policy "Driver sees own profile"
  on public.drivers for select
  using (auth.uid() = user_id);

create policy "Driver updates own profile"
  on public.drivers for update
  using (auth.uid() = user_id);

-- Pricing : le chauffeur gère sa propre tarification
create policy "Driver manages own pricing"
  on public.pricing for all
  using (driver_id in (select id from public.drivers where user_id = auth.uid()));

-- Clients : le chauffeur voit ses clients
create policy "Driver sees own clients"
  on public.clients for select
  using (driver_id in (select id from public.drivers where user_id = auth.uid()));

-- Réservations : le chauffeur voit et gère ses réservations
create policy "Driver sees own reservations"
  on public.reservations for select
  using (driver_id in (select id from public.drivers where user_id = auth.uid()));

create policy "Driver updates own reservations"
  on public.reservations for update
  using (driver_id in (select id from public.drivers where user_id = auth.uid()));

-- Accès public : insertion de réservations (le client réserve sans compte)
create policy "Public can insert reservations"
  on public.reservations for insert
  with check (true);

-- Accès public : lecture du chauffeur via son slug (pour la page de réservation)
create policy "Public can read active drivers by slug"
  on public.drivers for select
  using (is_active = true);

create policy "Public can read driver pricing"
  on public.pricing for select
  using (true);

-- ============================================================
-- FONCTION : incrémenter le compteur de courses d'un client
-- ============================================================
create or replace function public.increment_client_rides(p_client_id uuid)
returns void as $$
begin
  update public.clients
  set
    total_rides = total_rides + 1,
    is_loyal = (total_rides + 1) >= (
      select loyalty_threshold from public.pricing
      where driver_id = (select driver_id from public.clients where id = p_client_id)
    )
  where id = p_client_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- DONNÉES D'EXEMPLE : Chauffeur Patrick VTC
-- (À exécuter manuellement après avoir créé le compte Auth)
-- ============================================================

-- insert into public.drivers (name, email, phone, vehicle_model, vehicle_plate, slug, user_id)
-- values ('Patrick VTC', 'patrick@exemple.fr', '06 XX XX XX XX', 'Mercedes Classe E', 'XX-000-XX', 'patrick-vtc', 'UUID_DU_COMPTE_AUTH');

-- insert into public.pricing (driver_id)
-- values ((select id from public.drivers where slug = 'patrick-vtc'));
