-- Woolzip Row Level Security Policies
-- PRD §8.1에 명시된 RLS 정책 구현

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.signals enable row level security;
alter table public.medications enable row level security;
alter table public.med_logs enable row level security;
alter table public.reminders enable row level security;
alter table public.emotions enable row level security;
alter table public.invites enable row level security;
alter table public.settings enable row level security;
alter table public.devices enable row level security;
alter table public.sos_events enable row level security;

-- Users policies: 본인만 접근
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Families policies: 가족 구성원만 접근
create policy "Family members can view family" on public.families
  for select using (
    public.is_active_family_member(id)
    or created_by = auth.uid()
  );

create policy "Users can create families" on public.families
  for insert with check (auth.uid() is not null);

-- Family members policies: 같은 가족 구성원만 볼 수 있음
create policy "Family members can view members" on public.family_members
  for select using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = family_id and fm.user_id = auth.uid() and fm.is_active = true
    )
  );

create policy "Users can join families via invite" on public.family_members
  for insert with check (auth.uid() = user_id);

-- Signals policies: 같은 가족만 조회, 본인만 입력
create policy "Family members can view signals" on public.signals
  for select using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = signals.family_id and fm.user_id = auth.uid() and fm.is_active = true
    )
  );

create policy "Users can insert own signals" on public.signals
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own signals within undo window" on public.signals
  for delete using (
    auth.uid() = user_id and 
    (undo_until is null or undo_until > now())
  );

-- Medications policies: 본인 소유만 CRUD
create policy "Users can manage own medications" on public.medications
  for all using (auth.uid() = user_id);

-- Med logs policies: 같은 가족 조회, 본인만 입력
create policy "Family members can view med logs" on public.med_logs
  for select using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = med_logs.family_id and fm.user_id = auth.uid() and fm.is_active = true
    )
  );

create policy "Users can insert own med logs" on public.med_logs
  for insert with check (auth.uid() = user_id);

-- Reminders policies: 본인 소유만 CRUD
create policy "Users can manage own reminders" on public.reminders
  for all using (auth.uid() = user_id);

-- Emotions policies: 같은 가족 조회, 본인만 입력
create policy "Family members can view emotions" on public.emotions
  for select using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = emotions.family_id and fm.user_id = auth.uid() and fm.is_active = true
    )
  );

create policy "Users can insert own emotions" on public.emotions
  for insert with check (auth.uid() = user_id);

-- Invites policies: 가족 구성원이 생성, 누구나 사용 (코드 알면)
create policy "Family members can create invites" on public.invites
  for insert with check (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = family_id and fm.user_id = auth.uid() and fm.is_active = true
    )
  );

create policy "Anyone can view valid invites" on public.invites
  for select using (expires_at > now() and used_by is null);

create policy "Anyone can update invite usage" on public.invites
  for update using (expires_at > now() and used_by is null)
  with check (auth.uid() = used_by);

-- Settings policies: 본인 설정만 CRUD
create policy "Users can manage own settings" on public.settings
  for all using (auth.uid() = user_id);

-- Devices policies: 본인 기기만 CRUD
create policy "Users can manage own devices" on public.devices
  for all using (auth.uid() = user_id);

-- SOS events policies: 같은 가족 조회, 본인만 입력
create policy "Family members can view sos events" on public.sos_events
  for select using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = sos_events.family_id and fm.user_id = auth.uid() and fm.is_active = true
    )
  );

create policy "Users can insert own sos events" on public.sos_events
  for insert with check (auth.uid() = user_id);

create policy "Family members can resolve sos events" on public.sos_events
  for update using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = sos_events.family_id and fm.user_id = auth.uid() and fm.is_active = true
    )
  );
