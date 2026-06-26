# CONTEXT.md

> Mon contexte personnel et professionnel pour mon Jarvis.
> Ce fichier sera rempli automatiquement lors de l'installation initiale puis mis à jour au fil du temps par Claude.

---

## Qui je suis

- **Prénom :** Damien
- **Ville / Pays :** Ivry-sur-Seine, région parisienne, France
- **Situation actuelle :** Profil mixte, salarié à temps plein chez Edrington, vendeur en missions ponctuelles à l'Accor Arena, et auto-entrepreneur sous ma marque D Embassy
- **Profil dominant :** Mix (le salariat chez Edrington prend le plus de temps, 38 à 45h par semaine, mais l'auto-entreprise est ma priorité d'évolution)

---

## Ce que je fais

### Activité principale

Business Development Executive chez Edrington (groupe qui commercialise des spiritueux : rhum, whisky, gin). Poste qui prend le plus de temps dans ma semaine (38 à 45h), mais qui reste secondaire en termes d'objectifs d'évolution personnelle. En parallèle, je développe mon auto-entreprise D Embassy et plusieurs projets de développement web.

### Détails selon le profil

**Salarié (activité principale en temps) :**
- Poste : Business Development Executive - Off Trade
- Entreprise / Secteur : Edrington (spiritueux : rhum, whisky, gin)
- Missions principales : Prospection chez les cavistes off-trade (Nicolas, Repaire de Bacchus, V and B, Nysa, Cavavin, Intercaves, La Vignery, Le Comptoir Irlandais, Comptoir des Vignes). Scope géographique en cours d'élargissement à Paris, Île-de-France et Nord de la France. Nouveau contrat démarrant avec de nouveaux objectifs chiffrés (volumes, comptes) à partir de mi-juin 2026.

**Vendeur (mission ponctuelle) :**
- Vendeur à l'Accor Arena lors de missions ponctuelles (mission déjà exercée il y a deux ans). Objectif principal de cette mission : générer du revenu complémentaire.

