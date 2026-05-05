-- Add date column to monthly_savings, monthly_debts, and additional_incomes
ALTER TABLE monthly_savings ADD COLUMN date DATE;
ALTER TABLE monthly_debts ADD COLUMN date DATE;
ALTER TABLE additional_incomes ADD COLUMN date DATE;
