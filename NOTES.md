# NOTES — Do-it-from-phone deployment

## A) Reset PostgREST schema cache (universal method)
Run in Supabase SQL (prod):
```sql
select pg_notify('pgrst', 'reload schema');
```

If you want a reusable RPC:
```sql
create schema if not exists admin;
create or replace function admin.reset_schema_cache()
returns void language plpgsql security definer as $$
begin
  perform pg_notify('pgrst', 'reload schema');
end;
$$;
grant usage on schema admin to anon, authenticated;
grant execute on function admin.reset_schema_cache() to anon, authenticated;
```

Then:
```sql
select admin.reset_schema_cache();
```

## B) Temporary DB shim if your code expects `owner_id`
```sql
alter table music_releases add column if not exists owner_id uuid;
update music_releases set owner_id = user_id where owner_id is null;

alter table app_posts add column if not exists owner_id uuid;
update app_posts set owner_id = user_id where owner_id is null;
```
(You can remove later after code uses `user_id` everywhere.)

## C) Proxy-mode
- Delete/disable `middleware.ts` auth checks.
- Server pages should not redirect when Supabase cookies are missing.
- If the proxy forwards identity (e.g., `X-Auth-User`), read it in API routes only.
