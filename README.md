# ChantierBot

Agent IA pour artisans : analyse de photos de chantier par vision IA, suivi multi-chantiers, prédiction des besoins de stock et génération d'estimations métier.

**Production** : https://chantierbot.vercel.app — déployé automatiquement sur Vercel à chaque push sur `main`.

## Nouveauté — Copilote IA métier

Le flux photo d'un chantier est maintenant spécialisé selon le métier sélectionné dans le fond personnalisé : **Plombier, Paysagiste, Maçon, Électricien, Peintre, Carreleur, Couvreur, Charpentier**.

Flux : **📸 photo → 🤖 vision métier → 📋 travaux détectés → 📐 quantités indicatives → 💰 matériaux + main-d'œuvre → 📝 brouillon de devis → 🖨️ impression/PDF**.

Les prix et quantités produits par l'IA sont indicatifs et doivent être vérifiés par l'artisan avant transmission au client.

## Stack

- **Frontend / Backend** : SvelteKit (Svelte 4, TypeScript)
- **Style** : Tailwind CSS v3, charte graphique dans `doc/charte-graphique/`
- **Base de données / stockage** : Supabase (Postgres + Storage)
- **IA** : Groq API — vision (`qwen/qwen3.8-27b`) et texte (`openai/gpt-oss-120b`)
- **Build** : Vite

## Démarrage

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualise le build |
| `npm run check` | Vérification TypeScript + Svelte |
| `npm run check:watch` | Idem, en mode watch |

## Variables d'environnement

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Clé API Groq privée, uniquement côté serveur |
| `PUBLIC_SUPABASE_URL` | URL publique du projet Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Clé publishable Supabase contrôlée par les policies RLS |

Ne jamais commiter `.env.local` ni exposer `GROQ_API_KEY` au client.

## Navigation

- **Accueil** (`/`) : dashboard, KPI, recommandations et chantiers récents.
- **Projets** (`/projets`) : liste et création de chantier.
- **Chantier** (`/chantiers/[id]`) : upload photo + analyse IA métier + estimation.
- **IA** (`/ia`) : activité des analyses photo.
- **Analyses** (`/analyses`) : suivi de stock + prédiction des ruptures.
- **Rapports** (`/rapports`) : aperçu du dernier brouillon de devis IA + impression/PDF navigateur.
- **Paramètres** (`/parametres`) : placeholder.

## Architecture clé

```text
src/
  lib/
    config/trades.ts                  profils et spécialités par métier
    components/photoUpload.svelte     photo → analyse → estimation → brouillon
    services/groq.ts                  vision IA + génération d'estimation + stock
  routes/
    chantiers/[id]/                   détail chantier
    rapports/                         brouillon de devis imprimable
    api/analyze/                      analyse photo métier + persistance
    api/predict/                      prédiction stock
static/assets/backgrounds/             backgrounds métier
```

## Flux photo → IA → estimation

1. Le navigateur uploade la photo dans Supabase Storage `chantier-photos`.
2. Le client appelle `POST /api/analyze` avec `chantierId`, `imagePath`, `imageUrl` et le métier sélectionné.
3. Groq Vision identifie les travaux, matériaux et quantités visibles en tenant compte du profil métier.
4. Le modèle texte génère des lignes indicatives séparant matériaux et main-d'œuvre et calcule les totaux HT.
5. L'analyse principale est persistée dans `chantier_photos` ; le résultat d'estimation est renvoyé au client.
6. L'artisan peut enregistrer le résultat comme **brouillon de devis** dans le navigateur puis l'ouvrir dans `/rapports` pour impression/PDF.

## Sécurité et limites

- **Pas d'authentification** actuellement : la base est partagée. Les policies RLS doivent être restreintes par utilisateur avant une mise en production publique réelle.
- Une photo ne permet pas de mesurer précisément toutes les dimensions : les quantités et prix IA sont des aides à l'estimation, pas une validation technique.
- Les contraintes structurelles, sécurité, conformité, TVA, prix fournisseurs et taux de main-d'œuvre doivent être contrôlés par un professionnel.

## Accessibilité & SEO

- `lang="fr"`, meta description, Open Graph de base, favicon SVG, `robots.txt`.
- Focus clavier visible, cibles tactiles ≥ 44px et statut d'analyse annoncé avec `aria-live`.
- Mise en page mobile-first et thème clair/sombre.
