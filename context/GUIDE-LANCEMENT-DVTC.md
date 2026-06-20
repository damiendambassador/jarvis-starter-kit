# Guide de lancement D-VTC — d-vtc.fr

> Référence complète à consulter en cas de besoin. Mis à jour le 2026-06-20.

---

## Ce qui est en place

### Infrastructure
- **Hébergement** : Vercel (Next.js 14, déploiement automatique sur push `main`)
- **Base de données** : Supabase (PostgreSQL + Auth + Storage)
- **Paiements** : Stripe (abonnements récurrents + webhooks automatiques)
- **Emails** : Resend (emails transactionnels HTML)
- **Domaine** : d-vtc.fr

### Fonctionnalités actives
- Page de réservation publique par chauffeur : `d-vtc.fr/r/[slug]`
- Dashboard chauffeur : `d-vtc.fr/dashboard`
- Dashboard admin : `d-vtc.fr/admin/dashboard`
- Connexion unifiée chauffeur/admin : `d-vtc.fr/connexion`
- Page CGV : `d-vtc.fr/cgv`
- Modal CGV bloquante à la première connexion chauffeur (acceptation obligatoire)
- Création de compte chauffeur → email de bienvenue automatique + résumé CGV + checkout Stripe
- Abonnement Stripe 74€/mois par chauffeur (prélèvement automatique)
- Facturation automatique : chaque paiement réussi → PDF généré → stocké Supabase → email au chauffeur
- Gestion admin des abonnements : pause, résiliation, renvoi de facture
- Page "Mes factures" dans le dashboard chauffeur (téléchargement PDF)
- Notifications en temps réel (nouvelles réservations)

### URLs importantes
- **App production** : https://d-vtc.fr
- **Dashboard Vercel** : https://vercel.com/dashboard (projet "dvtc-app")
- **Dashboard Supabase** : https://supabase.com/dashboard (chercher le projet D-VTC)
- **Dashboard Stripe** : https://dashboard.stripe.com
- **Dashboard Resend** : https://resend.com/overview
- **Repo Git** : https://github.com/damiendambassador/jarvis-starter-kit

---

## Checklist de mise en production

### Supabase
- [ ] **B1 — Migration SQL exécutée** (`supabase/migrations_billing.sql`)
  - Colonnes Stripe sur `drivers` : `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `cgv_accepted_at`, `subscription_start_at`
  - Table `invoices` créée avec RLS
  - Fonction `next_invoice_number()` créée
- [ ] **B2 — Bucket Storage "invoices" créé** (Private, MIME: application/pdf)

### Stripe
- [ ] **C1 — Produit "Abonnement D-VTC" créé** à 74,00 € / mensuel / récurrent (mode Live)
- [ ] **C1 — STRIPE_PRICE_ID noté** (`price_...`)
- [ ] **C2 — Webhook enregistré** sur `https://d-vtc.fr/api/stripe/webhook`
- [ ] **C2 — 5 events configurés** : subscription.created/updated/deleted + invoice.payment_succeeded/failed
- [ ] **C2 — STRIPE_WEBHOOK_SECRET noté** (`whsec_...`)

### Resend
- [ ] **C4 — Domaine d-vtc.fr ajouté et vérifié** dans Resend (enregistrements DNS propagés)
- [ ] **C4 — EMAIL_FROM configuré** (`noreply@d-vtc.fr`)

### Vercel — Variables d'environnement
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PRICE_ID`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`
- [ ] `ADMIN_EMAIL`
- [ ] `ADMIN_PASSWORD`
- [ ] **C5 — Re-deploy forcé** (sans cache) après ajout des variables

### Test end-to-end
- [ ] Build Vercel : status "Ready" sur le dernier commit
- [ ] `d-vtc.fr` : lien "Connexion" visible dans la nav (pas "Espace chauffeur")
- [ ] `d-vtc.fr/cgv` : page accessible avec 11 articles
- [ ] `d-vtc.fr/connexion` : formulaire unique, auto-détection chauffeur/admin
- [ ] Dashboard admin → tab "Chauffeurs" : affiche les chauffeurs existants
- [ ] Dashboard admin → tab "Facturation" : visible
- [ ] Créer un chauffeur test → email reçu (avec résumé CGV + bouton Stripe)
- [ ] Suivre le lien Stripe test et compléter l'abonnement (carte test: 4242 4242 4242 4242)
- [ ] Vérifier que `subscription_status` = 'active' dans Supabase après paiement
- [ ] Vérifier que la facture PDF apparaît dans le dashboard chauffeur
- [ ] Supprimer le chauffeur test depuis l'admin

