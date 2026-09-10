-- Run this in Supabase SQL Editor after applying the auth/RLS migration.
-- It should return only the application's owner-scoped policies and RLS enabled = true.

select
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles','clients','chantiers','chantier_photos','stock_history','rendez_vous','fournisseurs','commandes','commande_lignes','relances')
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','clients','chantiers','chantier_photos','stock_history','rendez_vous','fournisseurs','commandes','commande_lignes','relances')
order by tablename, policyname;

select id, public as bucket_is_public
from storage.buckets
where id = 'chantier-photos';

select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (coalesce(qual, '') ilike '%chantier-photos%' or coalesce(with_check, '') ilike '%chantier-photos%')
order by policyname;

-- Manual smoke test:
-- 1. Create account A in /connexion and create a client + chantier.
-- 2. Create account B in another browser/private window.
-- 3. Verify B cannot see A's clients/chantiers/photos.
-- 4. Verify A can still create, update and delete its own records.
