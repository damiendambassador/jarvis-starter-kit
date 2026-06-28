# D-VTC — Design comportemental : créer des "sentiments de réussite"

> Objectif : transformer l'usage de D-VTC en habitude, côté chauffeur et côté client, en s'appuyant sur la recherche en comportementalisme (Skinner, Schultz, Fogg, Eyal).
> Posture : chercheur en systèmes de récompense. On amplifie des réussites **réelles**, on ne fabrique pas de fausses récompenses.

---

## 0. Doctrine (les règles du jeu)

### Les 5 principes mobilisés

1. **Renforcement à ratio variable (Skinner).** Le schedule de récompense le plus puissant pour ancrer un comportement est celui où la récompense est imprévisible. Sur D-VTC, cette variabilité est **déjà réelle** : une course tombe quand elle tombe, pour un montant inconnu à l'avance. On n'a pas à l'inventer, juste à la capter.

2. **Erreur de prédiction de récompense (Schultz, dopamine).** Le pic de dopamine n'arrive pas à la récompense attendue, mais à la **surprise positive** (récompense supérieure à l'attente). D'où l'importance de célébrer fort les bons moments inattendus (gros ticket, meilleure semaine).

3. **Boucle d'habitude / modèle Hooked (Fogg, Eyal) :** Déclencheur → Action → Récompense (variable) → Investissement. Chaque tour de boucle qui se referme rend le suivant plus probable. L'investissement (parrainage, fidélité) augmente la valeur future et crée un coût de sortie.

4. **Célébration immédiate (Fogg).** Une émotion positive juste après l'action est ce qui câble l'habitude, pas la répétition seule. Le délai tue l'effet. La célébration doit être instantanée.

5. **Goal gradient + endowed progress.** La motivation augmente à l'approche d'un but, et démarrer avec un progrès "déjà entamé" pousse à finir. On transforme les coûts (abonnement) et les compteurs en quêtes presque terminées.

### Les 3 garde-fous (non négociables)

- **G1 — Vérité.** Chaque récompense pointe vers un gain réel : argent encaissé, jalon atteint, Uber battu. Pas de badge creux, pas de fausse rareté.
- **G2 — Dignité du pro.** Le chauffeur gère une entreprise. Ton premium et sobre, jamais infantilisant. Pas de confettis criards sur un outil financier. La récompense doit faire "sérieux et gratifiant", pas "jeu mobile pour enfants".
- **G3 — Jamais de honte.** Aucun streak quotidien culpabilisant. Un chauffeur n'a pas de course tous les jours ; le punir pour ça le fait fuir. On récompense la réussite, on ne sanctionne jamais l'inactivité.

---

## 1. VUE CHAUFFEUR

