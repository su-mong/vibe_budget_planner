# Budget Recorder (가계부) React SPA Implementation Plan

## Overview
Convert `vibe_budget_planner.pen` design into a React SPA. The design contains 5 pages: Login (첫 페이지) and 4 pages sharing a common sidebar with navigation (Dashboard, Calendar, Budget Management, Settings).

---

## Tech Stack
- **Build**: Vite + React + TypeScript
- **Styling**: Tailwind CSS v4 + CSS custom properties (from design tokens)
- **Icons**: lucide-react
- **Fonts**: Playfair Display (Google Fonts), Pretendard (jsDelivr CDN)
- **State**: React Context + useReducer (no external library)
- **Navigation**: Internal state-based (no react-router — Login + 4 sidebar screens)
- **Auth**: Supabase Auth (SNS 로그인: Google + Kakao + Naver, RLS로 사용자별 데이터 격리)
- **Persistence**: Supabase (PostgreSQL DB via @supabase/supabase-js)
- **Responsive**: 기본 반응형 (사이드바 접힘, 테이블 가로 스크롤 등 최소한의 대응)

---

## 공통 사항
- 모든 숫자 표기는 3자리 단위 콤마(,)를 적용한다

---

## Design Tokens (from .pen variables)
```css
:root {
  /* Primary palette */
  --accent-blue: #334EAC;
  --accent-blue-dark: #263A80;
  --accent-blue-light: #8FA3D9;

  /* Backgrounds */
  --bg-card: #FFFFFF;
  --bg-muted: #F3F4F6;
  --bg-primary: #F7F7F7;

  /* Borders */
  --border-default: #E5E7EB;
  --border-light: #F3F4F6;

  /* Text */
  --text-primary: #1A1A1A;
  --text-secondary: #6B7280;
  --text-tertiary: #9CA3AF;

  /* Status */
  --status-negative: #DC2626;
  --status-positive: #059669;
  --status-warning: #F59E0B;

  /* Category colors */
  --cat-fixed: #1A1A1A;
  --cat-living: #22A06B;
  --cat-selfcare: #D4A017;
  --cat-social: #E07B39;
  --cat-leisure: #8256C9;
  --cat-etc: #8993A4;

  /* Category badge backgrounds */
  --cat-fixed-bg: #F2F2F2;
  --cat-living-bg: #E9F5EF;
  --cat-selfcare-bg: #FDF6E3;
  --cat-social-bg: #FFF0E5;
  --cat-leisure-bg: #F3EEFA;
  --cat-etc-bg: #F0F1F3;
}
```

---

## Screens (from .pen file)

### 1. Login
- Supabase Auth SNS 로그인 (Google, Kakao, Naver) + 회원가입
- 회원가입 시 기본 데이터 자동 생성: expense_sub_items (무제.rtf 기반) + income_items (급여)
- 인증 후 Dashboard로 이동

### 2. Budget Dashboard — Default View
- **Sidebar** (240px): Logo (wallet icon + "Budget Recorder"), 4 nav items (대시보드, 거래 내역, 예산 관리, 설정)
- **Main Content**:
  - Header: "대시보드" title + month selector (< 2025년 1월 >)
    - 이전 월 / 다음 월 버튼으로 월 이동
  - **Goal Section**: 목표 카드 (제목 + 줄글 텍스트 형태)
    - 표시 모드: 목표 제목 + 줄글 내용 + 연필 아이콘 편집 버튼
    - 편집 모드: 연필 아이콘 클릭 → 제목/내용 편집 UI로 전환, 확인 버튼 클릭 → 목표 저장 후 표시 모드로 복귀
    - Settings의 목표 표시 토글이 꺼져 있으면 숨김
  - 3 Metric cards: 총 수입, 총 지출, 잔액
  - 2 Tables side by side: "수지 계산표" + "항목별 지출 내역"

