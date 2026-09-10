-- Role system: the very first account created in Supabase becomes the admin.
-- Every subsequent account is a normal user by default.

alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'manager', 'user'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- The first Auth user created gets the admin role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  assigned_role := case
    when (select count(*) from auth.users) = 1 then 'admin'
    else 'user'
  end;

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
    role = coalesce(public.profiles.role, excluded.role),
    updated_at = now();

  return new;
end;
$$;

-- Recreate the trigger so new accounts use the role assignment above.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Admins can see and manage all application records; normal users remain isolated.
create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "clients_admin_all" on public.clients
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "chantiers_admin_all" on public.chantiers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "photos_admin_all" on public.chantier_photos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "stock_admin_all" on public.stock_history
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "rendez_vous_admin_all" on public.rendez_vous
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "fournisseurs_admin_all" on public.fournisseurs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "commandes_admin_all" on public.commandes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "commande_lignes_admin_all" on public.commande_lignes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "relances_admin_all" on public.relances
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
