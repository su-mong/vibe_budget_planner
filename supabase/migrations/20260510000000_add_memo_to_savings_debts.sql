-- Add memo column to monthly_savings and monthly_debts
ALTER TABLE monthly_savings ADD COLUMN memo TEXT;
ALTER TABLE monthly_debts ADD COLUMN memo TEXT;
