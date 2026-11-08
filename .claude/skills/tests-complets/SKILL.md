---
name: tests-complets
description: Lance et interprète tous les tests de ChantierBot — tests unitaires (métré, assistant, tarifs), typage svelte-check, build, tests de bout en bout par l'API et dans Chrome, et vérification de la production. À utiliser avant chaque push, quand l'utilisateur demande de « tout tester », de vérifier qu'une fonctionnalité marche, ou après une modification importante.
---

# Tests complets — ChantierBot

Toujours dans cet ordre (du moins cher au plus cher) ; s'arrêter et corriger dès qu'un niveau échoue.

## Prérequis
- `.env.local` contient `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `GROQ_API_KEY`, et pour les tests e2e `E2E_EMAIL` / `E2E_PASSWORD` d'un **compte de test** (jamais un vrai compte, jamais commité).
- Chrome installé (`C:/Program Files/Google/Chrome/Application/chrome.exe`, sinon variable `CHROME_PATH`).
- Si Supabase répond « fetch failed » : le projet gratuit est peut-être en pause (outil Supabase `get_project`, statut INACTIVE → `restore_project`, attendre ~3 min).

## Niveau 1 — Tests unitaires (secondes, sans réseau)
```bash
npm test 2>&1 | grep -E "ÉCHEC|Tous les tests"
```
Trois suites : `test:metre` (règles de consommation, chiffrage), `test:assistant` (compréhension des demandes), `test:tarifs` (import CSV / Excel, HT / TTC). Attendu : 3 × « Tous les tests passent ».

**Ajouter un test** à chaque nouvelle règle de calcul ou intention, dans le fichier `*.test.ts` du module, avec la valeur attendue calculée à la main dans le libellé.

## Niveau 2 — Typage et build
```bash
npm run check 2>&1 | grep -E "ERROR|WARNING|COMPLETED" | cut -c1-220
npm run build 2>&1 | grep -E "error|built in" | grep -v A11y | head -3
```
Attendu : `0 ERRORS 0 WARNINGS` et « built in ». Le projet est à zéro avertissement : ne pas en réintroduire.

## Niveau 3 — Bout en bout, serveur local + vraie base
Démarrer le serveur s'il ne tourne pas (PowerShell, en arrière-plan) :
```powershell
Start-Process -FilePath npm.cmd -ArgumentList 'run','dev','--','--port','5199' -WindowStyle Hidden -RedirectStandardOutput "$env:TEMP\cb-dev.log" -RedirectStandardError "$env:TEMP\cb-dev.err"
```
puis attendre que `http://localhost:5199/connexion` réponde 200.
```bash
npm run test:e2e 2>&1 | grep -E "ÉCHEC|TOUT EST OK|non testés"
```
- `tests/e2e/api.mjs` : crée des données « ZZ e2e », teste l'assistant, les pages, le cloisonnement par utilisateur, l'export RGPD, les tarifs, puis **nettoie** (bloc `finally`).
- `tests/e2e/navigateur.mjs` : parcours dans Chrome (connexion, assistant, métré chiffré, devis + TVA, autres métiers, mobile), captures dans `tests/e2e/captures/` (non versionné). Les ouvrir avec `Read` pour un contrôle visuel quand l'interface a changé.
- Après les tests : arrêter le serveur (`Get-NetTCPConnection -LocalPort 5199 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`).

Ne jamais tester la suppression de compte sur le compte de test : la vérifier dans un bloc SQL annulé (`raise exception` final) comme décrit dans `CARNET_DE_BORD.md`.

## Niveau 4 — Production (après le déploiement Vercel, ~1–2 min après le push)
```bash
npm run test:prod 2>&1 | grep -E "ÉCHEC|TOUT EST OK"
```
Lecture seule : pages publiques, redirection des pages protégées, réveil Supabase, connexion, assistant, pages principales.

## Restitution à l'utilisateur
Un tableau court : niveau → résultat (ex. « Unitaires 3/3 suites OK, Typage 0 erreur, E2E 37/37, Production 16/16 »). En cas d'échec : le test, le message, la cause trouvée et la correction. Ne jamais dire « tout marche » pour un niveau non exécuté : le signaler explicitement (ex. « tarifs non testés : migration non appliquée »).
