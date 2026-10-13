/**
 * STAPLE LIMITED — Communications, Live Chat & Support Domain Utilities (Phase 8)
 * Spec §41, §42, and Termii Nigerian SMS integration.
 */
import { NotificationType } from '../types/enums.js';
/**
 * Validates whether a user is eligible to enter and participate in Live Chat (Spec §41 & §42).
 * Rule: User must have participated in at least one Group Buy, or hold Champion/Admin privileges.
 */
export function validateChatEligibility(profile) {
    if (!profile)
        return false;
    // Admins and Champions are always eligible
    if (['admin', 'super_admin', 'champion'].includes(profile.role ?? '')) {
        return true;
    }
    // Verified participants with at least one order participation
    return profile.has_participated_in_group_buy === true;
}
/**
 * Formats a sequential support ticket number: STP-TCK-YYYY-XXXX
 */
export function formatTicketNumber(sequenceNumber, year = new Date().getFullYear()) {
    const padded = String(Math.max(1, Math.floor(sequenceNumber))).padStart(4, '0');
    return `STP-TCK-${year}-${padded}`;
}
/**
 * Sanitizes and validates live chat messages for Nigerian community groups
 * - Enforces length between 1 and 500 characters
 * - Trims excessive whitespace
 * - Strips common spam solicitation URLs
 */
export function sanitizeChatMessage(content) {
    if (!content || typeof content !== 'string') {
        return {
            isValid: false,
            sanitized: '',
            error: 'Message content cannot be empty.',
        };
    }
    const trimmed = content.trim();
    if (trimmed.length === 0) {
        return {
            isValid: false,
            sanitized: '',
            error: 'Message content cannot be blank.',
        };
    }
    if (trimmed.length > 500) {
        return {
            isValid: false,
            sanitized: trimmed.slice(0, 500),
            error: 'Message exceeds the 500-character community limit.',
        };
    }
    // Clean prohibited control characters
    const sanitized = trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    return {
        isValid: true,
        sanitized,
    };
}
/**
 * Normalizes Nigerian mobile phone numbers for Termii SMS and E.164
 * Handles:
 * - 08031234567 -> 2348031234567 (+2348031234567)
 * - +2348031234567 -> 2348031234567 (+2348031234567)
 * - 2348031234567 -> 2348031234567 (+2348031234567)
 */
export function normalizeNigerianPhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') {
        return {
            isValid: false,
            e164: '',
            termiiFormat: '',
            error: 'Phone number is required.',
        };
    }
    // Remove non-digits except leading plus
    let cleaned = rawPhone.replace(/[^\d+]/g, '');
    // Strip leading plus
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.slice(1);
    }
    // If local format starting with '0' (e.g. 08031234567 -> 11 digits)
    if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = '234' + cleaned.slice(1);
    }
    // Must be 13 digits starting with 234 (e.g. 2348031234567)
    if (!/^234[789][01]\d{8}$/.test(cleaned)) {
        return {
            isValid: false,
            e164: '',
            termiiFormat: '',
            error: 'Invalid Nigerian phone number. Must be an 11-digit local or valid +234 number.',
        };
    }
    return {
        isValid: true,
        e164: `+${cleaned}`,
        termiiFormat: cleaned,
    };
}
/**
 * Generates payload for Termii SMS Gateway API
 */
export function generateTermiiSmsPayload(to, message, channel = 'generic') {
    const norm = normalizeNigerianPhone(to);
    const targetPhone = norm.isValid ? norm.termiiFormat : to;
    return {
        to: targetPhone,
        from: 'staple',
        sms: message,
        type: 'plain',
        channel,
    };
}
/**
 * Maps NotificationType to localized Nigerian English header titles
 */
export function formatNotificationTitle(type) {
    switch (type) {
        case NotificationType.PRICING_TIER_REACHED:
            return 'Price Drop Unlocked! 💰';
        case NotificationType.TARGET_REACHED:
            return 'Group Buy Goal Reached! 🎉';
        case NotificationType.ORDER_CONFIRMED:
            return 'Order Confirmed ✅';
        case NotificationType.PAYMENT_SUCCESSFUL:
            return 'Payment Received ₦';
        case NotificationType.FULFILMENT_READY:
        case NotificationType.COLLECTION_READY:
            return 'Ready for Pickup! 📦';
        case NotificationType.WALLET_CREDITED:
            return 'Wallet Credited 👛';
        case NotificationType.FESTIVE_INSTALMENT_REMINDER:
            return 'Festive Instalment Reminder ⏳';
        case NotificationType.CHAMPION_APPROVED:
            return 'Champion Application Approved! ⭐';
        case NotificationType.SUPPORT_RESPONSE:
            return 'Support Desk Reply 💬';
        default:
            return 'staple Update 📢';
    }
}
//# sourceMappingURL=communications.js.map