-- Quiz / daily question feature tables

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  prompt text not null,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

create table if not exists public.question_instances (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions(id) on delete cascade,
  family_id uuid references public.families(id) on delete cascade,
  for_date date not null,
  status text check (status in ('open','closed')) default 'open',
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique (question_id, for_date)
);

create table if not exists public.question_responses (
  id uuid primary key default gen_random_uuid(),
  question_instance_id uuid references public.question_instances(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  answer_text text,
  created_at timestamptz default now(),
  unique (question_instance_id, user_id)
);

create table if not exists public.question_nudges (
  id uuid primary key default gen_random_uuid(),
  question_instance_id uuid references public.question_instances(id) on delete cascade,
  from_user_id uuid references public.users(id),
  to_user_id uuid references public.users(id),
  created_at timestamptz default now()
);

create table if not exists public.question_schedule (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  time_of_day time not null,
  timezone text default 'Asia/Seoul',
  enabled boolean default true,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_question_instances_family_date on public.question_instances (family_id, for_date);
create index if not exists idx_question_responses_instance on public.question_responses (question_instance_id);
create index if not exists idx_question_schedule_family on public.question_schedule (family_id, enabled);

-- RLS
alter table public.questions enable row level security;
alter table public.question_instances enable row level security;
alter table public.question_responses enable row level security;
alter table public.question_nudges enable row level security;
alter table public.question_schedule enable row level security;

-- Questions
drop policy if exists "View family questions" on public.questions;
create policy "View family questions" on public.questions
  for select using (public.is_active_family_member(family_id));

drop policy if exists "Create family questions" on public.questions;
create policy "Create family questions" on public.questions
  for insert with check (public.is_active_family_member(family_id) and created_by = auth.uid());

-- Question instances
drop policy if exists "View family question instances" on public.question_instances;
create policy "View family question instances" on public.question_instances
  for select using (public.is_active_family_member(family_id));

drop policy if exists "Create family question instances" on public.question_instances;
create policy "Create family question instances" on public.question_instances
  for insert with check (public.is_active_family_member(family_id));

drop policy if exists "Update family question instances" on public.question_instances;
create policy "Update family question instances" on public.question_instances
  for update using (public.is_active_family_member(family_id));

-- Question responses
drop policy if exists "View own or closed responses" on public.question_responses;
create policy "View own or closed responses" on public.question_responses
  for select using (
    exists (
      select 1
      from public.question_instances qi
      where qi.id = question_instance_id
        and public.is_active_family_member(qi.family_id)
        and (qi.status = 'closed' or auth.uid() = user_id)
    )
  );

drop policy if exists "Insert own responses" on public.question_responses;
create policy "Insert own responses" on public.question_responses
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.question_instances qi
      where qi.id = question_instance_id
        and public.is_active_family_member(qi.family_id)
    )
  );

-- Question nudges
drop policy if exists "View family nudges" on public.question_nudges;
create policy "View family nudges" on public.question_nudges
  for select using (
    exists (
      select 1 from public.question_instances qi
      where qi.id = question_instance_id
        and public.is_active_family_member(qi.family_id)
    )
  );

drop policy if exists "Create family nudges" on public.question_nudges;
create policy "Create family nudges" on public.question_nudges
  for insert with check (
    exists (
      select 1 from public.question_instances qi
      where qi.id = question_instance_id
        and public.is_active_family_member(qi.family_id)
    )
  );

-- Question schedule
drop policy if exists "View family schedules" on public.question_schedule;
create policy "View family schedules" on public.question_schedule
  for select using (public.is_active_family_member(family_id));

drop policy if exists "Manage family schedules" on public.question_schedule;
create policy "Manage family schedules" on public.question_schedule
  for all using (public.is_active_family_member(family_id));
