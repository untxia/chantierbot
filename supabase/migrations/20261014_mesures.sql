-- Mesures prises sur chantier (réalité augmentée ou sur photo).
-- value : mètres pour une longueur, mètres carrés pour une surface.
create table if not exists public.mesures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chantier_id uuid references public.chantiers(id) on delete set null,
  label text,
  kind text not null check (kind in ('longueur', 'surface')),
  value numeric not null check (value > 0 and value < 1000000),
  method text not null check (method in ('ar', 'photo')),
  created_at timestamptz not null default now()
);

create index if not exists idx_mesures_user_created
  on public.mesures(user_id, created_at desc);
create index if not exists idx_mesures_chantier
  on public.mesures(chantier_id);

alter table public.mesures enable row level security;

create policy "Users can read their mesures"
  on public.mesures for select
  using (auth.uid() = user_id);

create policy "Users can create their mesures"
  on public.mesures for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their mesures"
  on public.mesures for delete
  using (auth.uid() = user_id);
