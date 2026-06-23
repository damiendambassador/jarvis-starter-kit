# Adresses cavistes — fichiers prêts à importer

Chaque fichier est au format **Nom ⇥ Adresse ⇥ Code postal** (séparé par tabulation),
directement compatible avec « Coller une liste » de la carte de prospection.
L'app géocode automatiquement chaque adresse (lat/lng + ville) via Google.

## Comment importer

1. Ouvrir l'app → bouton **« Coller une liste »**
2. Dans le menu **Enseigne**, choisir l'enseigne correspondant au fichier (voir tableau)
3. Ouvrir le fichier `.tsv`, tout sélectionner (Ctrl+A), copier (Ctrl+C), coller dans la zone
4. **Importer & géocoder**
5. Répéter pour chaque fichier

## Fichiers

| Fichier                          | Enseigne à sélectionner | Magasins |
|----------------------------------|-------------------------|---------:|
| `01-nicolas.tsv`                 | Nicolas                 | 516 |
| `02-vandb.tsv`                   | V and B                 | 292 |
| `03-cavavin.tsv`                 | Cavavin                 | 133 |
| `05-comptoir-des-vignes.tsv`     | Comptoir des Vignes     |  59 |
| `06-intercaves.tsv`              | Intercaves              |  47 |
| `07-repaire-de-bacchus.tsv`      | Repaire de Bacchus      |  33 |
| `08-comptoir-irlandais.tsv`      | Le Comptoir Irlandais   |  55 |
| `09-nysa.tsv`                    | Nysa                    |  31 |
| **Total**                        |                         | **1166** |

## À faire à la main

- **La Vignery** (~21 magasins) : leur store locator bloque l'extraction automatique.
  À saisir manuellement depuis https://www.lavignery.fr/magasins

## Notes

- Source : store locators officiels de chaque enseigne (juin 2026).
- Magasins **hors France métropole/DOM retirés** (Belgique, Maroc, Madagascar, UK, Suisse, etc.).
- Comptoir Irlandais : 8 magasins sans code postal dans la source ; la ville a été
  ajoutée à l'adresse pour un géocodage correct.
- Quelques adresses Cavavin / Comptoir des Vignes sont en majuscules (sans incidence
  sur le géocodage).
