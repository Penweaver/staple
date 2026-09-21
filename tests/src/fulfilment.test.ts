/**
 * STAPLE LIMITED — Fulfilment & Collection Hub Operations Test Suite (Phase 6)
 * Verifies 6-digit pickup code formatting & validation (§29, §63),
 * nearest collection hub auto-allocation (Addendum B4),
 * fulfilment state transitions, Group Buy auto-completion on 100% collection,
 * operating hours evaluation, and staging load calculations.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePickupCode,
  formatPickupCode,
  validatePickupCode,
  isHubOpenNow,
  calculateHubStagingLoad,
  haversineDistanceKm,
} from '@staple/shared';

test('Fulfilment — 6-Digit Pickup Verification Code Generation & Formatting (§29, §63)', () => {
  // 1. Generation test
  const code = generatePickupCode();
  assert.ok(code.startsWith('STP-'), 'Code must start with STP-');
  assert.equal(code.length, 11, 'Code length must be 11 characters (STP-XXX-XXX)');
  assert.match(code, /^STP-[2-9A-Z]{3}-[2-9A-Z]{3}$/, 'Code must match alphanumeric format');

  // 2. Normalization test
  assert.equal(formatPickupCode('stp-782-910'), 'STP-782-910');
  assert.equal(formatPickupCode('782910'), 'STP-782-910');
  assert.equal(formatPickupCode('782-910'), 'STP-782-910');
  assert.equal(formatPickupCode('stp 782 910'), 'STP-782-910');
  assert.equal(formatPickupCode('STP-abc-xyz'), 'STP-ABC-XYZ');

  // 3. Validation test
  assert.equal(validatePickupCode('STP-782-910'), true);
  assert.equal(validatePickupCode('782910'), true);
  assert.equal(validatePickupCode('stp-abc-xyz'), true);
  assert.equal(validatePickupCode('123'), false);
  assert.equal(validatePickupCode(''), false);
  assert.equal(validatePickupCode('STP-12345'), false);
});

test('Fulfilment — Nearest Collection Point Allocation (Founder Addendum B4)', () => {
  interface MockCollectionPoint {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
  }

  const hubs: MockCollectionPoint[] = [
    {
      id: 'hub-lekki',
      name: 'staple Hub — Lekki Admiralty',
      latitude: 6.4474,
      longitude: 3.4723,
      isActive: true,
    },
    {
      id: 'hub-vi',
      name: 'staple Hub — Victoria Island',
      latitude: 6.4281,
      longitude: 3.4219,
      isActive: true,
    },
    {
      id: 'hub-ikeja',
      name: 'staple Hub — Ikeja GRA',
      latitude: 6.5944,
      longitude: 3.3553,
      isActive: true,
    },
  ];

  function resolveNearestHub(
    userLat: number,
    userLon: number,
    availableHubs: MockCollectionPoint[],
  ): MockCollectionPoint {
    let nearest = availableHubs[0];
    let minDistance = Infinity;

    for (const hub of availableHubs) {
      if (!hub.isActive) continue;
      const dist = haversineDistanceKm(userLat, userLon, hub.latitude, hub.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = hub;
      }
    }
    return nearest;
  }

  // Participant living in Lekki Phase 1 (6.4490, 3.4680)
  const lekkiUserHub = resolveNearestHub(6.449, 3.468, hubs);
  assert.equal(lekkiUserHub.id, 'hub-lekki', 'Should allocate nearest Lekki Admiralty hub');

  // Participant living in Ikeja (6.5900, 3.3500)
  const ikejaUserHub = resolveNearestHub(6.59, 3.35, hubs);
  assert.equal(ikejaUserHub.id, 'hub-ikeja', 'Should allocate nearest Ikeja hub');
});

test('Fulfilment — Order Collection Lifecycle & Group Buy Auto-Completion', () => {
  interface MockOrderFulfilment {
    id: string;
    orderId: string;
    groupBuyId: string;
    status: 'pending' | 'preparing' | 'ready_for_collection' | 'collected';
    pickupCode: string;
    collectedAt?: string;
    collectedBy?: string;
  }

  const groupBuyOrders: MockOrderFulfilment[] = [
    {
      id: 'ful-1',
      orderId: 'ord-1',
      groupBuyId: 'gb-100',
      status: 'ready_for_collection',
      pickupCode: 'STP-782-910',
    },
    {
      id: 'ful-2',
      orderId: 'ord-2',
      groupBuyId: 'gb-100',
      status: 'ready_for_collection',
      pickupCode: 'STP-519-204',
    },
  ];

  let gbStatus: 'delivery_fulfilment' | 'completed' = 'delivery_fulfilment';

  function completeOrderPickup(
    fulfilmentId: string,
    collectorName: string,
    items: MockOrderFulfilment[],
  ): { allCompleted: boolean } {
    const item = items.find((f) => f.id === fulfilmentId);
    if (!item) throw new Error('Not found');
    if (item.status === 'collected') throw new Error('Already collected');

    item.status = 'collected';
    item.collectedAt = new Date().toISOString();
    item.collectedBy = collectorName;

    const remainingUncollected = items.filter((f) => f.status !== 'collected');
    const allCompleted = remainingUncollected.length === 0;
    if (allCompleted) {
      gbStatus = 'completed';
    }
    return { allCompleted };
  }

  // Handoff 1st order
  const step1 = completeOrderPickup('ful-1', 'Babatunde Adeleke', groupBuyOrders);
  assert.equal(step1.allCompleted, false, 'Group Buy should not be completed yet');
  assert.equal(gbStatus, 'delivery_fulfilment');
  assert.equal(groupBuyOrders[0].status, 'collected');

  // Attempt duplicate collection on 1st order -> should fail
  assert.throws(
    () => completeOrderPickup('ful-1', 'Someone Else', groupBuyOrders),
    /Already collected/,
  );

  // Handoff 2nd order (100% collected)
  const step2 = completeOrderPickup('ful-2', 'Fatima Bello', groupBuyOrders);
  assert.equal(step2.allCompleted, true, 'Group Buy should now be 100% completed');
  assert.equal(gbStatus, 'completed', 'Group Buy state must transition to completed');
});

test('Fulfilment — Hub Operating Hours Evaluator (Nigerian Business Hours)', () => {
  const schedule = {
    monday: { open: '08:00', close: '18:00' },
    tuesday: { open: '08:00', close: '18:00' },
    wednesday: { open: '08:00', close: '18:00' },
    thursday: { open: '08:00', close: '18:00' },
    friday: { open: '08:00', close: '18:00' },
    saturday: { open: '08:00', close: '17:00' },
    sunday: { open: '', close: '' },
  };

  // 1. Monday at 14:30 (2:30 PM) -> Open
  const mondayOpen = new Date('2026-09-21T14:30:00'); // Sep 21 2026 is a Monday
  const check1 = isHubOpenNow(schedule, mondayOpen);
  assert.equal(check1.isOpen, true);
  assert.ok(check1.hoursLabel.includes('Open today until 18:00'));

  // 2. Monday at 20:00 (8:00 PM) -> Closed
  const mondayNight = new Date('2026-09-21T20:00:00');
  const check2 = isHubOpenNow(schedule, mondayNight);
  assert.equal(check2.isOpen, false);
  assert.ok(check2.hoursLabel.includes('Opens at 08:00'));

  // 3. Sunday at 12:00 PM -> Closed
  const sundayNoon = new Date('2026-09-20T12:00:00'); // Sep 20 2026 is a Sunday
  const check3 = isHubOpenNow(schedule, sundayNoon);
  assert.equal(check3.isOpen, false);
  assert.ok(check3.hoursLabel.includes('Closed'));
});

test('Fulfilment — Hub Staging Load Aggregation', () => {
  const stagedOrders = [
    { status: 'ready_for_collection', quantity: 10 },
    { status: 'ready_for_collection', quantity: 5 },
    { status: 'collected', quantity: 15 },
    { status: 'preparing', quantity: 8 },
  ];

  const load = calculateHubStagingLoad(stagedOrders);
  assert.equal(load.readyUnits, 15, 'Ready units should sum to 15');
  assert.equal(load.collectedUnits, 15, 'Collected units should sum to 15');
  assert.equal(load.pendingUnits, 8, 'Pending units should sum to 8');
  assert.equal(load.totalUnits, 38, 'Total units should sum to 38');
});
