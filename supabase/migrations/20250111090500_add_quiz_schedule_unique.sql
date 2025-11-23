-- Ensure only one schedule per family for daily questions
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'question_schedule_family_unique'
  ) then
    alter table public.question_schedule
    add constraint question_schedule_family_unique unique (family_id);
  end if;
end;
$$;
