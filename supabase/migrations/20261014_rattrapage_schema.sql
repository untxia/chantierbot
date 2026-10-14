-- Rattrapage du schÃ©ma de production (2026-10-14).
--
-- Les migrations 20260910_* du dÃ©pÃ´t n'avaient jamais Ã©tÃ© appliquÃ©es, et leur
-- ordre alphabÃ©tique n'est pas l'ordre des dÃ©pendances. Cette migration unique
-- les remplace en production, dans le bon ordre, en rÃ©conciliant aussi le
-- schÃ©ma du 2026-09-09 (planning/fournisseurs/relances) avec ce que le code attend.
--
-- Ordre : profils -> user_id -> chantiers -> fournisseurs/commandes/relances
--         -> rendez_vous -> notes -> rÃ´les admin -> RLS -> stockage.
-- Toutes les tables applicatives Ã©taient vides au moment de l'application.

-- ============================================================ 1. profiles
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists trade_id text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists disabled_at timestamptz;

alter table public.profiles alter column username drop not null;
alter table public.profiles alter column full_name drop not null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'manager', 'user'));

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_disabled_at_idx on public.profiles(disabled_at);

-- ============================================================ 2. user_id partout
alter table public.clients add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.chantiers add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.chantier_photos add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.stock_history add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.rendez_vous add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.fournisseurs add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.commandes add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.commande_lignes add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.relances add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists chantiers_user_id_idx on public.chantiers(user_id);
create index if not exists chantier_photos_user_id_idx on public.chantier_photos(user_id);
create index if not exists stock_history_user_id_idx on public.stock_history(user_id);
create index if not exists rendez_vous_user_id_idx on public.rendez_vous(user_id);
create index if not exists fournisseurs_user_id_idx on public.fournisseurs(user_id);
create index if not exists commandes_user_id_idx on public.commandes(user_id);
create index if not exists commande_lignes_user_id_idx on public.commande_lignes(user_id);
create index if not exists relances_user_id_idx on public.relances(user_id);

-- ============================================================ 3. chantiers
alter table public.chantiers add column if not exists description text;
alter table public.chantiers add column if not exists address text;
alter table public.chantiers add column if not exists start_date date;
alter table public.chantiers add column if not exists end_date date;
alter table public.chantiers add column if not exists budget numeric(12,2);
alter table public.chantiers add column if not exists updated_at timestamptz not null default now();

create index if not exists chantiers_client_id_idx on public.chantiers(client_id);
create index if not exists chantiers_status_idx on public.chantiers(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists chantiers_updated_at on public.chantiers;
create trigger chantiers_updated_at before update on public.chantiers
  for each row execute procedure public.set_updated_at();

-- ============================================================ 4. fournisseurs
alter table public.fournisseurs add column if not exists address text;
alter table public.fournisseurs add column if not exists favorite boolean not null default false;
alter table public.fournisseurs add column if not exists notes text;
alter table public.fournisseurs add column if not exists updated_at timestamptz not null default now();

create index if not exists fournisseurs_favorite_idx on public.fournisseurs(favorite);
drop trigger if exists fournisseurs_updated_at on public.fournisseurs;
create trigger fournisseurs_updated_at before update on public.fournisseurs
  for each row execute procedure public.set_updated_at();

-- ============================================================ 5. commandes
alter table public.commandes add column if not exists order_date date not null default current_date;
alter table public.commandes add column if not exists expected_date date;
alter table public.commandes add column if not exists total_ht numeric(12,2) not null default 0;
alter table public.commandes add column if not exists updated_at timestamptz not null default now();

-- Anciennes valeurs de statut -> nouvelles, puis nouvelle contrainte.
alter table public.commandes drop constraint if exists commandes_status_check;
update public.commandes set status = case status
  when 'en_attente' then 'brouillon'
  when 'confirmee' then 'commandee'
  when 'livree' then 'recue'
  else status end
where status in ('en_attente', 'confirmee', 'livree');
alter table public.commandes alter column status set default 'brouillon';
alter table public.commandes add constraint commandes_status_check
  check (status in ('brouillon', 'commandee', 'recue', 'annulee'));

create index if not exists commandes_fournisseur_idx on public.commandes(fournisseur_id);
create index if not exists commandes_chantier_idx on public.commandes(chantier_id);
create index if not exists commandes_status_idx on public.commandes(status);
drop trigger if exists commandes_updated_at on public.commandes;
create trigger commandes_updated_at before update on public.commandes
  for each row execute procedure public.set_updated_at();

-- ============================================================ 6. commande_lignes
alter table public.commande_lignes add column if not exists designation text;
alter table public.commande_lignes add column if not exists unit_price_ht numeric(12,2) not null default 0;
alter table public.commande_lignes add column if not exists total_ht numeric(12,2) not null default 0;

-- L'ancienne colonne "item" (obligatoire) est remplacÃ©e par "designation".
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'commande_lignes' and column_name = 'item') then
    update public.commande_lignes set designation = item where designation is null;
    alter table public.commande_lignes alter column item drop not null;
  end if;
