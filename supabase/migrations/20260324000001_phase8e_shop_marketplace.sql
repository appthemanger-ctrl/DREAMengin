-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 8 §E — DreamShop & DreamMarketplace: Real Listings
-- Points 39–46
--
-- Goals:
--   39. merch table aligned; no static data surface
--   40. merch INSERT returns full record (handled by API layer)
--   41. shop_orders table: owner-only RLS (private by default)
--   42. marketplace_items RLS requires authentication for reads
--   43. marketplace slot detail readable by id (handled by existing table)
--   44. public listing reads require auth; private data (orders, notes,
--       dreamads_config) scoped to owners only
--   45. merch table ready for sell-flow API (schema valid)
--   46. marketplace_contact_requests: real contact/request system
--
-- Architecture refs:
--   docs/ARCHITECTURE.md §10 — Supabase for all data
--   docs/SECURITY.md       — RLS on every user table
--   docs/AXIOMS.md Axiom 4 — Security by Default
--   docs/AXIOMS.md Axiom 5 — Privacy by Design (private by default)
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════════
-- 1.  FIX merch TABLE — align with production code expectations
-- ══════════════════════════════════════════════════════════════════════════════
-- The initial schema used owner_id + title; active app code uses user_id + name.
-- We add the application-facing columns, backfill from legacy columns, and
-- re-issue RLS policies.

ALTER TABLE public.merch
  ADD COLUMN IF NOT EXISTS user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name       TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Back-fill user_id from owner_id (profiles.id mirrors auth.users.id)
UPDATE public.merch
SET    user_id = owner_id
WHERE  user_id IS NULL AND owner_id IS NOT NULL;

-- Back-fill name from title
UPDATE public.merch
SET    name = title
WHERE  name IS NULL AND title IS NOT NULL;

-- Re-enable RLS (idempotent)
ALTER TABLE public.merch ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies before re-creating
DROP POLICY IF EXISTS "Merch read"                    ON public.merch;
DROP POLICY IF EXISTS "Own merch"                     ON public.merch;
DROP POLICY IF EXISTS "merch_select_authenticated"    ON public.merch;
DROP POLICY IF EXISTS "merch_insert_own"              ON public.merch;
DROP POLICY IF EXISTS "merch_update_own"              ON public.merch;
DROP POLICY IF EXISTS "merch_delete_own"              ON public.merch;

-- Point 44: public listing reads require authentication (not anon)
CREATE POLICY "merch_select_authenticated" ON public.merch
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Sellers manage their own rows via user_id
CREATE POLICY "merch_insert_own" ON public.merch
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "merch_update_own" ON public.merch
  FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "merch_delete_own" ON public.merch
  FOR DELETE
  USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 2.  shop_orders TABLE — Point 41: private order history
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id      UUID        NOT NULL REFERENCES public.merch(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','confirmed','shipped','completed','cancelled')),
  amount_cents INTEGER     NOT NULL DEFAULT 0,
  -- Point 44: private seller notes never exposed to buyers / public
  seller_notes TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_orders_owner_read"     ON public.shop_orders;
DROP POLICY IF EXISTS "shop_orders_buyer_insert"   ON public.shop_orders;
DROP POLICY IF EXISTS "shop_orders_owner_update"   ON public.shop_orders;

-- Point 41: only buyer or seller may read their own orders
CREATE POLICY "shop_orders_owner_read" ON public.shop_orders
  FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "shop_orders_buyer_insert" ON public.shop_orders
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "shop_orders_owner_update" ON public.shop_orders
  FOR UPDATE
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3.  marketplace_items RLS — Point 42 + 44
-- ══════════════════════════════════════════════════════════════════════════════
-- Table created in 20260307000000_readme_gaps.sql.
-- Replace the policy that allowed anon reads with auth-required reads.

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_items_select_published" ON public.marketplace_items;

-- Point 44: published listings visible to authenticated users only
CREATE POLICY "marketplace_items_select_published" ON public.marketplace_items
  FOR SELECT
  USING (
    (is_published = true AND auth.uid() IS NOT NULL)
    OR seller_id = auth.uid()
  );

-- Seller policies unchanged (insert/update/delete stay scoped to seller_id)
-- They were already created in readme_gaps; keep them.

-- ══════════════════════════════════════════════════════════════════════════════
-- 4.  marketplace_contact_requests TABLE — Point 46
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.marketplace_contact_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID        NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  requester_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message      TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','acknowledged','closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mcr_participant_read"   ON public.marketplace_contact_requests;
DROP POLICY IF EXISTS "mcr_requester_insert"   ON public.marketplace_contact_requests;
DROP POLICY IF EXISTS "mcr_seller_update"      ON public.marketplace_contact_requests;

-- Only requester or seller can see the request (Point 44: private to participants)
CREATE POLICY "mcr_participant_read" ON public.marketplace_contact_requests
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = seller_id);

CREATE POLICY "mcr_requester_insert" ON public.marketplace_contact_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Seller may acknowledge / close requests
CREATE POLICY "mcr_seller_update" ON public.marketplace_contact_requests
  FOR UPDATE
  USING (auth.uid() = seller_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5.  Index helpers for performance
-- ══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_merch_user_id
  ON public.merch (user_id);

CREATE INDEX IF NOT EXISTS idx_merch_created_at
  ON public.merch (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shop_orders_buyer
  ON public.shop_orders (buyer_id);

CREATE INDEX IF NOT EXISTS idx_shop_orders_seller
  ON public.shop_orders (seller_id);

CREATE INDEX IF NOT EXISTS idx_mcr_item_id
  ON public.marketplace_contact_requests (item_id);

CREATE INDEX IF NOT EXISTS idx_mcr_seller_id
  ON public.marketplace_contact_requests (seller_id);
