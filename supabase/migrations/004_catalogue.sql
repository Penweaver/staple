-- ============================================================================
-- STAPLE LIMITED — Migration 004: Catalogue (Products & Baskets)
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
