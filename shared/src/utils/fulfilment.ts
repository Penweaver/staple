/**
 * STAPLE LIMITED — Fulfilment & Collection Hub Operations Utilities (Phase 6)
 * Pure domain functions for 6-digit pickup code formatting and validation (§29, §63),
 * hub inventory staging calculations, and operating hours evaluation.
 */

/**
 * Valid characters for pickup code (excludes easily confused 0, 1, I, O)
 */
const PICKUP_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a standard STAPLE 6-character alphanumeric pickup verification code: STP-XXX-XXX
 */
export function generatePickupCode(): string {
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 3; i++) {
    part1 += PICKUP_CHARS.charAt(Math.floor(Math.random() * PICKUP_CHARS.length));
    part2 += PICKUP_CHARS.charAt(Math.floor(Math.random() * PICKUP_CHARS.length));
  }
  return `STP-${part1}-${part2}`;
}

/**
 * Normalizes any user-entered pickup code into standardized uppercase format: STP-XXX-XXX
 * Handles:
 * - "stp-abc-xyz" -> "STP-ABC-XYZ"
 * - "abc-xyz" -> "STP-ABC-XYZ"
 * - "abcxyz" -> "STP-ABC-XYZ"
 * - "STP ABC XYZ" -> "STP-ABC-XYZ"
 */
export function formatPickupCode(raw: string): string {
  if (!raw) return '';

  // Clean all spaces, hyphens, and uppercase
  const cleaned = raw.trim().toUpperCase().replace(/[\s-]/g, '');

  if (cleaned.startsWith('STP')) {
    const chars = cleaned.slice(3);
    if (chars.length === 6) {
      return `STP-${chars.slice(0, 3)}-${chars.slice(3, 6)}`;
    }
    return raw.trim().toUpperCase();
  }

  if (cleaned.length === 6) {
    return `STP-${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
  }

  return raw.trim().toUpperCase();
}

/**
 * Validates whether a string matches the STAPLE pickup verification code format
 */
export function validatePickupCode(code: string): boolean {
  if (!code) return false;
  const formatted = formatPickupCode(code);
  return /^STP-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(formatted);
}

/**
 * Evaluates whether a collection hub is currently open based on its operating hours JSON
 */
export function isHubOpenNow(
  operatingHours: Record<string, { open: string; close: string }> | null | undefined,
  date: Date = new Date(),
): { isOpen: boolean; currentDay: string; hoursLabel: string } {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = daysOfWeek[date.getDay()];

  if (!operatingHours || !operatingHours[currentDay]) {
    // Default Nigerian warehouse/hub schedule: Mon-Sat 08:00 - 18:00, Sun Closed
    const isSunday = currentDay === 'sunday';
    if (isSunday) {
      return { isOpen: false, currentDay, hoursLabel: 'Closed on Sundays' };
    }
    const currentHour = date.getHours();
    const isOpen = currentHour >= 8 && currentHour < 18;
    return {
      isOpen,
      currentDay,
      hoursLabel: isOpen ? 'Open today until 6:00 PM' : 'Opens at 8:00 AM',
    };
  }

  const daySchedule = operatingHours[currentDay];
  if (!daySchedule.open || !daySchedule.close) {
    return { isOpen: false, currentDay, hoursLabel: 'Closed today' };
  }

  // Parse HH:mm
  const [openH, openM] = daySchedule.open.split(':').map(Number);
  const [closeH, closeM] = daySchedule.close.split(':').map(Number);

  const openTime = openH * 60 + (openM || 0);
  const closeTime = closeH * 60 + (closeM || 0);
  const nowTime = date.getHours() * 60 + date.getMinutes();

  const isOpen = nowTime >= openTime && nowTime < closeTime;

  return {
    isOpen,
    currentDay,
    hoursLabel: isOpen
      ? `Open today until ${daySchedule.close}`
      : `Opens at ${daySchedule.open}`,
  };
}

/**
 * Aggregates staging load metrics across orders staged at a hub
 */
export function calculateHubStagingLoad(
  orders: Array<{ status: string; quantity: number }>,
): { readyUnits: number; collectedUnits: number; pendingUnits: number; totalUnits: number } {
  let readyUnits = 0;
  let collectedUnits = 0;
  let pendingUnits = 0;

  for (const order of orders) {
    const qty = order.quantity || 1;
    if (order.status === 'collected' || order.status === 'delivered') {
      collectedUnits += qty;
    } else if (order.status === 'ready_for_collection' || order.status === 'fulfilment_ready') {
      readyUnits += qty;
    } else {
      pendingUnits += qty;
    }
  }

  return {
    readyUnits,
    collectedUnits,
    pendingUnits,
    totalUnits: readyUnits + collectedUnits + pendingUnits,
  };
}
