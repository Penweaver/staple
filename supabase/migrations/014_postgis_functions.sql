-- ============================================================================
-- STAPLE LIMITED — Migration 014: PostGIS Proximity Functions (Phase 2)
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
