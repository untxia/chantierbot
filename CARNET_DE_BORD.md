# Carnet de bord — ChantierBot

Journal des décisions et de l'avancement du projet. Chaque entrée : ce qui a été fait, pourquoi, et ce qui reste ouvert.

---

## 2026-09-09 — Constat initial

Le commit "Add Groq API integration with photo analysis" annonçait l'intégration Groq, mais les fichiers créés étaient vides (`groq.ts`, `analyze/+server.ts`, `predict/+server.ts`, `photoUpload.svelte`, `chantiers.ts`). Seule la coquille SvelteKit tournait réellement.

## 2026-09-09 — Implémentation du MVP photo + IA

- **`lib/services/groq.ts`** : deux fonctions.
  - `analyzePhoto()` — appel REST direct à l'API Groq (pas le SDK) pour l'analyse vision, car `groq-sdk@0.3.x` ne type pas encore les messages multimodaux (`image_url`). Modèle : `meta-llama/llama-4-scout-17b-16e-instruct`.
  - `predictStock()` — utilise le SDK `groq-sdk` classique (texte only), modèle `llama-3.3-70b-versatile`.
  - Décision : réponses IA forcées en JSON (`response_format: json_object`) pour éviter le parsing fragile de texte libre.
- **Endpoints** `/api/analyze` et `/api/predict` — validation d'entrée minimale, erreurs 400/500 explicites.
- **Store `chantiers`** — en mémoire (`writable`), pas de persistance. *Limite connue, voir roadmap.*
- **`photoUpload.svelte`** — upload → data URL → appel `/api/analyze` → mise à jour du store.

## 2026-09-09 — Corrections de configuration (projet ne démarrait pas)

Plusieurs erreurs bloquantes découvertes en essayant de faire tourner l'app :

