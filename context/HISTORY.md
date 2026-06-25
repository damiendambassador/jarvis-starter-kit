# Workspace History

> Journal chronologique de toutes les sessions et décisions importantes.
> Le plus récent en haut. Mis à jour automatiquement par Claude.
>
> **Comment ça marche :** Quand je lance la commande `/update` après une session importante, ou quand je raconte un changement significatif, Claude ajoute une entrée ici automatiquement. Je n'ai pas à écrire ce fichier manuellement.

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

## 2026-06-24

### D-VTC — objectif rentabilité chiffré + compteur dans le panel admin

- Objectif central de D-VTC formalisé : **couvrir l'intégralité des charges fixes (1 547,99 €/mois)** via les abonnements
- Précision du calcul : en net après cotisations micro-BNC (~26 % en 2026), 74 € brut/chauffeur = ~54,70 € net, donc il faut **~29 chauffeurs actifs** (et non 27, chiffre qui ne couvrait pas tout à fait les charges en net avec les taux 2026)
- Compteur « Objectif rentabilité » ajouté en haut du panel admin (`app/admin/dashboard/page.tsx`) : jauge X/29 chauffeurs actifs, revenu net actuel vs charges fixes, MRR brut affiché en repère. Calcul paramétré (charges, prix, taux de cotisations) pour rester juste si un chiffre évolue
- Déployé en production (push sur main, Vercel build OK). Taux de cotisations ~26 % à confirmer avec le comptable (pilote le seuil de 29)

### Sécurisation de l'accès GitHub (token exposé)

