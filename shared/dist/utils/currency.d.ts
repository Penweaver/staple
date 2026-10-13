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
export declare function formatNaira(amount: number, showKobo?: boolean): string;
/**
 * Convert Naira to kobo for Paystack gateway calls.
 * @param naira - Amount in Naira
 * @returns Amount in kobo (integer)
 */
export declare function nairaToKobo(naira: number): number;
/**
 * Convert kobo to Naira from Paystack webhook responses.
 * @param kobo - Amount in kobo
 * @returns Amount in Naira
 */
export declare function koboToNaira(kobo: number): number;
/**
 * Format a compact price for listing cards (no kobo for whole numbers).
 * @param amount - Amount in Naira
 * @returns "₦85,000" for whole numbers, "₦85,000.50" for fractional
 */
export declare function formatNairaCompact(amount: number): string;
//# sourceMappingURL=currency.d.ts.map