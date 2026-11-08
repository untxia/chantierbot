---
name: audit-chantierbot
description: Audit complet de ChantierBot — sécurité (RLS, filtres par utilisateur, secrets), base de données (migrations appliquées, conseils Supabase), RGPD, qualité (tests, typage), dépendances, performances, accessibilité et état de la production — avec un rapport classé par gravité. À utiliser quand l'utilisateur demande un audit, un bilan, « est-ce prêt pour le lancement ? », ou avant d'ouvrir l'application à de vrais utilisateurs.
---

# Audit — ChantierBot

Produire un rapport factuel : chaque constat vient d'une commande ou d'une lecture faite pendant l'audit, jamais de mémoire. Ne rien corriger pendant l'audit sans accord, sauf demande explicite.

## 1. Sécurité
- **Secrets** : `git ls-files | grep -iE "\.env($|\.)"` doit ne renvoyer que `.env.example`. Chercher des clés en clair : `Grep` sur `src/` pour `sk_|eyJhbGci|service_role|GROQ_API_KEY *=`. Aucun secret ne doit être préfixé `VITE_` ou `PUBLIC_` (sauf l'URL et la clé publishable Supabase).
- **Filtre par utilisateur** : les politiques RLS `*_admin_all` donnent à un admin l'accès à toutes les lignes. Toute lecture dans `src/routes` doit avoir `.eq('user_id', …)` :
  `Grep` sur `\.from\('(chantiers|clients|chantier_photos|stock_history|rendez_vous|fournisseurs|commandes|relances|mesures|tarif_lignes|tarifs)'\)` puis vérifier chaque `select`.
- **Recherches** : tout texte utilisateur passé à `.or(...)` doit être nettoyé (`replace(/[,()%*\\:]/g, ' ')`).
- **Routes publiques** : `PUBLIC_PATHS` dans `src/hooks.server.ts` ; les routes `/api/cron/*` doivent vérifier `CRON_SECRET` si défini.
- Pour une revue de code sécurité approfondie, utiliser le skill `security-review`.

## 2. Base de données (outils Supabase, projet `pnkgcfwtucufwgllswla`)
- `get_project` : statut ACTIVE (INACTIVE = pause, cause des « fetch failed »).
- `get_advisors` type `security` puis `performance` : lister chaque avertissement. Connus et acceptés : `is_admin()` et `delete_my_account()` exécutables par les utilisateurs connectés (voulu).
- `list_tables` (verbose) : RLS activée sur toutes les tables publiques ; comparer avec les fichiers `supabase/migrations/*.sql` pour repérer une migration non appliquée (ex. tables `tarifs`, `tarif_lignes`, `tarif_associations`).
- Ne jamais appliquer de migration pendant l'audit : la signaler, avec le fichier à exécuter dans le SQL Editor.

## 3. RGPD et pages légales
- `src/lib/config/legal.ts` : champs encore vides (`editorName`, `legalForm`, `address`, `contactEmail`, `publicationDirector`).
- Repères `legal-todo` restants dans `src/routes/{confidentialite,mentions-legales,conditions}`.
- Export (`/api/account/export`) et suppression (`/api/account/delete`) présents ; sous-traitants (Supabase UE, Vercel, Groq = États-Unis) cités dans la politique.

## 4. Qualité
Lancer le skill `tests-complets` (au minimum niveaux 1 et 2) et reporter les chiffres. Zéro avertissement svelte-check attendu.

## 5. Dépendances
```bash
npm audit --omit=dev 2>&1 | tail -15
npm outdated 2>&1 | head -25
```
Signaler les vulnérabilités `high` / `critical` et les paquets majeurs en retard. Règle du projet : n'installer qu'une version publiée depuis au moins deux semaines (`npm view <paquet> time --json`) et fixer la version exacte. `@sveltejs/kit` reste compatible Svelte 4 (voir carnet).

## 6. Performances et poids
- Sortie de `npm run build` : repérer les fichiers JS de plus de 200 Ko.
- Images : `static/assets/backgrounds/*.webp` (fonds encore flous si < 10 Ko : couvreur, charpentier, plaquiste).

## 7. Accessibilité et SEO
- svelte-check signale les problèmes d'accessibilité (doit être à 0).
- `src/app.html` : langue `fr`, description, thème ; chaque page a un `<svelte:head><title>`.
- Pour une checklist complète avant mise en ligne : skill `checklist-avant-deploiement`.

## 8. Production
`npm run test:prod` (lecture seule) + `curl https://chantierbot.vercel.app/api/cron/keepalive` (ok: true).

## Rapport
En français, court, dans cet ordre :
1. **Verdict** en une phrase (prêt / pas prêt pour de vrais utilisateurs, et pourquoi).
2. **Tableau des constats** : gravité (🔴 bloquant, 🟠 important, 🟡 à prévoir) · domaine · constat · preuve (commande / fichier:ligne) · correction proposée.
3. **Ce qui a été vérifié et est conforme** (une ligne par domaine).
4. **Ce qui n'a pas pu être vérifié** et pourquoi.
Proposer de publier le rapport en page (artifact) si l'utilisateur veut le partager.
