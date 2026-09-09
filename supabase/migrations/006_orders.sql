-- ============================================================================
-- STAPLE LIMITED — Migration 006: Orders & Order Items
-- Idempotent order tracking, multi-funding split, and lifecycle refund audit
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE, -- STP-ORD-YYYYMMDD-XXXXXX
  user_id UUID NOT NULL REFERENCES profiles(id),
  group_buy_id UUID REFERENCES group_buys(id),

  -- Product or Basket reference
  product_id UUID REFERENCES products(id),
  basket_id UUID REFERENCES baskets(id),
  quantity INTEGER NOT NULL,
  unit_price_at_purchase DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',

  -- Status
  status order_status NOT NULL DEFAULT 'pending',

  -- Payment source allocation
  wallet_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  gateway_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,

  -- Price tier adjustment tracking
  price_adjustment_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  effective_unit_price DECIMAL(15, 2),

  -- Idempotency key
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,

  -- Festive & Champion attributes
  is_festive_plan BOOLEAN NOT NULL DEFAULT FALSE,
  festive_plan_id UUID, -- FK wired up after festive_plans table created
  is_champion_activation BOOLEAN NOT NULL DEFAULT FALSE,

  -- Refund tracking (Addendum A2, §4.1)
  refund_reason refund_reason,
  refunded_at TIMESTAMPTZ,
  refunded_by UUID REFERENCES profiles(id),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_order_qty_pos CHECK (quantity > 0 AND quantity <= 10),
  CONSTRAINT chk_order_total_pos CHECK (total_amount > 0),
  CONSTRAINT chk_order_split_balance CHECK (wallet_amount + gateway_amount = total_amount),
  CONSTRAINT chk_refund_integrity CHECK (
    (status = 'refunded' AND refund_reason IS NOT NULL AND refunded_at IS NOT NULL) OR
    (status != 'refunded')
  )
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_group_buy ON orders(group_buy_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_item_qty_pos CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
