/**
 * STAPLE LIMITED — Pricing Tier Engine
 * Dynamic volume discounts, tier activation, and retroactive wallet rebate math (Spec §20, §24)
 */

export interface PricingTierData {
  id?: string;
  minPercentage: number;
  maxPercentage: number | null;
  discountPercentage: number;
  discountedPrice: number;
  isActive?: boolean;
}

/**
 * Standard milestone tiers for regular Group Buys
 */
export const DEFAULT_TIER_SCHEDULE = [
  { minPercentage: 0, maxPercentage: 49.99, discountPercentage: 0 },
  { minPercentage: 50, maxPercentage: 74.99, discountPercentage: 2.5 },
  { minPercentage: 75, maxPercentage: 99.99, discountPercentage: 5.0 },
  { minPercentage: 100, maxPercentage: null, discountPercentage: 8.0 },
];

/**
 * Generate standard database rows for a Group Buy's pricing tiers
 */
export function generatePricingTierRows(
  groupBuyId: string,
  basePrice: number,
  tiers = DEFAULT_TIER_SCHEDULE,
) {
  return tiers.map((tier, index) => {
    const discountAmount = Math.round((basePrice * tier.discountPercentage) / 100);
    const discountedPrice = basePrice - discountAmount;

    return {
      group_buy_id: groupBuyId,
      min_percentage: tier.minPercentage,
      max_percentage: tier.maxPercentage,
      discount_percentage: tier.discountPercentage,
      discounted_price: discountedPrice,
      is_active: tier.minPercentage === 0,
      sort_order: index,
    };
  });
}

/**
 * Calculate the currently active pricing tier and current unit price
 */
export function resolveActiveTier(
  basePrice: number,
  paidQuantity: number,
  targetQuantity: number,
  tiers: PricingTierData[],
): {
  currentPrice: number;
  activeTier: PricingTierData | null;
  nextTier: PricingTierData | null;
  progressPercentage: number;
  unitsToNextTier: number;
} {
  const progressPercentage = targetQuantity > 0 ? (paidQuantity / targetQuantity) * 100 : 0;

  // Filter tiers reached by current progress (inclusive lower bound)
  const qualifyingTiers = tiers
    .filter((t) => progressPercentage >= t.minPercentage)
    .sort((a, b) => b.minPercentage - a.minPercentage);

  const activeTier = qualifyingTiers[0] || null;

  // Find the next upcoming tier
  const upcomingTiers = tiers
    .filter((t) => progressPercentage < t.minPercentage)
    .sort((a, b) => a.minPercentage - b.minPercentage);

  const nextTier = upcomingTiers[0] || null;

  let currentPrice = basePrice;
  if (activeTier) {
    const discount = Math.round((basePrice * activeTier.discountPercentage) / 100);
    currentPrice = basePrice - discount;
  }

  let unitsToNextTier = 0;
  if (nextTier) {
    const targetUnitsForNext = Math.ceil((nextTier.minPercentage / 100) * targetQuantity);
    unitsToNextTier = Math.max(0, targetUnitsForNext - paidQuantity);
  }

  return {
    currentPrice,
    activeTier,
    nextTier,
    progressPercentage: Math.round(progressPercentage * 10) / 10,
    unitsToNextTier,
  };
}

/**
 * Calculate retroactive price adjustment rebates for all participants
 * When a higher tier is reached, earlier buyers paid more than the final effective price.
 * The difference is credited back to their wallet (§24).
 */
export function calculateParticipantRebates(
  finalUnitPrice: number,
  orders: Array<{
    id: string;
    userId: string;
    quantity: number;
    unitPriceAtPurchase: number;
  }>,
): Array<{
  orderId: string;
  userId: string;
  rebateAmount: number;
  quantity: number;
}> {
  return orders
    .map((order) => {
      const priceDifference = Math.max(0, order.unitPriceAtPurchase - finalUnitPrice);
      const rebateAmount = priceDifference * order.quantity;

      return {
        orderId: order.id,
        userId: order.userId,
        rebateAmount,
        quantity: order.quantity,
      };
    })
    .filter((r) => r.rebateAmount > 0);
}
