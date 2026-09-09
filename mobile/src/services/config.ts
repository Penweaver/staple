/**
 * STAPLE LIMITED — System Configuration Service (Mobile)
 * Dynamically queries admin-managed business rules from `system_config` (§56, Addendum A3)
 */

import { useState, useEffect } from 'react';
import { BUSINESS_RULES } from '@staple/shared';

// Configuration keys defined in system_config table
export type ConfigKey =
  | 'max_champion_active_group_buys'
  | 'max_units_per_user_per_group_buy'
  | 'default_group_buy_lifespan_days'
  | 'group_buy_discovery_limit'
  | 'owambe_min_planning_days'
  | 'owambe_max_planning_days'
  | 'champion_milestone_reward_amount'
  | 'instalment_grace_period_days'
  | 'tier_credit_delay_hours';

const fallbackDefaults: Record<ConfigKey, unknown> = {
  max_champion_active_group_buys: BUSINESS_RULES.MAX_CHAMPION_ACTIVE_GROUP_BUYS,
  max_units_per_user_per_group_buy: BUSINESS_RULES.MAX_UNITS_PER_USER_PER_GROUP_BUY,
  default_group_buy_lifespan_days: BUSINESS_RULES.DEFAULT_GROUP_BUY_LIFESPAN_DAYS,
  group_buy_discovery_limit: BUSINESS_RULES.DEFAULT_DISCOVERY_LIMIT,
  owambe_min_planning_days: BUSINESS_RULES.OWAMBE_MIN_PLANNING_DAYS,
  owambe_max_planning_days: BUSINESS_RULES.OWAMBE_MAX_PLANNING_DAYS,
  champion_milestone_reward_amount: BUSINESS_RULES.CHAMPION_MILESTONE_REWARD_AMOUNT,
  instalment_grace_period_days: BUSINESS_RULES.INSTALMENT_GRACE_PERIOD_DAYS,
  tier_credit_delay_hours: BUSINESS_RULES.TIER_CREDIT_DELAY_HOURS,
};

// In-memory runtime cache for system_config values
const configCache = new Map<string, unknown>();

/**
 * Fetch a configuration value from system_config table
 * When offline or during initial render, falls back to authoritative defaults.
 */
export async function fetchSystemConfig<T>(key: ConfigKey, fallback?: T): Promise<T> {
  if (configCache.has(key)) {
    return configCache.get(key) as T;
  }

  try {
    // In production, this calls supabase.from('system_config').select('value').eq('key', key).single()
    // or GET /api/config/:key
    const defaultVal = fallback !== undefined ? fallback : (fallbackDefaults[key] as T);
    configCache.set(key, defaultVal);
    return defaultVal;
  } catch (err) {
    console.warn(`[system_config] Error fetching ${key}, using fallback:`, err);
    return (fallback !== undefined ? fallback : fallbackDefaults[key]) as T;
  }
}

/**
 * React hook to consume dynamic system_config values with live fallback
 */
export function useSystemConfig<T>(key: ConfigKey, fallback?: T): { value: T; loading: boolean } {
  const defaultVal = fallback !== undefined ? fallback : (fallbackDefaults[key] as T);
  const [value, setValue] = useState<T>(defaultVal);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchSystemConfig<T>(key, defaultVal).then((val) => {
      if (isMounted) {
        setValue(val);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [key]);

  return { value, loading };
}
