---
name: economie-tokens
description: Règles pour travailler sur ChantierBot en consommant le moins de tokens possible (lecture ciblée des fichiers, sorties de commandes filtrées, tests ciblés, pas de relecture inutile). À appliquer à chaque session sur ce dépôt, et dès que l'utilisateur parle de tokens, de coût, de contexte trop long ou de lenteur.
---

# Économie de tokens — ChantierBot

Objectif : obtenir le même résultat avec le moins de contexte possible. Chaque lecture, sortie de commande et réponse coûte des tokens.

## 1. Lire juste ce qu'il faut
- **Chercher avant de lire** : `Grep` (motif précis, `output_mode: "content"`, `-n`) pour trouver la ligne, puis `Read` avec `offset` / `limit` autour (30 à 60 lignes), jamais le fichier entier sans raison.
- **Ne pas relire un fichier qu'on vient d'écrire ou de modifier** : l'outil d'édition échoue si le texte ne correspond pas.
- **Fichiers « une ligne géante »** (`src/routes/planning|relances|fournisseurs|commandes|clients|rapports/+page.svelte`, `src/routes/+page.svelte`) : le balisage tient sur quelques lignes très longues. Utiliser `grep -o 'motif.\{0,200\}'` pour n'extraire que le morceau utile.
- **Ne jamais lire** `node_modules/`, `.svelte-kit/`, `package-lock.json`, les SVG du logo (`static/logo/*.svg` : 30 Ko de tracés) ni les images.

## 2. Filtrer les sorties de commandes
Toujours couper les sorties longues :

| Besoin | Commande |
|---|---|
| Typage | `npm run check 2>&1 \| grep -E "ERROR\|WARNING\|COMPLETED" \| cut -c1-220` |
| Build | `npm run build 2>&1 \| grep -E "error\|built in" \| grep -v A11y \| head -3` |
| Tests unitaires | `npm test 2>&1 \| grep -E "ÉCHEC\|Tous les tests"` |
| Tests e2e | `npm run test:e2e 2>&1 \| grep -E "ÉCHEC\|TOUT EST OK\|ÉCHEC\(S\)"` |
| Git | `git status --short \| head`, `git log --oneline -5`, `git diff --stat \| tail -3` |

N'afficher le détail complet que si un résultat échoue.

## 3. Lancer le plus petit test qui prouve le changement
- Modification du métré → `npm run test:metre` ; de l'assistant → `npm run test:assistant` ; des tarifs → `npm run test:tarifs`.
- `npm run check` + `npm run build` une fois en fin de lot, pas après chaque petite édition.
- Les tests e2e (navigateur) coûtent cher : à la fin d'une fonctionnalité, avant de pousser.

## 4. Grouper le travail
- Plusieurs commandes indépendantes → **un seul appel** (`&&` ou appels parallèles).
- Plusieurs remplacements dans un fichier → un petit script Node écrit dans le dossier temporaire (scratchpad) plutôt que dix éditions successives. Attention : PowerShell et bash interprètent `$`, les backticks et les guillemets ; préférer l'outil `Write` pour créer le script.
- Pas de sous-agents pour une recherche simple : `Grep` / `Glob` suffisent.

## 5. Réponses courtes à l'utilisateur
- L'utilisateur lit en français, sur un ton simple : résultat d'abord, puis ce qui reste à faire. Pas de répétition de ce qui a déjà été dit.
- Ne pas recopier de longs blocs de code dans la réponse : citer le fichier (`[fichier](chemin)`).

## 6. Contexte qui grossit
- Quand la conversation devient longue, proposer `/compact` à l'utilisateur à la fin d'une étape terminée (après un commit), jamais au milieu d'un travail.
- Les informations durables vont dans `CARNET_DE_BORD.md` (décisions, pièges) plutôt que d'être réexpliquées à chaque session.

## 7. Pièges déjà rencontrés (évitent des allers-retours)
- PowerShell : `H` = `Get-History`, `Del` = `Remove-Item` → ne jamais nommer une fonction ainsi.
- Remplacement de texte : vérifier qu'un motif n'est pas contenu dans un autre avant un remplacement global.
- Serveur de dev bloqué (« EPERM » sur `.svelte-kit`) : arrêter tous les `node` qui exécutent `vite` dans ce dossier, puis relancer.
