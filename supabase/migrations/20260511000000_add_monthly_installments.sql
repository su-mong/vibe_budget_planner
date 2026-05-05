-- Create monthly_installments table
create table monthly_installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  name text not null,
  amount integer not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table monthly_installments enable row level security;

-- Create policy
create policy "Users can CRUD own installments" on monthly_installments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
