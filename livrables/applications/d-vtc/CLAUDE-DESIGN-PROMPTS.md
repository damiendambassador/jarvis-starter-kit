# Prompts Claude Design — Plateforme D-VTC

> Colle chaque prompt directement dans Claude Design (claude.ai, onglet Artifacts).
> Itère sur le design, puis partage le code généré avec Jordi pour intégration.

---

## Palette de couleurs (à mentionner dans chaque prompt)

- Marine : `#0A1628`
- Or : `#C9A84C`
- Fond : `#F8F9FA`
- Gris clair : `#E8EDF5`
- Vert : `#2ECC71`
- Rouge : `#E74C3C`

---

## ÉCRAN 1 — Page de réservation (vue client)

```
Crée une page de réservation pour une application VTC premium appelée D-VTC.

Stack : React + Tailwind CSS.
Palette : fond #F8F9FA, marine #0A1628, or #C9A84C, gris clair #E8EDF5.
Style : sobre, premium, minimaliste. Icônes Lucide React. Aucun emoji dans l'interface.
Police : Inter.

MISE EN PAGE :
- Header marine foncé avec "Service privé VTC" en petites majuscules or, et le nom du chauffeur en blanc
- Section hero marine avec "Réservez votre chauffeur," en gras blanc, puis "en toute simplicité." en or
- Bandeau blanc horizontal avec 3 cards de tarification :
  * Card 1 (Trajets standards) : icône voiture, "À partir de 5€ + 1.66€/km", mention majoration nuit 30%
  * Card 2 (Mise à disposition) : icône horloge, "À partir de 70€ pour 2h", journée 250€
  * Card 3 (Programme fidélité) : fond or très léger, bord or, étoile, "-10% automatique dès la 5ème course"
- Body en 2 colonnes sur desktop (2/3 formulaire, 1/3 récap fixe), 1 colonne sur mobile

FORMULAIRE (colonne gauche) :
- Section "Vos coordonnées" : 4 champs (Prénom, Nom, Téléphone, Email) en grille 2 colonnes
- Section "Date et heure" : calendrier mois picker minimaliste + sélecteur heure (dropdown 30min) + 4 boutons passagers (1/2/3/4) sélectionnables
- Section "Mode de course" : 2 cards sélectionnables (Trajet simple / Mise à disposition), actif = marine avec texte blanc ; si Trajet simple, afficher 2 champs adresse (départ avec icône grise, arrivée avec icône or) + champ distance km ; si Mise à dispo, afficher champ lieu de prise en charge + encadré or avec tarifs
- Section "Note optionnelle" : textarea gris clair, placeholder "Bagages, animal, demande particulière..."
- Checkbox politique de confidentialité en texte xs gris

RÉCAPITULATIF (colonne droite, sticky) :
- Card blanche avec "Votre course" en titre
- Ligne distance — km (dynamique)
- Ligne durée estimée — min
- Séparateur ligne
- TOTAL en grand (24px bold) en or, avec "Tarif tout compris — TVA non applicable, art. 293B du CGI" en xs gris
- Gros bouton marine pleine largeur "Envoyer ma réservation →" (désactivé si champs manquants, avec compteur "X champs manquants")

Footer marine, texte blanc/40, "Service propulsé par D Embassy"
```

---

## ÉCRAN 2 — Page de confirmation (client après réservation)

```
Crée une page de confirmation de réservation pour une application VTC premium.

Stack : React + Tailwind CSS. Palette : fond #F8F9FA, marine #0A1628, or #C9A84C.
Style : sobre, rassurant, minimaliste. Icônes Lucide React. Police Inter.

CONTENU :
- Header marine avec "D-VTC — [Nom chauffeur]" en xs or
- Corps centré, max 520px :
  * Cercle vert pâle avec icône CheckCircle verte (32px)
  * H1 "Réservation envoyée" en gras marine
  * Sous-titre gris "Votre chauffeur va examiner votre demande et vous confirmer sous peu."
  * Card blanche avec récap : date/heure formatée en français, départ → arrivée, type de course, nb passagers, estimation de prix en or
  * Encadré marine/5 "Prochaines étapes" avec 3 étapes numérotées en cercles or pâle
  * Lien texte "Faire une nouvelle réservation" souligné
- Footer marine petit

STYLE des étapes :
1. Cercle numéroté fond or/20 texte or — "Votre chauffeur examine votre demande"
2. — "Vous recevez un email de confirmation"
3. — "Le jour J, votre chauffeur est à l'heure"
```

