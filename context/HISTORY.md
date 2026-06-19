# Workspace History

> Journal chronologique de toutes les sessions et décisions importantes.
> Le plus récent en haut. Mis à jour automatiquement par Claude.
>
> **Comment ça marche :** Quand je lance la commande `/update` après une session importante, ou quand je raconte un changement significatif, Claude ajoute une entrée ici automatiquement. Je n'ai pas à écrire ce fichier manuellement.

---

## 2026-06-19

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
- Projet stocké dans livrables/applications/0 - D-VTC/ (nomenclature "0" = première application, scalable)
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
