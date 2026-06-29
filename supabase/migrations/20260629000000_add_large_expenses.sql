-- Large expense groups and their budgeted sub-items.
-- Use this for expenses planned across multiple months, tracked separately
-- from regular monthly budget items.

create table if not exists large_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null default current_date,
  end_date date not null default current_date,
  "order" integer not null default 0,
  created_at timestamptz default now(),
  constraint large_expenses_date_range_check check (start_date <= end_date),
  unique (id, user_id),
  unique (user_id, name)
);

create table if not exists large_expense_sub_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  large_expense_id uuid not null,
  name text not null,
  budget_amount integer not null default 0 check (budget_amount >= 0),
  "order" integer not null default 0,
  created_at timestamptz default now(),
  foreign key (large_expense_id, user_id)
    references large_expenses (id, user_id)
    on delete cascade
);

create index if not exists idx_large_expenses_user_order
  on large_expenses (user_id, "order");

create index if not exists idx_large_expenses_user_date_range
  on large_expenses (user_id, start_date, end_date);

create index if not exists idx_large_expense_sub_items_parent_order
  on large_expense_sub_items (large_expense_id, "order");

create index if not exists idx_large_expense_sub_items_user
  on large_expense_sub_items (user_id);

create index if not exists idx_large_expense_sub_items_created_at
  on large_expense_sub_items (user_id, created_at);

alter table large_expenses enable row level security;
alter table large_expense_sub_items enable row level security;

drop policy if exists "Users can manage own large expenses" on large_expenses;
create policy "Users can manage own large expenses"
  on large_expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own large expense sub items" on large_expense_sub_items;
create policy "Users can manage own large expense sub items"
  on large_expense_sub_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
