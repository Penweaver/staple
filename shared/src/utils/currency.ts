/**
 * STAPLE LIMITED — Currency Formatting Utilities
 * Primary currency: Nigerian Naira (NGN / ₦)
 * Prices stored in main units (Naira). Converted to kobo (×100) at Paystack gateway boundary only.
 */

/**
 * Format a number as Nigerian Naira with the ₦ symbol.
 * @param amount - Amount in Naira (main units, e.g. 85000.00)
 * @param showKobo - Whether to show kobo (decimal places). Default true for amounts with kobo, false otherwise.
 * @returns Formatted string like "₦85,000.00" or "₦85,000"
 */
export function formatNaira(amount: number, showKobo: boolean = true): string {
  if (!Number.isFinite(amount)) return '₦0';
  const formatted = amount.toLocaleString('en-NG', {
    minimumFractionDigits: showKobo ? 2 : 0,
    maximumFractionDigits: showKobo ? 2 : 0,
  });
  return `₦${formatted}`;
}

/**
 * Convert Naira to kobo for Paystack gateway calls.
 * @param naira - Amount in Naira
 * @returns Amount in kobo (integer)
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/**
 * Convert kobo to Naira from Paystack webhook responses.
 * @param kobo - Amount in kobo
 * @returns Amount in Naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Format a compact price for listing cards (no kobo for whole numbers).
 * @param amount - Amount in Naira
 * @returns "₦85,000" for whole numbers, "₦85,000.50" for fractional
 */
export function formatNairaCompact(amount: number): string {
  const hasKobo = amount % 1 !== 0;
  return formatNaira(amount, hasKobo);
}
