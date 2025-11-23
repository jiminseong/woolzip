-- Allow inserting families without explicitly passing created_by by defaulting to auth.uid()
-- and relaxing the insert policy to accept null/implicit created_by.

-- Set default created_by to the current auth user.
alter table public.families
alter column created_by set default auth.uid();

-- Update insert policy to accept implicit created_by.
drop policy if exists "Users can create families" on public.families;
create policy "Users can create families" on public.families
  for insert
  with check (coalesce(created_by, auth.uid()) = auth.uid());
