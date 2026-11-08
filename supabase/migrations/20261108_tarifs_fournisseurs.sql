-- Tarifs fournisseurs importés par l'artisan (fichier CSV / Excel de son compte pro).
-- Prix stockés HT avec leur taux de TVA ; le TTC est calculé.
-- Chaque artisan ne voit que ses tarifs (pas de politique « admin voit tout » ici).

create table if not exists public.tarifs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fournisseur text not null check (char_length(trim(fournisseur)) > 0),
  date_tarif date,
  fichier text,
  created_at timestamptz not null default now()
);

create table if not exists public.tarif_lignes (
  id uuid primary key default gen_random_uuid(),
  tarif_id uuid not null references public.tarifs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text,
  designation text not null check (char_length(trim(designation)) > 0),
  unite text,
  prix_ht numeric(12,4) not null check (prix_ht >= 0),
  tva numeric(5,2) not null default 20 check (tva >= 0 and tva <= 100)
);

-- Lien entre une fourniture du métré (clé « code|unité ») et une ligne de tarif.
create table if not exists public.tarif_associations (
  user_id uuid not null references auth.users(id) on delete cascade,
  code_fourniture text not null,
  tarif_ligne_id uuid not null references public.tarif_lignes(id) on delete cascade,
  primary key (user_id, code_fourniture)
);

create index if not exists tarifs_user_idx on public.tarifs(user_id, created_at desc);
create index if not exists tarif_lignes_tarif_idx on public.tarif_lignes(tarif_id);
create index if not exists tarif_lignes_user_idx on public.tarif_lignes(user_id);
create index if not exists tarif_associations_ligne_idx on public.tarif_associations(tarif_ligne_id);

alter table public.tarifs enable row level security;
alter table public.tarif_lignes enable row level security;
alter table public.tarif_associations enable row level security;

revoke all on table public.tarifs, public.tarif_lignes, public.tarif_associations from anon;
grant select, insert, update, delete on table public.tarifs, public.tarif_lignes, public.tarif_associations to authenticated;

do $$
declare t text;
begin
  foreach t in array array['tarifs', 'tarif_lignes', 'tarif_associations']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t || '_delete_own', t);
  end loop;
end $$;
