create extension if not exists "pgcrypto";

drop table if exists public.user_preferences cascade;


create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamptz default now();


create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Focus Session',
  planned_duration integer not null,
  actual_duration integer,
  break_duration integer default 0 not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  status text not null default 'active',
  background text default 'forest' not null,
  paused_duration integer default 0 not null,
  created_at timestamptz default now() not null
);

alter table public.focus_sessions add column if not exists title text default 'Focus Session';
alter table public.focus_sessions add column if not exists planned_duration integer default 1500;
alter table public.focus_sessions add column if not exists actual_duration integer;
alter table public.focus_sessions add column if not exists break_duration integer default 0;
alter table public.focus_sessions add column if not exists started_at timestamptz default now();
alter table public.focus_sessions add column if not exists ended_at timestamptz;
alter table public.focus_sessions add column if not exists status text default 'active';
alter table public.focus_sessions add column if not exists background text default 'forest';
alter table public.focus_sessions add column if not exists paused_duration integer default 0;
alter table public.focus_sessions add column if not exists created_at timestamptz default now();

alter table public.focus_sessions drop constraint if exists session_status_valid;
alter table public.focus_sessions drop constraint if exists focus_sessions_status_check;
alter table public.focus_sessions add constraint focus_sessions_status_check
  check (status in ('active', 'paused', 'completed', 'ended_early'));


create index if not exists focus_sessions_user_id_idx on public.focus_sessions(user_id);
create index if not exists focus_sessions_started_at_idx on public.focus_sessions(started_at);
create index if not exists focus_sessions_user_started_idx on public.focus_sessions(user_id, started_at);

alter table public.profiles enable row level security;
alter table public.focus_sessions enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id or auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id or auth.uid() = id)
  with check (auth.uid() = user_id or auth.uid() = id);

drop policy if exists "Users can view own sessions" on public.focus_sessions;
drop policy if exists "Users can view their own sessions" on public.focus_sessions;
create policy "Users can view own sessions"
  on public.focus_sessions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sessions" on public.focus_sessions;
drop policy if exists "Users can create their own sessions" on public.focus_sessions;
create policy "Users can insert own sessions"
  on public.focus_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own sessions" on public.focus_sessions;
drop policy if exists "Users can update their own sessions" on public.focus_sessions;
create policy "Users can update own sessions"
  on public.focus_sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own sessions" on public.focus_sessions;
drop policy if exists "Users can delete their own sessions" on public.focus_sessions;
create policy "Users can delete own sessions"
  on public.focus_sessions for delete
  to authenticated
  using (auth.uid() = user_id);


create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

notify pgrst, 'reload schema';