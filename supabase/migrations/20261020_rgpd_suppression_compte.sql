-- RGPD : suppression de compte par l'utilisateur lui-même (droit à l'effacement).
--
-- La fonction ne supprime QUE le compte de l'appelant (auth.uid()). Le reste des
-- données part en cascade (toutes les tables applicatives ont user_id -> auth.users
-- ON DELETE CASCADE). Les fichiers du stockage sont supprimés par l'API avant l'appel.
-- Garde-fou : le dernier administrateur ne peut pas se supprimer (évite un blocage).

create or replace function public.delete_my_account(dry_run boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  is_admin_user boolean;
  other_admins integer;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select (role = 'admin') into is_admin_user from public.profiles where id = uid;

  if coalesce(is_admin_user, false) then
    select count(*) into other_admins
    from public.profiles
    where role = 'admin' and id <> uid and disabled_at is null;

    if other_admins = 0 then
      raise exception 'last_admin' using errcode = 'P0001';
    end if;
  end if;

  -- Essai à blanc : vérifie les conditions sans rien supprimer.
  if dry_run then
    return;
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account(boolean) from public, anon;
grant execute on function public.delete_my_account(boolean) to authenticated;
