-- Enforce created_by to match auth.uid() via trigger to avoid RLS insert failures.

create or replace function public.set_family_created_by()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is null; authentication required' using errcode = '42501';
  end if;
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  if new.created_by <> auth.uid() then
    raise exception 'created_by must match auth.uid()' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists set_family_created_by on public.families;
create trigger set_family_created_by
  before insert on public.families
  for each row
  execute function public.set_family_created_by();

-- Relax insert policy to just require authentication; trigger enforces created_by consistency.
drop policy if exists "Users can create families" on public.families;
create policy "Users can create families" on public.families
  for insert
  with check (auth.uid() is not null);
