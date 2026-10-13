/**
 * STAPLE LIMITED — Location Display Helpers
 * Formatting and utility functions for the 5-tier location hierarchy.
 */
/**
 * Build a human-readable breadcrumb from location hierarchy components.
 * Example: "Lekki Phase 1, Lekki, Eti-Osa, Lagos, Nigeria"
 */
export declare function formatLocationBreadcrumb(parts: {
    serviceArea?: string | null;
    city?: string | null;
    district?: string | null;
    state?: string | null;
    country?: string | null;
}): string;
/**
 * Build a short location label for display in compact UIs (cards, badges).
 * Prioritises the most specific known level.
 * Example: "Lekki Phase 1, Lagos"
 */
export declare function formatLocationShort(parts: {
    serviceArea?: string | null;
    city?: string | null;
    state?: string | null;
}): string;
/**
 * Calculate approximate distance between two GPS coordinates using Haversine formula.
 * @returns Distance in kilometers
 */
export declare function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Format a distance for user display.
 * @param km - Distance in kilometers
 * @returns "2.3 km" or "450 m" for sub-kilometer distances
 */
export declare function formatDistance(km: number): string;
/**
 * Format collection point operating hours for display.
 * @param hours - Operating hours JSONB from the collection_points table
 * @returns Formatted string like "Mon-Sat: 08:00 - 18:00"
 */
export declare function formatOperatingHours(hours: Record<string, {
    open: string;
    close: string;
}> | null): string;
/**
 * Nigerian states commonly served (initial markets from Spec §5.1).
 * Used for location picker defaults and validation.
 */
export declare const NIGERIA_INITIAL_STATES: readonly ["Lagos", "Federal Capital Territory", "Rivers", "Ogun", "Oyo"];
//# sourceMappingURL=location.d.ts.map