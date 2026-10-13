/**
 * STAPLE LIMITED — Fulfilment & Collection Hub Operations Utilities (Phase 6)
 * Pure domain functions for 6-digit pickup code formatting and validation (§29, §63),
 * hub inventory staging calculations, and operating hours evaluation.
 */
/**
 * Generates a standard STAPLE 6-character alphanumeric pickup verification code: STP-XXX-XXX
 */
export declare function generatePickupCode(): string;
/**
 * Normalizes any user-entered pickup code into standardized uppercase format: STP-XXX-XXX
 * Handles:
 * - "stp-abc-xyz" -> "STP-ABC-XYZ"
 * - "abc-xyz" -> "STP-ABC-XYZ"
 * - "abcxyz" -> "STP-ABC-XYZ"
 * - "STP ABC XYZ" -> "STP-ABC-XYZ"
 */
export declare function formatPickupCode(raw: string): string;
/**
 * Validates whether a string matches the STAPLE pickup verification code format
 */
export declare function validatePickupCode(code: string): boolean;
/**
 * Evaluates whether a collection hub is currently open based on its operating hours JSON
 */
export declare function isHubOpenNow(operatingHours: Record<string, {
    open: string;
    close: string;
}> | null | undefined, date?: Date): {
    isOpen: boolean;
    currentDay: string;
    hoursLabel: string;
};
/**
 * Aggregates staging load metrics across orders staged at a hub
 */
export declare function calculateHubStagingLoad(orders: Array<{
    status: string;
    quantity: number;
}>): {
    readyUnits: number;
    collectedUnits: number;
    pendingUnits: number;
    totalUnits: number;
};
//# sourceMappingURL=fulfilment.d.ts.map