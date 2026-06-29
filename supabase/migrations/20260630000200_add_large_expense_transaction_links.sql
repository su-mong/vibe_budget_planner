-- Link large expense sub-items to actual expense transactions.
-- One large_expense_sub_item can have many transactions, while each
-- transaction can be linked to at most one large expense sub-item.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'large_expense_sub_items_id_user_id_key'
  ) then
    alter table large_expense_sub_items
      add constraint large_expense_sub_items_id_user_id_key unique (id, user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'transactions_id_user_id_key'
  ) then
    alter table transactions
      add constraint transactions_id_user_id_key unique (id, user_id);
  end if;
end $$;

create table if not exists large_expense_transaction_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  large_expense_sub_item_id uuid not null,
  transaction_id uuid not null,
  created_at timestamptz default now(),
  unique (user_id, transaction_id),
  unique (user_id, large_expense_sub_item_id, transaction_id),
  foreign key (large_expense_sub_item_id, user_id)
    references large_expense_sub_items (id, user_id)
    on delete cascade,
  foreign key (transaction_id, user_id)
    references transactions (id, user_id)
    on delete cascade
);

create index if not exists idx_large_expense_transaction_links_sub_item
  on large_expense_transaction_links (user_id, large_expense_sub_item_id);

create index if not exists idx_large_expense_transaction_links_transaction
  on large_expense_transaction_links (user_id, transaction_id);

alter table large_expense_transaction_links enable row level security;

drop policy if exists "Users can manage own large expense transaction links"
  on large_expense_transaction_links;
create policy "Users can manage own large expense transaction links"
  on large_expense_transaction_links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
