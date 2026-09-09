-- ============================================================================
-- STAPLE LIMITED — Migration 005: Group Buying Core Engine
-- Target-based collective purchasing, MVFQ, dynamic pricing tiers, participant limits
-- ============================================================================

CREATE TABLE IF NOT EXISTS group_buys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  qr_code_url TEXT,

  -- Type & Creator
  type group_buy_type NOT NULL DEFAULT 'regular',
  creator_type group_buy_creator_type NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),

  -- Product or Basket reference (mutually exclusive)
  product_id UUID REFERENCES products(id),
  basket_id UUID REFERENCES baskets(id),

  -- Commercial configuration
  unit_price DECIMAL(15, 2) NOT NULL,
  original_unit_price DECIMAL(15, 2) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',

  -- Target & Quantities
  target_quantity INTEGER NOT NULL,
  paid_quantity INTEGER NOT NULL DEFAULT 0,
  max_units_per_user INTEGER NOT NULL DEFAULT 10,
  min_fulfilment_quantity INTEGER NOT NULL DEFAULT 1, -- MVFQ copied at creation (Addendum A1)

  -- Status & Lifecycle
  status group_buy_status NOT NULL DEFAULT 'draft',
  lifespan_days INTEGER NOT NULL DEFAULT 14,
  live_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  target_reached_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Location
  service_area_id UUID REFERENCES service_areas(id),
  collection_point_id UUID REFERENCES collection_points(id),

  -- Festive specific
  festive_category festive_category,
  has_minimum_threshold BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE for festive group buys (§40)

  -- Configuration flags
  allow_oversubscription BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata & Sharing
  description TEXT,
  share_message TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_product_or_basket CHECK (
    (product_id IS NOT NULL AND basket_id IS NULL) OR
    (product_id IS NULL AND basket_id IS NOT NULL)
  ),
  CONSTRAINT chk_target_positive CHECK (target_quantity > 0),
  CONSTRAINT chk_paid_not_negative CHECK (paid_quantity >= 0),
  CONSTRAINT chk_mvfq_positive CHECK (min_fulfilment_quantity > 0),
  CONSTRAINT chk_price_positive CHECK (unit_price > 0 AND original_unit_price > 0)
);

CREATE INDEX IF NOT EXISTS idx_group_buys_status ON group_buys(status);
CREATE INDEX IF NOT EXISTS idx_group_buys_type ON group_buys(type);
CREATE INDEX IF NOT EXISTS idx_group_buys_created_by ON group_buys(created_by);
CREATE INDEX IF NOT EXISTS idx_group_buys_service_area ON group_buys(service_area_id);
CREATE INDEX IF NOT EXISTS idx_group_buys_live_expires ON group_buys(live_at, expires_at) WHERE status = 'live';
CREATE INDEX IF NOT EXISTS idx_group_buys_slug ON group_buys(slug);

CREATE TABLE IF NOT EXISTS group_buy_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_buy_id UUID NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
  min_percentage DECIMAL(5, 2) NOT NULL,
  max_percentage DECIMAL(5, 2),
  discount_percentage DECIMAL(5, 2) NOT NULL,
  discounted_price DECIMAL(15, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_percentage_range CHECK (min_percentage >= 0 AND min_percentage <= 100),
  CONSTRAINT chk_discount_range CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

CREATE INDEX IF NOT EXISTS idx_pricing_tiers_group_buy ON group_buy_pricing_tiers(group_buy_id);

CREATE TABLE IF NOT EXISTS group_buy_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_buy_id UUID NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_champion BOOLEAN NOT NULL DEFAULT FALSE,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_participant_qty_limit CHECK (total_quantity >= 0 AND total_quantity <= 10),
  UNIQUE(group_buy_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_group_buy ON group_buy_participants(group_buy_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON group_buy_participants(user_id);

CREATE TABLE IF NOT EXISTS group_buy_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_buy_id UUID NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  previous_status group_buy_status,
  new_status group_buy_status,
  triggered_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gb_events_group_buy ON group_buy_events(group_buy_id);
CREATE INDEX IF NOT EXISTS idx_gb_events_created ON group_buy_events(created_at);
