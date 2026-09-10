-- Planning: appointments linked to the authenticated user, optional chantier and client.
create table if not exists public.rendez_vous (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chantier_id uuid references public.chantiers(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  type text not null default 'autre' check (type in ('client','intervention','livraison','reunion','autre')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index if not exists rendez_vous_user_start_idx on public.rendez_vous(user_id, start_at);
create index if not exists rendez_vous_chantier_idx on public.rendez_vous(chantier_id);

alter table public.rendez_vous enable row level security;

drop policy if exists "Users can read their appointments" on public.rendez_vous;
drop policy if exists "Users can create their appointments" on public.rendez_vous;
drop policy if exists "Users can update their appointments" on public.rendez_vous;
drop policy if exists "Users can delete their appointments" on public.rendez_vous;
create policy "Users can read their appointments" on public.rendez_vous for select using (auth.uid() = user_id);
create policy "Users can create their appointments" on public.rendez_vous for insert with check (auth.uid() = user_id);
create policy "Users can update their appointments" on public.rendez_vous for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their appointments" on public.rendez_vous for delete using (auth.uid() = user_id);

create or replace function public.set_rendez_vous_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists rendez_vous_updated_at on public.rendez_vous;
create trigger rendez_vous_updated_at before update on public.rendez_vous for each row execute procedure public.set_rendez_vous_updated_at();
