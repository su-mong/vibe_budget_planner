-- 식비 트랜잭션에 끼니 수를 기록하기 위한 컬럼 추가
alter table transactions add column meal_count integer default null;