---

## ÉCRAN 3 — Page de connexion chauffeur

```
Crée une page de connexion pour le dashboard d'un chauffeur VTC privé (application D-VTC).

Stack : React + Tailwind CSS. Palette : fond #0A1628 (marine foncé), or #C9A84C.
Style : premium, sobre, full-page login. Icônes Lucide React. Police Inter.

MISE EN PAGE : fond marine pleine hauteur, carte blanche centrée (max 420px), légère ombre

CARTE :
- En haut de la carte : logo D-VTC (initiales "D" en or sur carré marine foncé, taille 40px)
- Titre "Espace conducteur" en marine bold
- Sous-titre "Accédez à votre tableau de bord" en gris xs
- Champ email (icône Mail, label "Email")
- Champ mot de passe (icône Lock, label "Mot de passe", icône Eye pour afficher)
- Bouton pleine largeur marine "Se connecter →"
- Lien "Mot de passe oublié ?" centré en xs or

FOOTER de la page (hors carte) : "Service propulsé par D Embassy" blanc/40
```

---

## ÉCRAN 4 — Dashboard chauffeur (accueil)

```
Crée le dashboard principal d'un chauffeur VTC privé (application D-VTC).

Stack : React + Tailwind CSS. Palette : fond #F8F9FA, marine #0A1628, or #C9A84C, gris #E8EDF5.
Style : dashboard professionnel, sobre. Icônes Lucide React. Police Inter.

NAVIGATION LATÉRALE (desktop) ou BARRE EN BAS (mobile) :
- Logo D-VTC (initiales "D" en or sur fond marine)
- Liens : Tableau de bord (actif), Réservations, Clients, Calendrier, Paramètres
- Lien actif : fond marine/10, texte marine, trait or à gauche
- En bas : bouton "Déconnexion" avec icône LogOut

BODY :
Header : "Tableau de bord" + sous-titre "Bienvenue, [Nom du chauffeur]" + bouton "Exporter le mois" (outline)

5 STAT CARDS en ligne horizontale (scrollable mobile) :
1. "Courses aujourd'hui" — valeur 3 en marine bold
2. "Revenus semaine" — valeur "0.00 €" en or bold 
3. "Clients total" — valeur 12
4. "Clients fidèles" — valeur 4 (badge or "Fidèles")
5. "Mises à dispo (mois)" — valeur 2

SECTION "Réservations en attente" (titre + badge compteur rouge) :
- 2-3 cards de réservation en attente
- Chaque card : nom client, téléphone, date/heure, type de course, adresse, prix estimé, boutons "Accepter" (marine) et "Refuser" (outline rouge)
- Si aucune réservation : état vide avec icône Calendar et "Aucune réservation en attente"
```

---

## ÉCRAN 5 — Liste des réservations

```
Crée la page de gestion des réservations pour le dashboard chauffeur D-VTC.

Stack : React + Tailwind CSS. Même palette et navigation que l'écran 4.

FILTRES EN HAUT :
- Onglets ou boutons pills : Toutes | En attente (badge rouge) | Acceptées | Refusées | Terminées
- Tri "Du plus récent" (dropdown)
- Compteur "X réservations"

LISTE DE RÉSERVATIONS :
Chaque card reservation contient :
- Ligne 1 : Nom client + téléphone + badges statut (En attente = amber, Acceptée = vert, Refusée = rouge, Terminée = gris) + type (Standard/Nuit/Mise à dispo)
- Ligne 2 : Icône calendrier — Date et heure
- Ligne 3 : Icône carte — Départ → Arrivée
- Ligne 4 (si notes) : icône note en italic — notes du client
- Colonne droite : Prix estimé en or bold + distance + durée
- Pour les réservations "en attente" uniquement : boutons "Accepter" (fond marine) et "Refuser" (outline rouge)

ÉTAT VIDE : illustration simple, "Aucune réservation pour ce filtre"
```

