-- Ensure devices.push_token is unique for upsert operations.

-- Drop duplicates, keeping the latest row per push_token
do $$
begin
  with dedup as (
    select
      id,
      push_token,
      row_number() over (partition by push_token order by created_at desc nulls last, id desc) as rn
    from public.devices
    where push_token is not null
  )
  delete from public.devices d
  using dedup
  where d.id = dedup.id
    and dedup.rn > 1;
end;
$$;

-- Add unique constraint used by upsert on push_token
alter table public.devices
  add constraint devices_push_token_key unique (push_token);
