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

-- Own row only. `to auth.uid()` makes these per-user, not merely "authenticated".
create policy "read own rows"
  on lawlink_kv for select
  using (user_id = auth.uid());

create policy "insert own rows"
  on lawlink_kv for insert
  with check (user_id = auth.uid());

create policy "update own rows"
  on lawlink_kv for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "delete own rows"
  on lawlink_kv for delete
  using (user_id = auth.uid());

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
-- create policy "scores are public read" on lawlink_scores for select using (true);
-- create policy "update own score"   on lawlink_scores for update
--   using (user_id = auth.uid()) with check (user_id = auth.uid());
