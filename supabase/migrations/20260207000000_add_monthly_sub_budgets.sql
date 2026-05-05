-- 세부항목별 월별 예산 금액
create table monthly_sub_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  sub_item_id uuid not null references expense_sub_items(id) on delete cascade,
  amount integer not null default 0,
  created_at timestamptz default now(),
  unique (user_id, month, sub_item_id)
);

alter table monthly_sub_budgets enable row level security;

create policy "Users can manage own sub-budgets"
  on monthly_sub_budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