### 3. Calendar View
- Same sidebar (거래 내역 active)
- **Month selector**: 이전 월 / 다음 월 버튼
- **Calendar grid**: 7 columns (일~토), 5 week rows
  - 각 셀: 날짜 + 수입/지출 금액 표시
  - 선택된 날짜: 파란색 테두리 + 색상 적용, '+' 버튼 표시
  - '+' 버튼 클릭 → 지출 입력 팝업 오픈
- **지출 내역 표**: 선택된 월의 지출 내역
  - 메인 항목 (고정비, 생활비, 사회생활비 등) 클릭 시 아코디언 접기/펼치기
  - 각 메인 항목은 카테고리 색상 배지 포함

### 4. 지출 입력 팝업
- **2단계 카테고리 선택**:
  - '항목 선택': 6개 메인 카테고리 (고정비, 생활비, 자기관리비, 사회생활비, 여가비, 기타)
  - '세부 항목 선택': 선택된 메인 카테고리의 세부 항목 라디오 (Settings에서 관리)
  - '가격 입력': 금액 입력
- **동작**:
  - 항목 선택 변경 시 → 세부 항목 선택 + 가격 입력 초기화
  - 항목 선택 + 세부 항목 선택 + 가격 입력 모두 있어야 '확인' 버튼 활성화
  - '확인' → 지출 저장 + 팝업 닫힘
  - '취소' → 팝업만 닫힘

### 5. Budget Management
- Same sidebar (예산 관리 active)
- **Month selector**: 이전 월 / 다음 월 버튼
- **5개 섹션** (각각 Edit 버튼 → 인라인 편집 모드 → 확인 버튼 → 표시 모드 복귀):

| 섹션 | 설명 |
|------|------|
| 수입 | 수입 항목별 실제 금액 설정 |
| 지출 | 6개 메인 카테고리별 지출 예산 관리 |
| 저축 | 저축 항목별 예상 저축액 / 실제 저축액 관리 |
| 부채 | 부채 항목별 금액 관리 |
| 추가 수입 | '+' 버튼 → 추가 수입 입력 팝업 (항목명 + 금액 필수) |

### 6. 추가 수입 입력 팝업
- 항목명, 금액 모두 입력되어야 '확인' 버튼 활성화
- '확인' → 추가 수입 저장 + 팝업 닫힘
- '취소' → 팝업만 닫힘

### 7. Settings
- Same sidebar (설정 active)
- **6개 관리 카드**:

| 카드 | 설명 |
|------|------|
| 목표 표시 | 토글: Dashboard 목표 섹션 표시/숨김 |
| 수입 항목 | 수입 항목 목록 + 추가 팝업 (항목명 ≥ 1글자) + 휴지통 삭제 |
| 지출 항목 | 메인 카테고리별 아코디언 + 세부 항목 목록 + 추가 팝업 (항목 선택 + 세부 항목 입력 ≥ 1글자, 항목 변경 시 세부 항목 초기화) + 휴지통 삭제 |
| 저축 항목 | 저축 항목 목록 + 추가 팝업 (항목명 ≥ 1글자) + 휴지통 삭제 |
| 부채 항목 | 부채 항목 목록 + 추가 팝업 (항목명 ≥ 1글자) + 휴지통 삭제 |
| 계정 | 로그아웃 + 회원탈퇴 |

---

