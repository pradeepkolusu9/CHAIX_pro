-- LawLink — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- IMPORTANT — READ BEFORE ENABLING
-- ------------------------------------------------------------------
-- This schema is correct for a real deployment, but it requires Supabase Auth.
-- LawLink's own auth is a prototype: the password is validated for length and then
-- discarded, and no session is created. Until Supabase Auth is wired in, the anon
-- key is rejected by the policies below and every read/write falls back to
-- localStorage. That is the intended, safe behaviour: the demo must never depend
-- on a backend being reachable.
--
-- To go live you need all three:
--   1. Supabase Auth (email or Google) on the client.
--   2. signIn() before any query, so auth.uid() is populated.
--   3. The (user_id, key) primary key below, with user_id defaulting to auth.uid().
--
-- WITHOUT auth, do NOT loosen these policies. The earlier version used
-- `auth.role() = 'authenticated' OR auth.uid() IS NOT NULL`, which is
-- "any signed-in user", not "your own row" — and the old single global key meant
-- every visitor would have shared one blob, with clearAll() deleting it for all.

create table if not exists lawlink_kv (
  user_id    uuid        not null default auth.uid() references auth.users on delete cascade,
  key        text        not null,
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  -- Forward-compatible: the client writes a schema version so a future format
  -- change can be migrated instead of silently misread.
  version    int         not null default 1,
  primary key (user_id, key)
);

create index if not exists lawlink_kv_user_updated_idx
  on lawlink_kv (user_id, updated_at desc);

alter table lawlink_kv enable row level security;

-- Own row only. `to authenticated` keeps the anon role out entirely, and `user_id = auth.uid()`
-- makes each policy per-user rather than merely "any signed-in user". Every policy is dropped
-- first so this file can be re-run safely.
revoke all on lawlink_kv from anon;

drop policy if exists "read own rows" on lawlink_kv;
create policy "read own rows"
  on lawlink_kv for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "insert own rows" on lawlink_kv;
create policy "insert own rows"
  on lawlink_kv for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "update own rows" on lawlink_kv;
create policy "update own rows"
  on lawlink_kv for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "delete own rows" on lawlink_kv;
create policy "delete own rows"
  on lawlink_kv for delete
  to authenticated
  using (user_id = auth.uid());

-- Size limits, so one client cannot store an unbounded blob. Re-runnable.
alter table lawlink_kv drop constraint if exists lawlink_kv_key_length;
alter table lawlink_kv
  add constraint lawlink_kv_key_length check (char_length(key) between 1 and 128);

alter table lawlink_kv drop constraint if exists lawlink_kv_value_size;
alter table lawlink_kv
  add constraint lawlink_kv_value_size check (pg_column_size(value) <= 262144);

-- Keep updated_at honest: the client cannot forge or forget it.
create or replace function lawlink_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lawlink_kv_set_updated_at on lawlink_kv;
create trigger lawlink_kv_set_updated_at
  before update on lawlink_kv
  for each row execute function lawlink_set_updated_at();

-- ------------------------------------------------------------------
-- Optional: a real leaderboard. The shipped leaderboard is seeded demo data
-- and is labelled as such in the UI. Only create this if you want live ranks.
-- ------------------------------------------------------------------
-- create table if not exists lawlink_scores (
--   user_id   uuid primary key references auth.users on delete cascade,
--   name      text not null,
--   college   text,
--   xp        int  not null default 0,
--   weekly_xp int  not null default 0,
--   badges    int  not null default 0,
--   updated_at timestamptz not null default now()
-- );
-- alter table lawlink_scores enable row level security;
-- drop policy if exists "scores are public read" on lawlink_scores;
-- create policy "scores are public read" on lawlink_scores for select to authenticated using (true);
-- drop policy if exists "update own score" on lawlink_scores;
-- create policy "update own score" on lawlink_scores for update to authenticated
--   using (user_id = auth.uid()) with check (user_id = auth.uid());
