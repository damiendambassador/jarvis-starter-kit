# /commit

> Commande pour sauvegarder l'état du workspace dans Git.

---

## Mission

Quand je lance `/commit`, exécute la séquence suivante :

### Étape 1 : Vérifier l'état du dépôt

- Si le dépôt Git n'existe pas encore (`git status` échoue), initialise-le avec `git init`
- Lance `git status` pour voir les fichiers modifiés, ajoutés, supprimés
- Lance `git diff --stat` pour avoir un résumé visuel des changements

### Étape 2 : Me présenter un résumé

Affiche-moi :
- La liste des fichiers qui vont être commités
- Un message de commit suggéré (court, en français, au présent)

Format du message suggéré : `type: description courte`

Types possibles :
- `ajout` : nouveau fichier ou nouvelle fonctionnalité
- `mise à jour` : modification d'un fichier existant
- `suppression` : suppression de fichiers
- `config` : changement de configuration
- `contexte` : mise à jour des fichiers de contexte

Exemples :
- `ajout: structure livrables/ et gestion des secrets`
- `mise à jour: CONTEXT.md avec nouveau projet client`
- `config: .gitignore et variables d'environnement`

### Étape 3 : Demander confirmation

Pose-moi la question :

> "Je vais commiter ces fichiers avec le message : **[message suggéré]**. Tu veux modifier le message ou je valide ?"

### Étape 4 : Exécuter le commit

Une fois que je valide (ou que je donne un message alternatif) :

1. `git add .` pour stager tous les fichiers (en excluant ce que .gitignore protège)
2. `git commit -m "[message validé]"`
3. Confirme que le commit a bien été créé avec `git log --oneline -3`

---

## Règles importantes

- Ne jamais commiter `.env` (vérifie que .gitignore est en place)
- Si c'est le premier commit du dépôt, précise-le dans ta réponse
- Toujours attendre ma validation avant d'exécuter le commit
- Le message de commit doit être court (1 ligne, max 72 caractères)
- Pas de `--no-verify`, pas de contournement des hooks Git
