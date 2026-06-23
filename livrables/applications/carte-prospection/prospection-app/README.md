# Carte de prospection — Edrington

Web app personnelle pour cartographier les chaînes de caves de France, suivre les marques placées
et leurs références par magasin, repérer le potentiel commercial (marque absente), mettre en avant
les nouvelles DN gagnées, et calculer des distances/itinéraires. Accessible depuis PC et téléphone.

Stack : **Next.js 14 · TypeScript · Tailwind · Supabase · Google Maps · Vercel**.

---

## 1. Base de données Supabase

1. Crée un projet sur [supabase.com](https://supabase.com) (gratuit).
2. **SQL Editor → New query** → colle le contenu de [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   (Crée les tables `stores` + `placements`, les index, le trigger et les règles RLS.)
3. **Authentication → Users → Add user** → crée ton compte unique (email + mot de passe).
4. **Project Settings → API** → récupère :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (secret, serveur uniquement)

## 2. Google Cloud (carte + géocodage + distance)

1. [console.cloud.google.com](https://console.cloud.google.com) → crée un projet, active la facturation
   (crédit gratuit ~200 $/mois ; usage réel proche de 0 €).
2. **APIs & Services → Enable APIs** : active **Maps JavaScript API**, **Geocoding API**,
   **Distance Matrix API** (et **Directions API**, **Places API** pour les évolutions).
3. **Credentials → Create credentials → API key** ×2 :
   - **Clé client** → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Restreins-la par *Referrer HTTP*
     (`localhost:3000/*` puis ton domaine Vercel `*.vercel.app/*`).
   - **Clé serveur** → `GOOGLE_MAPS_SERVER_KEY`. Restreins-la par *API* (Geocoding + Distance Matrix).
4. (Optionnel) **Map Management → Create Map ID** (type *JavaScript*) → `NEXT_PUBLIC_MAP_ID`.
   À défaut, `DEMO_MAP_ID` fonctionne pour démarrer (requis par les marqueurs avancés).

## 3. Variables d'environnement

Copie [`.env.local.example`](.env.local.example) en `.env.local` et renseigne les valeurs ci-dessus.

## 4. Lancer en local

```bash
npm install
npm run dev
# http://localhost:3000  → /connexion avec le compte créé à l'étape 1.3
```

## 5. Déploiement Vercel

1. Pousse le dossier sur un repo Git, **Import** dans Vercel.
2. Reporte toutes les variables d'environnement dans **Settings → Environment Variables**.
3. Deploy. Ajoute ensuite l'URL de prod dans les restrictions de la clé Google client.
4. Sur mobile : ouvre l'URL → *Ajouter à l'écran d'accueil* (utilisable comme une app).

---

## Importer ton My Maps existant (KML)

1. Dans Google My Maps : **⋮ → Exporter au format KML/KMZ**.
2. Laisse **« Toute la carte »**, **coche** « Exporter au format **KML** au lieu de KMZ »,
   laisse décochée l'option « lien réseau » → **Télécharger**.
3. Dans l'app : bouton **Importer KML** → sélectionne le fichier.
   - Les magasins avec coordonnées sont importés directement.
   - Ceux qui n'ont qu'une adresse (`Adresse` + `Code Postal`) sont **géocodés automatiquement**.
   - L'enseigne est déduite du nom du calque KML.

> Évite d'importer deux KML qui se recoupent : les doublons ne sont pas dédupliqués automatiquement.

---

## Concepts clés de l'app

- **Colorer par** (sélecteur en haut) : `Statut` · `Nb de marques` (pénétration) · `Nouvelles DN` · `Enseigne`.
  Un seul axe coloré à la fois = carte lisible (contrairement à My Maps qui surcharge la couleur).
- **Chiffre dans le pin** = nombre de marques présentes (lisible quel que soit le mode).
- **Anneau bronze + pin agrandi** = magasin où une **nouvelle DN** a été gagnée (toujours mis en avant).
- **Focus marque** + **Présente / Absente** = cible directement le potentiel (ex. « Nicolas sans Macallan »).
- **★ Mes gains** = n'afficher que les magasins avec une nouvelle DN.
- **Panneau magasin** (clic sur un pin) : statut, contact, notes, dernière visite, marques + références,
  distance depuis « ma position ».
- **Légende & stats** (bas-gauche) : légende dynamique + taux de pénétration par marque + total des DN.

## Structure

```
app/            Pages (carte, connexion) + routes API (geocode, distance)
components/     MapView, StorePanel, AddStoreForm, FilterBar, StatsPanel
lib/            supabase (client + types), constants (enseignes/marques/couleurs), kml (import/export)
supabase/       schema.sql
```