## File Structure
```
src/
├── main.tsx                           # Entry point
├── App.tsx                            # AuthGuard > BudgetProvider > AppLayout
├── globals.css                        # @import "tailwindcss", :root vars, fonts
│
├── types/
│   └── budget.ts                      # All TypeScript interfaces and enums
│
├── constants/
│   ├── categories.ts                  # Category definitions, colors, default sub-items
│   └── sampleData.ts                  # Initial demo data matching design
│
├── lib/
│   └── supabase.ts                    # Supabase client (createClient with env vars)
│
├── context/
│   ├── BudgetContext.ts               # Context definition (state/actions/meta)
│   ├── BudgetProvider.tsx             # Provider with useReducer, Supabase 연동
│   └── budgetReducer.ts              # Reducer with all action handlers
│
├── hooks/
│   └── useBudget.ts                   # Convenience hook for context
│
├── components/
│   ├── auth/
│   │   ├── AuthGuard.tsx              # 로그인 상태 체크, 미인증 시 LoginPage 표시
│   │   └── LoginPage.tsx              # SNS 로그인 (Google/Kakao/Naver) + 회원가입
│   │
│   ├── layout/
│   │   ├── AppLayout.tsx              # Flex row: Sidebar + MainContent, 반응형
│   │   ├── Sidebar.tsx                # 240px sidebar with logo + nav, 모바일 접힘
│   │   └── NavItem.tsx                # Nav item (icon + label + active state)
│   │
│   ├── shared/
│   │   ├── Card.tsx                   # White card container
│   │   ├── MonthSelector.tsx          # Prev/next month arrows
│   │   ├── PageHeader.tsx             # Title + subtitle + right content
│   │   ├── Modal.tsx                  # Overlay + centered card
│   │   ├── CategoryDot.tsx            # Colored circle for categories
│   │   ├── CategoryBadge.tsx          # Colored badge (bg + text) for categories
│   │   ├── ProgressBar.tsx            # Horizontal fill bar
│   │   └── CurrencyDisplay.tsx        # Korean won formatting (3자리 콤마)
│   │
│   ├── dashboard/
│   │   ├── DashboardView.tsx          # Dashboard page composition
│   │   ├── GoalSection.tsx            # Goal card (표시 모드 + 편집 모드)
│   │   ├── MetricCards.tsx            # 3-card row
│   │   ├── MetricCard.tsx             # Single metric card
│   │   ├── BalanceSheet.tsx           # "수지 계산표" table
│   │   └── CategoryExpenses.tsx       # "항목별 지출 내역" table
│   │
│   ├── calendar/
│   │   ├── CalendarView.tsx           # Calendar page composition
│   │   ├── CalendarGrid.tsx           # 7-col grid with weeks
│   │   ├── CalendarCell.tsx           # Single day cell (선택 시 파란 테두리 + '+' 버튼)
│   │   ├── ExpenseHistoryTable.tsx    # 지출 내역 아코디언 테이블
│   │   └── TransactionModal.tsx       # "지출 입력" 팝업 (2단계 카테고리)
│   │
│   ├── budget/
│   │   ├── BudgetView.tsx             # Budget page composition (5 sections)
│   │   ├── IncomeSection.tsx          # 수입 예산 표시 + 인라인 편집
│   │   ├── ExpenseSection.tsx         # 지출 예산 표시 + 인라인 편집
│   │   ├── SavingsSection.tsx         # 저축 예산/실적 표시 + 인라인 편집
│   │   ├── DebtSection.tsx            # 부채 표시 + 인라인 편집
│   │   ├── ExtraIncomeSection.tsx     # 추가 수입 목록 + 인라인 편집
│   │   ├── BudgetRow.tsx              # 항목 행 (표시 / 편집 가능 input)
│   │   └── AdditionalIncomeModal.tsx  # 추가 수입 입력 팝업
│   │
│   └── settings/
│       ├── SettingsView.tsx           # Settings page composition (6 cards)
│       ├── GoalToggleCard.tsx         # 목표 표시 토글
│       ├── IncomeItemsCard.tsx        # 수입 항목 관리 (목록 + 삭제)
│       ├── ExpenseItemsCard.tsx       # 지출 항목 관리 (아코디언 + 삭제)
│       ├── SavingsItemsCard.tsx       # 저축 항목 관리 (목록 + 삭제)
│       ├── DebtItemsCard.tsx          # 부채 항목 관리 (목록 + 삭제)
│       ├── AccountCard.tsx            # 로그아웃 + 회원탈퇴
│       ├── AddIncomeItemModal.tsx     # 수입 항목 추가 팝업
│       ├── AddExpenseSubItemModal.tsx # 지출 세부 항목 추가 팝업
│       ├── AddSavingsItemModal.tsx    # 저축 항목 추가 팝업
│       └── AddDebtItemModal.tsx       # 부채 항목 추가 팝업
│
└── utils/
    ├── format.ts                      # Number formatting (3자리 콤마), date helpers
    └── calculations.ts               # Budget math (totals, percentages, deltas)
```

