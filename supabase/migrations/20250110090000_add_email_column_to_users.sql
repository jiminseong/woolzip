-- Ensure public.users has an email column for mapping Auth emails to app profiles.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'email'
  ) then
    alter table public.users add column email text;
  end if;
end;
$$;

-- Backfill emails from auth.users for existing accounts.
update public.users u
set email = au.email
from auth.users au
where au.id = u.id
  and u.email is null;

-- Keep emails unique.
do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'users_email_key'
  ) then
    create unique index users_email_key on public.users(email);
  end if;
end;
$$;
