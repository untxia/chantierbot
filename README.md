# ChantierBot

Agent IA pour artisans : analyse de photos de chantier par vision IA, suivi multi-chantiers, prédiction des besoins de stock et génération d'estimations métier.

**Production** : https://chantierbot.vercel.app — déployé automatiquement sur Vercel à chaque push sur `main`.

## Nouveauté — Comptes artisans + sécurité multi-utilisateurs

ChantierBot dispose maintenant du socle SaaS : **connexion / inscription Supabase Auth**, profil artisan, cookies de session serveur, clients, et préparation RLS complète.

Le SQL `supabase/migrations/20260910_auth_profiles_rls.sql` doit être exécuté dans le SQL Editor Supabase avant de considérer la base comme verrouillée. Il remplace les anciennes policies publiques par des policies propriétaire (`auth.uid()`), ajoute `user_id` aux données métier et rend le bucket photo privé. `supabase/verify_auth_rls.sql` contient les requêtes de contrôle.

## Stack

- **Frontend / Backend** : SvelteKit (Svelte 4, TypeScript)
- **Style** : Tailwind CSS v3, charte graphique dans `doc/charte-graphique/`
- **Base de données / stockage** : Supabase (Postgres + Storage)
- **Authentification** : Supabase Auth (email + mot de passe)
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
- **Clients** (`/clients`) : création, recherche, modification et suppression de clients.
- **Chantier** (`/chantiers/[id]`) : upload photo + analyse IA métier + estimation.
- **IA** (`/ia`) : activité des analyses photo.
- **Analyses** (`/analyses`) : suivi de stock + prédiction des ruptures.
- **Rapports** (`/rapports`) : aperçu du dernier brouillon de devis IA + impression/PDF navigateur.
- **Paramètres** (`/parametres`) : profil artisan et déconnexion.
- **Connexion** (`/connexion`) : inscription et connexion.

## Authentification et RLS

Le serveur lit la session depuis des cookies HTTP-only et injecte un client Supabase authentifié dans `event.locals`. Les pages et API métier utilisent ce client afin que les requêtes respectent RLS.

Après application de la migration d'authentification :

1. chaque compte possède une ligne `profiles` créée automatiquement par trigger ;
2. `clients`, `chantiers`, `chantier_photos`, `stock_history`, `rendez_vous`, `fournisseurs`, `commandes`, `commande_lignes` et `relances` sont associés à `user_id` ;
3. les rôles `anon` n'ont plus de droits sur ces tables ;
4. les policies limitent lecture/écriture à `auth.uid()` ;
5. le bucket `chantier-photos` devient privé et les photos sont servies via des URLs signées temporaires.

## Flux photo → IA → estimation

1. Le navigateur uploade la photo dans Supabase Storage `chantier-photos`.
2. Le client appelle `POST /api/analyze` avec `chantierId`, `imagePath`, `imageUrl` et le métier sélectionné.
3. Groq Vision identifie les travaux, matériaux et quantités visibles en tenant compte du profil métier.
4. Le modèle texte génère des lignes indicatives séparant matériaux et main-d'œuvre et calcule les totaux HT.
5. L'analyse principale est persistée dans `chantier_photos` ; le résultat d'estimation est renvoyé au client.
6. L'artisan peut enregistrer le résultat comme **brouillon de devis** dans le navigateur puis l'ouvrir dans `/rapports` pour impression/PDF.

## Sécurité et limites

- Les données métier sont destinées à être isolées par utilisateur via Supabase RLS. **Appliquer la migration SQL d'authentification avant de partager l'application avec de vrais utilisateurs.**
- Une photo ne permet pas de mesurer précisément toutes les dimensions : les quantités et prix IA sont des aides à l'estimation, pas une validation technique.
- Les contraintes structurelles, sécurité, conformité, TVA, prix fournisseurs et taux de main-d'œuvre doivent être contrôlés par un professionnel.

## Accessibilité & SEO

- `lang="fr"`, meta description, Open Graph de base, favicon SVG, `robots.txt`.
- Focus clavier visible, cibles tactiles ≥ 44px et statut d'analyse annoncé avec `aria-live`.
- Mise en page mobile-first et thème clair/sombre.
