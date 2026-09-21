-- ============================================================================
-- STAPLE LIMITED — Migration 002: Identity & Profiles
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