---

## Data Model

```ts
enum Category {
  FIXED = 'fixed',         // 고정비 - #1A1A1A
  LIVING = 'living',       // 생활비 - #22A06B
  SELFCARE = 'selfcare',   // 자기관리비 - #D4A017
  SOCIAL = 'social',       // 사회생활비 - #E07B39
  LEISURE = 'leisure',     // 여가비 - #8256C9
  ETC = 'etc',             // 기타 - #8993A4
}

type ViewId = 'dashboard' | 'calendar' | 'budget' | 'settings';

// --- 거래 ---
interface Transaction {
  id: string;
  date: string;              // "2025-01-15"
  type: 'expense';           // Calendar에서는 지출만 입력
  category: Category;
  sub_category: string;      // 세부 항목명 (Settings에서 관리)
  amount: number;
  created_at: string;
}

// --- 월별 수입 ---
interface MonthlyIncome {
  id: string;
  month: string;             // "2025-01"
  item_id: string;           // income_items.id
  amount: number;            // 실제 금액
}

// --- 월별 지출 예산 ---
interface MonthlyBudget {
  id: string;
  month: string;             // "2025-01"
  budget_fixed: number;
  budget_living: number;
  budget_selfcare: number;
  budget_social: number;
  budget_leisure: number;
  budget_etc: number;
}

// --- 월별 저축 ---
interface MonthlySavings {
  id: string;
  month: string;
  item_id: string;           // savings_items.id
  budget: number;            // 예상 저축액
  actual: number;            // 실제 저축액
}

// --- 월별 부채 ---
interface MonthlyDebt {
  id: string;
  month: string;
  item_id: string;           // debt_items.id
  budget: number;            // 예상 납부액
  actual: number;            // 실제 납부액
}

// --- 추가 수입 ---
interface AdditionalIncome {
  id: string;
  month: string;
  name: string;
  amount: number;
}

// --- Settings 항목 정의 ---
interface IncomeItem {
  id: string;
  name: string;
  order: number;
}

interface ExpenseSubItem {
  id: string;
  category: Category;
  name: string;
  order: number;
}

interface SavingsItem {
  id: string;
  name: string;
  order: number;
}

interface DebtItem {
  id: string;
  name: string;
  order: number;
}

// --- 목표 ---
interface Goal {
  id: string;
  title: string;             // 제목
  content: string;           // 줄글 텍스트 (내용)
  order: number;
}

// --- 사용자 설정 ---
interface UserSettings {
  show_goals: boolean;
}

// --- 앱 상태 ---
type EditingSection = 'income' | 'expense' | 'savings' | 'debt' | 'extraIncome' | null;

type ModalState =
  | { type: 'closed' }
  | { type: 'transaction'; date: string }
  | { type: 'additionalIncome' }
  | { type: 'addIncomeItem' }
  | { type: 'addExpenseSubItem' }
  | { type: 'addSavingsItem' }
  | { type: 'addDebtItem' };

interface BudgetState {
  activeView: ViewId;
  currentMonth: string;
  selectedDate: string | null;       // Calendar 선택된 날짜
  transactions: Transaction[];
  monthlyIncomes: MonthlyIncome[];
  budgets: MonthlyBudget[];
  monthlySavings: MonthlySavings[];
  monthlyDebts: MonthlyDebt[];
  additionalIncomes: AdditionalIncome[];
  incomeItems: IncomeItem[];
  expenseSubItems: ExpenseSubItem[];
  savingsItems: SavingsItem[];
  debtItems: DebtItem[];
  goal: Goal;
  userSettings: UserSettings;
  modalState: ModalState;
  editingSection: EditingSection;
  editingGoals: boolean;             // Dashboard 목표 편집 모드
}

// Derived in render (not stored in state):
// monthlyTransactions, totalIncome, totalExpense, balance, categoryTotals
```

