create policy "Family members can view basic profiles" on public.users
  for select using (
    auth.uid() = id
    or exists (
      select 1
      from public.family_members fm_self
      join public.family_members fm_target on fm_self.family_id = fm_target.family_id
      where fm_self.user_id = auth.uid()
        and fm_target.user_id = users.id
        and fm_self.is_active = true
        and fm_target.is_active = true
    )
  );
