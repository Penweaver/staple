import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatNaira,
  nairaToKobo,
  koboToNaira,
  formatNairaCompact,
} from '@staple/shared';

export interface TestProduct {
  id: string;
  name: string;
  categoryId: string;
  basePrice: number;
  minimumFulfilmentQuantity: number;
  isActive: boolean;
}

export interface LocationRule {
  productId: string;
  countryId?: string;
  stateId?: string;
  serviceAreaId?: string;
  isAvailable: boolean;
}

export function isProductAvailableInArea(
  productId: string,
  hierarchy: { countryId: string; stateId: string; serviceAreaId: string },
  rules: LocationRule[],
): boolean {
  const productRules = rules.filter((r) => r.productId === productId);
  // If no rules exist, product is available everywhere
  if (productRules.length === 0) return true;

  // Check matching rules
  return productRules.some((rule) => {
    if (!rule.isAvailable) return false;
    if (rule.serviceAreaId && rule.serviceAreaId === hierarchy.serviceAreaId) return true;
    if (rule.stateId && rule.stateId === hierarchy.stateId) return true;
    if (rule.countryId && rule.countryId === hierarchy.countryId) return true;
    return false;
  });
}

test('Catalogue — Currency Formatting (NGN / ₦)', () => {
  // Test Nigerian Naira formatting with ₦ symbol and commas
  assert.equal(formatNaira(85000), '₦85,000.00');
  assert.equal(formatNaira(75000.5), '₦75,000.50');
  assert.equal(formatNaira(0), '₦0.00');

  // Test compact format
  assert.equal(formatNairaCompact(85000), '₦85,000');
  assert.equal(formatNairaCompact(85000.75), '₦85,000.75');

  // Test Paystack gateway kobo conversions (main units x 100)
  assert.equal(nairaToKobo(85000), 8500000);
  assert.equal(nairaToKobo(48000.5), 4800050);
  assert.equal(koboToNaira(8500000), 85000);
  assert.equal(koboToNaira(4800050), 48000.5);
});

test('Catalogue — MVFQ Validation (Addendum A1)', () => {
  // Products must have a positive Minimum Viable Fulfilment Quantity
  const validateProductMVFQ = (product: { basePrice: number; minimumFulfilmentQuantity: number }) => {
    if (product.basePrice <= 0) throw new Error('Base price must be positive');
    if (product.minimumFulfilmentQuantity <= 0) throw new Error('MVFQ must be greater than zero');
    return true;
  };

  assert.equal(validateProductMVFQ({ basePrice: 85000, minimumFulfilmentQuantity: 20 }), true);
  assert.throws(() => validateProductMVFQ({ basePrice: 85000, minimumFulfilmentQuantity: 0 }), /MVFQ must be greater than zero/);
  assert.throws(() => validateProductMVFQ({ basePrice: 85000, minimumFulfilmentQuantity: -5 }), /MVFQ must be greater than zero/);
});

test('Catalogue — Location Availability Rules', () => {
  const rules: LocationRule[] = [
    // Rice only available in Lagos State
    { productId: 'prod-rice', stateId: 'state-lagos', isAvailable: true },
    // Cooking oil restricted to Lekki Phase 1 service area
    { productId: 'prod-oil', serviceAreaId: 'area-lekki-1', isAvailable: true },
  ];

  const lekkiPhase1 = {
    countryId: 'country-ng',
    stateId: 'state-lagos',
    serviceAreaId: 'area-lekki-1',
  };

  const maitamaAbuja = {
    countryId: 'country-ng',
    stateId: 'state-fct',
    serviceAreaId: 'area-maitama',
  };

  // Rice in Lekki (Lagos) -> Available
  assert.equal(isProductAvailableInArea('prod-rice', lekkiPhase1, rules), true);

  // Rice in Abuja (FCT) -> Not Available
  assert.equal(isProductAvailableInArea('prod-rice', maitamaAbuja, rules), false);

  // Cooking oil in Lekki -> Available
  assert.equal(isProductAvailableInArea('prod-oil', lekkiPhase1, rules), true);

  // Cooking oil in Abuja -> Not Available
  assert.equal(isProductAvailableInArea('prod-oil', maitamaAbuja, rules), false);

  // Item with no location rules -> Available everywhere
  assert.equal(isProductAvailableInArea('prod-garri-universal', maitamaAbuja, rules), true);
});