---

## Supabase DB Schema

```sql
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

-- 월별 수입 (수입 항목별 실제 금액)
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

-- 월별 부채 (예상 납부액 / 실제 납부액)
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

-- 수입 항목 정의
create table income_items (
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

-- 목표 (제목 + 줄글 내용)
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  "order" integer not null,
  created_at timestamptz default now()
);

-- 사용자 설정
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  show_goals boolean not null default true,
  created_at timestamptz default now()
);

-- RLS (Row Level Security) — 사용자별 데이터 격리
alter table transactions enable row level security;
alter table monthly_incomes enable row level security;
alter table monthly_budgets enable row level security;
alter table monthly_savings enable row level security;
alter table monthly_debts enable row level security;
alter table additional_incomes enable row level security;
alter table income_items enable row level security;
alter table expense_sub_items enable row level security;
alter table savings_items enable row level security;
alter table debt_items enable row level security;
alter table goals enable row level security;
alter table user_settings enable row level security;

create policy "Users can CRUD own data" on transactions for all using (auth.uid() = user_id);
create policy "Users can CRUD own data" on monthly_incomes for all using (auth.uid() = user_id);
create policy "Users can CRUD own data" on monthly_budgets for all using (auth.uid() = user_id);
create policy "Users can CRUD own data" on monthly_savings for all using (auth.uid() = user_id);
create policy "Users can CRUD own data" on monthly_debts for all using (auth.uid() = user_id);
create policy "Users can CRUD own data" on additional_incomes for all using (auth.uid() = user_id);
create policy "Users can CRUD own data" on income_items for all using (auth.uid() = user_id);
create policy "Users can CRUD own data" on expense_sub_items for all using (auth.uid() = user_id);
create policy "Users can CRUD own data" on savings_items for all using (auth.uid() = user_id);
create policy "Users can CRUD own data" on debt_items for all using (auth.uid() = user_id);
create policy "Users can CRUD own data" on goals for all using (auth.uid() = user_id);
create policy "Users can CRUD own data" on user_settings for all using (auth.uid() = user_id);
```

---

## Default Expense Sub-Items (무제.rtf 기반)

회원가입 시 자동 생성되는 기본 데이터:
- **income_items**: 급여 (1개만)
- **savings_items**: 없음 (빈 상태)
- **debt_items**: 없음 (빈 상태)
- **expense_sub_items**: 아래 목록

| 카테고리 | 세부 항목 |
|----------|-----------|
| 고정비 | 월세, 관리비, 공과금, 대중교통비, 시외교통비, 통신비, 구독료, 보험료 |
| 생활비 | 식비, 커피, 간식및과일, 잡화, 병원비, 세탁비, 기타 |
| 자기관리비 | AI 관련, 미용관리, 책, 행사참여, 기타 |
| 사회생활비 | 가족회비, 동아리, 경조사, 밥약, 카페, 이체, 택시, 선물, 기타 |
| 여가비 | 카페, 여행, 게임, 덕질, 기타 |
| 기타 | 쇼핑, 예상외지출, 기타 |

---

## Sample Data (matching design)
- Income: 3,200,000원 (근로소득)
- Expense budget: 고정비 750,000 / 생활비 500,000 / 자기관리비 200,000 / 사회생활비 350,000 / 여가비 200,000 / 기타 150,000
- Actual expense: 고정비 750,000 / 생활비 480,000 / 자기관리비 180,000 / 사회생활비 350,000 / 여가비 210,000 / 기타 180,000
- Total expense: 2,150,000원, Balance: 1,050,000원
- Goals: 1. 식비를 줄이자 / 2. 회사에서 커피는 사서 마시지 말자 / 3. 게임에 쓰는 돈을 10만원 이상 넘기지 말자
- Income items: 급여, 용돈, 부수입

---

## Implementation Steps

