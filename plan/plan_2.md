# 예산 항목 / 거래 입력 항목 분리 데이터 모델 설계

## 목표

현재 `expense_sub_items`가 예산 항목과 거래 입력 세부 항목 역할을 동시에 맡고 있다. 이 구조를 분리해 예산 항목 하나가 여러 거래 입력 항목을 포함할 수 있게 한다.

확정된 집계 정책:

- 거래 기록에는 거래 입력 항목 ID를 저장한다.
- 거래 입력 항목은 현재 연결된 예산 항목을 가진다.
- 과거 거래도 항상 현재 거래 입력 항목의 예산 항목 매핑을 따라 재집계된다.
- 예: `커피` 거래 항목을 `식생활비`에서 `여가비`로 옮기면 과거 `커피` 거래도 `여가비` 실적으로 이동한다.

## 현재 구조

```text
expense_sub_items
  id
  user_id
  category
  name
  order

monthly_sub_budgets
  id
  user_id
  month
  sub_item_id -> expense_sub_items.id
  amount

transactions
  id
  user_id
  date
  type
  category
  sub_category
  amount
  meal_count
  memo
```

문제점:

- `expense_sub_items` 하나가 예산 편성 단위와 거래 입력 선택지를 동시에 의미한다.
- `transactions.sub_category`가 문자열이라 항목명 변경, 중복명, 삭제에 취약하다.
- 예산 항목 하나에 여러 거래 입력 항목을 묶을 수 없다.

## 신규 구조

```text
budget_items
  id
  user_id
  category
  name
  order
  created_at

transaction_items
  id
  user_id
  budget_item_id -> budget_items.id
  category
  name
  order
  is_active
  created_at

monthly_budget_items
  id
  user_id
  month
  budget_item_id -> budget_items.id
  amount
  created_at

transactions
  id
  user_id
  date
  type
  transaction_item_id -> transaction_items.id
  category          -- 호환용, 당장은 유지
  sub_category      -- 호환용, 당장은 유지
  amount
  meal_count
  memo
  created_at
```

### `budget_items`

예산 관리 화면에서 금액을 배정하는 단위다.

```sql
create table budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('fixed', 'living', 'selfcare', 'social', 'leisure', 'etc')),
  name text not null,
  "order" integer not null default 0,
  created_at timestamptz default now(),
  unique (user_id, category, name)
);
```

설계 의도:

- `category`는 대시보드 대분류 집계와 색상 표시를 위해 예산 항목에 둔다.
- 같은 사용자 안에서 같은 대분류/이름 조합은 중복하지 않는다.
- 예산 항목 삭제 시 연결된 거래 항목 처리가 필요하므로, UI에서는 삭제 전 재매핑을 요구하는 것이 안전하다.

### `transaction_items`

거래 입력 모달에서 사용자가 선택하는 단위다.

```sql
create table transaction_items (
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
```

설계 의도:

- `budget_item_id`가 현재 매핑이다. 집계 시 이 값을 따라간다.
- `category`는 거래 입력 화면에서 대분류별 선택지를 빠르게 보여주기 위한 denormalized 값이다.
- `budget_items.category`와 `transaction_items.category`는 원칙적으로 같아야 한다.
- 거래 이력이 있는 항목은 삭제보다 `is_active = false`로 숨기는 방식을 기본으로 한다.

무결성 선택:

- DB에서 `transaction_items.category = budget_items.category`를 강제하려면 트리거가 필요하다.
- 1차 구현에서는 앱 로직으로 맞추고, 필요하면 후속 마이그레이션에서 트리거를 추가한다.

### `monthly_budget_items`

월별 예산 금액을 저장한다.

```sql
create table monthly_budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  budget_item_id uuid not null references budget_items(id) on delete cascade,
  amount integer not null default 0,
  created_at timestamptz default now(),
  unique (user_id, month, budget_item_id)
);
```

설계 의도:

- 기존 `monthly_sub_budgets`의 새 버전이다.
- 예산은 거래 입력 항목이 아니라 예산 항목 기준으로만 편성한다.

### `transactions` 변경

