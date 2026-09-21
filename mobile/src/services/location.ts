/**
 * STAPLE LIMITED — Location Service (Mobile)
 * Handles GPS detection, manual selection, and location state management (Spec §5, §47)
 */

import { useState, useEffect } from 'react';
import type {
  ServiceArea,
  CollectionPoint,
  StateRegion,
  DistrictLGA,
  CityLocality,
  Country,
  DetectLocationResponse,
} from '@staple/shared';
import { formatLocationShort, formatLocationBreadcrumb } from '@staple/shared';

export interface LocationState {
  serviceArea: ServiceArea | null;
  city: CityLocality | null;
  district: DistrictLGA | null;
  state: StateRegion | null;
  country: Country | null;
  nearestCollectionPoints: CollectionPoint[];
  selectedCollectionPoint: CollectionPoint | null;
  isAutoDetected: boolean;
  latitude: number | null;
  longitude: number | null;
}

// Default initial location: Lekki Phase 1, Lagos, Nigeria (Primary seed market)
export const DEFAULT_NIGERIA_LOCATION: LocationState = {
  country: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Nigeria',
    iso_code: 'NG',
    currency_code: 'NGN',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  state: {
    id: '00000000-0000-0000-0001-000000000001',
    country_id: '00000000-0000-0000-0000-000000000001',
    name: 'Lagos',
    code: 'LA',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  district: {
    id: '00000000-0000-0000-0002-000000000001',
    state_region_id: '00000000-0000-0000-0001-000000000001',
    name: 'Eti-Osa',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  city: {
    id: '00000000-0000-0000-0003-000000000001',
    district_lga_id: '00000000-0000-0000-0002-000000000001',
    name: 'Lekki',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  serviceArea: {
    id: '00000000-0000-0000-0004-000000000001',
    city_locality_id: '00000000-0000-0000-0003-000000000001',
    name: 'Lekki Phase 1',
    description: 'Admiralty Way, Freedom Way and surrounding Lekki Phase 1 residential clusters',
    radius_km: 8.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  nearestCollectionPoints: [
    {
      id: '00000000-0000-0000-0005-000000000001',
      service_area_id: '00000000-0000-0000-0004-000000000001',
      name: 'staple Hub — Lekki Admiralty',
      address: '42 Admiralty Way, Lekki Phase 1, Lagos',
      contact_phone: '+2348012345678',
      contact_name: 'Tunde Babatunde',
      operating_hours: {
        mon: { open: '08:00', close: '18:00' },
        sat: { open: '09:00', close: '16:00' },
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  selectedCollectionPoint: {
    id: '00000000-0000-0000-0005-000000000001',
    service_area_id: '00000000-0000-0000-0004-000000000001',
    name: 'staple Hub — Lekki Admiralty',
    address: '42 Admiralty Way, Lekki Phase 1, Lagos',
    contact_phone: '+2348012345678',
    contact_name: 'Tunde Babatunde',
    operating_hours: {
      mon: { open: '08:00', close: '18:00' },
      sat: { open: '09:00', close: '16:00' },
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  isAutoDetected: false,
  latitude: 6.4474,
  longitude: 3.4735,
};

// Global in-memory location state for runtime session
let currentLocationState: LocationState = { ...DEFAULT_NIGERIA_LOCATION };
const listeners = new Set<(loc: LocationState) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...currentLocationState }));
}

/**
 * Get the current active location state
 */
export function getCurrentLocation(): LocationState {
  return { ...currentLocationState };
}

/**
 * Update the active location state
 */
export function setCurrentLocation(newLocation: Partial<LocationState>) {
  currentLocationState = {
    ...currentLocationState,
    ...newLocation,
  };
  notifyListeners();
}

/**
 * Hook to subscribe to location updates in React components
 */
export function useLocation() {
  const [location, setLocation] = useState<LocationState>(currentLocationState);

  useEffect(() => {
    const handler = (loc: LocationState) => setLocation(loc);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    location,
    shortLabel: formatLocationShort({
      serviceArea: location.serviceArea?.name,
      city: location.city?.name,
      state: location.state?.name,
    }),
    breadcrumb: formatLocationBreadcrumb({
      serviceArea: location.serviceArea?.name,
      city: location.city?.name,
      district: location.district?.name,
      state: location.state?.name,
      country: location.country?.name,
    }),
    setLocation: setCurrentLocation,
  };
}

/**
 * Detect location from GPS coordinates (calls /locations/detect or mock)
 */
export async function detectLocation(lat: number, lng: number): Promise<DetectLocationResponse> {
  // In production, this hits supabase.functions.invoke('locations/detect', { body: { latitude: lat, longitude: lng } })
  // For local/mock fallback:
  const isLekki = Math.abs(lat - 6.4474) < 0.1 && Math.abs(lng - 3.4735) < 0.1;
  const isVI = Math.abs(lat - 6.4281) < 0.1 && Math.abs(lng - 3.4246) < 0.1;

  if (isVI) {
    return {
      service_area: {
        id: '00000000-0000-0000-0004-000000000002',
        city_locality_id: '00000000-0000-0000-0003-000000000002',
        name: 'Victoria Island Central',
        description: 'Adeola Odeku, Kofo Abayomi, Akin Adesola, and Ahmadu Bello Way area',
        radius_km: 5.0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      city: {
        id: '00000000-0000-0000-0003-000000000002',
        district_lga_id: '00000000-0000-0000-0002-000000000001',
        name: 'Victoria Island',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      district: DEFAULT_NIGERIA_LOCATION.district,
      state: DEFAULT_NIGERIA_LOCATION.state,
      country: DEFAULT_NIGERIA_LOCATION.country,
      nearest_collection_points: [
        {
          id: '00000000-0000-0000-0005-000000000002',
          service_area_id: '00000000-0000-0000-0004-000000000002',
          name: 'staple Hub — VI Bishop Oluwole',
          address: '15 Bishop Oluwole Street, Victoria Island, Lagos',
          contact_phone: '+2348023456789',
          contact_name: 'Amina Mohammed',
          operating_hours: {
            mon: { open: '08:00', close: '18:00' },
            sat: { open: '09:00', close: '16:00' },
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          distance_km: 0.8,
        },
      ],
    };
  }

  // Default to Lekki response
  return {
    service_area: DEFAULT_NIGERIA_LOCATION.serviceArea,
    city: DEFAULT_NIGERIA_LOCATION.city,
    district: DEFAULT_NIGERIA_LOCATION.district,
    state: DEFAULT_NIGERIA_LOCATION.state,
    country: DEFAULT_NIGERIA_LOCATION.country,
    nearest_collection_points: DEFAULT_NIGERIA_LOCATION.nearestCollectionPoints.map((cp) => ({
      ...cp,
      distance_km: 1.2,
    })),
  };
}
