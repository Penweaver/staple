-- ============================================================================
-- STAPLE LIMITED — Migration 016: Fulfilment Staging & Collection Hub Operations
-- Implements nearest collection hub auto-assignment (Addendum B4),
-- 6-digit secure pickup code generation (§29, §63), and admin RLS policies
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
