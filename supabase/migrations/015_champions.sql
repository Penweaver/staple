-- ============================================================================
-- STAPLE LIMITED — Migration 015: Champion Applications & Management
-- Supports Champion application pipeline, KYC/neighborhood capture,
-- status lifecycle tracking, and admin moderation (§6–§9, Addendum A3)
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
