# Workspace History

> Journal chronologique des sessions et décisions importantes. Le plus récent en haut.
> Mis à jour par Claude via `/update` ou lors d'un changement significatif.
> Les entrées anciennes sont condensées au fil du temps pour rester léger.

---

## 2026-07-01 — Catalogue prospection : références Brugal Visionaria

- Catalogue Edrington 2026 (`carte-prospection/.../lib/constants.ts`) : ajout de « Brugal Visionaria 01 Cacao » et « Brugal Visionaria 03 Coco », renommage « Brugal Visionaria 2 » → « Brugal Visionaria 02 Coffee ». Commit dca5267, déployé (Vercel).
- Rappel : ce catalogue alimente les suggestions du champ Référence ; les valeurs déjà saisies en base (Supabase) ne sont pas renommées rétroactivement.

## 2026-07-01 — Outil budget : refonte des catégories

- Épargne (bucket 20%) séparée des investissements (« Immobilier / parking » + nouvelle « Bourse & actions », hors 50/30/20). Assurance vie = épargne.
- Nouvelle catégorie « Dons & solidarité » ; suppression de « Divers » et des « Virement interne ».
- Nouveau KPI « Épargne placée » (réel vs objectif 20%).
- Bug corrigé : catégories figées dans localStorage → migration versionnée v3 (recharge le référentiel en conservant les transactions). Commits ff474d4 + b97afa1 (local, non déployé).
- Piste notée : diagramme Sankey (comparaison Finary, prévisionnel vs suivi du réel).

## 2026-06-29/30 — D-VTC : compatibilité mobile + passe design

- Dashboard chauffeur rendu responsive (app native <768px : top bar + tab bar en bas ; fix iOS safe-area). Calendrier et factures adaptés en cartes sur mobile.
- Passe design globale sur 4 surfaces (landing, réservation, dashboard, admin), identité navy/or conservée. Commits e1d3f6a, 1919935, a52c419, d6c06cd.
- Bugs d'affichage mobile corrigés : tarification illisible (empilement vertical <1024px), tableaux désalignés (colonnes figées), chevauchements de libellés (`col-span-2` → `col-span-full` sur grille mobile). Commits 2e3578c, cebe328. Typecheck OK, déployé.
- Note : build local échoue sur une route Stripe sans `STRIPE_SECRET_KEY` en `.env.local` (le build Vercel passe).

## 2026-06-27 — Stratégie D-VTC + parking

- **D-VTC cible Modèle A** : chauffeurs établis avec clientèle directe (vendre l'outil). Modèle B (agence apporteuse de clients) écarté. Patrick non activable court terme (attente carte VTC). Guide chauffeur pédagogique créé (HTML + PDF, `livrables/documents/`). Onglet compta repoussé (rétention, pas acquisition).
- **Parking** : diagnostic = problème de conversion, pas de distribution (déjà sur 5 plateformes). Marché local 65-85€ → repricing unique à 79€ CC harmonisé. Annonces refondues (RDC, XXL, sécurisé). Suivi : si 0 contact sous 10 j, descendre à 69€.

## 2026-06-26 — Carte prospection : prod + sécurité

- Déployée en prod sur **edringtonmapofftrade.vercel.app** (~1146 magasins). 5 variables d'env sur Vercel.
- Sécurité Google Maps : clé client restreinte par referrer (Maps JS API), clé serveur restreinte par API (Geocoding + Distance Matrix).
- Correctif import KML mono-couche (enseigne déduite du nom). Nouvelle enseigne Julien de Savignac. Décompte magasins IDF par enseigne établi.
- Titre de poste précisé : **Business Development Executive - Off Trade**.

## 2026-06-25 — Sécurisation D-VTC + routine emails

- **Revue de sécurité D-VTC** : 4 routes utilisaient service_role sans authentifier (IDOR) → helper `lib/actor-auth.ts` (resolveActor JWT chauffeur / token admin), 4 routes sécurisées. Anti-spam réservation (honeypot, idempotence `notified_at`, rate limit). Durcissement Supabase (Security Advisor 17→5). Session tokens admin (plus de mot de passe en localStorage). Commit 25c29e9, déployé. Non fait : « mots de passe compromis » (plan Pro).
- **Système de parrainage D-VTC** (manuel, admin) : colonnes `parraine_par` + `mois_offert_le` créées en base, route `gift-month` (coupon Stripe 100% off), UI admin (bouton « 1 mois offert »).
- **Routine cloud tri emails** créée via /schedule, puis passée en hebdomadaire (dimanche 8h30 Paris, cron `30 6 * * 0`, ID `trig_01KqWj2JyamYFN5piUetqoKk`) : trie les non-lus des 7 derniers jours en 5 catégories, brouillons pour URGENT/À RÉPONDRE, ne supprime/n'envoie jamais rien sauf le récap. Flux d'encaissement Stripe D-VTC opérationnel de bout en bout.

## Historique condensé (14-24 juin 2026)

- **Installation Jarvis** (14 juin).
- **D-VTC développement complet** (18-24 juin) : scaffolding Next.js 14 + Supabase, page réservation + calculateur, dashboard chauffeur, flow Stripe (74€/mois, checkout auto), CGV (11 articles), facturation PDF, déploiement prod d-vtc.fr, notifications temps réel. Activation Patrick (22 juin, fix webhook Stripe + Supabase Auth). Compteur rentabilité X/29 (24 juin). Token GitHub exposé le 24 juin : révoqué, remote nettoyé.
- **Carte prospection Edrington** : première version (23 juin, Next.js + Google Maps + Supabase, import KML, filtres).
- **Copity Beach Club** : site terminé (réservations, menu, planning staff), migré Netlify → Vercel, mot de passe COPITY2026, pitch en cours.
- **Templates Instagram D Embassy** : 3 templates 1080px (Conseil/Question/Concept du jour, HTML + PPTX Canva).
