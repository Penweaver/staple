-- ============================================================================
-- STAPLE LIMITED — Migration 017: Festive & Seasonal Planning Operations (Phase 7)
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
