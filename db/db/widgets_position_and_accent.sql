-- Ensure widgets has position + accent columns
alter table if exists widgets add column if not exists position int default 0;
alter table if exists widgets add column if not exists accent text;