---

## Étapes manuelles détaillées

### B1 — Migration SQL Supabase

URL : https://supabase.com/dashboard → ton projet → SQL Editor

Copier-coller intégralement le fichier `supabase/migrations_billing.sql` et cliquer "Run".

Vérification : Table Editor → `drivers` → 5 nouvelles colonnes présentes. Table `invoices` visible.

### B2 — Bucket Storage "invoices"

URL : https://supabase.com/dashboard → ton projet → Storage → Buckets → "New bucket"

- Name : `invoices` (exactement)
- Public : **NON**
- MIME types : `application/pdf`

### C1 — Produit Stripe 74€/mois

URL : https://dashboard.stripe.com/products/create (basculer en mode **Live**)

- Name : `Abonnement D-VTC`
- Prix : 74,00 € / mensuel / récurrent
- Après création → copier le Price ID : `price_...`

### C2 — Webhook Stripe

URL : https://dashboard.stripe.com/webhooks → "Add endpoint"

- URL : `https://d-vtc.fr/api/stripe/webhook`
- Events à sélectionner :
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Après création → "Signing secret" → Reveal → copier `whsec_...`

### C3 — Variables Vercel

URL : https://vercel.com/dashboard → D-VTC → Settings → Environment Variables

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key (Reveal) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key (`sk_live_...`) |
| `STRIPE_PRICE_ID` | Stripe → produit créé (`price_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → webhook créé (`whsec_...`) |
| `RESEND_API_KEY` | https://resend.com/api-keys |
| `EMAIL_FROM` | `noreply@d-vtc.fr` (après vérif domaine) |
| `ADMIN_EMAIL` | Ton email admin |
| `ADMIN_PASSWORD` | Mot de passe admin fort (choix libre) |

### C4 — Domaine email Resend

URL : https://resend.com/domains → "Add domain" → `d-vtc.fr`

Ajouter les enregistrements DNS fournis chez ton registrar (OVH, Namecheap...).
Attendre 15-30 min pour la propagation DNS, puis cliquer "Verify".

### C5 — Re-deploy Vercel

Vercel → Deployments → dernier deploy → "..." → "Redeploy" → **décocher "Use existing build cache"**.

---

## Comment ajouter un chauffeur (flow complet)

1. **Se connecter à l'admin** : https://d-vtc.fr/connexion (avec ADMIN_EMAIL + ADMIN_PASSWORD)

2. **Cliquer "Ajouter un chauffeur"** (bouton haut à droite du dashboard)

3. **Remplir le formulaire** :
   - Nom complet → le slug est généré automatiquement (ex: "Patrick Martin" → `patrick-martin`)
   - Email du chauffeur
   - Mot de passe temporaire pré-généré (12 caractères, sécurisé)

4. **Cliquer "Créer le compte chauffeur"**

5. **Ce qui se passe automatiquement** :
   - Compte Supabase Auth créé (email confirmé automatiquement — pas besoin que le chauffeur confirme)
   - Entrée `drivers` + tarification par défaut insérée en base
   - Customer Stripe créé avec l'email du chauffeur
   - Session de checkout Stripe générée (lien valide 24h)
   - Email de bienvenue envoyé avec :
     - Bouton "Activer mon abonnement D-VTC" (lien checkout Stripe)
     - Résumé des articles 1, 3, 4, 5 des CGV + lien vers d-vtc.fr/cgv
     - Page de réservation à partager aux clients
     - Identifiants de connexion (email + mot de passe temporaire)

6. **Copier les infos affichées** dans la modale de confirmation :
   - Page de réservation : `https://d-vtc.fr/r/[slug]`
   - Lien paiement Stripe (backup si le chauffeur n'a pas cliqué depuis l'email)

7. **Le chauffeur doit** :
   - Se connecter sur d-vtc.fr/connexion avec ses identifiants
   - Accepter les CGV (modale bloquante, lecture + checkbox obligatoire)
   - Cliquer le lien Stripe pour activer son abonnement 74€/mois
   - Changer son mot de passe depuis Paramètres

---

## Comment fonctionne la facturation automatique

```
Chauffeur clique "Activer mon abonnement" (email ou dashboard)
        ↓
Stripe Checkout : saisie CB, validation
        ↓
Stripe crée l'abonnement → customer.subscription.created
        ↓
Webhook POST → /api/stripe/webhook
        ↓
BDD mise à jour : subscription_status = 'active'
                  stripe_subscription_id = sub.id
                  subscription_start_at = date
        ↓
[Chaque 1er du mois — géré automatiquement par Stripe]
        ↓
Stripe prélève 74€ → invoice.payment_succeeded
        ↓
Webhook POST → /api/stripe/webhook
        ↓
Numéro séquentiel généré : DVTC-2026-001, DVTC-2026-002…
        ↓
PDF généré (@react-pdf/renderer) avec :
  nom chauffeur, période, montant, SIRET, mentions légales
        ↓
PDF uploadé → Supabase Storage bucket "invoices"
  path: [driver_id]/DVTC-YYYY-NNN.pdf
        ↓
Entrée insérée dans table "invoices"
        ↓
Email envoyé au chauffeur :
  "Votre facture DVTC-2026-NNN" + PDF en pièce jointe
        ↓
Chauffeur peut aussi télécharger depuis Dashboard → "Mes factures"
```

### En cas d'échec de paiement

- Stripe retente automatiquement (configurable dans le dashboard Stripe)
- À chaque échec : `subscription_status` = 'past_due' + email d'alerte à l'admin (ADMIN_EMAIL)
- Après les tentatives échouées : abonnement suspendu → `is_active = false`, `subscription_status = 'cancelled'`

### Actions admin disponibles (tab "Facturation")

- **Pause** : suspend la facturation sans résilier (chauffeur garde l'accès)
- **Résilier** : met fin à l'abonnement en fin de période en cours
- **Renvoyer** : renvoi de la dernière facture par email avec PDF en pièce jointe

---

## Architecture technique

### Stack
- **Framework** : Next.js 14 (App Router, TypeScript strict)
- **Styling** : TailwindCSS
- **Auth** : Supabase Auth (JWT, email confirmé automatiquement)
- **BDD** : Supabase PostgreSQL avec Row Level Security
- **Paiements** : Stripe SDK v22 (abonnements récurrents)
- **Emails** : Resend v3 (HTML transactionnel)
- **PDF** : @react-pdf/renderer v4 (génération server-side Node.js)
- **Icons** : lucide-react
- **Analytics** : Vercel Analytics

### Structure des fichiers clés

```
app/
├── page.tsx                        — Landing page marketing
├── connexion/page.tsx              — Connexion unifiée chauffeur + admin
├── cgv/page.tsx                    — CGV publiques (11 articles)
├── dashboard/
│   ├── layout.tsx                  — Modal CGV bloquante + guard auth
│   ├── page.tsx                    — Dashboard chauffeur (stats + réservations en attente)
│   ├── factures/page.tsx           — Liste des factures + téléchargement PDF
│   ├── reservations/page.tsx       — Historique complet des réservations
│   ├── clients/page.tsx            — Gestion des clients
│   ├── calendar/page.tsx           — Vue calendrier
│   └── settings/page.tsx           — Paramètres + changement MDP
├── admin/dashboard/page.tsx        — Dashboard admin (chauffeurs + facturation)
├── r/[slug]/page.tsx               — Page de réservation publique
└── api/
    ├── admin/
    │   ├── data/route.ts               — Auth admin + liste chauffeurs + stats
    │   ├── create-driver/route.ts      — Création compte + email + Stripe
    │   ├── update-driver/route.ts      — Modification chauffeur
    │   ├── delete-driver/route.ts      — Suppression complète
    │   └── stripe/
    │       ├── pause/route.ts              — Pause abonnement
    │       ├── cancel/route.ts             — Résiliation abonnement
    │       └── resend-invoice/route.ts     — Renvoi facture PDF
    ├── driver/
    │   ├── accept-cgv/route.ts         — Acceptation CGV (cgv_accepted_at)
    │   └── invoice-url/route.ts        — Signed URL téléchargement PDF (1h)
    ├── stripe/webhook/route.ts         — Webhooks Stripe (facturation auto)
    ├── webhook/reservations/route.ts   — Webhooks Supabase (emails réservations)
    └── test/invoice-pdf/route.ts       — TEST UNIQUEMENT: aperçu PDF (local uniquement)

lib/
├── supabase.ts         — Client Supabase + types TypeScript
├── invoice-pdf.tsx     — Génération PDF factures (react-pdf)
├── auth.ts             — Helpers auth
└── pricing.ts          — Calcul tarification

supabase/
├── schema.sql              — Schéma complet (tables de base)
└── migrations_billing.sql  — Migration facturation (à exécuter une seule fois)
```

### Variables d'environnement (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=          # https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # eyJ... (clé publique)
SUPABASE_SERVICE_ROLE_KEY=         # eyJ... (clé admin — JAMAIS exposée côté client)
STRIPE_SECRET_KEY=                 # sk_live_... (clé secrète Stripe)
STRIPE_PRICE_ID=                   # price_... (produit 74€/mois)
STRIPE_WEBHOOK_SECRET=             # whsec_... (secret webhook)
RESEND_API_KEY=                    # re_... (clé API Resend)
EMAIL_FROM=                        # noreply@d-vtc.fr
ADMIN_EMAIL=                       # Email administrateur D-VTC
ADMIN_PASSWORD=                    # Mot de passe administrateur D-VTC
```

---

## Où trouver quoi en cas de problème

### Build Vercel cassé
Vercel → projet → Deployments → cliquer le build raté → "Build logs"
Erreur TypeScript la plus fréquente : admin/data/route.ts (type mismatch si colonnes Stripe manquantes)

### Email non reçu après création d'un chauffeur
1. https://resend.com/emails — historique de tous les envois
2. Vérifier RESEND_API_KEY et EMAIL_FROM dans Vercel env vars
3. Vercel → Functions logs → filtrer sur `/api/admin/create-driver`

### Webhook Stripe ne déclenche pas
1. https://dashboard.stripe.com/webhooks → cliquer le webhook → "Recent deliveries"
2. Vérifier que l'URL est exactement `https://d-vtc.fr/api/stripe/webhook`
3. Vérifier que STRIPE_WEBHOOK_SECRET correspond au webhook enregistré
4. Vercel → Functions logs → filtrer sur `/api/stripe/webhook`

### Facture PDF non générée ou non envoyée
1. Supabase → Storage → bucket "invoices" : vérifier que le fichier existe
2. Vérifier SUPABASE_SERVICE_ROLE_KEY (droits d'écriture Storage)
3. Vercel → Functions logs → chercher l'erreur dans `/api/stripe/webhook`

### Abonnement Stripe non lié au chauffeur (subscription_status reste 'pending')
1. Vérifier que la migration SQL a été exécutée (colonne `stripe_customer_id` existe)
2. Stripe → Customers → chercher par email → vérifier metadata `driver_id`
3. Vérifier les livraisons du webhook `customer.subscription.created`

### Le chauffeur ne peut pas se connecter
1. Supabase → Authentication → Users → chercher l'email → vérifier "Email confirmed" = true
2. Si non confirmé : cliquer "Send confirmation email" ou confirmer manuellement
3. Le code crée le compte avec `email_confirm: true` — si problème c'est un bug Supabase

### Tester la génération PDF
En local uniquement : http://localhost:3000/api/test/invoice-pdf
Le PDF fictif s'affiche directement dans le navigateur.

---

## Informations légales D Embassy (micro-entrepreneur)

| Champ | Valeur |
|---|---|
| Raison sociale | D Embassy |
| Statut | Micro-entrepreneur |
| SIRET | 10073363300018 |
| Code APE | 7022Z |
| TVA | Non applicable — art. 293B du CGI |
| Email contact | damiendambassador@gmail.com |
| Ville | Ivry-sur-Seine (94200) |

---

## Accès et dashboards

| Service | URL | Accès |
|---|---|---|
| App D-VTC | https://d-vtc.fr | public |
| Admin D-VTC | https://d-vtc.fr/connexion | ADMIN_EMAIL + ADMIN_PASSWORD |
| Vercel | https://vercel.com/dashboard | compte Damien |
| Supabase | https://supabase.com/dashboard | compte Damien |
| Stripe | https://dashboard.stripe.com | compte Damien |
| Resend | https://resend.com | compte Damien |
| Git | https://github.com/damiendambassador/jarvis-starter-kit | compte GitHub Damien |
