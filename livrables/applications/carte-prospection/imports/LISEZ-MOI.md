# Adresses cavistes — base de prospection

> ✅ **Base déjà chargée le 24/06/2026 : 1145 magasins** (8 enseignes, France métropole + DOM),
> tous géocodés, sans doublon ni magasin étranger. Ces fichiers restent ici comme
> **référence / sauvegarde** (et pour un éventuel réimport).

## Contenu de la base

| Fichier                          | Enseigne                | En base |
|----------------------------------|-------------------------|--------:|
| `01-nicolas.tsv`                 | Nicolas                 | 497 |
| `02-vandb.tsv`                   | V and B                 | 292 |
| `03-cavavin.tsv`                 | Cavavin                 | 133 |
| `05-comptoir-des-vignes.tsv`     | Comptoir des Vignes     |  59 |
| `06-intercaves.tsv`              | Intercaves              |  45 |
| `07-repaire-de-bacchus.tsv`      | Repaire de Bacchus      |  33 |
| `08-comptoir-irlandais.tsv`      | Le Comptoir Irlandais   |  55 |
| `09-nysa.tsv`                    | Nysa                    |  31 |
| `10-julien-de-savignac.tsv`      | Julien de Savignac      |  11 |
| **Total**                        |                         | **1156** |

> Note : La Vignery (23 magasins) et Julien de Savignac (11) ont été ajoutés le 26/06/2026
> via KML / `.tsv`. Total base à jour : ~1179 magasins.

Format des `.tsv` : **Nom ⇥ Adresse ⇥ Code postal** (tabulation).
`cavistes-manquants.kml` regroupe Repaire / Nysa / Comptoir Irlandais / Intercaves avec
coordonnées GPS (sauvegarde ; la base est déjà à jour).

## Réimporter un fichier (si besoin)

1. Ouvrir l'app → **« Coller une liste »** → choisir l'**enseigne** dans le menu.
2. Ouvrir le `.tsv`, tout copier (Ctrl+A / Ctrl+C), coller, **Importer & géocoder**.

> Le chargement de la carte pagine au-delà de 1000 magasins (limite Supabase corrigée).

## À faire à la main

- ✅ **La Vignery** (23 magasins) : importée le 26/06/2026 via KML.
- ✅ **Julien de Savignac** (11 magasins) : voir `10-julien-de-savignac.tsv`.

## Notes

- Source : store locators officiels de chaque enseigne (juin 2026), géocodage via la
  **Base Adresse Nationale** (gratuite).
- Magasins **hors France retirés** (Maroc, Belgique, Espagne, Maurice, Madagascar, UK, Suisse…).
- Comptoir Irlandais : 8 magasins sans code postal source → ville ajoutée à l'adresse.
- Quelques adresses Cavavin / Comptoir des Vignes en majuscules (sans incidence géocodage).
