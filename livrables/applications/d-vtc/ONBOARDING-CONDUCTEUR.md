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

## Points techniques (si bug)

- Les emails partent depuis `reservations@d-vtc.fr` via Resend (compte `damiendambassador`)
- La clé Resend dans Vercel doit être celle du compte `damiendambassador` (pas `patrick.d.vtc`)
- La suppression de réservations test se fait depuis le dashboard admin → vue d'un conducteur → onglet Réservations → icône poubelle (admin uniquement)
