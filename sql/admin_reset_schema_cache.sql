-- admin_reset_schema_cache.sql
select pg_notify('pgrst', 'reload schema');