- Token GitHub personnel (`gho_`) découvert stocké en clair dans l'URL du remote git (`.git/config`), exposé pendant la session
- Token révoqué côté GitHub : Git Credential Manager et Visual Studio Code désautorisés dans les OAuth Apps
- Remote nettoyé (plus de token dans l'URL), ancien identifiant github.com purgé du coffre Windows
- Reste à faire : reconnexion GitHub au prochain `git push`/`fetch` via Git Credential Manager (`gh` CLI non installé). Le nouveau token sera stocké chiffré dans le Gestionnaire d'identifiants Windows

---

## 2026-06-23

### Carte de prospection Edrington — création de l'outil
- Nouvelle web app (Next.js 14 + Supabase + Google Maps + Vercel) pour remplacer le suivi Google My Maps de la prospection off-trade
- Modèle de données : magasins (enseigne, adresse, statut visite) + placements (marque, référence, statut Présent / En cours / Gagné / Refusé)
- Design : couleur = état, code 2 lettres = enseigne, étoile verte = nouvelle DN gagnée, panneau légende/stats redimensionnable
- Fonctions : filtres (focus marque présente/absente, « mes gains »), pénétration par marque, calcul de distances
- Import KML (géocodage automatique des ~707 adresses sans coordonnées) + import par collage de listes par enseigne
- Références alignées sur le catalogue Edrington 2026 (Macallan, Glenrothes, Highland Park, Brugal, Gin N°3, Valdespino)
- Infra créée : Supabase « Edrington Map France » (eu-central-1), Google Cloud « Edrington Map » (Maps JS + Geocoding + Distance Matrix)
- Commit ciblé 29502af (app uniquement)

---

## 2026-06-22 (session 3)

### D-VTC — Fix facture + i18n page de réservation + prospection VTC

**Fix facture manquante (Patrick) :**
- Bug identifié : garde `if (!inv.subscription) break` dans le webhook `invoice.payment_succeeded` bloquait silencieusement la génération de facture au premier paiement Stripe
- Fix : remplacé par `if (!inv.customer) break` (seule vérification utile)
- Solution immédiate Patrick : bouton "Resync" dans le panel admin (endpoint `/api/admin/stripe/resync-invoice` existant)
- Déployé en production

**Traduction FR / EN / ES — page de réservation publique :**
- Dictionnaires complets dans `lib/i18n/` (fr.ts, en.ts, es.ts, index.ts) — 120+ clés
- Hook `useLanguage()` avec persistance localStorage
- Composant `LanguageSwitcher` (FR · EN · ES) discret dans le header, langue active en doré
- Page de réservation et page de confirmation entièrement traduites
- Calendrier localisé via date-fns locale dynamique
- Langue persistée entre la réservation et la confirmation
- Déployé en production

**Prospection chauffeurs VTC :**
- 2 prospects rencontrés lors de courses Uber (numéros obtenus)
- Stratégie définie : WhatsApp d'abord, pas d'appel non sollicité
- Message envoyé à un prospect avec rappel du trajet (Carré Sénat → Ivry) et accroche personnalisée
- Prochain pas : envoyer le lien d-vtc.fr en second message, attendre 24-48h

---

## 2026-06-22 (session 2)

### D-VTC — Fonctionnalités + audit de sécurité complet

**Fonctionnalités livrées :**
- Majoration nuit configurable par chauffeur (toggle on/off, horaires personnalisés) dynamiques sur la page de réservation publique
- Plaque d'immatriculation affichée dans la pastille véhicule sur `/r/[slug]`
- Endpoint `/api/admin/stripe/resync-invoice` + bouton "Resync" dans le panel admin (rattrapage des factures Stripe manquantes avec génération PDF)
- Fusion de la page "Réservations" dans le "Tableau de bord" : 5 onglets de statut, 4 périodes (+ semaine prochaine), tri par ticket €, suppression admin

**Audit de sécurité :**
- Remplacement du stockage email+mot de passe admin en localStorage par un système de session tokens UUID (24h, révocables, stockés en `admin_config`)
- Nouveau endpoint `/api/admin/auth` pour la création de session
- Toutes les routes admin (x12) migrent vers `validateAdminRequest()`
- Comparaison hash en timing constant (`timingSafeEqual`) contre les timing attacks
- Headers de sécurité HTTP ajoutés (HSTS, X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy, Permissions-Policy)
- Changement de mot de passe invalide automatiquement la session active

**Statut :** Prêt à lancer la commercialisation.

---

## 2026-06-22

### D-VTC — Activation Patrick + correction infrastructure webhooks Stripe

**Problème initial :** Patrick avait payé 74€ mais restait bloqué par le PaymentWall.

**Cause 1 — Webhook 308 Redirect :**
- Le webhook Stripe pointait vers `https://d-vtc.fr/api/stripe/webhook` (sans www)
- Vercel redirige `d-vtc.fr` → `www.d-vtc.fr` avec un 308 permanent
- Stripe ne suit pas les redirects → tous les events échouaient silencieusement
- Fix : URL du webhook modifiée dans Stripe Dashboard vers `https://www.d-vtc.fr/api/stripe/webhook`

**Cause 2 — Magic link vers localhost:3000 :**
- Le "Site URL" dans Supabase Auth était resté `http://localhost:3000` (config de dev jamais mise à jour)
- Supabase ignorait le `redirectTo` passé dans `generateLink()` (URL non dans la liste autorisée)
- Fix : Site URL Supabase → `https://www.d-vtc.fr`, redirect URLs `https://www.d-vtc.fr/**` et `https://d-vtc.fr/**`
- Fix code : `redirectTo` dans `webhook/route.ts` mis à jour vers `https://www.d-vtc.fr/dashboard`

**Livraisons code :**
- Nouvelle route `POST /api/admin/stripe/activate` : force `subscription_status = 'active'` manuellement (backup si webhook KO)
- Bouton "Activer" (vert) dans le tableau Facturation du panel admin pour tout chauffeur `pending`
- Logs détaillés dans le webhook Stripe (event reçu, customer_id, résultat UPDATE, erreurs)

**Résultat :** Patrick activé et connecté. Infrastructure webhook stable pour les prochains chauffeurs.

### D-VTC — Fix calendrier + admin password + templates Instagram

**Bug calendrier indisponibilités corrigé :**
- Cause : INSERT/SELECT sur `unavailabilities` via client anon bloqués par RLS (silence total, aucune erreur visible)
- Fix : nouvelle route API `/api/driver/unavailabilities` (GET, POST, DELETE) avec service role key
- La lecture (GET) et l'écriture (POST/DELETE) passent maintenant toutes par cette route
- Ajout d'un message d'erreur rouge visible dans le modal si la sauvegarde échoue
- Fonctionne aussi en mode admin preview (pas de session Supabase Auth active dans ce mode)

**Changement de mot de passe admin depuis le panel :**
- Bouton "Mot de passe" dans le header du panel admin
- Modal avec champ actuel / nouveau / confirmation, validation min 8 caractères
- Nouveau mot de passe stocké en SHA-256 dans la table Supabase `admin_config`
- Nouveau fichier `lib/admin-auth.ts` avec `validateAdmin()` centralisé (vérifie d'abord la table, fallback sur env var)
- Toutes les routes admin (`/api/admin/*`) migrent vers `validateAdmin()`

**Stratégie acquisition 27 chauffeurs via @d_embassy_ :**
- Calcul du seuil de rentabilité D-VTC : 27 chauffeurs pour couvrir les charges mensuelles
- Patrick en prospection (pas encore signé)
- Plan 12 semaines d'acquisition chauffeurs discuté
- Stratégie de contenu Instagram @d_embassy_ pour cibler les chauffeurs VTC via le prisme de l'indépendance, performance, liberté (thème D Embassy)

**Templates Instagram D Embassy créés :**
- Projet Claude Design importé (`686ed111-8a2d-4392-b1c5-a890b8ab566d`)
- 3 templates 1080x1080px : Conseil du jour, Question du jour, Concept du jour
- Fichiers locaux dans `livrables/templates-instagram/d-embassy/` : HTML standalone + assets PNG
- Export PPTX généré (3 slides carrées) pour import dans Canva

---

## 2026-06-21 (session 2)

### D-VTC — Sécurité admin + droits chauffeur

**Mode preview admin :**
- Nouveau bouton "Dashboard" sur chaque carte chauffeur dans le panel admin
- Clic → `/dashboard?preview=DRIVER_ID` : affiche le dashboard du chauffeur avec bannière ambrée "Vue admin"
- Nouvelle route API `/api/admin/get-driver` (auth admin, service role)
- PaymentWall et CGV modal désactivés en mode preview
- Lien "← Retour admin" dans la bannière pour revenir sans se déconnecter

**Droits de suppression côté chauffeur :**
- Clients : corbeille sur les cartes et bouton "Supprimer ce client" supprimés (admin uniquement)
- Calendrier : blocs d'indisponibilité restent supprimables par le chauffeur ET l'admin (données de planning, pas données métier)
- Réservations et tableau de bord : déjà admin-only, aucun changement

**Sécurisation de l'accès admin :**
- ViewSwitcher retiré de la sidebar chauffeur et de la page de réservation publique
- Accès admin exclusivement via `d-vtc.fr/admin` (page dédiée, non liée publiquement)
- La sidebar chauffeur affiche désormais un logo D statique sans menu de navigation inter-vues

---

## 2026-06-21

### D-VTC — Flow Stripe complet + polish email + UI

**Flow d'activation Stripe opérationnel end-to-end :**
- Email 1 : lien checkout Stripe automatique à la création du chauffeur (sans mot de passe)
- Mur de paiement sur le dashboard pour les comptes `pending`
- Email 2 : magic link Supabase envoyé après confirmation du paiement Stripe (webhook `customer.subscription.created`)
- `checkout_url` stockée en base (colonne ajoutée via migration SQL manuelle)

**Bugs corrigés :**
- Resend 422 : champ `from` doublement wrappé (`EMAIL_FROM` contenait déjà le format `Name <email>`)
- `STRIPE_SECRET_KEY` invalide dans Vercel (clé `npdv-nkt...` au lieu de `sk_live_...`) — corrigé par Damien
- `consent_collection: terms_of_service` bloquait la création de session Stripe (URL ToS non configurée dans Stripe Dashboard) — supprimé
- `STRIPE_PRICE_ID` manquant dans les env vars Vercel

**Email onboarding :**
- Layout reécrit en `<table>` email-safe (suppression `display:flex` / `gap` non supportés par Gmail/Outlook)
- Bloc fallback "Prochaines étapes" en 3 points numérotés quand le lien Stripe n'est pas disponible
- Texte : "Je vous l'enverrai directement" au lieu de "vous le recevrez dans les prochaines heures"

**Admin :**
- Lien Stripe copié dans la modal de création, toujours visible (avec message d'erreur si non généré)
- Onglet Facturation : `checkout_url` affiché pour les chauffeurs "En attente"
- `checkout_url` ajouté à l'API `/api/admin/data`

**UI landing + réservation :**
- Cartes "Comment ça fonctionne" à hauteur égale (`h-full`)
- Suppression titre redondant dans la section CTA finale
- Page réservation : champ distance estimée supprimé, Note réduite (`max-w-xs`, `rows=2`)

**Statut :** Premier client (Patrick) va tester le flow de paiement complet en live.

---

## 2026-06-20

### Système de facturation D-VTC + configuration production complète
- Facturation Stripe intégrée : abonnement 74€/mois, checkout Stripe auto à chaque création de chauffeur
- Webhook Stripe (5 events) : PDF facture généré via @react-pdf/renderer, stocké Supabase Storage, envoyé par email au chauffeur à chaque paiement mensuel
- CGV D-VTC (11 articles) publiées sur `/cgv` + modal d'acceptation bloquante à la première connexion chauffeur
- Onglet "Facturation" dans le panel admin (pause/résiliation/renvoi facture) + page "Mes factures" dans le dashboard chauffeur
- Connexion unifiée `/connexion` remplace "Espace chauffeur" (auto-détection chauffeur/admin selon les credentials)
- Templates légaux D Embassy créés : CGV, contrat coaching, contrat conseil, modèle devis, modèle facture (HTML, mentions légales micro-entrepreneur)
- Email de bienvenue enrichi : résumé CGV (art. 1/3/4/5) + lien d-vtc.fr/cgv envoyé automatiquement à chaque nouveau chauffeur
- Configuration production finalisée : migration SQL Supabase (colonnes Stripe + table invoices + fonction next_invoice_number), bucket Storage "invoices" (Private), produit Stripe Live 74€/mois, webhook enregistré, 10 variables d'environnement Vercel configurées
- Guide de référence complet créé : `context/GUIDE-LANCEMENT-DVTC.md` (checklist, flows, debug par symptôme)
- Audit complet du codebase effectué : TypeScript, routes API, pages frontend, SQL, templates légaux

### Application D-VTC — Phase 3 complète, mise en production, commercialisation

**Ce qui a été livré :**
- Panel admin complet (login protégé, CRUD chauffeurs, création auto compte Supabase + email de bienvenue, KPIs financiers, suppression en cascade)
- ViewSwitcher : navigation admin/chauffeur/client depuis n'importe quelle vue
- Notifications temps réel sur le dashboard chauffeur (Supabase Realtime, toast auto-dismiss 10s)
- Dashboard multi-période (cette semaine / ce mois / tout), filtre côté client
- Changement de mot de passe dans les paramètres chauffeur
- Suppression de réservations (admin uniquement)
- Landing page publique sur `d-vtc.fr` avec calculateur de rentabilité vs plateformes, comparatif financier, arguments ROI chiffrés
- Déploiement production Vercel, domaine `d-vtc.fr` configuré (Squarespace)
- Resend domaine `d-vtc.fr` vérifié — emails envoyés depuis `reservations@d-vtc.fr`

**Décisions stratégiques :**
- Tarif commercialisé : 74€/mois (analyse de marché : rentable dès 20 courses directes, soit 10% de l'activité d'un chauffeur parisien)
- Positionnement : liberté et contrôle de l'agenda, sans nommer les plateformes directement
- Argument de vente principal : "20 courses directes/mois remboursent l'abonnement. Vos 5 clients fidèles suffisent."
- Premier chauffeur en production : Patrick (patrick.d.vtc@gmail.com)
- Statut : prêt à commercialiser

---

## 2026-06-19

### Copity Beach Club — finalisation démo + migration Vercel
- Horaires mis à jour : Dom-Jeu 11h-02h / Ven-Sam 11h-03h
- Porte d'accès mot de passe ajoutée directement dans le HTML (COPITY2026)
- Watermark "Demo · D Embassy" sur toutes les pages
- Site migré de Netlify vers Vercel (centralisation avec D-VTC)
- Raccourci DEPLOYER.bat créé pour les mises à jour en un clic
- Décision stratégie hébergement : sites statiques vers Cloudflare Pages (gratuit, illimité), apps Next.js vers Vercel, aucun abonnement pour l'instant
- Prochaine étape : envoyer le lien au contact pour présentation au client final

### Application D-VTC — Maquettes Claude Design + configuration Supabase
- Maquettes UI générées via Claude Design pour les 8 écrans (page réservation, confirmation, login, dashboard, réservations, clients, calendrier, paramètres)
- Création du projet Supabase free tier (région EU West 2, ID : oeyfjzccovshgmuhxukq)
- Schéma SQL appliqué : 4 tables (drivers, pricing, clients, reservations), 9 politiques RLS, fonction increment_client_rides
- .env.local configuré avec les vraies clés Supabase
- App prête à tester en local (reste à ajouter la clé Resend pour les emails)
- Prochaine étape : lancer npm run dev, tester la page de réservation, puis attaquer la Phase 2

---

## 2026-06-18

### Application D-VTC — Lancement du développement MVP
- Planification du MVP : architecture multi-chauffeurs, paiement à bord, notifications email via Resend
- Stack choisie : Next.js 14 (App Router), Tailwind CSS, Supabase, Vercel
- Phase 1 livrée : scaffolding complet, schéma SQL Supabase (4 tables + RLS), page de réservation client avec calculateur de prix en temps réel, page de confirmation, API route d'envoi d'emails
- Génération des 8 prompts Claude Design (page réservation, confirmation, login, dashboard, réservations, clients, calendrier, paramètres)
- Prompts envoyés sur Claude Design pour générer les maquettes UI
- Projet stocké dans livrables/applications/d-vtc/ (nomenclature "0" = première application, scalable)
- Prochaine étape : intégrer les maquettes Claude Design + développer le dashboard chauffeur (Phase 2)
- Objectif business : proposer à un premier chauffeur VTC, générer des revenus via D Embassy

---

### Projet Copity Beach Club — site web terminé + pitch commercial en cours
- Création complète d'un site web pour le Copity Beach Club (Alicante, Espagne)
- Fonctionnalités client : réservations, menu, événements à venir
- Fonctionnalités staff/managers : planning, modifications de planning, suivi des jours de travail
- Site en ligne : copity-beach-club.netlify.app
- Création d'une présentation commerciale (sales deck) pour vendre la solution
- Présentation en ligne : presentation-copity-beach-club.netlify.app
- Livrables stockés dans `livrables/sites-web/0 - Copity Beach Club/`
- Statut : site terminé, pitch commercial en cours (objectif : générer des revenus via D Embassy)

---

## 2026-06-14

### Installation initiale du Jarvis
- Workspace personnalisé pour Damien, basé à Ivry-sur-Seine (région parisienne)
- Profil principal : mixte (salarié, vendeur en missions ponctuelles, auto-entrepreneur)
- Activité : Business Development Executive chez Edrington (spiritueux, activité principale en temps), auto-entrepreneur sous la marque D Embassy (conseil business et coaching), développement de sites et applications
- Objectifs court terme identifiés : générer des revenus en priorité, mettre en ligne le site D-VTC, développer le coaching, réussir sa prise de poste chez Edrington
- Vision long terme : liberté financière, géographique et mentale via plusieurs sources de revenus solides et évolutives, garder le pouvoir de choisir
- Projets actifs au démarrage : site D-VTC, coaching D Embassy (Instagram @d_embassy_), conseil/business plans (Canva), poste Edrington, missions Accor Arena, formation IA, développement personnel (Miracle Morning, sport, lecture, écriture)
- Domaine d'aide prioritaire : génération de revenus et structuration des activités d'auto-entrepreneur, dans le respect du cadre légal de la micro-entreprise (D Embassy, SIRET 10073363300018, APE 7022Z, début 01/03/2026)
- Style de communication choisi : direct et efficace, avec de la pédagogie sur les sujets à se réapproprier
