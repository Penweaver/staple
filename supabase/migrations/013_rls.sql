-- ============================================================================
-- STAPLE LIMITED — Migration 013: Row Level Security (RLS) Policies
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

-- --- User Locations Policies (GPS Privacy §5.2) ---
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
-- Only LIVE group buys visible to non-admin/non-creator users (§15)
DROP POLICY IF EXISTS group_buys_select ON group_buys;
CREATE POLICY group_buys_select ON group_buys
  FOR SELECT USING (
    status = 'live'
    OR status IN ('target_reached', 'lifespan_expired', 'delivery_fulfilment', 'completed')
    OR created_by = auth.uid()
    OR is_admin()
  );

-- Only Admin or approved Champion can create Group Buys (§6)
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

-- Champions cannot delete Group Buys (§46)
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

-- --- Live Chat Policies (§41, §42) ---
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
