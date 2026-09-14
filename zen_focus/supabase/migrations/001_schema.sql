create extension if not exists "pgcrypto";

create schema if not exists private;


create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,

  name text,
  display_name text,
  avatar_url text,

  timezone text not null default 'Africa/Addis_Ababa',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null default 'Focus Session',

  planned_duration integer not null,
  actual_duration integer,

  break_duration integer not null default 0,

  started_at timestamptz not null,
  ended_at timestamptz,

  status text not null default 'active',

  background text not null default 'forest',

  paused_duration integer not null default 0,

  created_at timestamptz not null default now(),

  constraint focus_sessions_status_check
    check (
      status in (
        'active',
        'paused',
        'completed',
        'ended_early'
      )
    ),

  constraint focus_sessions_planned_duration_positive
    check (planned_duration > 0),

  constraint focus_sessions_actual_duration_nonnegative
    check (
      actual_duration is null
      or actual_duration >= 0
    ),

  constraint focus_sessions_break_duration_nonnegative
    check (break_duration >= 0),

  constraint focus_sessions_paused_duration_nonnegative
    check (paused_duration >= 0)
);


-- ------------------------------------------------------------
-- 5. INDEXES
-- ------------------------------------------------------------

create index focus_sessions_user_id_idx
  on public.focus_sessions(user_id);

create index focus_sessions_started_at_idx
  on public.focus_sessions(started_at);

create index focus_sessions_user_started_idx
  on public.focus_sessions(user_id, started_at);


-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.profiles enable row level security;

alter table public.focus_sessions enable row level security;


-- ------------------------------------------------------------
-- 7. CLIENT PRIVILEGES
-- ------------------------------------------------------------

-- Remove default access first.
revoke all on table public.profiles
from anon, authenticated;

revoke all on table public.focus_sessions
from anon, authenticated;


-- Profiles:
-- Users only need to read and update their own profile.
grant select, update
on table public.profiles
to authenticated;


-- Focus sessions:
-- Users need full CRUD access to their own sessions.
grant select, insert, update, delete
on table public.focus_sessions
to authenticated;


-- ------------------------------------------------------------
-- 8. PROFILE RLS POLICIES
-- ------------------------------------------------------------

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = user_id
);


create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);


-- ------------------------------------------------------------
-- 9. FOCUS SESSION RLS POLICIES
-- ------------------------------------------------------------

create policy "Users can view their own focus sessions"
on public.focus_sessions
for select
to authenticated
using (
  (select auth.uid()) = user_id
);


create policy "Users can create their own focus sessions"
on public.focus_sessions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);


create policy "Users can update their own focus sessions"
on public.focus_sessions
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);


create policy "Users can delete their own focus sessions"
on public.focus_sessions
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);


-- ------------------------------------------------------------
-- 10. AUTO-CREATE PROFILE WHEN AUTH USER IS CREATED
-- ------------------------------------------------------------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  insert into public.profiles (
    id,
    user_id,
    name,
    display_name
  )
  values (
    new.id,
    new.id,

    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    ),

    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )

  on conflict (user_id) do nothing;

  return new;

end;
$$;


-- ------------------------------------------------------------
-- 11. AUTH USER TRIGGER
-- ------------------------------------------------------------

drop trigger if exists on_auth_user_created
on auth.users;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();


-- ------------------------------------------------------------
-- 12. UPDATED_AT TRIGGER
-- ------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin

  new.updated_at = pg_catalog.now();

  return new;

end;
$$;


create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();


notify pgrst, 'reload schema';