-- Woolzip Database Schema
-- PRD §8에 명시된 스키마를 기반으로 한 가족 안부 공유 서비스 DB 구조

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table (Supabase Auth와 연동)
create table public.users (
  id uuid primary key default auth.uid(),
  username text unique not null, -- 로그인용 ID (예: myid123)
  email text unique, -- Supabase Auth 이메일 (내부용)
  display_name text, -- 가족이 보는 이름 (예: 엄마, 아빠)
  avatar_url text,
  locale text default 'ko-KR',
  created_at timestamptz default now()
);

-- Families table
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Family members relationship table
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text check (role in ('parent','child','sibling')),
  is_active boolean default true,
  joined_at timestamptz default now(),
  unique(family_id, user_id)
);

-- Signals table for 안심 신호
create table public.signals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  type text check (type in ('green','yellow','red')) not null,
  tag text check (tag in ('meal','home','leave','sleep','wake','sos') or tag is null),
  note text check (char_length(note) <= 60),
  created_at timestamptz default now(),
  undo_until timestamptz
);

-- Medications table for 복용약 정보
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  times text[] check (times <@ array['morning','noon','evening']),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Med logs table for 복용 기록
create table public.med_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  medication_id uuid references public.medications(id) on delete cascade,
  time_slot text check (time_slot in ('morning','noon','evening')),
  taken_at timestamptz default now()
);

-- Reminders table for 알림 설정
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  kind text check (kind in ('med','custom')),
  time_of_day time not null,
  days_mask int default 127, -- 비트마스크(월~일)
  enabled boolean default true,
  created_at timestamptz default now()
);

-- Emotions table for 감정 공유
create table public.emotions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  emoji text, -- e.g. "😊"
  text text check (char_length(text) <= 60),
  created_at timestamptz default now()
);

-- Invites table for 가족 초대
create table public.invites (
  code text primary key,
  family_id uuid references public.families(id) on delete cascade,
  created_by uuid references public.users(id),
  expires_at timestamptz,
  used_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Settings table for 사용자 설정
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete cascade,
  share_signals boolean default true,
  share_meds boolean default true,
  share_emotion boolean default true,
  font_scale text default 'md', -- 'md' | 'lg' | 'xl'
  high_contrast boolean default false,
  push_opt_in boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Devices table for 푸시 알림
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  device_type text, -- 'ios'|'android'|'desktop'
  push_token text,
  created_at timestamptz default now(),
  last_seen_at timestamptz
);

-- SOS events table for 긴급 신호
create table public.sos_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Create indexes for better performance
create index on public.signals (family_id, created_at desc);
create index on public.med_logs (user_id, time_slot, taken_at desc);
create index on public.family_members (family_id, user_id);
create index on public.emotions (family_id, created_at desc);
create index on public.medications (user_id, is_active);
create index on public.invites (code, expires_at);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at trigger to settings table
create trigger handle_settings_updated_at
  before update on public.settings
  for each row
  execute function public.handle_updated_at();