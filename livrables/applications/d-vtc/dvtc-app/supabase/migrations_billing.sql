-- ============================================================
-- D-VTC — Migration Facturation & Stripe
-- À exécuter dans l'éditeur SQL Supabase (une seule fois)
-- ============================================================

-- 1. Colonnes Stripe sur la table drivers
alter table public.drivers
  add column if not exists stripe_customer_id     text unique,
  add column if not exists stripe_subscription_id  text unique,
  add column if not exists subscription_status     text default 'pending'
    check (subscription_status in ('pending','trialing','active','past_due','cancelled','paused')),
  add column if not exists cgv_accepted_at         timestamptz,
  add column if not exists subscription_start_at   timestamptz;

-- 2. Table invoices
create table if not exists public.invoices (
  id                uuid primary key default uuid_generate_v4(),
  driver_id         uuid references public.drivers(id) on delete cascade not null,
  stripe_invoice_id text unique,
  invoice_number    text not null unique,
  amount_cents      int not null,
  currency          text default 'eur',
  status            text default 'draft'
    check (status in ('draft','pending','paid','failed','void')),
  period_start      date,
  period_end        date,
  pdf_storage_path  text,
  paid_at           timestamptz,
  due_date          date,
  created_at        timestamptz default now()
);

alter table public.invoices enable row level security;

create policy "Driver sees own invoices"
  on public.invoices for select
  using (driver_id in (select id from public.drivers where user_id = auth.uid()));

-- 3. Fonction numérotation séquentielle des factures
create or replace function public.next_invoice_number()
returns text as $$
declare
  year_str  text := to_char(now(), 'YYYY');
  count_val int;
begin
  select count(*) into count_val
  from public.invoices
  where invoice_number like 'DVTC-' || year_str || '-%';
  return 'DVTC-' || year_str || '-' || lpad((count_val + 1)::text, 3, '0');
end;
$$ language plpgsql security definer;
