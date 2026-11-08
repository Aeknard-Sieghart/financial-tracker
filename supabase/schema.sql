-- Run once in the Supabase SQL Editor. No privileged key belongs in the browser.
create table if not exists public.tracker_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.tracker_snapshots enable row level security;
revoke all on public.tracker_snapshots from anon, authenticated;
grant select on public.tracker_snapshots to authenticated;
drop policy if exists "Read own tracker" on public.tracker_snapshots;
create policy "Read own tracker" on public.tracker_snapshots for select to authenticated
  using ((select auth.uid()) = user_id);

-- Writes go through this function only. The user identity comes from the JWT,
-- never from a client-provided user ID. Advisory locking also handles first-save races.
create or replace function public.save_tracker_snapshot(expected_revision bigint, new_payload jsonb)
returns setof public.tracker_snapshots
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  current_revision bigint;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if new_payload is null or jsonb_typeof(new_payload) <> 'object'
     or octet_length(new_payload::text) > 10485760
     or new_payload->>'version' is distinct from '10'
     or not (new_payload ?& array['transactions','accounts','transfers','budgets','categories','bills','debts','schedules','goals','incomePlans','spendingBuffer']) then
    raise exception 'Invalid snapshot';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
  select revision into current_revision from public.tracker_snapshots where user_id = owner_id;
  if coalesce(current_revision, 0) <> expected_revision then return; end if;
  return query insert into public.tracker_snapshots (user_id, payload, revision, updated_at)
    values (owner_id, new_payload, 1, now())
    on conflict (user_id) do update set payload = excluded.payload,
      revision = tracker_snapshots.revision + 1, updated_at = now()
    returning *;
end;
$$;
revoke all on function public.save_tracker_snapshot(bigint, jsonb) from public;
grant execute on function public.save_tracker_snapshot(bigint, jsonb) to authenticated;