**Auto-entrepreneur (priorité d'évolution) :**
- Micro-entreprise : D Embassy
- SIRET : 10073363300018, code APE : 7022Z, nature libérale non réglementée
- Début d'activité : 01/03/2026
- Siège : 11 rue Gabriel Fauré, 77000 Melun
- Deux activités déclarées :
  1. Conseil pour les affaires et conseils de gestion, stratégie commerciale, business development et analyse de marché
  2. Coaching individuel en développement personnel, bien-être et hygiène de vie (gestion du stress, organisation personnelle, remise en forme)
- En complément, développement de sites et applications répondant à de vrais besoins (ex : site de réservation pour chauffeurs VTC)
- Présence : compte Instagram @d_embassy_ (coaching sport et habitudes)

---

## Mes objectifs

### Objectifs court terme (3 à 6 mois)

- **Générer des revenus (priorité absolue)**, pour libérer du temps des missions énergivores (Accor Arena) et le réinvestir dans mes activités à fort potentiel, tout en respectant strictement les règles de la micro-entreprise et en faisant transiter ces revenus légalement le plus vite possible
- **Couvrir l'intégralité de mes charges fixes (1 547,99 €/mois) via les abonnements D-VTC** : objectif chiffré central du projet au plus fort potentiel de financement. En net après cotisations micro-BNC (25,6 % confirmé pour 2026, profession libérale non réglementée au régime général), cela représente environ **29 chauffeurs actifs** (74 €/mois brut, soit ~55,06 € net par chauffeur). Le site est déjà en production sur d-vtc.fr, place à la commercialisation pour atteindre ce palier. Un compteur de progression est intégré au panel admin
- Développer mon activité de coaching (offre, suivi clients, génération de revenus)
- Réussir ma prise de poste chez Edrington et atteindre mes premiers objectifs chiffrés

### Objectifs long terme (1 à 3 ans)

- Atteindre la liberté au sens large : financière, géographique et mentale
- Construire plusieurs sources de revenus solides et évolutives
- Garder le pouvoir de choisir : pouvoir compléter le salariat avec de vrais revenus, ou le quitter pour développer mes activités, sans concessions ni sacrifices excessifs

---

## Mes projets en cours

Liste des projets ou chantiers actifs sur lesquels je veux que Claude m'aide :

- **Application D-VTC** (`livrables/applications/d-vtc/`) : Application complète en production sur `d-vtc.fr`. Stack Next.js 14, Supabase, Stripe, Resend, Vercel. Fonctionnalités livrées : page de réservation client (calculateur de prix temps réel), dashboard chauffeur (stats multi-période, calendrier avec indisponibilités, tableau de bord fusionné avec toutes les réservations filtrables par statut/période/ticket, paramètres, page "Mes factures"), majoration nuit configurable par chauffeur (horaires + toggle), plaque d'immatriculation affichée sur la page de réservation publique, resync des factures Stripe manquantes depuis le panel admin, notifications temps réel (Supabase Realtime), panel admin (connexion via `/admin`, CRUD chauffeurs complet, KPIs financiers, onglet Facturation, mode preview dashboard chauffeur, changement de mot de passe admin), landing page publique avec calculateur de rentabilité. Système de facturation Stripe complet : 74€/mois, PDF auto-généré, stocké Supabase Storage. CGV (11 articles) avec modal bloquante. Connexion unifiée `/connexion`. Domaine `d-vtc.fr` actif. Emails via Resend. Seuil de rentabilité : 27 chauffeurs. Sécurité : système de session tokens (plus de mot de passe en localStorage), headers HTTP sécurisés, timing-safe hash comparison. Premier client : Patrick (en prospection). Statut : 100% opérationnel, prêt à lancer la commercialisation.
- **Coaching D Embassy** : sport, création de bonnes habitudes, accompagnement, contenu Instagram (@d_embassy_), suivi clients (en phase de test sur Airtable, à développer pour générer du revenu). Templates Instagram créés dans `livrables/templates-instagram/d-embassy/` (HTML + PPTX Canva-ready). Stratégie en cours : utiliser @d_embassy_ comme levier d'acquisition chauffeurs D-VTC via contenu sur l'indépendance et la performance.
- **Conseil / business development et sites web** : business plans et présentations Canva pour mes clients (ex : A&J Naturals, Solara, Kirjava, Comptoir Malakit, Les Jardins d'Ivry, VTC Patrick) + création de sites web (ex : Copity Beach Club, Alicante, site terminé, démo protégée par mot de passe sur Vercel : copity-beach-club.vercel.app, contact identifié pour présentation au client final, pitch commercial en cours)
- **Carte de prospection Edrington (off-trade)** (`livrables/applications/carte-prospection/`) : web app perso Next.js 14 + Supabase + Google Maps + Vercel pour cartographier les chaînes de caves de France (Nicolas, Repaire de Bacchus, Nysa, V and B, La Vignery, Cavavin, Intercaves, Le Comptoir Irlandais, Comptoir des Vignes). Pins colorés par état (statut visite / pénétration / nouvelles DN), code 2 lettres par enseigne, saisie des marques placées + références exactes (catalogue Edrington 2026), statut par marque (Présent / En cours / Gagné / Refusé), mise en avant des gains (DN), filtres (focus marque présente/absente, « mes gains »), import KML + import par collage de listes avec géocodage automatique, calcul de distances, accès privé par login. Remplace et dépasse l'ancien suivi Google My Maps. **Déployée en production sur `edringtonmapofftrade.vercel.app`** (projet Vercel "Edrington - Map Off Trade", root directory `livrables/applications/carte-prospection/prospection-app` du repo jarvis-starter-kit). Sécurité Google Maps en place : clé client restreinte par domaine (Maps JavaScript API) + clé serveur restreinte par API (Geocoding + Distance Matrix). Statut : en production, ~1146 magasins importés, reste à enrichir les marques placées au fil des visites.
- **Poste Edrington** : prospection cavistes, nouveau scope et objectifs chiffrés
- **Missions Accor Arena** : vente ponctuelle (revenu complémentaire)
- **Formation IA** : comprendre et maîtriser l'IA au maximum
- **Développement personnel** : Miracle Morning (réveil tôt, encore un challenge), sport, lecture, écriture, ouverture sur le monde

---

## Mes outils et préférences

### Outils que j'utilise au quotidien

- IA (Claude en tête) : création de templates, coaching, descriptions de vidéos, aide aux tâches quotidiennes
- Airtable : prospection (travail) et suivi coaching (encore en phase de test, à développer)
- Canva : business plans et présentations clients
- Instagram : @d_embassy_ (coaching)

### Style de communication préféré

Direct et efficace, droit au but, mais avec de la pédagogie, surtout sur les sujets que je veux ensuite me réapproprier et réutiliser.

### Domaine où j'ai besoin du plus d'aide

La génération de revenus, et la structuration de mes activités d'auto-entrepreneur (coaching, conseil, site D-VTC) pour y parvenir, dans le respect du cadre légal de la micro-entreprise.

---

## Notes importantes

> Cette section se remplira au fil du temps avec les éléments de contexte qui émergent naturellement dans mes sessions avec Claude.