**Habitude visée :** ouvrir le dashboard chaque jour, accepter vite les courses, et **rester abonné** (l'enjeu réel des 29 chauffeurs).

**Constat actuel :** quand une course tombe ou se termine, il ne se passe rien de visible. Le chiffre change en silence. C'est du carburant dopaminergique gaspillé.

### 1.1 Célébration à l'acceptation d'une course
- **Déclencheur :** clic sur "Accepter".
- **Ce que voit le chauffeur :** micro-animation (le bouton se transforme en coche, léger pulse) + un toast premium "Course acceptée · +58 € pour ta semaine".
- **Principe :** célébration immédiate (Fogg) + peak-end. On lie physiquement l'action au gain chiffré.
- **Dimension variable :** le montant change à chaque fois → surprise positive plus ou moins forte.
- **Code :** `app/dashboard/page.tsx`, fonction `updateStatus()` (ligne 78). Le montant vient de `r.price_estimate`.
- **Garde-fou :** toast sobre, doré/navy, pas de confettis.

### 1.2 Compteur de CA animé (count-up)
- **Déclencheur :** une course passe en "terminée", ou au chargement du dashboard.
- **Ce que voit le chauffeur :** la carte "CA" anime le chiffre qui grimpe (ex. de 0 à 1 240 € en 800 ms) au lieu d'afficher la valeur figée.
- **Principe :** progrès visible = dopamine de progression. Le cerveau valorise le mouvement vers le haut.
- **Code :** carte "CA" (ligne 160) et "Éco vs Uber" (ligne 161). Hook `useCountUp` réutilisable.

### 1.3 La notification de nouvelle course (le moteur n°1)
- **Déclencheur :** nouvelle réservation reçue (Supabase Realtime, déjà en place via `_notif.tsx`).
- **Ce que voit le chauffeur :** notif marquante "Nouvelle course · 72 € · demain 9h" avec son optionnel + badge sur l'onglet.
- **Principe :** **ratio variable pur** — c'est ici que vit le cœur du renforcement intermittent. C'est le levier le plus fort de tout le système.
- **Code :** `app/dashboard/_notif.tsx` (Realtime déjà branché). Ajouter le montant, un son opt-in, un badge persistant tant que non vu.
- **Garde-fou :** ne pas noyer ce signal sous d'autres notifications de moindre valeur. Sa force vient de sa rareté et de sa valeur.

### 1.4 Paliers de réussite (milestones)
- **Déclencheur :** un seuil réel est franchi.
- **Exemples :** 10e course du mois · 1er ticket à +100 € · meilleure semaine jamais réalisée · 1 000 € sur le mois · 50e course totale.
- **Ce que voit le chauffeur :** une carte/bandeau premium "Palier atteint" qui apparaît une fois, puis se range dans un petit historique de jalons.
- **Principe :** goal gradient + surprise (la formulation du palier crée l'imprévu : on ne sait pas lequel va tomber).
- **Code :** logique dérivée de `completed` / `all`. Voir §3 pour la persistance (éviter de re-déclencher un palier déjà fêté).
- **Garde-fou :** paliers fondés sur des chiffres vrais uniquement.

### 1.5 "Tu as battu Uber de X €" comme moment, pas comme stat
- **Déclencheur :** consultation du dashboard, et surtout récap de fin de mois.
- **Ce que voit le chauffeur :** transformer la carte "Éco vs Uber" en message identitaire fort en fin de période : "Ce mois, tu as gardé 340 € que Uber t'aurait pris."
- **Principe :** récompense identitaire ("je suis mon propre patron"). Renforce l'image de soi liée à l'outil.
- **Code :** carte "Éco vs Uber" (ligne 161), calcul `uberSaved` déjà présent (ligne 107).

### 1.6 La quête de rentabilité de l'abonnement
- **Déclencheur :** dashboard, en continu sur le mois.
- **Ce que voit le chauffeur :** "Il te reste 1 course pour rentabiliser ton abonnement ce mois" → puis, une fois dépassé : "Abonnement rentabilisé · tout le reste est pour toi."
- **Principe :** endowed progress — transforme le coût mensuel (74 €) en quête presque terminée, ce qui réduit fortement le churn.
- **Code :** nouvelle carte. Seuil = 74 € / ticket moyen, comparé au CA du mois.
- **Garde-fou :** c'est le mécanisme anti-churn le plus important du système. À soigner.

### 1.7 Récap "Ta semaine" / "Ton mois"
- **Déclencheur :** ouverture le lundi, ou bouton dédié, + relais par email/notif.
- **Ce que voit le chauffeur :** un petit écran de synthèse : total, meilleur jour, nombre de courses, évolution vs période précédente (flèche ↑/↓), palier(s) du mois.
- **Principe :** peak-end (clôture émotionnelle de la période) + cue de réengagement (le récap est lui-même un déclencheur qui ramène dans l'app).
- **Code :** nouvelle section dérivée de `all` ; bornes via `getPeriodBounds()` (déjà présent, ligne 37).

---

## 2. VUE CLIENT

**Habitude visée :** rebooker le même chauffeur au lieu de rouvrir Uber, et parrainer.
**Surface clé :** la page de confirmation (`app/r/[slug]/confirmation/page.tsx`), qui est **le pic émotionnel du parcours**.

### 2.1 Amplifier le moment de confirmation
- **Déclencheur :** arrivée sur la page de confirmation.
- **Ce que voit le client :** animation de succès vivante (la coche `CheckCircle` qui se dessine/pulse) + message rassurant "Ton chauffeur est prévenu, il revient vers toi."
- **Principe :** peak-end. C'est le moment dont le client se souviendra ; il décide du rebooking futur.
- **Code :** `CheckCircle` (ligne 76). Animation d'entrée déjà amorcée (`animate-fade-in`).

### 2.2 Statut "client direct privilégié"
- **Déclencheur :** confirmation + page de réservation.
- **Ce que voit le client :** un bandeau identité "Tu réserves en direct : pas de commission, pas de surge, pas de numéro anonyme."
- **Principe :** récompense identitaire ("je suis malin, je ne suis pas un client Uber lambda"). Crée une préférence émotionnelle pour le canal direct.
- **Code :** sous le titre de confirmation (ligne 77) ou sur la page `r/[slug]/page.tsx`.

### 2.3 Reconnaissance du client fidèle
- **Déclencheur :** réservation par un client déjà venu (même `client_phone` chez ce chauffeur).
- **Ce que voit le client :** "Ta 3e course avec Patrick · content de te revoir."
- **Principe :** relation + endowed progress (le compteur de courses donne envie de le faire grandir).
- **Code :** compter les réservations passées du même `client_phone` pour ce `driver_id`. Données déjà disponibles, pas de schéma à changer.

### 2.4 Rebooking en 1 clic
- **Déclencheur :** fin de course / page de confirmation / retour sur la page du chauffeur.
- **Ce que voit le client :** bouton "Refaire ce trajet" qui pré-remplit départ/arrivée/type.
- **Principe :** réduction de friction (Fogg : Behavior = Motivation × Ability × Trigger). Moins d'effort = habitude plus probable. C'est le levier de rebooking le plus direct.
- **Code :** bouton "Nouvelle réservation" (ligne 116) → passer les champs en query params vers `r/[slug]`.

### 2.5 Parrainage plus saillant
- **Déclencheur :** page de confirmation (carte déjà présente, ligne 124).
- **Ce que voit le client :** rendre la récompense plus concrète et visible ("Offre une course, gagne X sur la tienne"), bouton de partage natif en plus du copier-lien.
- **Principe :** investissement (modèle Hooked) — le client qui parraine s'engage davantage et a un coût de sortie.
- **Code :** carte referral existante (ligne 124) ; `copyRefLink()` (ligne 31) déjà en place, ajouter `navigator.share`.

---

## 3. Données nécessaires

La plupart des mécaniques se calculent à partir de l'existant (`reservations`, `drivers`). Deux besoins de persistance :

- **Paliers (§1.4) :** pour ne pas re-fêter un palier déjà vu, persister les jalons atteints. Option simple : table `driver_milestones (driver_id, milestone_key, reached_at)`. Option légère sans schéma : `localStorage` par chauffeur (suffisant au début, mais perdu en cas de changement d'appareil).
- **"Vu / pas vu" des notifs et célébrations (§1.3) :** un flag de lecture (déjà partiellement géré ; à confirmer dans `_notif.tsx`).

Le reste (count-up, célébration acceptation, quête rentabilité, récap, fidélité client, rebooking) ne nécessite **aucune migration**.

---

## 4. Séquencement de build recommandé

**Phase 1 — Capter les vrais gains côté chauffeur (effet maximal, effort minimal, risque éthique nul)**
- 1.1 Célébration à l'acceptation
- 1.2 Compteur CA animé
- 1.3 Notification de course enrichie

**Phase 2 — Ancrer l'habitude et réduire le churn chauffeur**
- 1.6 Quête de rentabilité de l'abonnement (anti-churn n°1)
- 1.4 Paliers
- 1.7 Récap hebdo/mensuel
- 1.5 Moment "battu Uber"

**Phase 3 — Boucle client (acquisition + rebooking)**
- 2.1 Confirmation amplifiée
- 2.4 Rebooking 1 clic
- 2.2 Statut client direct
- 2.3 Fidélité client
- 2.5 Parrainage saillant

---

## 5. Comment savoir si ça marche (mesure)

Le design comportemental sans mesure n'est qu'une intuition. À suivre :

- **Chauffeur :** fréquence d'ouverture du dashboard (proxy de l'habitude), délai moyen d'acceptation d'une course (doit baisser), **taux de rétention d'abonnement mensuel** (la métrique reine).
- **Client :** taux de rebooking (clients avec ≥2 courses), taux de parrainage (liens partagés / confirmations), part du canal direct vs retour à Uber.

> Règle de prudence : tester une phase, mesurer, puis itérer. Si une mécanique ne déplace pas une métrique réelle, on la retire. On ne garde pas du décor.

---

*Document de conception — à valider avant implémentation. D·Jarvis.*
