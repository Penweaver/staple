-- ============================================================================
-- STAPLE LIMITED â€” Migration 001: Enums
-- Authoritative system enums as specified in Implementation Plan v1.1
-- ============================================================================

-- Extensions required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Identity & Roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'champion', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE champion_status AS ENUM ('inactive', 'active', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Group Buying
DO $$ BEGIN
  CREATE TYPE group_buy_type AS ENUM ('regular', 'festive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE group_buy_status AS ENUM (
    'draft', 'pending_activation', 'live', 'target_reached',
    'lifespan_expired', 'delivery_fulfilment', 'completed', 'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE group_buy_creator_type AS ENUM ('admin', 'champion');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Orders & Refunds
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending', 'payment_processing', 'paid', 'fulfilment_ready',
    'in_fulfilment', 'fulfilled', 'collected', 'cancelled', 'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE refund_reason AS ENUM (
    'user_cancelled', 'mvfq_not_met', 'fulfilment_failed', 'festive_season_cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payments
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'initiated', 'pending', 'successful', 'failed', 'refunded', 'abandoned'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('gateway', 'wallet', 'split');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_gateway_provider AS ENUM ('paystack', 'flutterwave');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Wallet
DO $$ BEGIN
  CREATE TYPE wallet_transaction_type AS ENUM (
    'credit_price_adjustment', 'credit_promotional', 'credit_operational',
    'credit_champion_milestone', 'credit_refund',
    'debit_purchase', 'debit_reversal'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE wallet_entry_side AS ENUM ('debit', 'credit');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Festive
DO $$ BEGIN
  CREATE TYPE festive_category AS ENUM ('christmas', 'ileya', 'owambe_party');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE festive_payment_type AS ENUM ('outright', 'instalment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE instalment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Fulfilment
DO $$ BEGIN
  CREATE TYPE fulfilment_status AS ENUM (
    'pending', 'preparing', 'ready_for_collection', 'in_delivery',
    'collected', 'delivered', 'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfilment_method AS ENUM ('collection', 'delivery');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Communication & Notifications
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'group_buy_created', 'group_buy_live', 'group_buy_shared',
    'pricing_tier_reached', 'wallet_credited', 'target_approaching',
    'target_reached', 'group_buy_expiring', 'group_buy_fulfilment',
    'order_confirmed', 'payment_successful', 'payment_failed',
    'fulfilment_ready', 'collection_ready', 'festive_instalment_reminder',
    'champion_approved', 'champion_suspended', 'support_response',
    'general'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('push', 'sms', 'email', 'in_app');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Support
DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- ============================================================================
-- STAPLE LIMITED â€” Migration 002: Identity & Profiles
-- User profiles with Champion status, location link, and participation tracker
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  champion_status champion_status NOT NULL DEFAULT 'inactive',
  champion_approved_at TIMESTAMPTZ,
  champion_approved_by UUID REFERENCES profiles(id),
  champion_suspended_at TIMESTAMPTZ,
  champion_suspended_by UUID REFERENCES profiles(id),
  champion_suspension_reason TEXT,
  default_location_id UUID, -- Foreign key added after user_locations table created
  has_participated_in_group_buy BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_champion_status ON profiles(champion_status);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
-- ============================================================================
-- STAPLE LIMITED â€” Migration 003: Location Hierarchy & PostGIS
-- Country -> State/Region -> District/LGA -> City/Locality -> Service Area -> Collection Point
-- ============================================================================

CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  iso_code CHAR(2) NOT NULL UNIQUE,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS states_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(country_id, name)
);

CREATE TABLE IF NOT EXISTS districts_lgas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_region_id UUID NOT NULL REFERENCES states_regions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(state_region_id, name)
);

CREATE TABLE IF NOT EXISTS cities_localities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_lga_id UUID NOT NULL REFERENCES districts_lgas(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(district_lga_id, name)
);

CREATE TABLE IF NOT EXISTS service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_locality_id UUID NOT NULL REFERENCES cities_localities(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  boundary GEOMETRY(POLYGON, 4326),
  center_point GEOMETRY(POINT, 4326),
  radius_km DECIMAL(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_areas_boundary ON service_areas USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_service_areas_center ON service_areas USING GIST(center_point);

CREATE TABLE IF NOT EXISTS collection_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_area_id UUID NOT NULL REFERENCES service_areas(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  location_point GEOMETRY(POINT, 4326),
  contact_phone VARCHAR(20),
  contact_name VARCHAR(100),
  operating_hours JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_points_location ON collection_points USING GIST(location_point);

CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id),
  state_region_id UUID NOT NULL REFERENCES states_regions(id),
  district_lga_id UUID REFERENCES districts_lgas(id),
  city_locality_id UUID REFERENCES cities_localities(id),
  service_area_id UUID REFERENCES service_areas(id),
  detected_point GEOMETRY(POINT, 4326), -- GPS point: private, never exposed via public queries
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_auto_detected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_locations_user ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_service_area ON user_locations(service_area_id);

-- Wire default_location_id in profiles
DO $$ BEGIN
  ALTER TABLE profiles
    ADD CONSTRAINT fk_profiles_default_location
    FOREIGN KEY (default_location_id) REFERENCES user_locations(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- ============================================================================
-- STAPLE LIMITED â€” Migration 004: Catalogue (Products & Baskets)
-- Category-agnostic product and basket models with MVFQ support (Addendum A1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  parent_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES product_categories(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  unit VARCHAR(50) NOT NULL, -- e.g., 'bag', 'carton', 'pack', 'kg'
  weight_value DECIMAL(10, 2),
  weight_unit VARCHAR(20),
  base_price DECIMAL(15, 2) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  min_group_buy_target INTEGER NOT NULL DEFAULT 1,
  max_group_buy_target INTEGER NOT NULL DEFAULT 10000,
  max_units_per_user INTEGER NOT NULL DEFAULT 10,
  minimum_fulfilment_quantity INTEGER NOT NULL DEFAULT 1, -- MVFQ: supplier MOQ / break-even qty (Addendum A1)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_festive BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_product_price_pos CHECK (base_price > 0),
  CONSTRAINT chk_product_targets CHECK (min_group_buy_target > 0 AND max_group_buy_target >= min_group_buy_target),
  CONSTRAINT chk_product_mvfq CHECK (minimum_fulfilment_quantity > 0)
);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(200),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_location_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  state_region_id UUID REFERENCES states_regions(id) ON DELETE CASCADE,
  service_area_id UUID REFERENCES service_areas(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_location_scope CHECK (
    country_id IS NOT NULL OR state_region_id IS NOT NULL OR service_area_id IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS baskets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  total_price DECIMAL(15, 2) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  max_units_per_user INTEGER NOT NULL DEFAULT 10,
  minimum_fulfilment_quantity INTEGER NOT NULL DEFAULT 1, -- MVFQ (Addendum A1)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_festive BOOLEAN NOT NULL DEFAULT FALSE,
  festive_category festive_category,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_basket_price_pos CHECK (total_price > 0),
  CONSTRAINT chk_basket_mvfq CHECK (minimum_fulfilment_quantity > 0)
);

CREATE TABLE IF NOT EXISTS basket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  basket_id UUID NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_basket_item_qty CHECK (quantity > 0),
  UNIQUE(basket_id, product_id)
);
-- ============================================================================
-- STAPLE LIMITED â€” Migration 005: Group Buying Core Engine
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
  has_minimum_threshold BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE for festive group buys (Â§40)

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
-- ============================================================================
-- STAPLE LIMITED â€” Migration 006: Orders & Order Items
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

  -- Refund tracking (Addendum A2, Â§4.1)
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
-- ============================================================================
-- STAPLE LIMITED â€” Migration 007: Payments & Webhooks
-- Paystack integration, anti-gaming fingerprinting (Addendum A4), idempotent webhooks
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(100) NOT NULL UNIQUE, -- STP-PAY-YYYYMMDD-XXXXXX
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),

  -- Amounts
  amount DECIMAL(15, 2) NOT NULL,
  wallet_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  gateway_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',

  -- Status & Methods
  status payment_status NOT NULL DEFAULT 'initiated',
  method payment_method NOT NULL,
  gateway_provider payment_gateway_provider,

  -- Gateway details
  gateway_reference VARCHAR(200),
  gateway_authorization_code VARCHAR(200),
  gateway_channel VARCHAR(50),
  gateway_response JSONB,

  -- Anti-Gaming Fingerprint (Addendum A4)
  -- Paystack authorization.signature / card/account fingerprint hash
  payment_fingerprint VARCHAR(200),

  -- Server-side verification
  verified_at TIMESTAMPTZ,
  verified_by VARCHAR(50),

  -- Idempotency
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_payment_amount_pos CHECK (amount > 0),
  CONSTRAINT chk_payment_split_sum CHECK (wallet_amount + gateway_amount = amount)
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_ref ON payment_transactions(gateway_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payments_fingerprint ON payment_transactions(payment_fingerprint) WHERE payment_fingerprint IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider payment_gateway_provider NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  reference VARCHAR(200),
  payload JSONB NOT NULL,
  signature VARCHAR(500),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  idempotency_key VARCHAR(200) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_reference ON payment_webhooks(reference);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON payment_webhooks(is_processed);
CREATE INDEX IF NOT EXISTS idx_webhooks_idempotency ON payment_webhooks(idempotency_key);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL CHECK (source IN ('wallet', 'gateway')),
  amount DECIMAL(15, 2) NOT NULL,
  wallet_transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_alloc_amount_pos CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_allocations_payment ON payment_allocations(payment_id);
-- ============================================================================
-- STAPLE LIMITED â€” Migration 008: Wallet & Double-Entry Ledger
-- Materialized balance with strict audit ledger, no bank withdrawals in MVP (Â§24)
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_wallet_balance_non_neg CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  transaction_type wallet_transaction_type NOT NULL,
  entry_side wallet_entry_side NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  balance_before DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',

  -- Entity links
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  group_buy_id UUID REFERENCES group_buys(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,

  description TEXT NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_tx_amount_pos CHECK (amount > 0),
  CONSTRAINT chk_balance_math CHECK (
    (entry_side = 'credit' AND balance_after = balance_before + amount) OR
    (entry_side = 'debit' AND balance_after = balance_before - amount)
  )
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_idempotency ON wallet_transactions(idempotency_key);

-- Link payment allocations to wallet transactions
DO $$ BEGIN
  ALTER TABLE payment_allocations
    ADD CONSTRAINT fk_alloc_wallet_tx
    FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- ============================================================================
-- STAPLE LIMITED â€” Migration 009: Festive Basket Plans & Seasons
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
-- ============================================================================
-- STAPLE LIMITED â€” Migration 010: Fulfilment & Coordinated Collection
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
-- ============================================================================
-- STAPLE LIMITED â€” Migration 011: Communications & Eligible Live Chat
-- In-app notifications, support ticketing, and participation-gated live chat (Â§41)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- Live Chat (Restricted to verified participants per Spec Â§41)
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  group_buy_id UUID REFERENCES group_buys(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_memberships_user ON chat_memberships(user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at);
-- ============================================================================
-- STAPLE LIMITED â€” Migration 012: Audit Logs, Idempotency & System Config
-- Immutability tracking, idempotency enforcement, and dynamic business parameters
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role user_role,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS idempotency_records (
  key VARCHAR(200) PRIMARY KEY,
  response JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_records(expires_at);

CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed authoritative system configuration (Implementation Plan v1.1 + Addendum v1)
INSERT INTO system_config (key, value, description) VALUES
  ('max_champion_active_group_buys', '2', 'Maximum active Group Buys per Champion (Â§8)'),
  ('max_units_per_user_per_group_buy', '10', 'Maximum units any user can purchase per Group Buy (Â§11)'),
  ('default_group_buy_lifespan_days', '14', 'Default Group Buy lifespan in calendar days from LIVE (Â§16)'),
  ('group_buy_discovery_limit', '10', 'Default number of Group Buys in nearby discovery feed (Â§5.3)'),
  ('owambe_min_planning_days', '42', 'Minimum days before delivery for Owambe plans (Â§39)'),
  ('owambe_max_planning_days', '100', 'Maximum days before delivery for Owambe plans (Â§39)'),
  ('champion_milestone_reward_amount', '2000', 'Flat NGN reward for Champion on TARGET_REACHED (Addendum A3)'),
  ('instalment_grace_period_days', '7', 'Grace period days after instalment due date before Admin cancellation (Addendum B5)'),
  ('tier_credit_delay_hours', '48', 'Hours to delay pricing-tier wallet credit disbursement after DELIVERY_FULFILMENT (Addendum A4)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();
-- ============================================================================
-- STAPLE LIMITED â€” Migration 013: Row Level Security (RLS) Policies
-- Enforcing least-privilege, privacy, and non-circumvention rules server-side
-- ============================================================================

-- Enable RLS on all core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buy_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buy_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE festive_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE festive_instalments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfilments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: check if current user is eligible for Live Chat
CREATE OR REPLACE FUNCTION is_chat_eligible()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (has_participated_in_group_buy = TRUE OR role IN ('admin', 'super_admin'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- Profiles Policies ---
DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (
    id = auth.uid() OR is_admin()
  );

DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (
    id = auth.uid() OR is_admin()
  );

-- --- User Locations Policies (GPS Privacy Â§5.2) ---
DROP POLICY IF EXISTS user_locations_select ON user_locations;
CREATE POLICY user_locations_select ON user_locations
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

DROP POLICY IF EXISTS user_locations_insert ON user_locations;
CREATE POLICY user_locations_insert ON user_locations
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS user_locations_update ON user_locations;
CREATE POLICY user_locations_update ON user_locations
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- --- Group Buys Policies ---
-- Only LIVE group buys visible to non-admin/non-creator users (Â§15)
DROP POLICY IF EXISTS group_buys_select ON group_buys;
CREATE POLICY group_buys_select ON group_buys
  FOR SELECT USING (
    status = 'live'
    OR status IN ('target_reached', 'lifespan_expired', 'delivery_fulfilment', 'completed')
    OR created_by = auth.uid()
    OR is_admin()
  );

-- Only Admin or approved Champion can create Group Buys (Â§6)
DROP POLICY IF EXISTS group_buys_insert ON group_buys;
CREATE POLICY group_buys_insert ON group_buys
  FOR INSERT WITH CHECK (
    is_admin() OR (
      created_by = auth.uid() AND
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND champion_status = 'active'
      )
    )
  );

-- Champions cannot delete Group Buys (Â§46)
DROP POLICY IF EXISTS group_buys_delete ON group_buys;
CREATE POLICY group_buys_delete ON group_buys
  FOR DELETE USING (
    is_admin()
  );

-- --- Pricing Tiers ---
DROP POLICY IF EXISTS pricing_tiers_select ON group_buy_pricing_tiers;
CREATE POLICY pricing_tiers_select ON group_buy_pricing_tiers
  FOR SELECT USING (TRUE);

-- --- Wallets & Transactions (Read-only for users, managed via backend) ---
DROP POLICY IF EXISTS wallets_select ON wallets;
CREATE POLICY wallets_select ON wallets
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

DROP POLICY IF EXISTS wallet_tx_select ON wallet_transactions;
CREATE POLICY wallet_tx_select ON wallet_transactions
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

-- --- Orders Policies ---
DROP POLICY IF EXISTS orders_select ON orders;
CREATE POLICY orders_select ON orders
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

-- --- Payments Policies ---
DROP POLICY IF EXISTS payments_select ON payment_transactions;
CREATE POLICY payments_select ON payment_transactions
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

-- --- Festive Plans Policies ---
DROP POLICY IF EXISTS festive_plans_select ON festive_plans;
CREATE POLICY festive_plans_select ON festive_plans
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

-- --- Fulfilments Policies ---
DROP POLICY IF EXISTS fulfilments_select ON fulfilments;
CREATE POLICY fulfilments_select ON fulfilments
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

-- --- Notifications Policies ---
DROP POLICY IF EXISTS notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- --- Live Chat Policies (Â§41, Â§42) ---
DROP POLICY IF EXISTS chat_rooms_select ON chat_rooms;
CREATE POLICY chat_rooms_select ON chat_rooms
  FOR SELECT USING (
    is_chat_eligible()
  );

DROP POLICY IF EXISTS chat_memberships_select ON chat_memberships;
CREATE POLICY chat_memberships_select ON chat_memberships
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

DROP POLICY IF EXISTS chat_messages_select ON chat_messages;
CREATE POLICY chat_messages_select ON chat_messages
  FOR SELECT USING (
    is_chat_eligible() AND EXISTS (
      SELECT 1 FROM chat_memberships
      WHERE room_id = chat_messages.room_id
      AND user_id = auth.uid()
      AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS chat_messages_insert ON chat_messages;
CREATE POLICY chat_messages_insert ON chat_messages
  FOR INSERT WITH CHECK (
    is_chat_eligible() AND user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM chat_memberships
      WHERE room_id = chat_messages.room_id
      AND user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- --- Audit Logs (Admin Only) ---
DROP POLICY IF EXISTS audit_logs_select ON audit_logs;
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT USING (
    is_admin()
  );

-- --- System Config (Readable by all, writable only by Admin) ---
DROP POLICY IF EXISTS system_config_select ON system_config;
CREATE POLICY system_config_select ON system_config
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS system_config_write ON system_config;
CREATE POLICY system_config_write ON system_config
  FOR ALL USING (
    is_admin()
  );
-- ============================================================================
-- STAPLE LIMITED â€” Migration 014: PostGIS Proximity Functions (Phase 2)
-- RPC functions for location detection, nearby collection point search,
-- and service area resolution using PostGIS ST_DWithin.
-- ============================================================================

-- Find the nearest service area to a given GPS coordinate
-- Uses ST_DWithin for efficient bounding-box + distance filtering
CREATE OR REPLACE FUNCTION find_nearest_service_area(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  max_distance_km DOUBLE PRECISION DEFAULT 50.0
)
RETURNS TABLE (
  id UUID,
  city_locality_id UUID,
  name VARCHAR,
  description TEXT,
  radius_km DECIMAL,
  is_active BOOLEAN,
  distance_km DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.city_locality_id,
    sa.name,
    sa.description,
    sa.radius_km,
    sa.is_active,
    ROUND(
      (ST_Distance(
        sa.center_point::geography,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
      ) / 1000.0)::numeric, 2
    )::DOUBLE PRECISION AS distance_km,
    sa.created_at,
    sa.updated_at
  FROM service_areas sa
  WHERE
    sa.is_active = TRUE
    AND sa.center_point IS NOT NULL
    AND ST_DWithin(
      sa.center_point::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      max_distance_km * 1000  -- ST_DWithin geography uses meters
    )
  ORDER BY
    ST_Distance(
      sa.center_point::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    )
  LIMIT 5;
END;
$$;

-- Find nearby collection points within a given radius
CREATE OR REPLACE FUNCTION find_nearby_collection_points(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  max_distance_km DOUBLE PRECISION DEFAULT 15.0,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  service_area_id UUID,
  name VARCHAR,
  address TEXT,
  contact_phone VARCHAR,
  contact_name VARCHAR,
  operating_hours JSONB,
  is_active BOOLEAN,
  distance_km DOUBLE PRECISION,
  service_area_name VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.service_area_id,
    cp.name,
    cp.address,
    cp.contact_phone,
    cp.contact_name,
    cp.operating_hours,
    cp.is_active,
    ROUND(
      (ST_Distance(
        cp.location_point::geography,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
      ) / 1000.0)::numeric, 2
    )::DOUBLE PRECISION AS distance_km,
    sa.name AS service_area_name,
    cp.created_at,
    cp.updated_at
  FROM collection_points cp
  JOIN service_areas sa ON sa.id = cp.service_area_id
  WHERE
    cp.is_active = TRUE
    AND cp.location_point IS NOT NULL
    AND ST_DWithin(
      cp.location_point::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      max_distance_km * 1000
    )
  ORDER BY
    ST_Distance(
      cp.location_point::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    )
  LIMIT result_limit;
END;
$$;

-- Check if a product is available in a given service area
-- Respects the product_location_rules table (allow/deny per location level)
CREATE OR REPLACE FUNCTION is_product_available_in_area(
  p_product_id UUID,
  p_service_area_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  rule_count INTEGER;
  available_count INTEGER;
BEGIN
  -- Count total rules for this product
  SELECT COUNT(*) INTO rule_count
  FROM product_location_rules
  WHERE product_id = p_product_id;

  -- If no rules exist, product is available everywhere
  IF rule_count = 0 THEN
    RETURN TRUE;
  END IF;

  -- Check if any rule explicitly allows this service area, its parent state, or country
  SELECT COUNT(*) INTO available_count
  FROM product_location_rules plr
  WHERE plr.product_id = p_product_id
    AND plr.is_available = TRUE
    AND (
      -- Direct service area match
      plr.service_area_id = p_service_area_id
      -- State-level match
      OR plr.state_region_id IN (
        SELECT sr.id
        FROM service_areas sa
        JOIN cities_localities cl ON cl.id = sa.city_locality_id
        JOIN districts_lgas dl ON dl.id = cl.district_lga_id
        JOIN states_regions sr ON sr.id = dl.state_region_id
        WHERE sa.id = p_service_area_id
      )
      -- Country-level match
      OR plr.country_id IN (
        SELECT c.id
        FROM service_areas sa
        JOIN cities_localities cl ON cl.id = sa.city_locality_id
        JOIN districts_lgas dl ON dl.id = cl.district_lga_id
        JOIN states_regions sr ON sr.id = dl.state_region_id
        JOIN countries c ON c.id = sr.country_id
        WHERE sa.id = p_service_area_id
      )
    );

  RETURN available_count > 0;
END;
$$;

-- Get products available in a service area with filtering and pagination
CREATE OR REPLACE FUNCTION get_products_for_area(
  p_service_area_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_is_festive BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  category_id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  unit VARCHAR,
  weight_value DECIMAL,
  weight_unit VARCHAR,
  base_price DECIMAL,
  currency_code CHAR(3),
  min_group_buy_target INTEGER,
  max_group_buy_target INTEGER,
  max_units_per_user INTEGER,
  minimum_fulfilment_quantity INTEGER,
  is_active BOOLEAN,
  is_festive BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  category_name VARCHAR,
  primary_image_url TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.category_id,
    p.name,
    p.slug,
    p.description,
    p.unit,
    p.weight_value,
    p.weight_unit,
    p.base_price,
    p.currency_code,
    p.min_group_buy_target,
    p.max_group_buy_target,
    p.max_units_per_user,
    p.minimum_fulfilment_quantity,
    p.is_active,
    p.is_festive,
    p.metadata,
    p.created_at,
    p.updated_at,
    pc.name AS category_name,
    (
      SELECT pi.image_url
      FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = TRUE
      LIMIT 1
    ) AS primary_image_url,
    COUNT(*) OVER() AS total_count
  FROM products p
  JOIN product_categories pc ON pc.id = p.category_id
  WHERE
    p.is_active = TRUE
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_is_festive IS NULL OR p.is_festive = p_is_festive)
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%' OR p.description ILIKE '%' || p_search || '%')
    AND (
      p_service_area_id IS NULL
      OR is_product_available_in_area(p.id, p_service_area_id)
    )
  ORDER BY pc.sort_order, p.name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION find_nearest_service_area TO authenticated, anon;
GRANT EXECUTE ON FUNCTION find_nearby_collection_points TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_product_available_in_area TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_products_for_area TO authenticated, anon;
-- ============================================================================
-- STAPLE LIMITED â€” Migration 015: Champion Applications & Management
-- Supports Champion application pipeline, KYC/neighborhood capture,
-- status lifecycle tracking, and admin moderation (Â§6â€“Â§9, Addendum A3)
-- ============================================================================

-- Champion Application Status Enum
DO $$ BEGIN
  CREATE TYPE champion_application_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Champion Applications Table
CREATE TABLE IF NOT EXISTS champion_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  state VARCHAR(50) NOT NULL,
  lga VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(255) NOT NULL,
  service_area_id UUID REFERENCES service_areas(id) ON DELETE SET NULL,
  estimated_network_size INTEGER NOT NULL DEFAULT 10,
  motivation TEXT NOT NULL,
  experience TEXT,
  status champion_application_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_network_size_pos CHECK (estimated_network_size > 0)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_champion_apps_user ON champion_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_champion_apps_status ON champion_applications(status);
CREATE INDEX IF NOT EXISTS idx_champion_apps_created ON champion_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_champion_apps_state_lga ON champion_applications(state, lga);

-- Enable Row Level Security
ALTER TABLE champion_applications ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own applications
CREATE POLICY rls_champ_app_select_own ON champion_applications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS: Users can submit an application for themselves
CREATE POLICY rls_champ_app_insert_own ON champion_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS: Admins have full access to view all applications
CREATE POLICY rls_champ_app_admin_all ON champion_applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Function: Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION set_champion_app_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_champ_app_updated_at ON champion_applications;
CREATE TRIGGER trg_champ_app_updated_at
  BEFORE UPDATE ON champion_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_champion_app_updated_at();
-- ============================================================================
-- STAPLE LIMITED â€” Migration 016: Fulfilment Staging & Collection Hub Operations
-- Implements nearest collection hub auto-assignment (Addendum B4),
-- 6-digit secure pickup code generation (Â§29, Â§63), and admin RLS policies
-- ============================================================================

-- Ensure 1:1 relationship between orders and fulfilment records
CREATE UNIQUE INDEX IF NOT EXISTS idx_fulfilments_unique_order ON fulfilments(order_id);

-- Additional index for quick code redemption at hub counter
CREATE INDEX IF NOT EXISTS idx_fulfilments_hub_status ON fulfilments(collection_point_id, status);

-- Admin & Staff RLS Policy for Fulfilments Management
DROP POLICY IF EXISTS fulfilments_admin_all ON fulfilments;
CREATE POLICY fulfilments_admin_all ON fulfilments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Function: Resolve nearest active collection point for a participant (Addendum B4)
CREATE OR REPLACE FUNCTION get_nearest_collection_point_for_user(
  p_user_id UUID,
  p_service_area_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_user_geom GEOMETRY(POINT, 4326);
  v_nearest_point_id UUID;
BEGIN
  -- 1. Get user's saved location point if available
  SELECT detected_point INTO v_user_geom
  FROM user_locations
  WHERE user_id = p_user_id
  ORDER BY is_default DESC, updated_at DESC
  LIMIT 1;

  -- 2. If user geometry exists, find nearest collection point in service area
  IF v_user_geom IS NOT NULL THEN
    SELECT id INTO v_nearest_point_id
    FROM collection_points
    WHERE service_area_id = p_service_area_id
      AND is_active = TRUE
    ORDER BY location_point <-> v_user_geom
    LIMIT 1;
  END IF;

  -- 3. Fallback: return first active collection point in the service area
  IF v_nearest_point_id IS NULL THEN
    SELECT id INTO v_nearest_point_id
    FROM collection_points
    WHERE service_area_id = p_service_area_id
      AND is_active = TRUE
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  RETURN v_nearest_point_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Generate a unique, secure 6-character pickup verification code (e.g. STP-782-910)
CREATE OR REPLACE FUNCTION generate_staple_pickup_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- Excludes confusing 0, 1, I, O
  code TEXT := 'STP-';
  i INTEGER;
BEGIN
  FOR i IN 1..3 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  code := code || '-';
  FOR i IN 1..3 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Trigger: Automatically generate pickup code on fulfilment creation if null
CREATE OR REPLACE FUNCTION trg_set_fulfilment_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.collection_code IS NULL THEN
    NEW.collection_code := generate_staple_pickup_code();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fulfilments_before_insert ON fulfilments;
CREATE TRIGGER trg_fulfilments_before_insert
  BEFORE INSERT ON fulfilments
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_fulfilment_code();
-- ============================================================================
-- STAPLE LIMITED â€” Migration 017: Festive & Seasonal Planning Operations (Phase 7)
-- RLS policies, automated payment status trigger, and overdue grace period engine
-- ============================================================================

-- Enable RLS on festive tables
ALTER TABLE festive_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE festive_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE festive_instalments ENABLE ROW LEVEL SECURITY;

-- 1. Policies for festive_seasons
DROP POLICY IF EXISTS festive_seasons_select ON festive_seasons;
CREATE POLICY festive_seasons_select ON festive_seasons
  FOR SELECT USING (
    is_active = TRUE OR is_admin()
  );

DROP POLICY IF EXISTS festive_seasons_admin_all ON festive_seasons;
CREATE POLICY festive_seasons_admin_all ON festive_seasons
  FOR ALL USING (
    is_admin()
  );

-- 2. Policies for festive_plans
DROP POLICY IF EXISTS festive_plans_select ON festive_plans;
CREATE POLICY festive_plans_select ON festive_plans
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

DROP POLICY IF EXISTS festive_plans_insert ON festive_plans;
CREATE POLICY festive_plans_insert ON festive_plans
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND no_refund_acknowledged = TRUE
  );

DROP POLICY IF EXISTS festive_plans_update ON festive_plans;
CREATE POLICY festive_plans_update ON festive_plans
  FOR UPDATE USING (
    user_id = auth.uid() OR is_admin()
  );

-- 3. Policies for festive_instalments
DROP POLICY IF EXISTS festive_instalments_select ON festive_instalments;
CREATE POLICY festive_instalments_select ON festive_instalments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM festive_plans p
      WHERE p.id = festive_instalments.plan_id
        AND (p.user_id = auth.uid() OR is_admin())
    )
  );

DROP POLICY IF EXISTS festive_instalments_admin_all ON festive_instalments;
CREATE POLICY festive_instalments_admin_all ON festive_instalments
  FOR ALL USING (
    is_admin()
  );

-- 4. Trigger to automatically update festive_plans on instalment status change
CREATE OR REPLACE FUNCTION update_festive_plan_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(15, 2);
  v_plan_total DECIMAL(15, 2);
BEGIN
  -- Re-aggregate total paid amount for this plan
  SELECT COALESCE(SUM(amount), 0.00)
  INTO v_total_paid
  FROM festive_instalments
  WHERE plan_id = NEW.plan_id
    AND status = 'paid';

  -- Retrieve total amount
  SELECT total_amount
  INTO v_plan_total
  FROM festive_plans
  WHERE id = NEW.plan_id;

  -- Update parent plan
  UPDATE festive_plans
  SET
    paid_amount = v_total_paid,
    remaining_amount = GREATEST(0.00, v_plan_total - v_total_paid),
    is_fully_paid = (v_total_paid >= v_plan_total),
    updated_at = now()
  WHERE id = NEW.plan_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_festive_instalment_payment ON festive_instalments;
CREATE TRIGGER trg_festive_instalment_payment
AFTER INSERT OR UPDATE OF status, amount ON festive_instalments
FOR EACH ROW
EXECUTE FUNCTION update_festive_plan_payment_status();

-- 5. Stored procedure to mark overdue instalments and detect default (Addendum B5)
CREATE OR REPLACE FUNCTION check_overdue_festive_instalments()
RETURNS TABLE (
  overdue_count INTEGER,
  plans_in_grace INTEGER,
  plans_in_default INTEGER
) AS $$
DECLARE
  v_overdue_count INTEGER;
  v_grace_count INTEGER;
  v_default_count INTEGER;
BEGIN
  -- Mark pending instalments past their due date as 'overdue'
  WITH updated AS (
    UPDATE festive_instalments
    SET status = 'overdue',
        updated_at = now()
    WHERE status = 'pending'
      AND due_date < CURRENT_DATE
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_overdue_count FROM updated;

  -- Count plans with overdue instalments within 7-day grace period
  SELECT COUNT(DISTINCT plan_id)::INTEGER
  INTO v_grace_count
  FROM festive_instalments
  WHERE status = 'overdue'
    AND due_date >= (CURRENT_DATE - INTERVAL '7 days');

  -- Count plans with overdue instalments past 7-day grace period (eligible for forfeiture cancellation)
  SELECT COUNT(DISTINCT plan_id)::INTEGER
  INTO v_default_count
  FROM festive_instalments
  WHERE status = 'overdue'
    AND due_date < (CURRENT_DATE - INTERVAL '7 days');

  RETURN QUERY SELECT v_overdue_count, v_grace_count, v_default_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Seed active festive seasons for initial launch (2026)
INSERT INTO festive_seasons (
  category, name, year, event_date, delivery_window_start, delivery_window_end, planning_start_date, planning_end_date, is_active, metadata
)
VALUES
  (
    'christmas',
    'Christmas & End-of-Year 2026 Celebration',
    2026,
    '2026-12-25',
    '2026-12-18',
    '2026-12-24',
    '2026-09-01',
    '2026-12-10',
    TRUE,
    '{"theme": "Yuletide Feast", "popular_baskets": ["Family Hamper", "Rice & Oil Mega Pack"]}'::jsonb
  ),
  (
    'ileya',
    'Eid-el-Kabir (Ileya) 2026 Feast',
    2026,
    '2026-05-27',
    '2026-05-20',
    '2026-05-26',
    '2026-02-01',
    '2026-05-15',
    TRUE,
    '{"theme": "Ileya Ram & Rice Celebration", "popular_baskets": ["Ileya Feast Basket", "Oils & Seasoning Bulk"]}'::jsonb
  ),
  (
    'owambe_party',
    'Owambe & Milestone Family Celebrations 2026',
    2026,
    NULL,
    NULL,
    NULL,
    '2026-01-01',
    '2026-12-31',
    TRUE,
    '{"theme": "Weddings, Burials & Anniversaries", "planning_window_days": {"min": 42, "max": 100}}'::jsonb
  )
ON CONFLICT (category, year) DO UPDATE
SET
  is_active = TRUE,
  updated_at = now();
-- ============================================================================
-- STAPLE LIMITED â€” Migration 018: Communications, Live Chat & Support (Phase 8)
-- Threaded support messages, chat automation triggers, and comprehensive RLS
-- ============================================================================

-- 1. Support Ticket Messages (Threaded customer/agent replies)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user', 'champion', 'admin', 'system'
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender ON ticket_messages(sender_id);

-- Enable RLS on communications tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Policies for support_tickets
DROP POLICY IF EXISTS support_tickets_select ON support_tickets;
CREATE POLICY support_tickets_select ON support_tickets
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

DROP POLICY IF EXISTS support_tickets_insert ON support_tickets;
CREATE POLICY support_tickets_insert ON support_tickets
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS support_tickets_update ON support_tickets;
CREATE POLICY support_tickets_update ON support_tickets
  FOR UPDATE USING (
    is_admin() OR user_id = auth.uid()
  );

-- 3. Policies for ticket_messages
DROP POLICY IF EXISTS ticket_messages_select ON ticket_messages;
CREATE POLICY ticket_messages_select ON ticket_messages
  FOR SELECT USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_messages.ticket_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS ticket_messages_insert ON ticket_messages;
CREATE POLICY ticket_messages_insert ON ticket_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND (
      is_admin() OR EXISTS (
        SELECT 1 FROM support_tickets t
        WHERE t.id = ticket_messages.ticket_id
          AND t.user_id = auth.uid()
      )
    )
  );

-- 4. Policies for notifications
DROP POLICY IF EXISTS notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS notifications_admin_all ON notifications;
CREATE POLICY notifications_admin_all ON notifications
  FOR ALL USING (
    is_admin()
  );

-- 5. Trigger: Automatically create chat_room when a Group Buy is created or activated to 'live'
CREATE OR REPLACE FUNCTION auto_create_group_buy_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'live' AND (OLD.status IS NULL OR OLD.status != 'live') THEN
    INSERT INTO chat_rooms (name, group_buy_id, is_active)
    VALUES (
      'Group Buy Discussion â€” ' || NEW.slug,
      NEW.id,
      TRUE
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_create_group_buy_chat ON group_buys;
CREATE TRIGGER trg_auto_create_group_buy_chat
AFTER INSERT OR UPDATE OF status ON group_buys
FOR EACH ROW
EXECUTE FUNCTION auto_create_group_buy_chat_room();

-- 6. Trigger: Automatically add participant to chat_memberships on paid order & update profile participation flag
CREATE OR REPLACE FUNCTION auto_join_group_buy_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
BEGIN
  IF NEW.status = 'paid' AND NEW.group_buy_id IS NOT NULL THEN
    -- Mark profile as having participated in Group Buy (Spec Â§41 eligibility)
    UPDATE profiles
    SET has_participated_in_group_buy = TRUE
    WHERE id = NEW.user_id;

    -- Find chat room for this group buy
    SELECT id INTO v_room_id
    FROM chat_rooms
    WHERE group_buy_id = NEW.group_buy_id
    LIMIT 1;

    -- If room exists, add user to membership
    IF v_room_id IS NOT NULL THEN
      INSERT INTO chat_memberships (room_id, user_id, is_active)
      VALUES (v_room_id, NEW.user_id, TRUE)
      ON CONFLICT (room_id, user_id) DO UPDATE
      SET is_active = TRUE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_join_group_buy_chat ON orders;
CREATE TRIGGER trg_auto_join_group_buy_chat
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION auto_join_group_buy_chat();
-- ============================================================================
-- STAPLE LIMITED â€” Migration 019: System Hardening & Automated Maintenance (Phase 9)
-- Daily double-entry wallet reconciliation, automated group buy expiry, and delayed tier rebate release
-- ============================================================================

-- 1. Daily Double-Entry Wallet Ledger Reconciliation
CREATE OR REPLACE FUNCTION reconcile_wallet_ledger()
RETURNS TABLE (
  total_wallets INTEGER,
  balanced_wallets INTEGER,
  discrepant_wallets INTEGER,
  total_system_liability DECIMAL(15, 2),
  discrepant_wallet_ids UUID[]
) AS $$
DECLARE
  v_total INTEGER := 0;
  v_balanced INTEGER := 0;
  v_discrepant INTEGER := 0;
  v_liability DECIMAL(15, 2) := 0.00;
  v_bad_ids UUID[] := '{}';
  r RECORD;
BEGIN
  -- Sum total system liability
  SELECT COALESCE(SUM(balance), 0.00), COUNT(*)::INTEGER
  INTO v_liability, v_total
  FROM wallets
  WHERE is_active = TRUE;

  -- Iterate each wallet to verify double-entry math
  FOR r IN
    SELECT
      w.id AS wallet_id,
      w.balance AS current_balance,
      COALESCE(
        SUM(
          CASE
            WHEN tx.entry_side = 'credit' THEN tx.amount
            WHEN tx.entry_side = 'debit' THEN -tx.amount
            ELSE 0.00
          END
        ),
        0.00
      ) AS ledger_balance
    FROM wallets w
    LEFT JOIN wallet_transactions tx ON tx.wallet_id = w.id
    WHERE w.is_active = TRUE
    GROUP BY w.id, w.balance
  LOOP
    IF r.current_balance = r.ledger_balance THEN
      v_balanced := v_balanced + 1;
    ELSE
      v_discrepant := v_discrepant + 1;
      v_bad_ids := array_append(v_bad_ids, r.wallet_id);
    END IF;
  END LOOP;

  -- Log reconciliation audit record
  INSERT INTO audit_logs (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    new_state,
    metadata
  )
  VALUES (
    NULL,
    'admin',
    'wallet_reconciliation_audit',
    'system_reconciliation',
    gen_random_uuid(),
    jsonb_build_object(
      'total_wallets', v_total,
      'balanced_wallets', v_balanced,
      'discrepant_wallets', v_discrepant,
      'total_system_liability', v_liability
    ),
    jsonb_build_object(
      'discrepant_wallet_ids', v_bad_ids,
      'is_clean', (v_discrepant = 0)
    )
  );

  RETURN QUERY SELECT v_total, v_balanced, v_discrepant, v_liability, v_bad_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Automated Group Buy Expiry & MVFQ Auto-Resolution (Addendum A1 & A2)
CREATE OR REPLACE FUNCTION process_expired_group_buys()
RETURNS TABLE (
  processed_count INTEGER,
  fulfilled_count INTEGER,
  closed_count INTEGER,
  total_refunded_naira DECIMAL(15, 2)
) AS $$
DECLARE
  v_processed INTEGER := 0;
  v_fulfilled INTEGER := 0;
  v_closed INTEGER := 0;
  v_refunded DECIMAL(15, 2) := 0.00;
  gb RECORD;
  ord RECORD;
  v_wallet_id UUID;
  v_balance_before DECIMAL(15, 2);
  v_balance_after DECIMAL(15, 2);
  now_iso TIMESTAMPTZ := now();
BEGIN
  -- Select all expired group buys currently in 'live' status
  FOR gb IN
    SELECT id, slug, paid_quantity, min_fulfilment_quantity
    FROM group_buys
    WHERE status = 'live'
      AND expires_at < now_iso
  LOOP
    v_processed := v_processed + 1;

    -- Case A: MVFQ Met -> Proceed to delivery_fulfilment
    IF gb.paid_quantity >= gb.min_fulfilment_quantity THEN
      UPDATE group_buys
      SET status = 'delivery_fulfilment',
          updated_at = now_iso
      WHERE id = gb.id;

      v_fulfilled := v_fulfilled + 1;

      -- Log state change
      INSERT INTO audit_logs (action, entity_type, entity_id, new_state)
      VALUES (
        'group_buy_auto_transition_fulfilment',
        'group_buy',
        gb.id,
        jsonb_build_object('status', 'delivery_fulfilment', 'paid_quantity', gb.paid_quantity, 'mvfq', gb.min_fulfilment_quantity)
      );

    -- Case B: MVFQ NOT Met -> Close buy and trigger automatic 100% wallet refund (Addendum A2)
    ELSE
      UPDATE group_buys
      SET status = 'closed',
          updated_at = now_iso
      WHERE id = gb.id;

      v_closed := v_closed + 1;

      -- Iterate each paid order in this group buy to credit user's wallet
      FOR ord IN
        SELECT id, user_id, total_amount, order_number
        FROM orders
        WHERE group_buy_id = gb.id
          AND status IN ('paid', 'pending')
      LOOP
        -- Retrieve user wallet
        SELECT id, balance INTO v_wallet_id, v_balance_before
        FROM wallets
        WHERE user_id = ord.user_id;

        IF v_wallet_id IS NOT NULL THEN
          v_balance_after := v_balance_before + ord.total_amount;

          -- Credit wallet
          UPDATE wallets
          SET balance = v_balance_after,
              updated_at = now_iso
          WHERE id = v_wallet_id;

          -- Double-entry ledger record
          INSERT INTO wallet_transactions (
            wallet_id,
            user_id,
            transaction_type,
            entry_side,
            amount,
            balance_before,
            balance_after,
            currency_code,
            order_id,
            group_buy_id,
            description,
            idempotency_key,
            metadata
          )
          VALUES (
            v_wallet_id,
            ord.user_id,
            'credit_refund',
            'credit',
            ord.total_amount,
            v_balance_before,
            v_balance_after,
            'NGN',
            ord.id,
            gb.id,
            '100% Refund: Minimum Viable Quantity not reached for ' || gb.slug,
            'refund-mvfq-' || ord.id || '-' || extract(epoch from now_iso)::text,
            jsonb_build_object('refund_reason', 'mvfq_not_met', 'order_number', ord.order_number)
          );

          -- Update order status to refunded
          UPDATE orders
          SET status = 'refunded',
              refund_reason = 'mvfq_not_met',
              refunded_at = now_iso,
              updated_at = now_iso
          WHERE id = ord.id;

          -- Send in-app notification to user
          INSERT INTO notifications (
            user_id,
            type,
            channel,
            title,
            body,
            data
          )
          VALUES (
            ord.user_id,
            'wallet_credited',
            'in_app',
            'Full Refund Credited ðŸ‘›',
            'Group Buy did not reach minimum target. â‚¦' || to_char(ord.total_amount, 'FM999,999,999') || ' has been refunded to your staple wallet.',
            jsonb_build_object('order_id', ord.id, 'refund_reason', 'mvfq_not_met')
          );

          v_refunded := v_refunded + ord.total_amount;
        END IF;
      END LOOP;

      -- Log closure audit
      INSERT INTO audit_logs (action, entity_type, entity_id, new_state)
      VALUES (
        'group_buy_auto_closed_mvfq_failed',
        'group_buy',
        gb.id,
        jsonb_build_object('status', 'closed', 'paid_quantity', gb.paid_quantity, 'mvfq', gb.min_fulfilment_quantity)
      );
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_fulfilled, v_closed, v_refunded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delayed Pricing Tier Rebate Disbursement (48h Post-Fulfilment Hold - Addendum A4)
CREATE OR REPLACE FUNCTION disburse_delayed_tier_credits()
RETURNS TABLE (
  orders_credited INTEGER,
  total_disbursed_naira DECIMAL(15, 2)
) AS $$
DECLARE
  v_count INTEGER := 0;
  v_total DECIMAL(15, 2) := 0.00;
  ord RECORD;
  v_wallet_id UUID;
  v_balance_before DECIMAL(15, 2);
  v_balance_after DECIMAL(15, 2);
  now_iso TIMESTAMPTZ := now();
BEGIN
  -- Select orders with price adjustment where 48 hours have elapsed post fulfilment
  FOR ord IN
    SELECT
      o.id AS order_id,
      o.user_id,
      o.price_adjustment_amount,
      o.order_number,
      gb.slug AS group_buy_slug
    FROM orders o
    JOIN group_buys gb ON gb.id = o.group_buy_id
    WHERE gb.status IN ('delivery_fulfilment', 'completed')
      AND o.price_adjustment_amount > 0
      AND (o.metadata->>'tier_credit_disbursed') IS NULL
      AND gb.updated_at <= (now_iso - INTERVAL '48 hours')
  LOOP
    -- Retrieve wallet
    SELECT id, balance INTO v_wallet_id, v_balance_before
    FROM wallets
    WHERE user_id = ord.user_id;

    IF v_wallet_id IS NOT NULL THEN
      v_balance_after := v_balance_before + ord.price_adjustment_amount;

      -- Credit wallet
      UPDATE wallets
      SET balance = v_balance_after,
          updated_at = now_iso
      WHERE id = v_wallet_id;

      -- Double-entry record
      INSERT INTO wallet_transactions (
        wallet_id,
        user_id,
        transaction_type,
        entry_side,
        amount,
        balance_before,
        balance_after,
        currency_code,
        order_id,
        description,
        idempotency_key,
        metadata
      )
      VALUES (
        v_wallet_id,
        ord.user_id,
        'credit_price_adjustment',
        'credit',
        ord.price_adjustment_amount,
        v_balance_before,
        v_balance_after,
        'NGN',
        ord.order_id,
        'Retroactive Tier Discount Rebate for ' || ord.group_buy_slug,
        'rebate-' || ord.order_id || '-' || extract(epoch from now_iso)::text,
        jsonb_build_object('order_number', ord.order_number, 'hold_period', '48_hours_cleared')
      );

      -- Mark order metadata
      UPDATE orders
      SET metadata = metadata || '{"tier_credit_disbursed": true}'::jsonb,
          updated_at = now_iso
      WHERE id = ord.order_id;

      -- Send notification
      INSERT INTO notifications (
        user_id,
        type,
        channel,
        title,
        body,
        data
      )
      VALUES (
        ord.user_id,
        'pricing_tier_reached',
        'in_app',
        'Price Drop Savings Disbursed! ðŸ’°',
        'Your â‚¦' || to_char(ord.price_adjustment_amount, 'FM999,999,999') || ' retroactive discount has been added to your wallet.',
        jsonb_build_object('order_id', ord.order_id)
      );

      v_count := v_count + 1;
      v_total := v_total + ord.price_adjustment_amount;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_count, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Composite Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gb_live_expires ON group_buys(expires_at) WHERE status = 'live';
CREATE INDEX IF NOT EXISTS idx_orders_gb_status ON orders(group_buy_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_side_amount ON wallet_transactions(wallet_id, entry_side, amount);
