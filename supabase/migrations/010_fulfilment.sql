-- ============================================================================
-- STAPLE LIMITED — Migration 010: Fulfilment & Coordinated Collection
-- Collection point staging, automated allocation (Addendum B4), secure pickup codes
-- ============================================================================

CREATE TABLE IF NOT EXISTS fulfilments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_buy_id UUID REFERENCES group_buys(id) ON DELETE SET NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  method fulfilment_method NOT NULL DEFAULT 'collection',
  status fulfilment_status NOT NULL DEFAULT 'pending',
  collection_point_id UUID REFERENCES collection_points(id) ON DELETE SET NULL,
  scheduled_date DATE,
  scheduled_slot VARCHAR(50),
  collected_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  collected_by VARCHAR(200),
  collection_code VARCHAR(20),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fulfilments_group_buy ON fulfilments(group_buy_id);
CREATE INDEX IF NOT EXISTS idx_fulfilments_order ON fulfilments(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfilments_user ON fulfilments(user_id);
CREATE INDEX IF NOT EXISTS idx_fulfilments_status ON fulfilments(status);
CREATE INDEX IF NOT EXISTS idx_fulfilments_date ON fulfilments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_fulfilments_code ON fulfilments(collection_code) WHERE collection_code IS NOT NULL;
