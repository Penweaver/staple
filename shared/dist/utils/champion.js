/**
 * STAPLE LIMITED — Champion Domain Utilities & Engagement Engine (Spec §6–§9, Addendum A3)
 * Pure business logic for capacity validation, tier badges, application checks,
 * and localized WhatsApp community broadcast generation.
 */
import { ChampionStatus } from '../types/enums.js';
import { BUSINESS_RULES } from '../constants/businessRules.js';
import { formatNaira } from './currency.js';
/**
 * Validates whether a Champion can initialize a new Group Buy (§8).
 * Strictly enforces that Champion status is ACTIVE and active concurrent buys < 2.
 */
export function canChampionCreateGroupBuy(status, activeCount, maxActive = BUSINESS_RULES.MAX_CHAMPION_ACTIVE_GROUP_BUYS) {
    if (status !== ChampionStatus.ACTIVE) {
        if (status === ChampionStatus.SUSPENDED) {
            return {
                allowed: false,
                reason: 'Your Champion account is currently suspended. Please contact STAPLE Support.',
            };
        }
        return {
            allowed: false,
            reason: 'Only verified Active Champions can initiate Group Buys.',
        };
    }
    if (activeCount >= maxActive) {
        return {
            allowed: false,
            reason: `Champion active capacity reached: You currently have ${activeCount} active Group Buy(s). Maximum ${maxActive} allowed concurrently.`,
        };
    }
    return { allowed: true };
}
/**
 * Resolves Champion Community Tier based on track record of successful deliveries and GMV.
 */
export function calculateChampionTier(completedBuysCount, totalGmvNaira) {
    if (completedBuysCount >= 10 || totalGmvNaira >= 5_000_000) {
        return {
            tierName: 'Gold Food Security Leader',
            badge: '🥇',
            rank: 3,
            completedBuysRequired: 10,
        };
    }
    if (completedBuysCount >= 4 || totalGmvNaira >= 1_500_000) {
        return {
            tierName: 'Silver Community Organizer',
            badge: '🥈',
            rank: 2,
            completedBuysRequired: 4,
            nextTierRequirement: 'Organize 10 completed Group Buys or ₦5,000,000 GMV to reach Gold',
        };
    }
    return {
        tierName: 'Bronze Estate Champion',
        badge: '🥉',
        rank: 1,
        completedBuysRequired: 0,
        nextTierRequirement: 'Complete 4 Group Buys or mobilize ₦1,500,000 to reach Silver',
    };
}
/**
 * Validates Champion Application inputs
 */
export function validateChampionApplication(input) {
    const errors = [];
    if (!input.full_name || input.full_name.trim().length < 3) {
        errors.push('Full name must be at least 3 characters long.');
    }
    // Clean Nigerian phone (supports 080..., 070..., 090..., 081..., +234...)
    const phoneClean = (input.phone || '').replace(/[\s-]/g, '');
    const isNigerianPhone = /^(\+234|0)[789][01]\d{8}$/.test(phoneClean);
    if (!isNigerianPhone) {
        errors.push('Please provide a valid Nigerian mobile phone number (e.g. 08012345678 or +2348012345678).');
    }
    if (!input.state || input.state.trim().length < 2) {
        errors.push('State is required.');
    }
    if (!input.lga || input.lga.trim().length < 2) {
        errors.push('Local Government Area (LGA) is required.');
    }
    if (!input.neighborhood || input.neighborhood.trim().length < 2) {
        errors.push('Neighborhood or Estate name is required.');
    }
    if (!input.estimated_network_size || input.estimated_network_size < 5) {
        errors.push('Estimated community reach must be at least 5 households.');
    }
    if (!input.motivation || input.motivation.trim().length < 15) {
        errors.push('Please explain your motivation in at least 15 characters.');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
/**
 * Generates ready-to-copy WhatsApp broadcast messages tailored for Nigerian community groups.
 * Provides both Standard Nigerian English and Nigerian Pidgin dialects.
 */
export function generateChampionBroadcastMessage({ groupBuyTitle, unitPrice, targetQuantity, currentPaidQuantity, areaName, shareUrl, championName, dialect = 'standard', }) {
    const remaining = Math.max(0, targetQuantity - currentPaidQuantity);
    const formattedPrice = formatNaira(unitPrice);
    if (dialect === 'pidgin') {
        return [
            `🚨 *NEIGHBOR, HEAR WORD! WHOLESALE FOODSTUFF DEY HAPPEN!* 🚨`,
            ``,
            `I don start collective buy for *${groupBuyTitle}* for our area (${areaName})!`,
            ``,
            `💰 *Our Price:* ${formattedPrice} per unit (direct wholesale, market price pass this one!)`,
            `📦 *Target:* ${targetQuantity} units | *Remaining:* ${remaining} units to lock discount`,
            `🚚 *Pickup:* Free collection at our local staple Hub in ${areaName}`,
            ``,
            `Make we buy am together sharp sharp before slot finish:`,
            `👉 ${shareUrl}`,
            ``,
            `— Organized by your neighborhood Champion, *${championName}* on *staple*`,
        ].join('\n');
    }
    // Standard Nigerian English
    return [
        `📢 *Community Bulk Food Purchase Alert — ${areaName}* 📢`,
        ``,
        `Hello neighbors, I have organized a collective bulk order for *${groupBuyTitle}* on staple so we can buy at farm-gate wholesale prices.`,
        ``,
        `💵 *Wholesale Price:* ${formattedPrice} per unit`,
        `🎯 *Target Quantity:* ${targetQuantity} units (${remaining} more needed to complete order)`,
        `📍 *Collection:* Free pickup at our neighborhood staple Hub in ${areaName}`,
        ``,
        `Tap the link below to join with your household quota (max 10 units):`,
        `🔗 ${shareUrl}`,
        ``,
        `Let's beat food inflation together!`,
        `— *${championName}* (STAPLE Community Champion)`,
    ].join('\n');
}
//# sourceMappingURL=champion.js.map