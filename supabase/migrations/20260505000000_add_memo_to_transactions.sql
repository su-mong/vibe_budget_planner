-- 거래 내역에 메모를 기록하기 위한 컬럼 추가
alter table transactions add column memo text default null;
