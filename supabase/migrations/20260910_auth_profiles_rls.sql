create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  company_name text,
  trade_id text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists trade_id text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.clients add column if not exists user_id uuid;
alter table public.chantiers add column if not exists user_id uuid;
alter table public.chantier_photos add column if not exists user_id uuid;
alter table public.stock_history add column if not exists user_id uuid;
alter table public.rendez_vous add column if not exists user_id uuid;
alter table public.fournisseurs add column if not exists user_id uuid;
alter table public.commandes add column if not exists user_id uuid;
alter table public.commande_lignes add column if not exists user_id uuid;
alter table public.relances add column if not exists user_id uuid;

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists chantiers_user_id_idx on public.chantiers(user_id);
create index if not exists chantier_photos_user_id_idx on public.chantier_photos(user_id);
create index if not exists stock_history_user_id_idx on public.stock_history(user_id);
create index if not exists rendez_vous_user_id_idx on public.rendez_vous(user_id);
create index if not exists fournisseurs_user_id_idx on public.fournisseurs(user_id);
create index if not exists commandes_user_id_idx on public.commandes(user_id);
create index if not exists commande_lignes_user_id_idx on public.commande_lignes(user_id);
create index if not exists relances_user_id_idx on public.relances(user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, company_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''), nullif(new.raw_user_meta_data ->> 'company_name', ''))
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, profiles.display_name),
    company_name = coalesce(excluded.company_name, profiles.company_name),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' and tablename in ('profiles','clients','chantiers','chantier_photos','stock_history','rendez_vous','fournisseurs','commandes','commande_lignes','relances')
  loop execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename); end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.chantiers enable row level security;
alter table public.chantier_photos enable row level security;
alter table public.stock_history enable row level security;
alter table public.rendez_vous enable row level security;
alter table public.fournisseurs enable row level security;
alter table public.commandes enable row level security;
alter table public.commande_lignes enable row level security;
alter table public.relances enable row level security;

revoke all on table public.profiles, public.clients, public.chantiers, public.chantier_photos, public.stock_history, public.rendez_vous, public.fournisseurs, public.commandes, public.commande_lignes, public.relances from anon;
grant select, insert, update, delete on table public.profiles, public.clients, public.chantiers, public.chantier_photos, public.stock_history, public.rendez_vous, public.fournisseurs, public.commandes, public.commande_lignes, public.relances to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

create policy "clients_select_own" on public.clients for select to authenticated using ((select auth.uid()) = user_id);
create policy "clients_insert_own" on public.clients for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "clients_update_own" on public.clients for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "clients_delete_own" on public.clients for delete to authenticated using ((select auth.uid()) = user_id);

create policy "chantiers_select_own" on public.chantiers for select to authenticated using ((select auth.uid()) = user_id);
create policy "chantiers_insert_own" on public.chantiers for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "chantiers_update_own" on public.chantiers for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "chantiers_delete_own" on public.chantiers for delete to authenticated using ((select auth.uid()) = user_id);

create policy "photos_select_own" on public.chantier_photos for select to authenticated using ((select auth.uid()) = user_id);
create policy "photos_insert_own" on public.chantier_photos for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "photos_update_own" on public.chantier_photos for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "photos_delete_own" on public.chantier_photos for delete to authenticated using ((select auth.uid()) = user_id);

create policy "stock_select_own" on public.stock_history for select to authenticated using ((select auth.uid()) = user_id);
create policy "stock_insert_own" on public.stock_history for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "stock_update_own" on public.stock_history for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "stock_delete_own" on public.stock_history for delete to authenticated using ((select auth.uid()) = user_id);

create policy "rendez_vous_select_own" on public.rendez_vous for select to authenticated using ((select auth.uid()) = user_id);
create policy "rendez_vous_insert_own" on public.rendez_vous for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "rendez_vous_update_own" on public.rendez_vous for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "rendez_vous_delete_own" on public.rendez_vous for delete to authenticated using ((select auth.uid()) = user_id);

create policy "fournisseurs_select_own" on public.fournisseurs for select to authenticated using ((select auth.uid()) = user_id);
create policy "fournisseurs_insert_own" on public.fournisseurs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "fournisseurs_update_own" on public.fournisseurs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "fournisseurs_delete_own" on public.fournisseurs for delete to authenticated using ((select auth.uid()) = user_id);

create policy "commandes_select_own" on public.commandes for select to authenticated using ((select auth.uid()) = user_id);
create policy "commandes_insert_own" on public.commandes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "commandes_update_own" on public.commandes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "commandes_delete_own" on public.commandes for delete to authenticated using ((select auth.uid()) = user_id);

create policy "commande_lignes_select_own" on public.commande_lignes for select to authenticated using ((select auth.uid()) = user_id);
create policy "commande_lignes_insert_own" on public.commande_lignes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "commande_lignes_update_own" on public.commande_lignes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "commande_lignes_delete_own" on public.commande_lignes for delete to authenticated using ((select auth.uid()) = user_id);

create policy "relances_select_own" on public.relances for select to authenticated using ((select auth.uid()) = user_id);
create policy "relances_insert_own" on public.relances for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "relances_update_own" on public.relances for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "relances_delete_own" on public.relances for delete to authenticated using ((select auth.uid()) = user_id);

update storage.buckets set public = false where id = 'chantier-photos';

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and (coalesce(qual, '') ilike '%chantier-photos%' or coalesce(with_check, '') ilike '%chantier-photos%')
  loop execute format('drop policy if exists %I on storage.objects', r.policyname); end loop;
end $$;

create policy "chantier_photos_storage_select" on storage.objects for select to authenticated using (bucket_id = 'chantier-photos' and exists (select 1 from public.chantiers c where c.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid())));
create policy "chantier_photos_storage_insert" on storage.objects for insert to authenticated with check (bucket_id = 'chantier-photos' and exists (select 1 from public.chantiers c where c.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid())));
create policy "chantier_photos_storage_update" on storage.objects for update to authenticated using (bucket_id = 'chantier-photos' and exists (select 1 from public.chantiers c where c.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid()))) with check (bucket_id = 'chantier-photos' and exists (select 1 from public.chantiers c where c.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid())));
create policy "chantier_photos_storage_delete" on storage.objects for delete to authenticated using (bucket_id = 'chantier-photos' and exists (select 1 from public.chantiers c where c.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid())));
