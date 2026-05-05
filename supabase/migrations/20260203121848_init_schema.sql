-- =============================================
-- Budget Recorder: Initial Schema
-- =============================================

-- 수입 항목 정의 (먼저 생성 - FK 참조 대상)
create table income_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  "order" integer not null default 0,
  created_at timestamptz default now()
);

-- 저축 항목 정의
create table savings_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  "order" integer not null default 0,
  created_at timestamptz default now()
);

-- 부채 항목 정의
create table debt_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  "order" integer not null default 0,
  created_at timestamptz default now()
);

-- 지출 세부 항목 정의
create table expense_sub_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('fixed', 'living', 'selfcare', 'social', 'leisure', 'etc')),
  name text not null,
  "order" integer not null default 0,
  created_at timestamptz default now()
);

-- 거래 내역
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null default 'expense' check (type in ('expense')),
  category text not null check (category in ('fixed', 'living', 'selfcare', 'social', 'leisure', 'etc')),
  sub_category text not null,
  amount integer not null,
  created_at timestamptz default now()
);

-- 월별 수입
create table monthly_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  item_id uuid not null references income_items(id) on delete cascade,
  amount integer not null default 0,
  created_at timestamptz default now(),
  unique (user_id, month, item_id)
);

-- 월별 지출 예산
create table monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  budget_fixed integer not null default 0,
  budget_living integer not null default 0,
  budget_selfcare integer not null default 0,
  budget_social integer not null default 0,
  budget_leisure integer not null default 0,
  budget_etc integer not null default 0,
  created_at timestamptz default now(),
  unique (user_id, month)
);

-- 월별 저축
create table monthly_savings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  item_id uuid not null references savings_items(id) on delete cascade,
  budget integer not null default 0,
  actual integer not null default 0,
  created_at timestamptz default now(),
  unique (user_id, month, item_id)
);

-- 월별 부채
create table monthly_debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  item_id uuid not null references debt_items(id) on delete cascade,
  budget integer not null default 0,
  actual integer not null default 0,
  created_at timestamptz default now(),
  unique (user_id, month, item_id)
);

-- 추가 수입
create table additional_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  name text not null,
  amount integer not null,
  created_at timestamptz default now()
);

-- 목표
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  "order" integer not null default 0,
  created_at timestamptz default now()
);

-- 사용자 설정
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  show_goals boolean not null default true,
  created_at timestamptz default now()
);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

alter table income_items enable row level security;
alter table savings_items enable row level security;
alter table debt_items enable row level security;
alter table expense_sub_items enable row level security;
alter table transactions enable row level security;
alter table monthly_incomes enable row level security;
alter table monthly_budgets enable row level security;
alter table monthly_savings enable row level security;
alter table monthly_debts enable row level security;
alter table additional_incomes enable row level security;
alter table goals enable row level security;
alter table user_settings enable row level security;

create policy "Users can CRUD own data" on income_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can CRUD own data" on savings_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can CRUD own data" on debt_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can CRUD own data" on expense_sub_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can CRUD own data" on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can CRUD own data" on monthly_incomes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can CRUD own data" on monthly_budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can CRUD own data" on monthly_savings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can CRUD own data" on monthly_debts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can CRUD own data" on additional_incomes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can CRUD own data" on goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can CRUD own data" on user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================
-- delete_user RPC (회원탈퇴용)
-- =============================================
-- cascade가 있으므로 auth.users에서 삭제하면 모든 데이터가 자동 삭제됨
create or replace function delete_user()
returns void
language sql
security definer
as $$
  delete from auth.users where id = auth.uid();
$$;
