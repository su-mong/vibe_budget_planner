-- monthly_budgets 테이블 제거
-- monthly_sub_budgets 테이블이 category/sub_category별 예산을 정규화하여 관리하므로
-- 하드코딩된 카테고리 컬럼 방식의 monthly_budgets는 더 이상 필요하지 않음

drop policy if exists "Users can CRUD own data" on monthly_budgets;
drop table if exists monthly_budgets;
