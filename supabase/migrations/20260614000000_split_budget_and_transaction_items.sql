-- 예산 항목과 거래 입력 항목 분리
-- 기존 expense_sub_items / monthly_sub_budgets 구조는 안정화 전까지 유지한다.

create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('fixed', 'living', 'selfcare', 'social', 'leisure', 'etc')),
  name text not null,
  "order" integer not null default 0,
  created_at timestamptz default now(),
  unique (user_id, category, name)
);

create table if not exists transaction_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_item_id uuid not null references budget_items(id) on delete restrict,
  category text not null check (category in ('fixed', 'living', 'selfcare', 'social', 'leisure', 'etc')),
  name text not null,
  "order" integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  unique (user_id, category, name)
);

create table if not exists monthly_budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  budget_item_id uuid not null references budget_items(id) on delete cascade,
  amount integer not null default 0,
  created_at timestamptz default now(),
  unique (user_id, month, budget_item_id)
);

alter table transactions
  add column if not exists transaction_item_id uuid references transaction_items(id) on delete restrict;

create index if not exists idx_budget_items_user_category_order
  on budget_items (user_id, category, "order");

create index if not exists idx_transaction_items_user_budget_item
  on transaction_items (user_id, budget_item_id);

create index if not exists idx_transaction_items_user_category_order
  on transaction_items (user_id, category, "order");

create index if not exists idx_monthly_budget_items_user_month
  on monthly_budget_items (user_id, month);

create index if not exists idx_transactions_transaction_item_id
  on transactions (transaction_item_id);

alter table budget_items enable row level security;
alter table transaction_items enable row level security;
alter table monthly_budget_items enable row level security;

drop policy if exists "Users can manage own budget items" on budget_items;
create policy "Users can manage own budget items"
  on budget_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own transaction items" on transaction_items;
create policy "Users can manage own transaction items"
  on transaction_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own monthly budget items" on monthly_budget_items;
create policy "Users can manage own monthly budget items"
  on monthly_budget_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 1. 기존 설정 항목을 예산 항목으로 이전한다.
insert into budget_items (user_id, category, name, "order", created_at)
select
  user_id,
  category,
  name,
  min("order") as "order",
  min(created_at) as created_at
from expense_sub_items
group by user_id, category, name
on conflict (user_id, category, name) do nothing;

-- 2. 거래에는 있지만 설정 항목에는 없는 문자열 항목도 예산 항목으로 만든다.
insert into budget_items (user_id, category, name, "order")
select
  t.user_id,
  t.category,
  t.sub_category,
  0
from transactions t
where not exists (
  select 1
  from budget_items bi
  where bi.user_id = t.user_id
    and bi.category = t.category
    and bi.name = t.sub_category
)
group by t.user_id, t.category, t.sub_category
on conflict (user_id, category, name) do nothing;

-- 3. 기존 설정 항목을 거래 입력 항목으로 이전한다. 초기 상태는 기존 의미와 같은 1:1 매핑이다.
insert into transaction_items (user_id, budget_item_id, category, name, "order", is_active, created_at)
select
  esi.user_id,
  bi.id,
  esi.category,
  esi.name,
  min(esi."order") as "order",
  true,
  min(esi.created_at) as created_at
from expense_sub_items esi
join budget_items bi
  on bi.user_id = esi.user_id
  and bi.category = esi.category
  and bi.name = esi.name
group by esi.user_id, bi.id, esi.category, esi.name
on conflict (user_id, category, name) do nothing;

-- 4. 거래에는 있지만 설정 항목에는 없는 문자열 항목도 거래 입력 항목으로 만든다.
insert into transaction_items (user_id, budget_item_id, category, name, "order", is_active)
select
  t.user_id,
  bi.id,
  t.category,
  t.sub_category,
  0,
  true
from transactions t
join budget_items bi
  on bi.user_id = t.user_id
  and bi.category = t.category
  and bi.name = t.sub_category
where not exists (
  select 1
  from transaction_items ti
  where ti.user_id = t.user_id
    and ti.category = t.category
    and ti.name = t.sub_category
)
group by t.user_id, bi.id, t.category, t.sub_category
on conflict (user_id, category, name) do nothing;

-- 5. 기존 월별 세부 예산을 예산 항목 기준 월별 예산으로 이전한다.
-- 중복된 기존 세부 항목이 같은 예산 항목으로 합쳐지는 경우 amount를 합산한다.
insert into monthly_budget_items (user_id, month, budget_item_id, amount, created_at)
select
  msb.user_id,
  msb.month,
  bi.id as budget_item_id,
  sum(msb.amount) as amount,
  min(msb.created_at) as created_at
from monthly_sub_budgets msb
join expense_sub_items esi
  on esi.id = msb.sub_item_id
join budget_items bi
  on bi.user_id = msb.user_id
  and bi.category = esi.category
  and bi.name = esi.name
group by msb.user_id, msb.month, bi.id
on conflict (user_id, month, budget_item_id)
do update set amount = excluded.amount;

-- 6. 기존 거래에 ID 기반 거래 입력 항목을 연결한다.
update transactions t
set transaction_item_id = ti.id
from transaction_items ti
where t.transaction_item_id is null
  and ti.user_id = t.user_id
  and ti.category = t.category
  and ti.name = t.sub_category;
