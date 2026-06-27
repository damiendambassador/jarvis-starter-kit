# Workspace History

> Journal chronologique de toutes les sessions et décisions importantes.
> Le plus récent en haut. Mis à jour automatiquement par Claude.
>
> **Comment ça marche :** Quand je lance la commande `/update` après une session importante, ou quand je raconte un changement significatif, Claude ajoute une entrée ici automatiquement. Je n'ai pas à écrire ce fichier manuellement.

---

## 2026-06-27

### Stratégie D-VTC : cible chauffeurs établis (Modèle A) + guide chauffeur
- Patrick non activable à court terme (attente de sa carte VTC, pas de clientèle directe, actif sur Citygo). Ses contacts sont dans la même situation d'attente.
- Décision stratégique : cibler les chauffeurs VTC déjà établis disposant d'une clientèle directe (Modèle A, vendre l'outil). Modèle B (devenir une agence qui apporte les clients) écarté.
- Guide chauffeur pédagogique créé (HTML + PDF) dans `livrables/documents/` pour faciliter la prise en main de l'application.
- Onglet comptabilité repoussé : c'est un outil de rétention, pas d'acquisition, prématuré à ce stade.

### Déblocage de la location du parking (Villeneuve-le-Roi)
- Actif : place n°43, résidence neuve "Les Rives du Roi", 94290 Villeneuve-le-Roi, acquise 02/2026 (M & S Développement Immobilier). Coût récurrent ~160€/an (taxe foncière + charges de copropriété).
- Diagnostic corrigé : pas un problème de distribution (déjà présent sur 5 plateformes : LeBonCoin, SeLoger, MonsieurParking, PrendsMaPlace, Facebook Marketplace) mais de conversion. Beaucoup de vues, zéro contact = prix hors marché.
- Marché local relevé : 65-85€ pour une place (plafond 100€). Prix affichés incohérents (90-115€ selon plateforme). Repricing à un prix unique de 79€ CC, harmonisé partout.
- Annonces refondues : titre sans "PMR", texte optimisé (RDC, XXL, sécurisé), dépôt de garantie 1 mois conservé.
- À corriger : surface SeLoger affichée 7 m² au lieu de 16,5 m² (contredit l'argument XXL). Suivi : si 0 contact à 79€ sous 10 jours, descendre à 69€ et revoir les photos.

---

## 2026-06-26

### Carte de prospection — correctif import KML, nouvelle enseigne, analyse IDF
- Correctif KML (commit 6e98776) : un KML sans calque `<Folder>` (ex. My Maps mono-couche) laissait l'enseigne à null → tout atterrissait en "Autre". L'enseigne est désormais déduite du nom du magasin à défaut de calque (`chainFromText(p.chain ?? p.name)`).
- Nouvelle enseigne **Julien de Savignac** ajoutée (commit 94378fb) : couleur ambre `#B45309`, code JS, détection "savignac". Liste d'import de 11 magasins créée dans `imports/10-julien-de-savignac.tsv` (commit 87fcb90).
- Import La Vignery réglé : 23 magasins (KML) initialement classés en "Autre" (46 doublons après 2 tentatives), nettoyés via SQL (`DELETE FROM stores WHERE chain='Autre' AND name ILIKE '%vignery%'`) puis réimportés proprement.
- **Décompte magasins par enseigne en IDF** (départements 75/77/78/91/92/93/94/95, à partir des codes postaux des fichiers `imports/*.tsv`) : Nicolas 296, Repaire de Bacchus 33, Nysa 31, V&B 12, La Vignery 16 (calculé sur les villes, pas de CP en KML), Intercaves 13, Julien de Savignac 6, Cavavin 27, Comptoir des Vignes 2, Comptoir Irlandais 0. Note : V&B = 12 en IDF stricte (Vernon-27 et le sud Oise-60 sont hors IDF même s'ils apparaissent proches sur la carte).

### Nouveau poste : Business Development Executive - Off Trade
- Précision du poste chez Edrington : le titre exact est désormais **Business Development Executive - Off Trade** (focus circuit off-trade / cavistes). `CONTEXT.md` mis à jour.

### Carte de prospection Edrington — déploiement production + sécurité Google Maps
- App déployée en prod sur **edringtonmapofftrade.vercel.app** (projet Vercel "Edrington - Map Off Trade", root directory `livrables/applications/carte-prospection/prospection-app` du monorepo jarvis-starter-kit, même repo que D-VTC). ~1146 magasins affichés.
- 5 variables d'env reportées sur Vercel (Supabase URL + anon, Google client + Map ID + server). `SUPABASE_SERVICE_ROLE_KEY` inutilisée donc omise.
- Sécurisation Google Maps (la même clé servait au client ET au serveur) : création d'une 2e clé. Clé client "Edrington Client (web)" restreinte par referrer (`edringtonmapofftrade.vercel.app/*` + `localhost:3000/*`) et limitée à Maps JavaScript API. Ancienne clé "Edrington Projet" conservée en clé serveur, restrictions applications = Aucune, API limitées à Geocoding + Distance Matrix. Géocodage serveur testé OK (collage d'un magasin La Vignery près de Melun).

### D-VTC — Colonnes SQL parrainage créées
- Les 2 colonnes `parraine_par TEXT` et `mois_offert_le TIMESTAMPTZ` ont été créées dans Supabase (table `drivers`). Le système de parrainage (bouton "1 mois offert" dans l'onglet Facturation) est désormais pleinement opérationnel.

### D-VTC — Système de parrainage (manuel, admin)
- Deux nouvelles colonnes SQL à créer dans Supabase sur la table `drivers` : `parraine_par TEXT` (slug du parrain) et `mois_offert_le TIMESTAMPTZ` (date du mois gratuit offert)
- Script SQL (à exécuter une fois dans Supabase SQL Editor) :
  ```sql
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS parraine_par TEXT;
  ALTER TABLE drivers ADD COLUMN IF NOT EXISTS mois_offert_le TIMESTAMPTZ;
  ```
- Nouvelle route `POST /api/admin/stripe/gift-month` : crée un coupon Stripe 100% off usage unique, l'applique à l'abonnement, trace `mois_offert_le` en base. Utilisable sans limite (pas de blocage).
- Dashboard admin mis à jour : champ "Parrainé par" (liste déroulante des chauffeurs) dans la modal Modifier, filleuls et parrain visibles sur la carte chauffeur, bouton violet "1 mois offert" dans l'onglet Facturation (visible dès qu'un abonnement Stripe existe, tooltip affiche la date du dernier mois offert)
- Stratégie : canal d'acquisition prioritaire via Patrick (ambassadeur), système activable manuellement pour garder le contrôle

### Routine cloud de tri d'emails : passage de quotidien à hebdomadaire
- La routine « Tri emails du matin » (jours ouvrés 8h30) est transformée en « Tri emails hebdo (dimanche) » : exécution chaque dimanche à 8h30 Paris (cron `30 6 * * 0`)
- Périmètre élargi : trie désormais les emails non lus des 7 derniers jours (et non plus depuis la veille 18h)
- Reste inchangé : 5 catégories, brouillons pour URGENT/À RÉPONDRE, opportunités en tête, règle de sécurité (ne supprime/n'envoie jamais rien sauf le récap), connecteur Gmail, modèle Sonnet. Objet du récap : « Tri de la semaine - semaine du X au Y »
- Même routine modifiée (pas de doublon) : il n'y a plus de tri quotidien en semaine. ID : `trig_01KqWj2JyamYFN5piUetqoKk`

---

## 2026-06-25

### Sécurisation D-VTC (revue de sécurité complète + corrections déployées)
- Revue de sécurité du code D-VTC menée à partir du guide Claude Code (Cas 3 « créer une application »)
- Constat de départ : panel admin, webhook Stripe et headers HTTP corrects, mais 4 routes utilisaient la clé service_role (qui contourne la RLS) sans authentifier l'appelant → failles IDOR
- Correctifs code : nouveau helper `lib/actor-auth.ts` (resolveActor : JWT chauffeur ou token admin), 4 routes sécurisées avec vérification de propriété (unavailabilities, accept-cgv, invoice-url, booking/status), helper client `lib/authed-fetch.ts` + contexte `adminPreview`
- Anti-spam de la réservation publique : honeypot, idempotence via colonne `notified_at` (stoppe le rejeu et la double-incrémentation de total_rides), rate limit souple ; webhook Supabase `reservations_email` désactivé (supprime le doublon d'emails)
- Durcissement Supabase : verrouillage des fonctions SECURITY DEFINER internes (revoke anon/authenticated + search_path fixé), suppression de la policy INSERT publique sur `reservations`. Security Advisor : 17 → 5 avertissements (les 5 restants sont normaux). `admin_config` déjà protégé (RLS active, aucune policy)
- Aperçu admin corrigé : 3 routes de lecture (reservations, clients, invoices) + pages du dashboard branchées dessus en mode preview
- Déployé en production (commit 25c29e9, push main → Vercel). Contrôle de types OK
- Non fait : protection « mots de passe compromis » (réservée au plan Supabase Pro)
- Slug réel de Patrick : `patrick-defoe` (https://www.d-vtc.fr/r/patrick-defoe)

### Mise en place d'une routine cloud de tri d'emails + grand nettoyage Gmail
- Routine cloud « Tri emails du matin » créée via /schedule (jours ouvrés 8h30) : classe les non-lus en 5 catégories, prépare des brouillons pour les emails à répondre, envoie un récap par email, ne supprime ni n'envoie jamais rien de lui-même
- Tri complet de la boîte (~60 non-lus) : 29 archivés (Smash, onboarding SaaS, promos), désabonnements identifiés (Malt, OpenAI, Canva). Constat : aucun email personnel en attente de réponse
- Paiement Stripe de 74 € (« Dem's Revolut ») confirmé et configuration du compte Stripe finalisée : flux d'encaissement D-VTC opérationnel de bout en bout

### Veille du jour (impacts D-VTC et micro-entreprise)
- Cotisations micro-BNC 2026 confirmées à 25,6 % (libéral non réglementé, régime général) : valide le calcul du seuil de rentabilité D-VTC (29 chauffeurs)
- Durcissement réglementaire VTC 2026 (auto-déclaration URSSAF par les plateformes, ZFE Grand Paris) : argument commercial pour D-VTC
- Réforme facturation électronique : première entrée en vigueur le 1er septembre 2026

### Divers
- Renommage du dossier livrables Copity Beach Club + ajout d'un guide Claude Code (commit 142aba5)

---

## Historique condensé (14 - 24 juin 2026)

### D-VTC — Développement complet (18-24 juin)
- Phase 1 (18 juin) : scaffolding Next.js 14 + Supabase, page réservation avec calculateur, maquettes Claude Design
- Phase 2-3 (19-21 juin) : dashboard chauffeur, flow Stripe end-to-end (74€/mois, checkout auto), CGV (11 articles), facturation PDF, déploiement prod sur d-vtc.fr, notifications temps réel
- Activation Patrick (22 juin) : fix webhook Stripe (308 redirect d-vtc.fr → www) + fix Supabase Auth (Site URL était localhost), activation manuelle via bouton admin
- Sécurité (22 juin) : session tokens admin (UUID 24h, timing-safe), headers HTTP, audit complet, mode preview admin, droits chauffeur ajustés
- Bugs corrigés : calendrier indisponibilités (RLS bloquait), fix facture manquante (garde `if (!inv.customer)`), i18n FR/EN/ES page réservation
- Compteur rentabilité (24 juin) : jauge X/29 dans le panel admin, calcul net après cotisations micro-BNC 26%
- Carte prospection Edrington (23 juin) : web app Next.js + Google Maps + Supabase, import KML, filtres, commit 29502af
- Token GitHub exposé (24 juin) : révoqué, remote nettoyé, reconnexion au prochain push via Git Credential Manager

### Autres projets (14-19 juin)
- Installation Jarvis (14 juin)
- Copity Beach Club : site terminé (réservations, menu, planning staff), migré Netlify → Vercel, mot de passe COPITY2026, pitch commercial en cours
- Templates Instagram D Embassy : 3 templates 1080px — Conseil/Question/Concept du jour (HTML + PPTX Canva)
