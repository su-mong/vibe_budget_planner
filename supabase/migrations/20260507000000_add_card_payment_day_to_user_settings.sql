-- Add card_payment_day column to user_settings table
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS card_payment_day INTEGER DEFAULT NULL;
