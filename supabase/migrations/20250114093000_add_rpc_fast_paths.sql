-- RPC helpers to cut round-trips for core write operations.

create or replace function public.insert_signal(
  p_type text,
  p_tag text default null,
  p_note text default null
)
returns table (id uuid, created_at timestamptz, undo_until timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_undo_until timestamptz := now() + interval '5 minutes';
begin
  select family_id
    into v_family_id
    from public.family_members
   where user_id = auth.uid()
     and is_active = true
   limit 1;

  if v_family_id is null then
    raise exception 'NO_FAMILY';
  end if;

  return query
    insert into public.signals (family_id, user_id, type, tag, note, undo_until)
    values (v_family_id, auth.uid(), p_type, p_tag, p_note, v_undo_until)
    returning id, created_at, undo_until;
end;
$$;

comment on function public.insert_signal is 'Insert a signal for the current user using their active family membership.';


create or replace function public.insert_emotion(
  p_emoji text,
  p_text text default null
)
returns table (id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_has_today boolean;
begin
  select family_id
    into v_family_id
    from public.family_members
   where user_id = auth.uid()
     and is_active = true
   limit 1;

  if v_family_id is null then
    raise exception 'NO_FAMILY';
  end if;

  select exists (
    select 1
      from public.emotions e
     where e.user_id = auth.uid()
       and e.family_id = v_family_id
       and e.created_at >= date_trunc('day', now())
  ) into v_has_today;

  if coalesce(v_has_today, false) then
    raise exception 'ALREADY_SHARED';
  end if;

  return query
    insert into public.emotions (family_id, user_id, emoji, text)
    values (v_family_id, auth.uid(), p_emoji, p_text)
    returning id, created_at;
end;
$$;

comment on function public.insert_emotion is 'Insert an emotion entry once per day for the current user.';


create or replace function public.insert_med_log(
  p_medication_id uuid,
  p_time_slot text
)
returns table (id uuid, taken_at timestamptz, medication_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_med_name text;
  v_has_today boolean;
begin
  select family_id
    into v_family_id
    from public.family_members
   where user_id = auth.uid()
     and is_active = true
   limit 1;

  if v_family_id is null then
    raise exception 'NO_FAMILY';
  end if;

  select name
    into v_med_name
    from public.medications
   where id = p_medication_id
     and user_id = auth.uid()
     and coalesce(is_active, true) = true
   limit 1;

  if v_med_name is null then
    raise exception 'MEDICATION_NOT_FOUND';
  end if;

  select exists (
    select 1
      from public.med_logs ml
     where ml.user_id = auth.uid()
       and ml.medication_id = p_medication_id
       and ml.time_slot = p_time_slot
       and ml.taken_at >= date_trunc('day', now())
  ) into v_has_today;

  if coalesce(v_has_today, false) then
    raise exception 'ALREADY_TAKEN';
  end if;

  return query
    insert into public.med_logs (family_id, user_id, medication_id, time_slot)
    values (v_family_id, auth.uid(), p_medication_id, p_time_slot)
    returning id, taken_at, v_med_name as medication_name;
end;
$$;

comment on function public.insert_med_log is 'Insert a medication log for the current user, ensuring ownership and daily uniqueness.';