end $$;

alter table public.commande_lignes alter column quantity set default 1;
alter table public.commande_lignes alter column unit set default 'u';
create index if not exists commande_lignes_commande_idx on public.commande_lignes(commande_id);

-- ============================================================ 7. relances
alter table public.relances add column if not exists title text;
alter table public.relances add column if not exists priority text not null default 'normale';
alter table public.relances add column if not exists notes text;
alter table public.relances add column if not exists completed_at timestamptz;
alter table public.relances add column if not exists updated_at timestamptz not null default now();

-- "message" (obligatoire) devient facultatif ; son contenu alimente le titre.
alter table public.relances alter column message drop not null;
update public.relances set title = message where title is null and message is not null;

alter table public.relances drop constraint if exists relances_status_check;
update public.relances set status = case status when 'resolue' then 'faite' when 'envoyee' then 'faite' else status end
where status in ('resolue', 'envoyee');
alter table public.relances add constraint relances_status_check
  check (status in ('a_faire', 'faite', 'annulee'));

alter table public.relances drop constraint if exists relances_priority_check;
alter table public.relances add constraint relances_priority_check
  check (priority in ('basse', 'normale', 'haute', 'urgente'));

create index if not exists relances_client_idx on public.relances(client_id);
create index if not exists relances_fournisseur_idx on public.relances(fournisseur_id);
create index if not exists relances_chantier_idx on public.relances(chantier_id);
create index if not exists relances_due_date_idx on public.relances(due_date);
drop trigger if exists relances_updated_at on public.relances;
create trigger relances_updated_at before update on public.relances
  for each row execute procedure public.set_updated_at();

-- ============================================================ 8. rendez_vous
alter table public.rendez_vous add column if not exists description text;
alter table public.rendez_vous add column if not exists type text not null default 'autre';
alter table public.rendez_vous add column if not exists start_at timestamptz;
alter table public.rendez_vous add column if not exists end_at timestamptz;
alter table public.rendez_vous add column if not exists updated_at timestamptz not null default now();

-- scheduled_at (ancien modÃ¨le) -> start_at / end_at (+1 h).
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'rendez_vous' and column_name = 'scheduled_at') then
    update public.rendez_vous
      set start_at = coalesce(start_at, scheduled_at),
          end_at = coalesce(end_at, scheduled_at + interval '1 hour')
      where start_at is null;
    alter table public.rendez_vous alter column scheduled_at drop not null;
  end if;
end $$;

alter table public.rendez_vous alter column start_at set not null;
alter table public.rendez_vous alter column end_at set not null;

alter table public.rendez_vous drop constraint if exists rendez_vous_type_check;
alter table public.rendez_vous add constraint rendez_vous_type_check
  check (type in ('client', 'intervention', 'livraison', 'reunion', 'autre'));
alter table public.rendez_vous drop constraint if exists rendez_vous_end_after_start;
alter table public.rendez_vous add constraint rendez_vous_end_after_start check (end_at > start_at);

create index if not exists rendez_vous_user_start_idx on public.rendez_vous(user_id, start_at);
create index if not exists rendez_vous_chantier_idx on public.rendez_vous(chantier_id);
drop trigger if exists rendez_vous_updated_at on public.rendez_vous;
create trigger rendez_vous_updated_at before update on public.rendez_vous
  for each row execute procedure public.set_updated_at();

