-- ════════════════════════════════════════════════════════════
--  Carte de prospection — schéma Supabase
--  À exécuter dans : Supabase → SQL Editor → New query → Run
-- ════════════════════════════════════════════════════════════

-- Extension pour gen_random_uuid()
create extension if not exists "pgcrypto";

-- ── Table magasins ──────────────────────────────────────────
create table if not exists public.stores (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  chain        text not null,
  name         text,
  address      text,
  city         text,
  postal_code  text,
  lat          double precision not null,
  lng          double precision not null,
  status       text not null default 'À prospecter',
  contact_name text,
  phone        text,
  email        text,
  last_visit   date,
  notes        text
);

-- ── Table placements (marque + référence par magasin) ───────
create table if not exists public.placements (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores(id) on delete cascade,
  brand      text not null,
  reference  text,
  status     text not null default 'Présent',
  -- référence gagnée par le commercial (= "nouvelle DN"), distincte d'un produit déjà présent
  is_new_dn  boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists placements_store_id_idx on public.placements(store_id);
create index if not exists stores_chain_idx on public.stores(chain);

-- ── updated_at automatique ──────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stores_touch_updated_at on public.stores;
create trigger stores_touch_updated_at
  before update on public.stores
  for each row execute function public.touch_updated_at();

-- ── Row Level Security ──────────────────────────────────────
-- App privée mono-utilisateur : tout utilisateur authentifié a accès complet.
alter table public.stores     enable row level security;
alter table public.placements enable row level security;

drop policy if exists "auth full access stores" on public.stores;
create policy "auth full access stores" on public.stores
  for all to authenticated using (true) with check (true);

drop policy if exists "auth full access placements" on public.placements;
create policy "auth full access placements" on public.placements
  for all to authenticated using (true) with check (true);

-- ════════════════════════════════════════════════════════════
--  Après exécution : créer le compte utilisateur unique dans
--  Authentication → Users → Add user (email + mot de passe).
-- ════════════════════════════════════════════════════════════
