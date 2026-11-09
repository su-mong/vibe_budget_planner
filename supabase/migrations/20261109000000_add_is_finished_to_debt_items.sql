-- 부채 상환 완료 여부. 기존 항목과 신규 항목은 기본적으로 미완료 상태이다.
alter table public.debt_items
  add column is_finished boolean not null default false;

comment on column public.debt_items.is_finished is '상환 완료 여부 (true: 상환 완료, false: 상환 중)';
