-- Phase 8 §E — DreamShop Orders Table
-- Point 41: DreamShop order history is private by default — owner-only reads enforced by RLS.
--
-- Architecture: ARCHITECTURE.md §5 (privacy model) — nothing is public by default.
-- Security: RLS enforces buyer-only read and write; seller can view orders for their items.

CREATE TABLE IF NOT EXISTS orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id     uuid NOT NULL,           -- references merch.id (soft FK for flexibility)
  item_table  text NOT NULL DEFAULT 'merch', -- 'merch' | 'marketplace_items'
  amount      numeric(12, 2) NOT NULL,
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'fulfilled', 'cancelled', 'refunded')),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Buyer can read their own orders
CREATE POLICY "orders_buyer_select"
  ON orders FOR SELECT
  USING (auth.uid() = buyer_id);

-- Seller can read orders for items they own
CREATE POLICY "orders_seller_select"
  ON orders FOR SELECT
  USING (auth.uid() = seller_id);

-- Only the buyer can create an order
CREATE POLICY "orders_buyer_insert"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Buyer and seller can update (e.g., seller confirms / buyer cancels)
CREATE POLICY "orders_participant_update"
  ON orders FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Buyer can delete (cancel) their own pending orders
CREATE POLICY "orders_buyer_delete"
  ON orders FOR DELETE
  USING (auth.uid() = buyer_id AND status = 'pending');