-- ============================================================ 9. chantier_notes
create table if not exists public.chantier_notes (
  id uuid primary key default gen_random_uuid(),
  chantier_id uuid not null references public.chantiers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_chantier_notes_chantier_created
  on public.chantier_notes(chantier_id, created_at desc);

-- ============================================================ 10. rÃ´les admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- CrÃ©ation d'un compte : profil automatique ; le tout premier compte devient admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  assigned_role := case when (select count(*) from auth.users) = 1 then 'admin' else 'user' end;

  insert into public.profiles (id, display_name, company_name, full_name, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    assigned_role
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Comptes dÃ©jÃ  existants : profil manquant crÃ©Ã© ; le plus ancien devient admin
-- s'il n'y a encore aucun admin.
insert into public.profiles (id, display_name, company_name, full_name, role)
select u.id,
       nullif(u.raw_user_meta_data ->> 'display_name', ''),
       nullif(u.raw_user_meta_data ->> 'company_name', ''),
       nullif(u.raw_user_meta_data ->> 'display_name', ''),
       'user'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

update public.profiles
set role = 'admin'
where id = (select id from auth.users order by created_at asc limit 1)
  and not exists (select 1 from public.profiles where role = 'admin');

-- ============================================================ 11. RLS
-- Remise Ã  plat des politiques des tables applicatives.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','clients','chantiers','chantier_photos','stock_history','rendez_vous',
                        'fournisseurs','commandes','commande_lignes','relances','chantier_notes')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.chantier_notes enable row level security;

revoke all on table public.profiles, public.clients, public.chantiers, public.chantier_photos,
  public.stock_history, public.rendez_vous, public.fournisseurs, public.commandes,
  public.commande_lignes, public.relances, public.chantier_notes from anon;
grant select, insert, update, delete on table public.profiles, public.clients, public.chantiers,
  public.chantier_photos, public.stock_history, public.rendez_vous, public.fournisseurs,
  public.commandes, public.commande_lignes, public.relances, public.chantier_notes to authenticated;

-- Tables Ã  propriÃ©taire : chaque utilisateur ne voit/modifie que ses lignes ; l'admin voit tout.
do $$
declare t text;
begin
  foreach t in array array['clients','chantiers','chantier_photos','stock_history','rendez_vous',
                           'fournisseurs','commandes','commande_lignes','relances','chantier_notes']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t || '_delete_own', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin_all', t);
  end loop;
end $$;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
-- Un utilisateur peut modifier son profil mais pas son rÃ´le ni sa dÃ©sactivation.
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
    and disabled_at is not distinct from (select p.disabled_at from public.profiles p where p.id = (select auth.uid()))
  );
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================ 12. stockage des photos
update storage.buckets set public = false where id = 'chantier-photos';

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') ilike '%chantier-photos%' or coalesce(with_check, '') ilike '%chantier-photos%')
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

-- Le premier segment du chemin est l'id du chantier ; il doit appartenir Ã  l'utilisateur.
create policy chantier_photos_storage_select on storage.objects for select to authenticated
  using (bucket_id = 'chantier-photos' and exists (
    select 1 from public.chantiers c
    where c.id::text = (storage.foldername(objects.name))[1] and c.user_id = (select auth.uid())));
create policy chantier_photos_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'chantier-photos' and exists (
    select 1 from public.chantiers c
    where c.id::text = (storage.foldername(objects.name))[1] and c.user_id = (select auth.uid())));
create policy chantier_photos_storage_update on storage.objects for update to authenticated
  using (bucket_id = 'chantier-photos' and exists (
    select 1 from public.chantiers c
    where c.id::text = (storage.foldername(objects.name))[1] and c.user_id = (select auth.uid())))
  with check (bucket_id = 'chantier-photos' and exists (
    select 1 from public.chantiers c
    where c.id::text = (storage.foldername(objects.name))[1] and c.user_id = (select auth.uid())));
create policy chantier_photos_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'chantier-photos' and exists (
    select 1 from public.chantiers c
    where c.id::text = (storage.foldername(objects.name))[1] and c.user_id = (select auth.uid())));