### Phase 1: Foundation
1. **Project scaffolding**: `npm create vite@latest . -- --template react-ts`
2. **Install deps**: `npm install lucide-react @supabase/supabase-js`, `npm install -D tailwindcss @tailwindcss/vite`
3. **Configure**: vite.config.ts (Tailwind plugin), globals.css (tokens, fonts), index.html (font CDNs, lang="ko")
4. **Supabase setup**: lib/supabase.ts (createClient), .env에 `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` 설정, Supabase 프로젝트에 DB 테이블 + RLS 정책 생성
5. **Auth**: AuthGuard.tsx, LoginPage.tsx (SNS 로그인: Google/Kakao/Naver), onAuthStateChange로 세션 관리, 회원가입 시 기본 데이터 자동 생성
6. **Types & constants**: budget.ts, categories.ts (기본 세부 항목 포함), sampleData.ts
7. **State management**: BudgetContext, budgetReducer, BudgetProvider (Supabase fetch/sync), useBudget hook
8. **Utilities**: format.ts (formatWon with 3자리 콤마, formatMonth), calculations.ts

### Phase 2: Layout Shell
9. **AppLayout**: Flex row container (sidebar + content area), 반응형 breakpoint 설정
10. **Sidebar**: 240px width, logo, 4 nav items with active state, 모바일에서 접힘 처리
11. **Shared components**: Card, PageHeader, MonthSelector, Modal, CategoryDot, CategoryBadge, ProgressBar, CurrencyDisplay

### Phase 3: Dashboard
12. **DashboardView**: Page composition with header + month selector
13. **GoalSection**: 표시 모드 + 편집 모드 (연필 아이콘 → 편집 → 확인), Settings 토글 연동
14. **MetricCards**: 3-card row (income/expense/balance) with delta indicators
15. **BalanceSheet**: "수지 계산표" table (항목/예상 비용/실제 비용)
16. **CategoryExpenses**: "항목별 지출 내역" table with colored dots and percentages

### Phase 4: Calendar View
17. **CalendarGrid**: 7-col grid, 선택된 날짜 파란색 테두리 + '+' 버튼
18. **ExpenseHistoryTable**: 지출 내역 아코디언 (메인 항목 클릭 → 세부 항목 접기/펼치기)
19. **TransactionModal**: 2단계 카테고리 선택 (항목 → 세부 항목), 가격 입력, 항목 변경 시 초기화, 모든 값 필수

### Phase 5: Budget Management
20. **BudgetView**: 5개 섹션 구성 + month selector
21. **IncomeSection**: 수입 예산 금액 설정 (예산만, 거래 기록 없음) + 인라인 편집
22. **ExpenseSection**: 카테고리별 지출 예산 표시 + 인라인 편집
23. **SavingsSection**: 저축 예상/실제 표시 + 인라인 편집
24. **DebtSection**: 부채 표시 + 인라인 편집
25. **ExtraIncomeSection**: 추가 수입 목록 + 인라인 편집
26. **AdditionalIncomeModal**: 추가 수입 입력 팝업 (항목명 + 금액 필수)

### Phase 6: Settings
27. **SettingsView**: 6개 카드 레이아웃
28. **GoalToggleCard**: Dashboard 목표 표시/숨김 토글
29. **IncomeItemsCard**: 수입 항목 목록 + AddIncomeItemModal + 휴지통 삭제
30. **ExpenseItemsCard**: 아코디언 + 세부 항목 목록 + AddExpenseSubItemModal + 휴지통 삭제
31. **SavingsItemsCard**: 저축 항목 목록 + AddSavingsItemModal + 휴지통 삭제
32. **DebtItemsCard**: 부채 항목 목록 + AddDebtItemModal + 휴지통 삭제
33. **AccountCard**: 로그아웃 + 회원탈퇴 (Supabase Auth 계정 삭제)

