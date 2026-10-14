# Brief logo

## Objectif
Créer un symbole simple, mémorisable et reconnaissable.

## Concept
Mélange abstrait de :
- construction
- technologie
- progression
- IA

## Versions nécessaires
- Logo principal
- Logo horizontal
- Icône seule
- Version claire
- Version sombre
- Version monochrome
- Favicon

## Style
Minimal, premium, moderne.
Éviter les logos trop complexes ou trop illustratifs.

## Livré

Concept retenu : trois barres ascendantes (silhouette de construction + progression), la plus haute se terminant par un nœud/signal (IA), dans le gradient signature Electric Blue → Electric Violet.

Fichiers dans [`/static/logo`](../../static/logo) (servis directement par l'app à la racine `/logo/...`) :

| Version | Fichier | Aperçu |
|---|---|---|
| Icône seule | `icon.svg` | ![Icône ChantierBot](../../static/logo/icon.svg) |
| Icône monochrome (`currentColor`) | `icon-mono.svg` | ![Icône monochrome](../../static/logo/icon-mono.svg) |
| Logo horizontal — fond clair | `logo-horizontal-light.svg` | ![Logo horizontal fond clair](../../static/logo/logo-horizontal-light.svg) |
| Logo horizontal — fond sombre | `logo-horizontal-dark.svg` | ![Logo horizontal fond sombre](../../static/logo/logo-horizontal-dark.svg) |
| Favicon | `/favicon.svg` (racine `static/`) | ![Favicon](../../static/favicon.svg) |

Le logo principal = version horizontale ; la version claire et la version sombre couvrent les usages sur fond clair/sombre ; `icon-mono.svg` sert de version monochrome (hérite de la couleur du texte via `currentColor`).

Intégré dans l'app : en-tête (`src/routes/+layout.svelte`) et favicon (`src/app.html`).

## Mise à jour 2026-10-14 — logo robot (en vigueur)

Le logo en vigueur est le **robot ChantierBot** : casque de chantier jaune portant une maison, visière sombre aux yeux lumineux, accompagné du mot-symbole « Chantier**Bot** » (Barlow Condensed ExtraBold ; « Chantier » blanc ou bleu nuit, « Bot » orange `#FFB020`) extrudé en 3D, et du slogan *Votre allié sur tous vos chantiers*.

| Usage | Fichier / composant |
|---|---|
| Logo horizontal 3D, fond sombre | `static/logo/chantierbot-3d.svg` |
| Logo horizontal 3D, fond clair | `static/logo/chantierbot-3d-light.svg` |
| Icône d'application / favicon | `static/favicon.svg` |
| Robot complet (illustration) | `static/assets/robot/chantierbot-3d.svg` |
| Dans l'interface (animé) | `RobotBot.svelte` (robot) et `Logo.svelte` (robot + mot-symbole) |

Animations du robot (CSS, désactivées si « réduire les animations » est actif) : flottement, clignement des yeux, légère inclinaison de la tête, salut de la main, halo de l'oreille. Variante « working » : flottement accéléré.

Les anciens logos « trois barres » (`icon.svg`, `logo-horizontal-*.svg`) restent dans `static/logo` mais ne sont plus utilisés dans l'interface.