1. `package.json` référençait le paquet `vite-plugin-svelte` (non-scopé, abandonné) au lieu de `@sveltejs/vite-plugin-svelte`.
2. `vite.config.js` utilisait le plugin Svelte brut (`svelte()`) au lieu du plugin SvelteKit (`sveltekit()`) — sans lui, aucune route serveur ni alias `$lib`/`$env` ne fonctionne.
3. `@sveltejs/adapter-auto` était utilisé dans `svelte.config.js` mais absent des dépendances.
4. `tsconfig.json` n'étendait pas la config générée par SvelteKit, et déclarait manuellement des `paths` qui entrent en conflit avec elle.
5. `@sveltejs/kit@2.70.3` (dernière version au moment de l'install) génère des types (`$types.d.ts`) qui référencent `Snippet`, un type Svelte 5 — incompatible avec Svelte 4 utilisé ici. Fixé en épinglant `@sveltejs/kit@2.15.3`.

Validé en lançant réellement `npm run dev` et en curlant `/` et `/api/analyze`.

## 2026-09-09 — Incident de sécurité : clé API committée

`.env` (contenant la vraie clé Groq) était tracké par git, sous le nom `VITE_GROQ_API_KEY` — préfixe qui aurait exposé la clé côté navigateur si jamais importée dans du code client.

Actions :
- Renommage en `GROQ_API_KEY`, lu côté serveur uniquement via `$env/static/private`.
- `git rm --cached .env`, ajout au `.gitignore`.
- **Réécriture complète de l'historique git** (`git filter-branch --index-filter "git rm --cached --ignore-unmatch .env"` sur un clone propre, puis `git push --force origin main`) pour purger la clé des commits déjà poussés sur GitHub. Confirmé explicitement avec l'utilisateur avant le force-push (action irréversible sur dépôt partagé).
- Recommandation transmise : régénérer la clé côté Groq malgré la purge d'historique (la garantie absolue, la réécriture n'est qu'un filet de sécurité).

## 2026-09-09 — Passage en structure "pro" : SEO, a11y, mobile-first

- **SEO** : meta description, Open Graph de base, favicon SVG, `robots.txt`, `<svelte:head>` par page.
- **A11y** : `aria-live` sur le statut d'analyse (lecteurs d'écran), `alt` dynamique sur les photos (au lieu d'un texte statique redondant "Photo de..."), focus clavier visible (`:focus-visible`), cibles tactiles ≥ 44px.
- **Mobile-first** : padding réduit par défaut, augmenté à partir de 640px ; grille de résultats déjà responsive (`auto-fill`).
- **Scripts** : ajout de `npm run check` / `check:watch` (svelte-check, déjà en dépendance).

## 2026-09-09 — Persistance Supabase + dashboard multi-chantiers + Tailwind

- **Supabase** : réactivation du projet existant "untxia's Project" (`pnkgcfwtucufwgllswla`, eu-central-1) plutôt que d'en créer un nouveau — décision utilisateur pour éviter une ressource cloud de plus.
  - Schéma : tables `chantiers`, `chantier_photos` (fk `chantier_id`), `stock_history` (prête pour `/api/predict`, pas encore alimentée par l'UI). RLS activée avec policies **publiques** (lecture/écriture ouvertes) car pas d'auth pour l'instant — *à restreindre par utilisateur dès que l'auth existe*.
  - Bucket Storage public `chantier-photos` (policies select/insert/delete publiques, mêmes raisons).
  - Client `lib/services/supabase.ts` utilise la clé publishable (`PUBLIC_SUPABASE_ANON_KEY`/`PUBLIC_SUPABASE_URL`, via `$env/static/public`) — sûre à exposer côté client par design, contrairement à `GROQ_API_KEY`.
- **Nouveau flux photo** : upload direct navigateur → Storage (plus de base64 en transit vers `/api/analyze`), puis `/api/analyze` reçoit `{ chantierId, imagePath, imageUrl }`, appelle Groq avec l'URL publique, persiste le résultat dans `chantier_photos`. En cas d'échec d'analyse, une ligne avec `error` est quand même insérée pour ne pas perdre la photo déjà uploadée.
- **Store en mémoire supprimé** (`lib/stores/chantiers.ts`) — remplacé par des `+page.server.ts` (SSR, `supabase.from(...).select()`) + `invalidateAll()` côté client après upload. Plus idiomatique SvelteKit, et cohérent multi-onglets.
- **Dashboard multi-chantiers** : `/` liste les chantiers (nom, nombre de photos) + formulaire de création (`POST /api/chantiers`). `/chantiers/[id]` = détail avec upload + galerie.
- **Modèles Groq corrigés** : les modèles initialement choisis (`meta-llama/llama-4-scout-17b-16e-instruct` pour la vision, `llama-3.3-70b-versatile` pour le texte) **n'existent pas/plus sur ce compte** (`model_not_found` en test réel). Remplacés après vérification via `GET /v1/models` + doc officielle :
  - Vision : `qwen/qwen3.8-27b` (mode instruct, JSON propre en sortie avec `response_format: json_object`).
  - Texte : `openai/gpt-oss-120b` (le raisonnement sort dans un champ `reasoning` séparé, `content` reste du JSON pur).
  - Testé en conditions réelles : upload vers Storage → analyse Groq → insertion DB → affichage, bout en bout.
- **Tailwind CSS** ajouté (v3, config classique, pas v4) — styles migrés des `<style>` scoped Svelte vers des classes utilitaires. Palette encore neutre : la charte graphique de l'utilisateur arrivera plus tard et sera injectée dans `tailwind.config.js` (`theme.extend`).

## 2026-09-09 — Charte graphique + logo appliqués à l'app (navigation, IA, Analyses, statuts)

Le dossier `doc/charte-graphique/` (tokens, composants UI, mascotte, architecture d'écrans) est arrivé entre-temps (Tailwind configuré avec la vraie palette, classes `.card`/`.btn-*`/`.input`/`.badge-ai` déjà posées). Reste à appliquer la structure de navigation et fermer les écarts identifiés dans la roadmap précédente :

- **Navigation** : sidebar desktop (fond Dark Navy, actif en surbrillance bleu/violet léger) + bottom nav mobile, 5 entrées (`lib/components/nav-items.ts`, `Sidebar.svelte`, `BottomNav.svelte`, icônes outline dans `NavIcon.svelte`). Mobile suit le pattern du doc "Accueil / Projets / IA / Plus", `/plus` regroupe Analyses + Paramètres.
- **Pages ajoutées** :
  - `/` (Accueil) : salutation + 3 KPI (chantiers, photos analysées, dernière activité) + chantiers récents. Le dashboard complet (création + liste totale) a été déplacé sur `/projets` pour respecter la philosophie "dashboard compris en 3 secondes" du doc.
  - `/ia` : flux des dernières analyses IA tous chantiers confondus (ferme un vide : avant, les analyses n'étaient visibles que chantier par chantier).
  - `/analyses` : **branche enfin `/api/predict`** — formulaire d'ajout d'entrée de stock (`POST /api/stock`, nouvelle table déjà prête) + bouton "Prédire les ruptures" qui appelle Groq et affiche les résultats. Testé en conditions réelles (ajout de 2 matériaux → prédiction retournée par `openai/gpt-oss-120b`).
  - `/parametres` : placeholder minimal (pas d'auth = rien à configurer pour l'instant).
- **Statut de chantier** : colonne `status` ajoutée (migration `add_chantier_status`, valeurs `en_cours`/`termine`/`en_attente`), `StatusBadge.svelte`, sélecteur sur la page détail (`PATCH /api/chantiers/[id]`).
- **Notifications** : store `lib/stores/toast.ts` + `ToastHost.svelte` (succès/info/warning/erreur, fade+slide ~250ms comme demandé) — remplace les messages d'erreur silencieux/inline sur la création de chantier et l'upload photo.
- **Mascotte** : `Mascot.svelte` — version simplifiée et bornée en scope (pas d'illustration complète 5 poses comme décrit dans `04_MASCOTTE_ET_ANIMATIONS.md`, qui demanderait un vrai travail d'illustration). Un seul personnage géométrique cohérent avec le logo, qui "bobote" pendant l'analyse et affiche un badge ✓/! au résultat, utilisé dans `photoUpload.svelte`. *Écran de chargement dédié avec pourcentage/messages non fait — à construire si besoin d'un flux plus long.*

## 2026-09-09 — Refonte visuelle "look mockup" (tableau de bord héro, sidebar élargie)

L'utilisateur a fourni un mockup marketing (`doc/charte-graphique/chantierbot-background-dashboard.png`, ajouté directement sur GitHub) : fond photo plein écran avec overlay sombre, cartes en verre dépoli, orbe IA, barre de prompt, cartes de "décisions recommandées", sidebar à 9 entrées, sélecteurs langue/thème/arrière-plan, aperçu mobile.

Décision de phasage (validée avec l'utilisateur via question explicite) : **le look d'abord**, les fonctionnalités manquantes (Planning, Fournisseurs, Relances, moteur de recommandations, chat IA, i18n) restent des chantiers séparés à construire ensuite. Rien n'a été fabriqué/inventé pour coller au mockup — tout ce qui s'affiche vient de données réelles.

- **Fond héro** : `HeroBackground.svelte` — dégradé + silhouette de skyline en SVG, **pas une photo réelle**. Choix délibéré : une vraie photo avec une personne (comme dans le mockup) pose un problème de droits/licence qu'il n'était pas raisonnable de résoudre en sourçant une image au hasard sur le web pour une app en prod. À remplacer par une vraie photo si l'utilisateur en fournit une avec les droits, ou en génère une.
- **Thème clair/sombre devient bascule manuelle réelle** : `tailwind.config.js` passé de `darkMode: 'media'` à `'selector'`, store `lib/stores/theme.ts` + `ThemeToggle.svelte`, persisté en `localStorage`, bootstrap anti-flash inline dans `app.html`. Avant, seul le `prefers-color-scheme` système comptait.
- **TopBar** (`TopBar.svelte`) : recherche (réelle — filtre `/projets?q=`), toggle thème, sélecteur de langue (FR actif, EN/ES/EU visibles mais désactivés avec toast "bientôt" — pas de fausse promesse d'i18n), icône compte générique (pas de faux nom/profil inventé, contrairement au mockup qui affiche "Chris · Artisan Pro" — honnête tant qu'il n'y a pas d'auth).
- **Sidebar refaite** : 9 entrées comme le mockup (Tableau de bord, Chantiers, Stocks, Planning*, Fournisseurs*, Relances*, Assistant IA, Rapports*, Paramètres — `*` = pages "bientôt disponible", créées comme placeholders simples). Bouton "Focus chantier" **fonctionnel** (`lib/stores/focus-mode.ts`, masque la sidebar, persisté).
- **Tableau de bord (`/`) refondu** : hero sombre en pleine largeur avec salutation, barre de prompt IA (visuelle — soumettre affiche un toast "bientôt", pas de faux chat), 4 cartes KPI en verre **toutes sourcées de vraies requêtes** (chantiers actifs, recommandations IA = nb photos avec au moins un problème détecté, photos analysées, dernière activité). Section "Recommandations IA" = les 3 dernières analyses avec un problème détecté, avec vrai lien vers le chantier (pas de fausses cartes "Valider la commande" comme le mockup, qui impliqueraient un moteur de décision inexistant).
- **Progression de chantier** : colonne `progress` ajoutée (migration `add_chantier_progress`, 0-100), slider sur la page détail (`PATCH /api/chantiers/[id]`), barre de progression affichée sur les cartes chantier (Accueil + Chantiers), remplace l'ancien texte brut.
- **Recherche** : `/projets?q=...` filtre par nom (`ilike`), reliée à la recherche de la TopBar.
- Renommage : "Projets" → "Chantiers" dans la nav (aligné mockup), route `/projets` conservée pour ne pas casser les liens existants.

**Ce qui n'a pas été fait, volontairement** :
- Photo réelle en fond (raison de droits, voir plus haut)
- Sélecteur d'arrière-plan (mockup montre Chantier/Montagne/Mer/Import) — ressemble à un outil de démo/configurateur plutôt qu'une fonctionnalité confirmée, pas construit sans confirmation
- Chat IA conversationnel réel, moteur de recommandations avec actions (commandes, relances), i18n complet, Planning/Fournisseurs/Relances/Rapports fonctionnels

## 2026-09-09 — Schéma complet Planning / Fournisseurs / Relances

Demande explicite : construire toute la base de données pour les sections encore en placeholder. Migration `add_planning_fournisseurs_relances_schema` appliquée :

- **`clients`** (name, email, phone, address) — nouveau concept transverse, `chantiers.client_id` ajouté (nullable, `on delete set null`) pour rattacher un chantier à un client.
- **`rendez_vous`** (Planning) : `chantier_id`, `client_id`, `title`, `scheduled_at`, `status` (`en_attente`/`confirme`/`annule`), `notes`.
- **`fournisseurs`** (name, email, phone, category).
- **`commandes`** : `fournisseur_id`, `chantier_id`, `status` (`en_attente`/`confirmee`/`livree`/`annulee`), `delivery_date`, `notes` — + **`commande_lignes`** pour le détail par article (item, quantity, unit), séparée pour permettre plusieurs lignes par commande.
- **`relances`** : `type` (`client`/`fournisseur`), fk vers le bon type de cible, `chantier_id`, `message`, `channel` (`email`/`telephone`/`sms`), `due_date`, `status` (`a_faire`/`envoyee`/`resolue`).
- Index sur toutes les clés étrangères, RLS activée avec policies publiques (même pattern que le reste — pas d'auth pour l'instant).

**Découverte en vérifiant le schéma** : une table `public.profiles` existe déjà dans le projet Supabase (liée à `auth.users`, RLS activée, 0 ligne) — pas créée par moi, probablement un scaffold Supabase Auth déjà en place. Utile à savoir pour le futur chantier authentification : la base semble déjà prête à accueillir de vrais comptes.

**Pas fait dans cette passe** (demande explicitement scopée à "la DB") : aucune page (`/planning`, `/fournisseurs`, `/relances`) n'a été branchée sur ces nouvelles tables — elles restent en placeholder "bientôt disponible" jusqu'à ce qu'on construise le CRUD et l'UI dessus.

## 2026-09-10 — Déploiement Vercel

Production en ligne : **https://chantierbot.vercel.app**

- Ajout de `@sveltejs/adapter-vercel` en devDependency — `adapter-auto` détecte Vercel au build mais a besoin du paquet réellement installé pour ne pas planter. Vérifié en local en simulant l'environnement (`VERCEL=1 npm run build`).
- `.vercel/` ajouté au `.gitignore` (sortie de build générée, comme `.svelte-kit/`).
- Projet Vercel créé/lié au repo GitHub `untxia/chantierbot` — l'outil MCP Vercel a eu du mal à voir le projet après coup (`list_projects`/`get_project` renvoyaient vide/404 alors qu'il existait bel et bien, confirmé par l'URL du dashboard) : problème de synchronisation du connecteur, pas un vrai souci de config. Pas cherché à contourner, juste vérifié par les moyens du bord (curl direct sur l'URL publique).
- **Piège rencontré** : les variables `PUBLIC_SUPABASE_URL`/`PUBLIC_SUPABASE_ANON_KEY` doivent être en visibilité **Config** sur Vercel, pas **Secret** — Vercel refuse le type "Secret" pour toute variable au préfixe reconnu comme public par le framework. `GROQ_API_KEY` reste en Secret (comportement correct, c'est la seule vraie clé privée).
- Premier build a échoué (avant l'ajout des variables `PUBLIC_*`) car `$env/static/public` de SvelteKit fait planter le build si une variable référencée est absente. Un commit vide a suffi à redéclencher un build une fois les variables corrigées.
- Validé en prod : les 9 routes principales répondent en 200, lecture ET écriture Supabase fonctionnelles (chantier de test créé puis supprimé via `execute_sql`).

---

## 2026-10-14 — Mesure AR, style flottant, typographie chantier, rattrapage de la base

- **`/mesures`** : mesure de longueurs et surfaces. AR en direct via WebXR (hit-test + dom-overlay) sur Android/Chrome ; repli « sur photo » avec étalonnage par objet de référence pour iPhone (Safari iOS n'a pas WebXR) et desktop. Table `mesures` (RLS par utilisateur). Géométrie dans `lib/measure.ts`, testée (aire, longueur, projection d'écran). **Le mode AR n'a pas été testé sur un vrai téléphone.**
- **Design** : icônes 3D (`NavIcon` + `IconDefs`), cartes flottantes avec inclinaison au survol (`lib/actions/floating.ts`), scène de fond, typographie Barlow / Barlow Condensed. Réglages dans Paramètres > Apparence (flou, voile, effet flottant ; `lib/stores/appearance.ts`).
- **Constat** : les migrations `20260910_*` n'avaient jamais été appliquées en production et leur ordre alphabétique n'est pas l'ordre des dépendances (`auth_profiles_rls` supprime toutes les politiques, donc doit passer avant `admin_roles`). Le code attendait `user_id`, `start_at`, `designation`… absents de la base : création de chantier et planning en erreur.
- **Rattrapage** : `20261014_rattrapage_schema.sql`, migration unique et ordonnée qui remplace les 7 anciennes en production. Réconcilie aussi mon schéma du 09-09 (`scheduled_at` → `start_at`/`end_at`, `item` → `designation`, statuts de commandes/relances remappés). Appliquée à la main dans le SQL Editor (tables vides, aucun risque). Comptes : le plus ancien devient admin.
- **Piège découvert au test** : dans une politique `storage.objects`, `name` non qualifié désigne `chantiers.name` (portée la plus proche) et non le nom du fichier → upload refusé même pour le propriétaire. Toujours écrire `objects.name`. Corrigé dans le fichier ; politiques de stockage à recréer en base (voir ci-dessous).
- **Vérifié en conditions réelles** (compte de test, base de production, données nettoyées) : création chantier / client / fournisseur / rendez-vous / commande+ligne / relance / mesure / stock, mise à jour de progression, 12 pages en 200, anonyme bloqué en lecture et écriture, auto-promotion admin refusée, `/api/admin/users` en 403 pour un non-admin.
- **À régler dans le dashboard Supabase** : Site URL = `https://chantierbot.vercel.app` (le lien de confirmation par mail redirige sinon vers une adresse locale) ; activer la protection contre les mots de passe compromis.

---

## Roadmap ouverte (mise à jour 2026-10-20)

Fait depuis la dernière version de cette liste : authentification et rôles, pages Planning / Fournisseurs / Commandes / Relances / Clients branchées, fonds photo HD (8 métiers sur 10), logo robot animé, mesure AR / photo, rattrapage du schéma de production.

### Avant d'ouvrir à de vrais utilisateurs
- [ ] **RGPD de l'application** : politique de confidentialité, mentions légales, bouton « exporter mes données », bouton « supprimer mon compte » (la suppression en cascade existe déjà en base), information sur les photos de personnes, vérification des sous-traitants (Supabase Francfort, Vercel, Groq = États-Unis).
- [ ] **Réglages Supabase (dashboard)** : Site URL = https://chantierbot.vercel.app (le lien de confirmation par e-mail renvoie sinon vers une adresse locale) ; protection contre les mots de passe compromis (peut exiger une formule payante).
- [ ] **Tester la mesure AR sur un vrai Android** (Chrome, pas l'application installée) et lire le bloc « Diagnostic » de /mesures. Jamais exécutée sur appareil.
- [ ] **Changer le mot de passe du compte de test** (exposé dans les conversations) ou supprimer le compte.

### Produit
- [ ] **Assistant IA conversationnel** branché sur les données de l'utilisateur (outils / lecture des tables, pas de RAG). La barre de prompt du tableau de bord est encore visuelle.
- [ ] **Devis** : intégrer les mesures du chantier, PDF propre, envoi au client. Le menu « Rapports » est en réalité le Devis IA ; renommer le libellé.
- [ ] **RAG sécurité** (Code du travail en données ouvertes, pgvector dans Supabase, citations obligatoires, relecture par un préventeur) puis collection RGPD. Isoler d'abord le fournisseur d'IA dans un seul fichier.
- [ ] **Édition complète** des rendez-vous, commandes et relances après création.
- [ ] Relances automatiques par e-mail / SMS, synchro Google Agenda, tableau de bord chiffré, mode hors connexion.
- [ ] Idée drone : mode « photo aérienne » (mesure de toiture avec pente) pour tester la demande avant tout partenariat. Vérifier d'abord auprès de 5 à 10 couvreurs / charpentiers.
- [ ] i18n (EN / ES / EU) : sélecteur présent mais désactivé.

### Contenu et finitions
- [ ] Fonds photo manquants en HD : couvreur, charpentier, plaquiste (fichiers de 1 à 2 Ko, flous).
- [ ] Animations du robot : seules les poses simples existent (flottement, clignement, salut). Marche / creuse / construit non dessinées.
- [ ] Nettoyer le `stash@{1}` (ancien travail avant réécriture d'historique) et `stash@{0}` (CRUD remplacé par la version de main) s'ils ne servent plus.
- [ ] Avertissements svelte-check d'accessibilité (clics sur des div) dans fournisseurs / relances.

## Décisions à ne pas oublier

- Ne jamais préfixer un secret par `VITE_` dans ce projet — expose côté client. Seuls les identifiants Supabase (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`) sont volontairement publics.
- `groq-sdk@0.3.x` ne supporte pas les messages vision typés → rester sur `fetch` direct pour `analyzePhoto()` tant que le SDK n'est pas mis à jour (à revérifier si upgrade du SDK).
- `@sveltejs/kit` épinglé à `2.15.3` tant que le projet reste sur Svelte 4 (versions plus récentes cassent la génération de types).
- **Toujours vérifier qu'un modèle Groq existe réellement avant de le coder en dur** (`GET https://api.groq.com/openai/v1/models`) — la doc/mémoire peut citer des modèles dépréciés. Vision actuelle : `qwen/qwen3.8-27b`. Texte actuel : `openai/gpt-oss-120b`.
- RLS Supabase actuellement 100% publique (aucune auth) — ne pas stocker de données sensibles tant que ce n'est pas verrouillé.
