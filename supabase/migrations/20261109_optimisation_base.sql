-- Optimisation de la base (issue de l'audit du 2026-11-08, conseils Supabase « performance »).
-- À exécuter dans le SQL Editor APRÈS 20261108_tarifs_fournisseurs.sql.
-- Partie 1 : sans risque (index et réécriture de règles équivalentes).
-- Partie 2 : DÉCISION À PRENDRE — retirer les règles « l'administrateur voit tout ».

-- ============================================================ Partie 1
-- 1.a Index en double (créés par deux migrations successives) : on garde un seul exemplaire.
drop index if exists public.commande_lignes_commande_id_idx;
drop index if exists public.commandes_chantier_id_idx;
drop index if exists public.commandes_fournisseur_id_idx;
drop index if exists public.relances_chantier_id_idx;
drop index if exists public.relances_client_id_idx;
drop index if exists public.relances_fournisseur_id_idx;
drop index if exists public.rendez_vous_chantier_id_idx;

-- 1.b Clés étrangères sans index.
create index if not exists chantier_notes_user_id_idx on public.chantier_notes(user_id);
create index if not exists rendez_vous_client_id_idx on public.rendez_vous(client_id);

-- 1.c Mesures : auth.uid() évalué une fois par requête et non une fois par ligne.
drop policy if exists "Users can read their mesures" on public.mesures;
drop policy if exists "Users can create their mesures" on public.mesures;
drop policy if exists "Users can delete their mesures" on public.mesures;
create policy mesures_select_own on public.mesures for select to authenticated using ((select auth.uid()) = user_id);
create policy mesures_insert_own on public.mesures for insert to authenticated with check ((select auth.uid()) = user_id);
create policy mesures_delete_own on public.mesures for delete to authenticated using ((select auth.uid()) = user_id);

-- ============================================================ Partie 2 (facultative)
-- Les règles *_admin_all donnent à un administrateur l'accès aux données de TOUS les comptes.
-- La console d'administration n'en a pas besoin (elle utilise la clé de service côté serveur),
-- et le code filtre déjà chaque lecture sur l'utilisateur. Les retirer :
--   - protège les données des artisans au niveau de la base (défense en profondeur) ;
--   - supprime les 43 avertissements « multiple permissive policies ».
-- Décommenter le bloc ci-dessous pour l'appliquer.
--
-- do $$
-- declare t text;
-- begin
--   foreach t in array array['clients','chantiers','chantier_photos','stock_history','rendez_vous',
--                            'fournisseurs','commandes','commande_lignes','relances','chantier_notes']
--   loop
--     execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
--   end loop;
-- end $$;
-- La règle profiles_admin_all est conservée : la page Administration lit le rôle des comptes.
