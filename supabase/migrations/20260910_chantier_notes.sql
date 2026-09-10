create table if not exists public.chantier_notes (
  id uuid primary key default gen_random_uuid(),
  chantier_id uuid not null references public.chantiers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_chantier_notes_chantier_created
  on public.chantier_notes(chantier_id, created_at desc);

alter table public.chantier_notes enable row level security;

create policy "Users can read their chantier notes"
  on public.chantier_notes for select
  using (auth.uid() = user_id);

create policy "Users can create their chantier notes"
  on public.chantier_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their chantier notes"
  on public.chantier_notes for delete
  using (auth.uid() = user_id);