```sql
alter table transactions
  add column transaction_item_id uuid references transaction_items(id) on delete restrict;
```

설계 의도:

- 새 거래는 반드시 `transaction_item_id`를 저장한다.
- 기존 `category`, `sub_category`는 당분간 유지한다.
- 앱 전환이 끝나면 `category`, `sub_category`는 표시용 fallback 또는 제거 대상으로 본다.
- 과거 거래의 예산 항목은 `transactions.transaction_item_id -> transaction_items.budget_item_id`로 계산한다.

## TypeScript 타입 초안

```ts
export interface BudgetItem {
  id: string;
  category: Category;
  name: string;
  order: number;
}

export interface TransactionItem {
  id: string;
  budget_item_id: string;
  category: Category;
  name: string;
  order: number;
  is_active: boolean;
}

export interface MonthlyBudgetItem {
  id: string;
  month: string;
  budget_item_id: string;
  amount: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'expense';
  transaction_item_id?: string | null;
  category: Category;
  sub_category: string;
  amount: number;
  meal_count?: number | null;
  memo?: string | null;
  created_at: string;
}
```

`BudgetState` 변경 초안:

```ts
export interface BudgetState {
  // ...
  transactions: Transaction[];
  budgetItems: BudgetItem[];
  transactionItems: TransactionItem[];
  monthlyBudgetItems: MonthlyBudgetItem[];

  // Deprecated during migration
  expenseSubItems: ExpenseSubItem[];
  monthlySubBudgets: MonthlySubBudget[];
}
```

## 기존 데이터 이전 규칙

1. 기존 `expense_sub_items`의 각 행으로 `budget_items`를 만든다.
2. 같은 기존 행으로 `transaction_items`도 만든다.
3. `transaction_items.budget_item_id`는 1번에서 만든 같은 이름/카테고리의 `budget_items.id`를 참조한다.
4. 기존 `monthly_sub_budgets.sub_item_id`는 해당 `budget_items.id`로 변환해 `monthly_budget_items`에 넣는다.
5. 기존 `transactions`는 `user_id + category + sub_category`로 `transaction_items`를 찾아 `transaction_item_id`를 채운다.
6. 매칭되지 않는 거래가 있으면 같은 `category/sub_category` 이름으로 예산 항목과 거래 항목을 생성한 뒤 연결한다.

초기 이전 후에는 데이터 의미가 기존과 동일한 1:1 상태로 보존된다. 이후 설정 화면에서 사용자가 여러 거래 항목을 하나의 예산 항목으로 묶을 수 있다.

## 집계 규칙

월별 총 지출:

```text
transactions where date starts with month
sum amount
```

예산 항목별 실적:

```text
transactions
  -> transaction_items by transaction_item_id
  -> budget_items by transaction_items.budget_item_id
group by budget_items.id
sum transactions.amount
```

대분류별 실적:

```text
transactions
  -> transaction_items
  -> budget_items
group by budget_items.category
sum transactions.amount
```

예산 항목별 예산:

```text
monthly_budget_items
group by budget_item_id
sum amount
```

## 삭제 / 비활성 정책

- `budget_items`:
  - 연결된 `transaction_items`가 있으면 삭제하지 않는다.
  - 삭제 전 거래 항목을 다른 예산 항목으로 재매핑하도록 한다.
- `transaction_items`:
  - 거래 이력이 있으면 삭제하지 않고 `is_active = false`로 숨긴다.
  - 거래 이력이 없으면 실제 삭제 가능하다.
- `transactions`:
  - `transaction_item_id`가 가리키는 항목은 `on delete restrict`로 보호한다.

## 후속 구현 범위

1. 마이그레이션 파일 추가
2. 타입 추가 및 `BudgetState` 확장
3. `BudgetProvider`에서 새 테이블 로드
4. 계산 유틸을 ID 기반 집계로 전환
5. 예산 관리 화면을 `budgetItems` 기준으로 전환
6. 거래 입력 모달을 `transactionItems` 기준으로 전환
7. 설정 화면을 예산 항목 관리 / 거래 입력 항목 관리로 분리
8. 안정화 후 deprecated 테이블과 컬럼 제거 검토
