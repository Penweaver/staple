-- ============================================================================
-- STAPLE LIMITED — Seed Data (Nigeria First Market §5.1)
-- Location hierarchy, catalogue items with MVFQ, baskets, and festive seasons
-- ============================================================================

-- 1. Country: Nigeria
INSERT INTO countries (id, name, iso_code, currency_code, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Nigeria', 'NG', 'NGN', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 2. States / Regions
INSERT INTO states_regions (id, country_id, name, code, is_active) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Lagos', 'LA', TRUE),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Federal Capital Territory', 'FC', TRUE),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Rivers', 'RI', TRUE),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Ogun', 'OG', TRUE),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'Oyo', 'OY', TRUE)
ON CONFLICT (country_id, name) DO NOTHING;

-- 3. LGAs / Districts
INSERT INTO districts_lgas (id, state_region_id, name, is_active) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'Eti-Osa', TRUE),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', 'Ikeja', TRUE),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000001', 'Surulere', TRUE),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000002', 'Abuja Municipal', TRUE)
ON CONFLICT (state_region_id, name) DO NOTHING;

-- 4. Cities / Localities
INSERT INTO cities_localities (id, district_lga_id, name, is_active) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000001', 'Lekki', TRUE),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000001', 'Victoria Island', TRUE),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000002', 'Ikeja', TRUE),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0002-000000000004', 'Maitama', TRUE)
ON CONFLICT (district_lga_id, name) DO NOTHING;

