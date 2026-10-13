/**
 * STAPLE LIMITED — Champion Domain Utilities & Engagement Engine (Spec §6–§9, Addendum A3)
 * Pure business logic for capacity validation, tier badges, application checks,
 * and localized WhatsApp community broadcast generation.
 */
import { ChampionStatus } from '../types/enums.js';
import { ChampionApplicationInput } from '../types/api.js';
export interface ChampionTierInfo {
    tierName: string;
    badge: string;
    rank: number;
    completedBuysRequired: number;
    nextTierRequirement?: string;
}
/**
 * Validates whether a Champion can initialize a new Group Buy (§8).
 * Strictly enforces that Champion status is ACTIVE and active concurrent buys < 2.
 */
export declare function canChampionCreateGroupBuy(status: ChampionStatus, activeCount: number, maxActive?: 2): {
    allowed: boolean;
    reason?: string;
};
/**
 * Resolves Champion Community Tier based on track record of successful deliveries and GMV.
 */
export declare function calculateChampionTier(completedBuysCount: number, totalGmvNaira: number): ChampionTierInfo;
/**
 * Validates Champion Application inputs
 */
export declare function validateChampionApplication(input: ChampionApplicationInput): {
    isValid: boolean;
    errors: string[];
};
/**
 * Generates ready-to-copy WhatsApp broadcast messages tailored for Nigerian community groups.
 * Provides both Standard Nigerian English and Nigerian Pidgin dialects.
 */
export declare function generateChampionBroadcastMessage({ groupBuyTitle, unitPrice, targetQuantity, currentPaidQuantity, areaName, shareUrl, championName, dialect, }: {
    groupBuyTitle: string;
    unitPrice: number;
    targetQuantity: number;
    currentPaidQuantity: number;
    areaName: string;
    shareUrl: string;
    championName: string;
    dialect?: 'standard' | 'pidgin';
}): string;
//# sourceMappingURL=champion.d.ts.map