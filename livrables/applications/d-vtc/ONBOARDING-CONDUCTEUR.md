# Onboarding d'un nouveau conducteur D-VTC

## 1. Créer le compte (admin)

1. Aller sur `d-vtc.fr/connexion` → se connecter en tant qu'admin
2. Cliquer sur **"Ajouter un chauffeur"** (bouton en haut à droite)
3. Remplir le formulaire :
   - Nom complet (le slug `/r/prenom-nom` se génère automatiquement)
   - Email du conducteur
   - Mot de passe temporaire (généré auto, peut être regénéré)

---

## 2. Ce que tu récupères après création

La modale affiche 4 champs à copier/envoyer au conducteur :

| Info | Valeur |
|------|--------|
| Page de réservation (clients) | `d-vtc.fr/r/son-slug` |
| Accès dashboard | `d-vtc.fr/dashboard` |
| Email de connexion | *(celui saisi)* |
| Mot de passe temporaire | *(généré)* |
| Lien paiement Stripe | *(généré si applicable)* |

---

## 3. Ce que tu transmets au conducteur

Copie-colle ce message :

> Voici tes accès D-VTC :
>
> **Ta page de réservation** (à partager à tes clients) :
> `https://d-vtc.fr/r/[son-slug]`
>
> **Ton espace conducteur** : `https://d-vtc.fr/dashboard`
> Email : `[son-email]`
> Mot de passe temporaire : `[mot-de-passe]`
>
> Tu peux changer ton mot de passe depuis Paramètres → Sécurité.

---

## 4. Ce qui est automatique ensuite

- Nouvelle réservation sur sa page → il reçoit un email de notification
- Il accepte/refuse → le client reçoit un email de confirmation
- Ses réservations et clients sont isolés (il ne voit que les siens)
- Son abonnement (74€/mois) se gère depuis l'onglet **Facturation** de l'admin

---

## 5. Stripe et facturation

### 5.1 Le lien de paiement

- Le lien est **généré automatiquement** à la création du compte et apparaît dans la modale de confirmation (champ "Lien paiement Stripe")
- Il est **envoyé automatiquement par email** au chauffeur avec un bouton "Activer mon abonnement D-VTC →" — aucune action manuelle nécessaire
- Il **expire après 24h** (comportement Stripe standard)

**Si l'email n'arrive pas :**
1. Copier le lien depuis la modale et l'envoyer manuellement au chauffeur
2. Vérifier les logs Vercel pour diagnostiquer : dashboard.vercel.com → projet d-vtc → onglet Logs → rechercher `[create-driver] Resend email error`
3. L'email peut aussi finir en spam, demander au chauffeur de vérifier

**Si le lien a expiré :**
1. Aller sur dashboard.stripe.com → Customers
2. Rechercher le chauffeur par email
3. Dans sa fiche → onglet Subscriptions → "Create subscription" pour générer un nouveau lien de paiement

---

### 5.2 L'espace facturation (admin)

Accès : `d-vtc.fr/connexion` → onglet **Facturation** (à droite de "Chauffeurs")

**Ce qu'on y voit :**
- MRR total, nombre d'abonnements actifs, en retard, résiliés
- Tableau de tous les chauffeurs avec leur statut d'abonnement

**Signification des statuts :**

| Statut | Signification |
|--------|--------------|
| En attente | Le chauffeur n'a pas encore cliqué sur son lien Stripe (pas d'abonnement actif) |
| Actif | Abonnement en cours, prélèvement mensuel automatique opérationnel |
| En retard | Paiement échoué — Stripe relance automatiquement (3 tentatives avant suspension) |
| En pause | Abonnement suspendu manuellement par l'admin |
| Résilié | Compte fermé |

**Les boutons d'actions (Pause, Résilier, Renvoyer facture)** n'apparaissent que pour les chauffeurs avec un abonnement Stripe existant (statut Actif ou En retard). C'est normal : tant que le chauffeur n'a pas payé (statut En attente), aucune action Stripe n'est possible.

---

### 5.3 Documents légaux (CGV)

- **CGV complètes** : accessibles publiquement sur `d-vtc.fr/cgv` (11 articles). À envoyer si le chauffeur veut les lire avant de s'abonner.
- **Résumé dans l'email de bienvenue** : les articles clés (prix, paiement, résiliation) sont inclus automatiquement dans l'email envoyé à la création du compte.
- **Acceptation obligatoire** : à la première connexion sur le dashboard, une modal bloquante demande au chauffeur de cocher "J'accepte les CGV". Il ne peut pas accéder au dashboard sans. La date d'acceptation est enregistrée en base (preuve légale).

Aucune action manuelle à faire de ta part.

---

## Points techniques (si bug)

- Les emails partent depuis `reservations@d-vtc.fr` via Resend (compte `damiendambassador`)
- La clé Resend dans Vercel doit être celle du compte `damiendambassador` (pas `patrick.d.vtc`)
- La suppression de réservations test se fait depuis le dashboard admin → vue d'un conducteur → onglet Réservations → icône poubelle (admin uniquement)
