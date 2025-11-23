-- Fix RLS recursion on family_members by using a helper function.

-- Helper: check if the current auth user is an active member of the target family.
create or replace function public.is_active_family_member(target_family_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = target_family_id
      and fm.user_id = auth.uid()
      and fm.is_active = true
  );
$$;

-- Families: use helper to avoid recursive reference.
drop policy if exists "Family members can view family" on public.families;
create policy "Family members can view family" on public.families
  for select using (public.is_active_family_member(id));

-- Family members: avoid self-referential policy.
drop policy if exists "Family members can view members" on public.family_members;
create policy "Family members can view members" on public.family_members
  for select using (public.is_active_family_member(family_id));

-- Signals: reuse helper for consistency.
drop policy if exists "Family members can view signals" on public.signals;
create policy "Family members can view signals" on public.signals
  for select using (public.is_active_family_member(family_id));

-- Med logs: reuse helper for consistency.
drop policy if exists "Family members can view med logs" on public.med_logs;
create policy "Family members can view med logs" on public.med_logs
  for select using (public.is_active_family_member(family_id));

-- Emotions: reuse helper for consistency.
drop policy if exists "Family members can view emotions" on public.emotions;
create policy "Family members can view emotions" on public.emotions
  for select using (public.is_active_family_member(family_id));

-- SOS events: reuse helper for consistency.
drop policy if exists "Family members can view sos events" on public.sos_events;
create policy "Family members can view sos events" on public.sos_events
  for select using (public.is_active_family_member(family_id));
