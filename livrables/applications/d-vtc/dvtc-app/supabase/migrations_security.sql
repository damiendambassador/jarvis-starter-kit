-- Migration : sécurité (anti-rejeu booking/notify + checklist RLS)
-- À exécuter dans l'éditeur SQL du Dashboard Supabase.
-- IMPORTANT : appliquer la partie 1 AVANT de déployer le nouveau code de booking/notify.

-- ─────────────────────────────────────────────────────────────
-- 1. Idempotence des notifications de réservation
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────
-- 2. Checklist RLS (à VÉRIFIER manuellement, ne pas exécuter à l'aveugle)
--    Les routes serveur utilisent la service_role et contournent la RLS,
--    mais le client public (clé anon) ne doit accéder qu'au strict nécessaire.
-- ─────────────────────────────────────────────────────────────

-- Voir l'état actuel des politiques :
--   SELECT schemaname, tablename, policyname, roles, cmd, qual
--   FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- Vérifier que la RLS est ACTIVÉE sur toutes les tables sensibles :
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('drivers','pricing','clients','reservations',
--                     'unavailabilities','invoices','admin_config');
-- relrowsecurity doit valoir true partout.

-- Points de contrôle attendus (rôle "anon") :
--   admin_config     : AUCUN accès anon (contient le hash admin + les tokens de session). Priorité absolue.
--   invoices         : AUCUN accès anon.
--   clients          : AUCUN accès anon.
--   unavailabilities : pas d'écriture anon (géré par la route authentifiée).
--   reservations     : INSERT via la RPC create_reservation uniquement ; pas de SELECT/UPDATE/DELETE anon arbitraire.
--   drivers, pricing : lecture limitée au nécessaire pour la page publique /r/[slug].

-- Exemple pour COUPER tout accès anon à admin_config si une policy trop large existe :
--   ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
--   -- (ne créer AUCUNE policy pour le rôle anon sur cette table)
