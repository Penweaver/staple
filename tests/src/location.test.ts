import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineDistanceKm,
  formatDistance,
  formatLocationBreadcrumb,
  formatLocationShort,
  formatOperatingHours,
  NIGERIA_INITIAL_STATES,
} from '@staple/shared';

test('Location — Haversine Distance Calculation & Formatting', () => {
  // Lekki Admiralty (lat: 6.4468, lng: 3.4682) to VI Bishop Oluwole (lat: 6.4255, lng: 3.4210)
  const distanceKm = haversineDistanceKm(6.4468, 3.4682, 6.4255, 3.4210);

  // Approximately 5.7km apart across Lagos lagoon / road network
  assert.ok(distanceKm > 5.0 && distanceKm < 6.5, `Expected ~5.7km, got ${distanceKm}`);

  // Test distance formatting
  assert.equal(formatDistance(0.45), '450 m');
  assert.equal(formatDistance(2.34), '2.3 km');
  assert.equal(formatDistance(15.8), '16 km');
});

test('Location — Breadcrumbs and Short Labels', () => {
  const fullBreadcrumb = formatLocationBreadcrumb({
    serviceArea: 'Lekki Phase 1',
    city: 'Lekki',
    district: 'Eti-Osa',
    state: 'Lagos',
    country: 'Nigeria',
  });
  assert.equal(fullBreadcrumb, 'Lekki Phase 1, Lekki, Eti-Osa, Lagos, Nigeria');

  const partialBreadcrumb = formatLocationBreadcrumb({
    serviceArea: 'Victoria Island Central',
    state: 'Lagos',
  });
  assert.equal(partialBreadcrumb, 'Victoria Island Central, Lagos');

  const shortLabel = formatLocationShort({
    serviceArea: 'Lekki Phase 1',
    city: 'Lekki',
    state: 'Lagos',
  });
  assert.equal(shortLabel, 'Lekki Phase 1, Lagos');
});

test('Location — Operating Hours Formatting', () => {
  const hours = {
    mon: { open: '08:00', close: '18:00' },
    sat: { open: '09:00', close: '16:00' },
  };

  const formatted = formatOperatingHours(hours);
  assert.equal(formatted, 'Mon: 08:00 – 18:00 · Sat: 09:00 – 16:00');

  assert.equal(formatOperatingHours(null), 'Hours not available');
});

test('Location — Nigerian Initial Launch Markets (§5.1)', () => {
  // Verify initial target states are configured
  assert.ok(NIGERIA_INITIAL_STATES.includes('Lagos'));
  assert.ok(NIGERIA_INITIAL_STATES.includes('Federal Capital Territory'));
  assert.ok(NIGERIA_INITIAL_STATES.includes('Rivers'));
  assert.ok(NIGERIA_INITIAL_STATES.includes('Ogun'));
  assert.ok(NIGERIA_INITIAL_STATES.includes('Oyo'));
  assert.equal(NIGERIA_INITIAL_STATES.length, 5);
});