### Phase 7: Polish
34. **Final audit**: Typography (Playfair Display/Pretendard), colors, spacing match design
35. **Responsive**: 사이드바 접힘, 테이블 가로 스크롤
36. **Number formatting**: 모든 숫자에 3자리 콤마 적용 확인

---

## Key Design-to-Code Mappings

| Design Element | Implementation |
|---|---|
| Sidebar 240px, white, right border | `w-[240px] bg-white border-r border-[var(--border-default)]` |
| Active nav item | `bg-[#EDF0F9] text-[var(--accent-blue)] font-semibold` |
| Inactive nav item | `text-[var(--text-secondary)]` |
| Main content padding | `px-10 py-8` (40px / 32px) |
| Card container | `bg-white rounded-xl border border-[var(--border-default)]` |
| Title text | `font-display text-[28px] font-bold` (Playfair Display) |
| Body text | `font-body text-sm` (Pretendard) |
| Income green | `text-[var(--status-positive)]` |
| Expense red | `text-[var(--status-negative)]` |
| Balance blue | `text-[var(--accent-blue)]` |
| Category dot | `w-2 h-2 rounded-full` with category color |
| Category badge | `px-2 py-0.5 rounded text-xs` with category bg + text color |
| Month selector buttons | `w-9 h-9 bg-white rounded-lg border border-[var(--border-default)]` |
| Selected calendar cell | `border-2 border-[var(--accent-blue)]` |

---

## Verification Checklist

### Auth
- [ ] 미인증 시 로그인 페이지 표시 (Google/Kakao/Naver SNS 버튼)
- [ ] SNS 회원가입 정상 동작 (기본 expense_sub_items + income_items 자동 생성)
- [ ] 로그인 후 Dashboard가 기본 화면으로 로드
- [ ] RLS 적용으로 다른 사용자의 데이터 접근 불가
- [ ] 회원탈퇴 시 계정 + 모든 데이터 삭제 정상

### Dashboard
- [ ] 월 선택기 이전/다음 월 정상 이동
- [ ] 목표 섹션 표시/편집/저장 동작 정상
- [ ] Settings 목표 토글 off 시 목표 섹션 숨김
- [ ] 3 Metric cards 데이터 정확
- [ ] 수지 계산표 + 항목별 지출 내역 테이블 정상

### Calendar
- [ ] 선택된 날짜에 파란색 테두리 + '+' 버튼 표시
- [ ] '+' 버튼 클릭 시 지출 입력 팝업 오픈
- [ ] 2단계 카테고리 선택 정상 (항목 변경 시 세부 항목 + 가격 초기화)
- [ ] 3개 필드 모두 입력 시에만 확인 버튼 활성화
- [ ] 지출 내역 아코디언 접기/펼치기 정상
- [ ] 월 선택기 정상 동작

### Budget Management
- [ ] 5개 섹션 (수입/지출/저축/부채/추가수입) 표시 정상
- [ ] 각 섹션 Edit → 인라인 편집 → 확인 → 저장 동작 정상
- [ ] 추가 수입 '+' → 팝업 → 항목명+금액 필수 → 저장 정상
- [ ] 월 선택기 정상 동작

### Settings
- [ ] 목표 표시 토글 on/off → Dashboard 반영
- [ ] 수입 항목 추가/삭제 정상
- [ ] 지출 항목 아코디언 + 세부 항목 추가/삭제 정상
- [ ] 저축 항목 추가/삭제 정상
- [ ] 부채 항목 추가/삭제 정상
- [ ] 각 추가 팝업의 validation (1글자 이상) 정상
- [ ] 지출 항목 추가 팝업에서 항목 변경 시 세부 항목 입력 초기화

### 공통
- [ ] 모든 숫자에 3자리 콤마 적용
- [ ] Supabase DB에 저장되고 새로고침 시 유지
- [ ] Fonts: Playfair Display on titles, Pretendard on body text
- [ ] Colors match design tokens exactly
- [ ] All Korean text preserved correctly
- [ ] 반응형: 좁은 화면에서 사이드바 접힘, 테이블 가로 스크롤 정상 동작
