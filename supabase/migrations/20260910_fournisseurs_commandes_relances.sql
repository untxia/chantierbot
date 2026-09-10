-- Point 4: fournisseurs, commandes et relances
-- Les tables existent dans le projet ; cette migration enrichit leur structure
-- et sécurise les relations nécessaires au module de gestion.

alter table public.fournisseurs add column if not exists email text;
alter table public.fournisseurs add column if not exists phone text;
alter table public.fournisseurs add column if not exists address text;
alter table public.fournisseurs add column if not exists favorite boolean not null default false;
alter table public.fournisseurs add column if not exists notes text;
alter table public.fournisseurs add column if not exists updated_at timestamptz not null default now();

alter table public.commandes add column if not exists fournisseur_id uuid;
alter table public.commandes add column if not exists chantier_id uuid;
alter table public.commandes add column if not exists status text not null default 'brouillon';
alter table public.commandes add column if not exists order_date date not null default current_date;
alter table public.commandes add column if not exists expected_date date;
alter table public.commandes add column if not exists notes text;
alter table public.commandes add column if not exists total_ht numeric(12,2) not null default 0;
alter table public.commandes add column if not exists updated_at timestamptz not null default now();

alter table public.commande_lignes add column if not exists commande_id uuid;
alter table public.commande_lignes add column if not exists designation text;
alter table public.commande_lignes add column if not exists quantity numeric(12,3) not null default 1;
alter table public.commande_lignes add column if not exists unit text not null default 'u';
alter table public.commande_lignes add column if not exists unit_price_ht numeric(12,2) not null default 0;
alter table public.commande_lignes add column if not exists total_ht numeric(12,2) not null default 0;

alter table public.relances add column if not exists client_id uuid;
alter table public.relances add column if not exists fournisseur_id uuid;
alter table public.relances add column if not exists chantier_id uuid;
alter table public.relances add column if not exists type text not null default 'client';
alter table public.relances add column if not exists title text;
alter table public.relances add column if not exists due_date date;
alter table public.relances add column if not exists priority text not null default 'normale';
alter table public.relances add column if not exists status text not null default 'a_faire';
alter table public.relances add column if not exists notes text;
alter table public.relances add column if not exists completed_at timestamptz;
alter table public.relances add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.commandes add constraint commandes_status_check check (status in ('brouillon','commandee','recue','annulee'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.relances add constraint relances_type_check check (type in ('client','fournisseur'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.relances add constraint relances_priority_check check (priority in ('basse','normale','haute','urgente'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.relances add constraint relances_status_check check (status in ('a_faire','faite','annulee'));
exception when duplicate_object then null; end $$;

create index if not exists fournisseurs_favorite_idx on public.fournisseurs(favorite);
create index if not exists commandes_fournisseur_idx on public.commandes(fournisseur_id);
create index if not exists commandes_chantier_idx on public.commandes(chantier_id);
create index if not exists commandes_status_idx on public.commandes(status);
create index if not exists commande_lignes_commande_idx on public.commande_lignes(commande_id);
create index if not exists relances_client_idx on public.relances(client_id);
create index if not exists relances_fournisseur_idx on public.relances(fournisseur_id);
create index if not exists relances_chantier_idx on public.relances(chantier_id);
create index if not exists relances_due_date_idx on public.relances(due_date);

create or replace function public.set_point4_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists fournisseurs_updated_at on public.fournisseurs;
create trigger fournisseurs_updated_at before update on public.fournisseurs for each row execute procedure public.set_point4_updated_at();
drop trigger if exists commandes_updated_at on public.commandes;
create trigger commandes_updated_at before update on public.commandes for each row execute procedure public.set_point4_updated_at();
drop trigger if exists relances_updated_at on public.relances;
create trigger relances_updated_at before update on public.relances for each row execute procedure public.set_point4_updated_at();
