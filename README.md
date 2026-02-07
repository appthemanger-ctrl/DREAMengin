# DreamEngin Hotfix Bundle (Proxy Auth + Schema Cache + RLS)

This bundle contains copy‑paste files to stabilize prod quickly.

## What's inside
- `sql/admin_reset_schema_cache.sql` — one-shot AND reusable PostgREST schema cache reset.
- `sql/rls_private.sql` — strict RLS policies (auth-only) for `app_posts` and `music_releases`.
- `api/admin/hotfix/route.ts` — browser-triggerable cache reset + sanity checks (token protected).
- `patches/user_id_owner_id.diff` — sample code diff to use `user_id` instead of `owner_id`.
- `env/production.env.example` — minimal envs for Vercel prod in proxy mode.
- `NOTES.md` — how to deploy from phone (summary).

## Quick Start
1. Run `sql/admin_reset_schema_cache.sql` in Supabase SQL editor (prod).
2. Deploy `api/admin/hotfix/route.ts`, set `HOTFIX_TOKEN` in Vercel, open:
   `/api/admin/hotfix?token=<HOTFIX_TOKEN>` to force reload + run checks.
3. If your front-end still queries `owner_id`, apply `patches/user_id_owner_id.diff` or
   add temporary columns (see NOTES).
4. If you require login at `/`, keep middleware disabled and rely on your proxy for auth.
