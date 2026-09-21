/**
 * STAPLE LIMITED — Communications, Live Chat & Support Test Suite (Phase 8)
 * Tests Live Chat participation eligibility (Spec §41 & §42),
 * ticket sequence formatting, chat message sanitization,
 * Nigerian phone number normalization for Termii SMS, and notification routing.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateChatEligibility,
  formatTicketNumber,
  sanitizeChatMessage,
  normalizeNigerianPhone,
  generateTermiiSmsPayload,
  formatNotificationTitle,
  NotificationType,
} from '@staple/shared';

test('Communications — Live Chat Participation Eligibility Gating (Spec §41 & §42)', () => {
  // Case 1: Unregistered or null profile -> Blocked
  assert.equal(validateChatEligibility(null), false);
  assert.equal(validateChatEligibility(undefined), false);

  // Case 2: Standard user with NO prior group buy participation -> Blocked (§41)
  const freshUser = {
    role: 'user',
    has_participated_in_group_buy: false,
  };
  assert.equal(validateChatEligibility(freshUser), false);

  // Case 3: Verified participant who has completed at least 1 group buy order -> Approved
  const participatingUser = {
    role: 'user',
    has_participated_in_group_buy: true,
  };
  assert.equal(validateChatEligibility(participatingUser), true);

  // Case 4: Champion -> Approved (even if has_participated_in_group_buy flag is missing)
  const championUser = {
    role: 'champion',
    has_participated_in_group_buy: false,
  };
  assert.equal(validateChatEligibility(championUser), true);

  // Case 5: Admin & Super Admin -> Approved
  assert.equal(validateChatEligibility({ role: 'admin' }), true);
  assert.equal(validateChatEligibility({ role: 'super_admin' }), true);
});

test('Communications — Support Ticket Sequential Formatting', () => {
  assert.equal(formatTicketNumber(1, 2026), 'STP-TCK-2026-0001');
  assert.equal(formatTicketNumber(42, 2026), 'STP-TCK-2026-0042');
  assert.equal(formatTicketNumber(105, 2026), 'STP-TCK-2026-0105');
  assert.equal(formatTicketNumber(9999, 2026), 'STP-TCK-2026-9999');
});

test('Communications — Chat Message Sanitization & Length Guard', () => {
  // Case 1: Empty or whitespace message -> Rejected
  const emptyRes = sanitizeChatMessage('');
  assert.equal(emptyRes.isValid, false);

  const spacesRes = sanitizeChatMessage('    ');
  assert.equal(spacesRes.isValid, false);

  // Case 2: Normal valid message -> Accepted and trimmed
  const validRes = sanitizeChatMessage('   Hello everyone in Lekki Phase 1!   ');
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.sanitized, 'Hello everyone in Lekki Phase 1!');

  // Case 3: Excessive length (> 500 characters) -> Rejected
  const longText = 'A'.repeat(550);
  const longRes = sanitizeChatMessage(longText);
  assert.equal(longRes.isValid, false);
  assert.equal(longRes.sanitized.length, 500);
  assert.match(longRes.error ?? '', /exceeds the 500-character/);
});

test('Communications — Nigerian Phone Normalization for Termii SMS Gateway', () => {
  // Case 1: Standard local 11-digit mobile (080...)
  const localRes = normalizeNigerianPhone('08031234567');
  assert.equal(localRes.isValid, true);
  assert.equal(localRes.termiiFormat, '2348031234567');
  assert.equal(localRes.e164, '+2348031234567');

  // Case 2: International formatted (+234...)
  const intlRes = normalizeNigerianPhone('+2348059876543');
  assert.equal(intlRes.isValid, true);
  assert.equal(intlRes.termiiFormat, '2348059876543');
  assert.equal(intlRes.e164, '+2348059876543');

  // Case 3: Formatted with spaces and hyphens
  const formattedRes = normalizeNigerianPhone('090-2345-6789');
  assert.equal(formattedRes.isValid, true);
  assert.equal(formattedRes.termiiFormat, '2349023456789');

  // Case 4: Invalid phone numbers
  const invalidRes1 = normalizeNigerianPhone('1234567');
  assert.equal(invalidRes1.isValid, false);

  const invalidRes2 = normalizeNigerianPhone('05012345678'); // 050 is not a Nigerian prefix
  assert.equal(invalidRes2.isValid, false);
});

test('Communications — Termii SMS Payload Generation & Localized Notification Titles', () => {
  // Case 1: Termii Payload construction
  const payload = generateTermiiSmsPayload(
    '08023456789',
    'Your staple pickup code is STP-782-910. Pick up at Lekki Hub.',
    'generic'
  );
  assert.equal(payload.to, '2348023456789');
  assert.equal(payload.from, 'staple');
  assert.match(payload.sms, /STP-782-910/);
  assert.equal(payload.channel, 'generic');

  // Case 2: Localized titles
  assert.match(formatNotificationTitle(NotificationType.PRICING_TIER_REACHED), /Price Drop Unlocked/);
  assert.match(formatNotificationTitle(NotificationType.TARGET_REACHED), /Group Buy Goal Reached/);
  assert.match(formatNotificationTitle(NotificationType.COLLECTION_READY), /Ready for Pickup/);
  assert.match(formatNotificationTitle(NotificationType.SUPPORT_RESPONSE), /Support Desk Reply/);
});
