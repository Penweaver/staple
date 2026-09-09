-- ============================================================================
-- STAPLE LIMITED — Migration 009: Festive Basket Plans & Seasons
-- Christmas, Ileya, Owambe/Party seasonal plans with outright or instalment payment
-- ============================================================================

CREATE TABLE IF NOT EXISTS festive_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category festive_category NOT NULL,
  name VARCHAR(200) NOT NULL,
  year INTEGER NOT NULL,
  event_date DATE,
  delivery_window_start DATE,
  delivery_window_end DATE,
  planning_start_date DATE,
  planning_end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category, year)
);

CREATE TABLE IF NOT EXISTS festive_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES festive_seasons(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  basket_id UUID NOT NULL REFERENCES baskets(id) ON DELETE RESTRICT,
  payment_type festive_payment_type NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  remaining_amount DECIMAL(15, 2) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  preferred_delivery_date DATE,
  delivery_date DATE,
  collection_point_id UUID REFERENCES collection_points(id) ON DELETE SET NULL,
  is_fully_paid BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'fulfilled', 'cancelled'
  no_refund_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_festive_remaining CHECK (remaining_amount = total_amount - paid_amount),
  CONSTRAINT chk_festive_paid_cap CHECK (paid_amount <= total_amount),
  CONSTRAINT chk_festive_total_pos CHECK (total_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_festive_plans_user ON festive_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_festive_plans_season ON festive_plans(season_id);

CREATE TABLE IF NOT EXISTS festive_instalments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES festive_plans(id) ON DELETE CASCADE,
  instalment_number INTEGER NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  due_date DATE NOT NULL,
  status instalment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_instalment_amount_pos CHECK (amount > 0),
  UNIQUE(plan_id, instalment_number)
);

CREATE INDEX IF NOT EXISTS idx_instalments_plan ON festive_instalments(plan_id);
CREATE INDEX IF NOT EXISTS idx_instalments_due ON festive_instalments(due_date) WHERE status = 'pending';

-- Wire up foreign key from orders to festive_plans
DO $$ BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT fk_orders_festive_plan
    FOREIGN KEY (festive_plan_id) REFERENCES festive_plans(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
