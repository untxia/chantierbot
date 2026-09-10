-- Chantier management: richer fields, timestamps and safe defaults.
alter table public.chantiers add column if not exists description text;
alter table public.chantiers add column if not exists client_id uuid;
alter table public.chantiers add column if not exists address text;
alter table public.chantiers add column if not exists start_date date;
alter table public.chantiers add column if not exists end_date date;
alter table public.chantiers add column if not exists budget numeric(12,2);
alter table public.chantiers add column if not exists updated_at timestamptz not null default now();

create index if not exists chantiers_client_id_idx on public.chantiers(client_id);
create index if not exists chantiers_status_idx on public.chantiers(status);

create or replace function public.set_chantiers_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists chantiers_updated_at on public.chantiers;
create trigger chantiers_updated_at before update on public.chantiers for each row execute procedure public.set_chantiers_updated_at();
