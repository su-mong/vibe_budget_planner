-- Add validity dates to large expense groups.
-- A large expense is visible in budget months that overlap this date range.

alter table large_expenses
  add column if not exists start_date date not null default current_date,
  add column if not exists end_date date not null default current_date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'large_expenses_date_range_check'
  ) then
    alter table large_expenses
      add constraint large_expenses_date_range_check
      check (start_date <= end_date);
  end if;
end $$;

create index if not exists idx_large_expenses_user_date_range
  on large_expenses (user_id, start_date, end_date);
