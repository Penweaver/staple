/**
 * STAPLE LIMITED — Location Display Helpers
 * Formatting and utility functions for the 5-tier location hierarchy.
 */
/**
 * Build a human-readable breadcrumb from location hierarchy components.
 * Example: "Lekki Phase 1, Lekki, Eti-Osa, Lagos, Nigeria"
 */
export function formatLocationBreadcrumb(parts) {
    return [parts.serviceArea, parts.city, parts.district, parts.state, parts.country]
        .filter(Boolean)
        .join(', ');
}
/**
 * Build a short location label for display in compact UIs (cards, badges).
 * Prioritises the most specific known level.
 * Example: "Lekki Phase 1, Lagos"
 */
export function formatLocationShort(parts) {
    const specific = parts.serviceArea ?? parts.city ?? 'Unknown';
    if (parts.state && specific !== parts.state) {
        return `${specific}, ${parts.state}`;
    }
    return specific;
}
/**
 * Calculate approximate distance between two GPS coordinates using Haversine formula.
 * @returns Distance in kilometers
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
/**
 * Format a distance for user display.
 * @param km - Distance in kilometers
 * @returns "2.3 km" or "450 m" for sub-kilometer distances
 */
export function formatDistance(km) {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    if (km < 10) {
        return `${km.toFixed(1)} km`;
    }
    return `${Math.round(km)} km`;
}
/**
 * Format collection point operating hours for display.
 * @param hours - Operating hours JSONB from the collection_points table
 * @returns Formatted string like "Mon-Sat: 08:00 - 18:00"
 */
export function formatOperatingHours(hours) {
    if (!hours || Object.keys(hours).length === 0)
        return 'Hours not available';
    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayLabels = {
        mon: 'Mon',
        tue: 'Tue',
        wed: 'Wed',
        thu: 'Thu',
        fri: 'Fri',
        sat: 'Sat',
        sun: 'Sun',
    };
    const entries = dayOrder
        .filter((d) => hours[d])
        .map((d) => `${dayLabels[d]}: ${hours[d].open} – ${hours[d].close}`);
    return entries.join(' · ');
}
/**
 * Nigerian states commonly served (initial markets from Spec §5.1).
 * Used for location picker defaults and validation.
 */
export const NIGERIA_INITIAL_STATES = [
    'Lagos',
    'Federal Capital Territory',
    'Rivers',
    'Ogun',
    'Oyo',
];
//# sourceMappingURL=location.js.map