---

## ÉCRAN 6 — Liste des clients

```
Crée la page de gestion des clients pour le dashboard chauffeur D-VTC.

Stack : React + Tailwind CSS. Même palette et navigation que l'écran 4.

HEADER :
- Titre "Clients" + compteur "X au total"
- Barre de recherche pleine largeur (icône Search, placeholder "Rechercher par nom ou téléphone...")

GRILLE DE CLIENTS (2 colonnes desktop, 1 colonne mobile) :
Chaque card client :
- Nom du client en bold (+ badge "Fidèle" en or si is_loyal)
- Téléphone cliquable (icône Phone)
- 2 métriques : "Courses" (nombre) + "Total CA" (montant en or)
- Icône poubelle pour supprimer (hover rouge)
- Clic sur la card : ouvre un panel latéral ou modal avec le détail du client et l'historique de ses réservations

ÉTAT VIDE : "Aucun client enregistré. Les clients apparaîtront après leur première réservation."
```

---

## ÉCRAN 7 — Calendrier

```
Crée la vue calendrier pour le dashboard chauffeur D-VTC.

Stack : React + Tailwind CSS. Même palette et navigation que l'écran 4.

CALENDRIER MENSUEL :
- Header : chevrons < et > pour naviguer entre les mois + "Juin 2026" centré
- Grille 7 colonnes (LUN MAR MER JEU VEN SAM DIM) en xs uppercase gris
- Cases calendrier : fond blanc, date en haut à gauche, jours du mois courant en marine, autres mois en gris clair
- Aujourd'hui : date soulignée or ou cercle or léger
- Événements : petits blocs colorés avec texte xs (tronqué si plusieurs par jour)
- Couleurs des événements :
  * Standard : fond #0A1628 texte blanc
  * Nuit : fond #1a2a4a texte blanc (marine plus foncé)
  * Mise à dispo : fond #C9A84C texte marine
  * Bloqué : fond #E8EDF5 texte #999

LÉGENDE en bas : carré couleur + label pour chaque type

CLIC sur un événement : modal ou tooltip avec détails de la réservation
```

---

## ÉCRAN 8 — Paramètres chauffeur

```
Crée la page de paramètres pour le dashboard chauffeur D-VTC.

Stack : React + Tailwind CSS. Même palette et navigation que l'écran 4.

SECTIONS AVEC CARDS :

1. "Mon profil"
   - Champs : Nom complet, Téléphone, Email (lecture seule)
   - Bouton "Enregistrer" en bas

2. "Mon véhicule"
   - Champs : Modèle, Plaque d'immatriculation, Capacité (dropdown 1-7)

3. "Ma tarification"
   - Champs en grille 2 colonnes :
     * Prix de base (€), Prix par km (€/km)
     * Majoration nuit (%), Mise à dispo 2h (€)
     * Journée complète (€), Km inclus mise à dispo
     * Seuil fidélité (nème course), Remise fidélité (%)
   - Aperçu en temps réel à droite : exemple de calcul avec les valeurs actuelles

4. "Mon lien de réservation"
   - Lien complet affiché (ex: dvtc.app/r/patrick-vtc) dans un encadré gris
   - Bouton "Copier le lien" avec icône Copy
   - Texte "Partagez ce lien à vos clients pour qu'ils réservent directement chez vous."

Chaque section a un titre uppercase xs gris, et un bouton "Enregistrer les modifications" (marine, pleine largeur).
```

---

## Notes d'intégration

- Toutes les couleurs utilisent les valeurs hex ci-dessus, pas de couleurs Tailwind generiques
- Les composants doivent être des fonctions React avec des props claires (pas de données hardcodées)
- Mobile-first : les colonnes desktop deviennent des blocs empilés sur mobile
- Les états loading/vide/erreur doivent être intégrés dans chaque composant
