/**
 * STAPLE LIMITED — Authoritative Business Rule Defaults (Spec §74 + Founder Addendum v1)
 */

export const BUSINESS_RULES = {
  // Max units any user (including Champion) can purchase per Group Buy
  MAX_UNITS_PER_USER_PER_GROUP_BUY: 10,

  // Minimum units for initial Champion activation purchase (Spec §9 Step 6)
  MIN_CHAMPION_ACTIVATION_UNITS: 1,

  // Maximum active Group Buys a Champion may organize concurrently (Spec §8)
  MAX_CHAMPION_ACTIVE_GROUP_BUYS: 2,

  // Default lifespan in calendar days from LIVE activation (Spec §16)
  DEFAULT_GROUP_BUY_LIFESPAN_DAYS: 14,

  // Default discovery feed recommendation limit (Spec §5.3)
  DEFAULT_DISCOVERY_LIMIT: 10,

  // Default search radius in meters around user's location
  DEFAULT_DISCOVERY_RADIUS_METERS: 15000, // 15km

  // Owambe/Party delivery planning window in days (Spec §39)
  OWAMBE_MIN_PLANNING_DAYS: 42,
  OWAMBE_MAX_PLANNING_DAYS: 100,

  // Champion Milestone Reward in NGN on TARGET_REACHED (Addendum A3)
  CHAMPION_MILESTONE_REWARD_AMOUNT: 2000,

  // Festive instalment grace period in days before plan cancellation (Addendum B5)
  INSTALMENT_GRACE_PERIOD_DAYS: 7,

  // Hours to hold pricing tier wallet credit disbursement post-DELIVERY_FULFILMENT (Addendum A4)
  TIER_CREDIT_DELAY_HOURS: 48,

  // Standard operational currency
  DEFAULT_CURRENCY: 'NGN',

  // Default Minimum Viable Fulfilment Quantity fallback
  DEFAULT_MIN_FULFILMENT_QUANTITY: 1,
} as const;
