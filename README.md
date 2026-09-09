# ChantierBot

Agent IA pour artisans : analyse de photos de chantier par vision IA, suivi multi-chantiers, prédiction des besoins de stock.

## Stack

- **Frontend / Backend** : [SvelteKit](https://kit.svelte.dev/) (Svelte 4, TypeScript)
- **Style** : [Tailwind CSS](https://tailwindcss.com/) v3, charte graphique dans `doc/charte-graphique/`
- **Base de données / stockage** : [Supabase](https://supabase.com/) (Postgres + Storage)
- **IA** : [Groq API](https://groq.com/) — vision (`qwen/qwen3.8-27b`) et texte (`openai/gpt-oss-120b`)
- **Build** : Vite

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les variables (voir plus bas)
npm run dev
```

L'app tourne sur http://localhost:5173 (ou le port suivant disponible).

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualise le build |
| `npm run check` | Vérification TypeScript + Svelte (`svelte-check`) |
| `npm run check:watch` | Idem, en mode watch |

## Variables d'environnement

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Clé API Groq, **privée** (jamais exposée au client — utilisée uniquement dans les routes serveur via `$env/static/private`) |
| `PUBLIC_SUPABASE_URL` | URL du projet Supabase — publique par design |
| `PUBLIC_SUPABASE_ANON_KEY` | Clé publishable Supabase — publique par design (accès contrôlé par les policies RLS, pas par le secret) |

À définir dans `.env.local` (jamais commité, voir `.gitignore`). Ne jamais utiliser le préfixe `VITE_` pour un secret : toute variable préfixée `VITE_` est injectée dans le bundle client et donc publique. C'est volontairement le cas pour les identifiants Supabase ci-dessus (préfixe `PUBLIC_`), mais jamais pour `GROQ_API_KEY`.

## Navigation

- **Accueil** (`/`) : salutation, KPI (chantiers, photos analysées, dernière activité), chantiers récents.
- **Projets** (`/projets`) : liste complète + création de chantier.
- **IA** (`/ia`) : flux des dernières analyses de photos, tous chantiers confondus.
- **Analyses** (`/analyses`) : suivi de stock + prédiction des ruptures (Groq).
- **Paramètres** (`/parametres`) : placeholder (pas d'authentification pour l'instant).

Desktop : sidebar gauche (Dark Navy). Mobile : bottom nav (Accueil / Projets / IA / Plus — Plus regroupe Analyses et Paramètres).

## Architecture

```
src/
  app.html                             squelette HTML, meta SEO
  lib/
    components/
      photoUpload.svelte               upload → Storage → déclenche l'analyse
      Sidebar.svelte / BottomNav.svelte navigation desktop / mobile
      NavIcon.svelte / nav-items.ts     icônes + définition des entrées de nav
      StatusBadge.svelte                badge de statut chantier
      Mascot.svelte                     mascotte (idle/working/success/error)
      ToastHost.svelte                  notifications (succès/info/warning/erreur)
    services/
      groq.ts                          appels Groq (vision + texte), server-only
      supabase.ts                      client Supabase (DB + Storage), utilisé client & serveur
    stores/
      toast.ts                         file de notifications
    styles/
      globals.css                      Tailwind + charte graphique + a11y (focus visible, cibles tactiles)
  routes/
    +layout.svelte                     shell : sidebar/bottom nav + toasts
    +page.svelte / +page.server.ts     Accueil : KPI + chantiers récents
    projets/                           liste complète + création
    chantiers/[id]/                    détail chantier : upload + galerie + statut
    ia/                                flux des analyses IA
    analyses/                          suivi de stock + prédiction
    parametres/                        placeholder
    plus/                              menu mobile (Analyses/Paramètres)
    api/
      chantiers/+server.ts             POST — crée un chantier
      chantiers/[id]/+server.ts        PATCH — met à jour le statut
      analyze/+server.ts               POST — analyse une photo (vision IA) + persiste en DB
      predict/+server.ts               POST — prédit les ruptures de stock
      stock/+server.ts                 POST — ajoute une entrée d'historique de stock
static/
  logo/                                icône, versions horizontales claire/sombre, monochrome
  favicon.svg
  robots.txt
doc/charte-graphique/                  référence design (tokens, composants, mascotte, écrans)
tailwind.config.js                     tokens de la charte graphique (couleurs, radius, ombres)
```

## Flux photo → analyse → persistance

1. Le navigateur uploade le fichier directement dans le bucket Supabase Storage `chantier-photos` (public).
2. Il appelle `POST /api/analyze` avec `{ chantierId, imagePath, imageUrl }`.
3. Le serveur envoie `imageUrl` à Groq (vision), parse la réponse JSON, insère une ligne dans `chantier_photos`.
4. Le client déclenche `invalidateAll()` : la page se recharge depuis Supabase (source de vérité unique, pas de store client dupliqué).

## Base de données (Supabase)

Tables : `chantiers` (avec `status`), `chantier_photos` (fk `chantier_id`), `stock_history` (fk `chantier_id` optionnelle).

RLS activée avec policies **publiques** (lecture/écriture ouvertes à quiconque a la clé publishable) car il n'y a pas encore d'authentification. **À restreindre par utilisateur dès que l'auth est ajoutée** — ne pas stocker de données sensibles avant ça.

## État actuel / limites connues

- **Pas d'authentification** : une seule "base" partagée, pas de notion d'artisan/compte. Condition bloquante avant mise en prod publique (voir RLS ci-dessus).
- **Mascotte** : version simplifiée (un seul personnage géométrique avec états idle/working/success/error), pas l'illustration complète à 5 poses décrite dans la charte. Pas d'écran de chargement dédié avec barre de progression.
- **Pas de synchronisation planning ni de relances fournisseurs automatiques** — hors scope du MVP actuel.

Voir [CARNET_DE_BORD.md](./CARNET_DE_BORD.md) pour l'historique détaillé des décisions.

## Accessibilité & SEO

- `lang="fr"`, meta description, Open Graph de base, favicon SVG, `robots.txt`.
- Focus visible clavier (`:focus-visible`), cibles tactiles ≥ 44px, statut d'analyse annoncé aux lecteurs d'écran (`aria-live`), texte alternatif dynamique sur les photos analysées.
- Mise en page mobile-first (padding réduit sous 640px, grilles responsive `auto-fill`).
- Thème clair/sombre automatique (`prefers-color-scheme`).
