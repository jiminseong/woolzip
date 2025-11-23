-- Allow family creator to view the newly inserted family row (for RETURNING)
-- even before they are inserted into family_members.

drop policy if exists "Family members can view family" on public.families;
create policy "Family members can view family" on public.families
  for select using (
    public.is_active_family_member(id)
    or created_by = auth.uid()
  );
