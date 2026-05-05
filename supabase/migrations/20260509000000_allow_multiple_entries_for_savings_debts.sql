-- Remove unique constraints from monthly_savings and monthly_debts
-- This allows multiple records for the same item in the same month

-- 1. monthly_savings 테이블 제약 조건 제거
ALTER TABLE monthly_savings DROP CONSTRAINT IF EXISTS monthly_savings_user_id_month_item_id_key;

-- 2. monthly_debts 테이블 제약 조건 제거
ALTER TABLE monthly_debts DROP CONSTRAINT IF EXISTS monthly_debts_user_id_month_item_id_key;

-- 3. 조회 성능을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_monthly_savings_user_month_item ON monthly_savings(user_id, month, item_id);
CREATE INDEX IF NOT EXISTS idx_monthly_debts_user_month_item ON monthly_debts(user_id, month, item_id);
