-- Allow family members to view all question responses regardless of status.
drop policy if exists "View own or closed responses" on public.question_responses;
create policy "View family responses" on public.question_responses
  for select using (
    exists (
      select 1
      from public.question_instances qi
      where qi.id = question_instance_id
        and public.is_active_family_member(qi.family_id)
    )
  );
