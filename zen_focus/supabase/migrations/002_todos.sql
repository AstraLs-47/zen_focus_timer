create table public.todos (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,

  title       text        not null,
  description text,

  status      text        not null default 'todo',
  priority    text        not null default 'medium',

  due_date    date,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint todos_status_check
    check (status in ('todo', 'in_progress', 'done')),

  constraint todos_priority_check
    check (priority in ('low', 'medium', 'high')),

  constraint todos_title_not_empty
    check (char_length(trim(title)) > 0)
);



create index todos_user_id_idx
  on public.todos(user_id);

create index todos_user_status_idx
  on public.todos(user_id, status);

create index todos_due_date_idx
  on public.todos(user_id, due_date);



alter table public.todos enable row level security;

revoke all on table public.todos from anon, authenticated;


grant select, insert, update, delete
  on table public.todos
  to authenticated;



create policy "Users can view their own todos"
  on public.todos
  for select
  to authenticated
  using ((select auth.uid()) = user_id);


create policy "Users can create their own todos"
  on public.todos
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);


create policy "Users can update their own todos"
  on public.todos
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


create policy "Users can delete their own todos"
  on public.todos
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);


create trigger todos_set_updated_at
  before update on public.todos
  for each row
  execute function private.set_updated_at();



notify pgrst, 'reload schema';
