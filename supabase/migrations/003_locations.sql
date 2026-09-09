-- ============================================================================
-- STAPLE LIMITED — Migration 003: Location Hierarchy & PostGIS
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
