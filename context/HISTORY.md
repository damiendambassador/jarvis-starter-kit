# Workspace History

> Journal chronologique de toutes les sessions et décisions importantes.
> Le plus récent en haut. Mis à jour automatiquement par Claude.
>
> **Comment ça marche :** Quand je lance la commande `/update` après une session importante, ou quand je raconte un changement significatif, Claude ajoute une entrée ici automatiquement. Je n'ai pas à écrire ce fichier manuellement.

---

## 2026-06-22

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