-- 5. Service Areas (Coordinates: Lagos / Lekki / VI)
INSERT INTO service_areas (id, city_locality_id, name, description, center_point, radius_km, is_active) VALUES
  (
    '00000000-0000-0000-0004-000000000001',
    '00000000-0000-0000-0003-000000000001',
    'Lekki Phase 1',
    'Admiralty Way, Freedom Way and surrounding Lekki Phase 1 residential clusters',
    ST_SetSRID(ST_MakePoint(3.4735, 6.4474), 4326),
    8.00,
    TRUE
  ),
  (
    '00000000-0000-0000-0004-000000000002',
    '00000000-0000-0000-0003-000000000002',
    'Victoria Island Central',
    'Adeola Odeku, Kofo Abayomi, Akin Adesola, and Ahmadu Bello Way area',
    ST_SetSRID(ST_MakePoint(3.4246, 6.4281), 4326),
    5.00,
    TRUE
  ),
  (
    '00000000-0000-0000-0004-000000000003',
    '00000000-0000-0000-0003-000000000003',
    'Ikeja GRA & Central',
    'Ikeja GRA, Allen Avenue, Opebi and environs',
    ST_SetSRID(ST_MakePoint(3.3515, 6.5922), 4326),
    6.50,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- 6. Collection Points
INSERT INTO collection_points (id, service_area_id, name, address, location_point, contact_phone, contact_name, operating_hours, is_active) VALUES
  (
    '00000000-0000-0000-0005-000000000001',
    '00000000-0000-0000-0004-000000000001',
    'staple Hub — Lekki Admiralty',
    '42 Admiralty Way, Lekki Phase 1, Lagos',
    ST_SetSRID(ST_MakePoint(3.4682, 6.4468), 4326),
    '+2348012345678',
    'Tunde Babatunde',
    '{"mon": {"open": "08:00", "close": "18:00"}, "sat": {"open": "09:00", "close": "16:00"}}'::jsonb,
    TRUE
  ),
  (
    '00000000-0000-0000-0005-000000000002',
    '00000000-0000-0000-0004-000000000002',
    'staple Hub — VI Bishop Oluwole',
    '15 Bishop Oluwole Street, Victoria Island, Lagos',
    ST_SetSRID(ST_MakePoint(3.4210, 6.4255), 4326),
    '+2348023456789',
    'Amina Mohammed',
    '{"mon": {"open": "08:00", "close": "18:00"}, "sat": {"open": "09:00", "close": "16:00"}}'::jsonb,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- 7. Product Categories
INSERT INTO product_categories (id, name, slug, description, sort_order, is_active) VALUES
  ('00000000-0000-0000-0006-000000000001', 'Grains & Flours', 'grains-flours', 'Rice, beans, garri, semolina and grain staples', 1, TRUE),
  ('00000000-0000-0000-0006-000000000002', 'Oils & Condiments', 'oils-condiments', 'Vegetable oil, palm oil, seasoning and cooking essentials', 2, TRUE),
  ('00000000-0000-0000-0006-000000000003', 'Curated Baskets', 'curated-baskets', 'Pre-configured foodstuff baskets for students, singles, and families', 3, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 8. Products (with MVFQ: Minimum Viable Fulfilment Quantity per Addendum A1)
INSERT INTO products (
  id, category_id, name, slug, description, unit, weight_value, weight_unit,
  base_price, currency_code, min_group_buy_target, max_group_buy_target,
  max_units_per_user, minimum_fulfilment_quantity, is_active
) VALUES
  (
    '00000000-0000-0000-0007-000000000001',
    '00000000-0000-0000-0006-000000000001',
    'Mama Gold Premium Parboiled Rice (50kg)',
    'mama-gold-rice-50kg',
    'Stone-free, high-grade long grain parboiled Nigerian rice in 50kg bag.',
    'bag', 50.00, 'kg',
    85000.00, 'NGN', 20, 200, 10,
    20, -- MVFQ: Supplier bulk discount requires 20 bags MOQ
    TRUE
  ),
  (
    '00000000-0000-0000-0007-000000000002',
    '00000000-0000-0000-0006-000000000001',
    'Oloyin Honey Beans (50kg)',
    'oloyin-honey-beans-50kg',
    'Clean, sweet honey beans bag, freshly bagged from farmgate.',
    'bag', 50.00, 'kg',
    75000.00, 'NGN', 15, 150, 10,
    15, -- MVFQ
    TRUE
  ),
  (
    '00000000-0000-0000-0007-000000000003',
    '00000000-0000-0000-0006-000000000002',
    'Kings Pure Vegetable Cooking Oil (25 Litres)',
    'kings-vegetable-oil-25l',
    'Cholesterol-free, fortified vegetable oil keg.',
    'keg', 25.00, 'litres',
    48000.00, 'NGN', 20, 200, 10,
    15, -- MVFQ
    TRUE
  ),
  (
    '00000000-0000-0000-0007-000000000004',
    '00000000-0000-0000-0006-000000000001',
    'White Garri Ijebu (50kg Bag)',
    'white-garri-ijebu-50kg',
    'Crisp, well-fermented, sand-free Ijebu garri bag.',
    'bag', 50.00, 'kg',
    32000.00, 'NGN', 15, 100, 10,
    10, -- MVFQ
    TRUE
  )
ON CONFLICT (slug) DO NOTHING;

-- 9. Baskets
INSERT INTO baskets (
  id, name, slug, description, total_price, currency_code,
  max_units_per_user, minimum_fulfilment_quantity, is_active, is_festive
) VALUES
  (
    '00000000-0000-0000-0008-000000000001',
    'Student Essentials Basket',
    'student-essentials-basket',
    'Includes 10kg Parboiled Rice, 5kg Honey Beans, 5L Kings Oil, and 10kg Garri.',
    38000.00, 'NGN', 5,
    10, -- MVFQ
    TRUE, FALSE
  ),
  (
    '00000000-0000-0000-0008-000000000002',
    'Family Monthly Basket',
    'family-monthly-basket',
    'Includes 50kg Rice, 25kg Beans, 25L Oil, 25kg Garri, and 2 Cartons of Seasoning.',
    165000.00, 'NGN', 5,
    8, -- MVFQ
    TRUE, FALSE
  )
ON CONFLICT (slug) DO NOTHING;

-- 10. Festive Seasons
INSERT INTO festive_seasons (
  id, category, name, year, event_date,
  delivery_window_start, delivery_window_end,
  planning_start_date, planning_end_date, is_active
) VALUES
  (
    '00000000-0000-0000-0009-000000000001',
    'christmas',
    'Christmas 2026 Celebration Plan',
    2026,
    '2026-12-25',
    '2026-12-20',
    '2026-12-24',
    '2026-09-01',
    '2026-12-15',
    TRUE
  ),
  (
    '00000000-0000-0000-0009-000000000002',
    'ileya',
    'Eid-el-Kabir (Ileya) 2026 Plan',
    2026,
    '2026-06-16',
    '2026-06-13',
    '2026-06-15',
    '2026-03-01',
    '2026-06-05',
    TRUE
  ),
  (
    '00000000-0000-0000-0009-000000000003',
    'owambe_party',
    'Owambe / Event Bulk Planning (Rolling)',
    2026,
    NULL,
    NULL,
    NULL,
    '2026-01-01',
    '2026-12-31',
    TRUE
  )
ON CONFLICT (category, year) DO NOTHING;
