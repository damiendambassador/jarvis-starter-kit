-- Migration : configuration horaires de nuit par chauffeur
-- À exécuter dans l'éditeur SQL Supabase Dashboard

ALTER TABLE public.pricing
  ADD COLUMN IF NOT EXISTS night_surcharge_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS night_start_hour INT DEFAULT 20,
  ADD COLUMN IF NOT EXISTS night_end_hour INT DEFAULT 8;
