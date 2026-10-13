/**
 * STAPLE LIMITED — Communications, Live Chat & Support Domain Utilities (Phase 8)
 * Spec §41, §42, and Termii Nigerian SMS integration.
 */
import { NotificationType } from '../types/enums.js';
export interface ChatEligibilityProfile {
    has_participated_in_group_buy?: boolean;
    role?: string;
}
export interface ChatMessageSanitizationResult {
    isValid: boolean;
    sanitized: string;
    error?: string;
}
export interface PhoneNormalizationResult {
    isValid: boolean;
    e164: string;
    termiiFormat: string;
    error?: string;
}
export interface TermiiSmsPayload {
    to: string;
    from: string;
    sms: string;
    type: string;
    channel: string;
}
/**
 * Validates whether a user is eligible to enter and participate in Live Chat (Spec §41 & §42).
 * Rule: User must have participated in at least one Group Buy, or hold Champion/Admin privileges.
 */
export declare function validateChatEligibility(profile: ChatEligibilityProfile | null | undefined): boolean;
/**
 * Formats a sequential support ticket number: STP-TCK-YYYY-XXXX
 */
export declare function formatTicketNumber(sequenceNumber: number, year?: number): string;
/**
 * Sanitizes and validates live chat messages for Nigerian community groups
 * - Enforces length between 1 and 500 characters
 * - Trims excessive whitespace
 * - Strips common spam solicitation URLs
 */
export declare function sanitizeChatMessage(content: string): ChatMessageSanitizationResult;
/**
 * Normalizes Nigerian mobile phone numbers for Termii SMS and E.164
 * Handles:
 * - 08031234567 -> 2348031234567 (+2348031234567)
 * - +2348031234567 -> 2348031234567 (+2348031234567)
 * - 2348031234567 -> 2348031234567 (+2348031234567)
 */
export declare function normalizeNigerianPhone(rawPhone: string): PhoneNormalizationResult;
/**
 * Generates payload for Termii SMS Gateway API
 */
export declare function generateTermiiSmsPayload(to: string, message: string, channel?: 'generic' | 'dnd' | 'whatsapp'): TermiiSmsPayload;
/**
 * Maps NotificationType to localized Nigerian English header titles
 */
export declare function formatNotificationTitle(type: NotificationType): string;
//# sourceMappingURL=communications.d.ts.map