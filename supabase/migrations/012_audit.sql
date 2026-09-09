-- ============================================================================
-- STAPLE LIMITED — Migration 012: Audit Logs, Idempotency & System Config
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
  ('max_champion_active_group_buys', '2', 'Maximum active Group Buys per Champion (§8)'),
  ('max_units_per_user_per_group_buy', '10', 'Maximum units any user can purchase per Group Buy (§11)'),
  ('default_group_buy_lifespan_days', '14', 'Default Group Buy lifespan in calendar days from LIVE (§16)'),
  ('group_buy_discovery_limit', '10', 'Default number of Group Buys in nearby discovery feed (§5.3)'),
  ('owambe_min_planning_days', '42', 'Minimum days before delivery for Owambe plans (§39)'),
  ('owambe_max_planning_days', '100', 'Maximum days before delivery for Owambe plans (§39)'),
  ('champion_milestone_reward_amount', '2000', 'Flat NGN reward for Champion on TARGET_REACHED (Addendum A3)'),
  ('instalment_grace_period_days', '7', 'Grace period days after instalment due date before Admin cancellation (Addendum B5)'),
  ('tier_credit_delay_hours', '48', 'Hours to delay pricing-tier wallet credit disbursement after DELIVERY_FULFILMENT (Addendum A4)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();
