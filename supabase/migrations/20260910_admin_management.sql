-- Admin management: account status and administrative controls.
-- The service role is used only by server-side admin endpoints for Auth operations.

alter table public.profiles
  add column if not exists disabled_at timestamptz;

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_disabled_at_idx on public.profiles(disabled_at);

-- Keep disabled accounts from being usable even if a valid Auth session exists.
create policy "profiles_admin_management" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
