/**
 * STAPLE LIMITED — Location API Edge Function (Phase 2)
 * Routes: detect, hierarchy, nearby, user-location
 *
 * Supabase Edge Function entry point (Deno runtime).
 * Handles GPS → service area resolution, location hierarchy queries,
 * nearby collection points, and user location preferences.
 */

import {
  createUserClient,
  createServiceClient,
  getAuthenticatedUserId,
  HttpError,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return corsHeaders();
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    // Path: /locations/{action}
    const action = pathSegments[pathSegments.length - 1];

    switch (action) {
      case 'detect':
        return await handleDetect(req);
      case 'hierarchy':
        return await handleHierarchy(req);
      case 'nearby':
        return await handleNearby(req);
      case 'user-location':
        return await handleUserLocation(req);
      default:
        throw new HttpError(404, `Unknown location action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error);
  }
});

/**
 * POST /locations/detect
 * Resolve GPS coordinates to the nearest service area using PostGIS ST_DWithin.
 * Public endpoint (no auth required) — used during onboarding.
 */
async function handleDetect(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    throw new HttpError(405, 'Method not allowed');
  }

  const body = await req.json();
  const { latitude, longitude } = body;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new HttpError(400, 'latitude and longitude are required (numbers)');
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new HttpError(400, 'Invalid coordinates');
  }

  const supabase = createServiceClient();

  // Find the nearest service area using PostGIS ST_DWithin (within radius)
  // Note: PostGIS geography distance is in meters. We search within max radius first.
  const { data: serviceAreas, error: saError } = await supabase.rpc('find_nearest_service_area', {
    user_lat: latitude,
    user_lng: longitude,
    max_distance_km: 50, // Search up to 50km
  });

  if (saError) {
    console.error('PostGIS query error:', saError);
    throw new HttpError(500, 'Location detection failed');
  }

  let serviceArea = null;
  let city = null;
  let district = null;
  let state = null;
  let country = null;

  if (serviceAreas && serviceAreas.length > 0) {
    const nearest = serviceAreas[0];
    serviceArea = nearest;

    // Hydrate the location hierarchy for the detected service area
    const { data: hierarchy } = await supabase
      .from('service_areas')
      .select(`
        *,
        city_locality:cities_localities!inner(
          *,
          district_lga:districts_lgas!inner(
            *,
            state_region:states_regions!inner(
              *,
              country:countries!inner(*)
            )
          )
        )
      `)
      .eq('id', nearest.id)
      .single();

    if (hierarchy) {
      const cl = hierarchy.city_locality;
      const dl = cl.district_lga;
      const sr = dl.state_region;
      city = { id: cl.id, name: cl.name, district_lga_id: cl.district_lga_id, is_active: cl.is_active, created_at: cl.created_at };
      district = { id: dl.id, name: dl.name, state_region_id: dl.state_region_id, is_active: dl.is_active, created_at: dl.created_at };
      state = { id: sr.id, name: sr.name, country_id: sr.country_id, code: sr.code, is_active: sr.is_active, created_at: sr.created_at };
      country = sr.country;
    }
  }

  // Find nearby collection points
  const { data: nearbyPoints } = await supabase.rpc('find_nearby_collection_points', {
    user_lat: latitude,
    user_lng: longitude,
    max_distance_km: 15,
    result_limit: 5,
  });

  return jsonResponse({
    service_area: serviceArea,
    city,
    district,
    state,
    country,
    nearest_collection_points: nearbyPoints ?? [],
  });
}

/**
 * GET /locations/hierarchy
 * Return the full location hierarchy for manual selection.
 * Optionally filter by country_id or state_id.
 */
async function handleHierarchy(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    throw new HttpError(405, 'Method not allowed');
  }

  const url = new URL(req.url);
  const countryId = url.searchParams.get('country_id');
  const stateId = url.searchParams.get('state_id');

  const supabase = createServiceClient();

  // If requesting a specific state's children
  if (stateId) {
    const { data: districts, error } = await supabase
      .from('districts_lgas')
      .select(`
        *,
        cities:cities_localities(
          *,
          service_areas:service_areas(*)
        )
      `)
      .eq('state_region_id', stateId)
      .eq('is_active', true)
      .order('name');

    if (error) throw new HttpError(500, 'Failed to fetch location hierarchy');
    return jsonResponse({ districts });
  }

  // Full hierarchy (or filtered by country)
  let query = supabase
    .from('countries')
    .select(`
      *,
      states:states_regions(
        *,
        districts:districts_lgas(
          *,
          cities:cities_localities(
            *,
            service_areas:service_areas(*)
          )
        )
      )
    `)
    .eq('is_active', true)
    .order('name');

  if (countryId) {
    query = query.eq('id', countryId);
  }

  const { data: countries, error } = await query;
  if (error) throw new HttpError(500, 'Failed to fetch location hierarchy');

  return jsonResponse({ countries: countries ?? [] });
}

/**
 * GET /locations/nearby?lat=&lng=&radius_km=
 * Find collection points within a radius of the given coordinates.
 */
async function handleNearby(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    throw new HttpError(405, 'Method not allowed');
  }

  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lng = parseFloat(url.searchParams.get('lng') ?? '');
  const radiusKm = parseFloat(url.searchParams.get('radius_km') ?? '15');

  if (isNaN(lat) || isNaN(lng)) {
    throw new HttpError(400, 'lat and lng query parameters are required');
  }

  const supabase = createServiceClient();

  const { data: collectionPoints, error } = await supabase.rpc('find_nearby_collection_points', {
    user_lat: lat,
    user_lng: lng,
    max_distance_km: radiusKm,
    result_limit: 20,
  });

  if (error) throw new HttpError(500, 'Failed to find nearby collection points');

  // Also detect the containing service area
  const { data: serviceAreas } = await supabase.rpc('find_nearest_service_area', {
    user_lat: lat,
    user_lng: lng,
    max_distance_km: radiusKm,
  });

  return jsonResponse({
    collection_points: collectionPoints ?? [],
    service_area: serviceAreas?.[0] ?? null,
  });
}

/**
 * POST /locations/user-location
 * Save or update the authenticated user's location preference.
 */
async function handleUserLocation(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    throw new HttpError(405, 'Method not allowed');
  }

  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const body = await req.json();

  const {
    country_id,
    state_region_id,
    district_lga_id,
    city_locality_id,
    service_area_id,
    latitude,
    longitude,
    is_default = true,
    is_auto_detected = false,
  } = body;

  if (!country_id || !state_region_id) {
    throw new HttpError(400, 'country_id and state_region_id are required');
  }

  // If setting as default, unset any existing defaults for this user
  if (is_default) {
    await supabase
      .from('user_locations')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  // Build the detected_point if coordinates are provided
  const insertData: Record<string, unknown> = {
    user_id: userId,
    country_id,
    state_region_id,
    district_lga_id: district_lga_id ?? null,
    city_locality_id: city_locality_id ?? null,
    service_area_id: service_area_id ?? null,
    is_default,
    is_auto_detected,
  };

  // If GPS coordinates are provided, store as PostGIS point
  // The RPC handles ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    insertData.detected_point = `SRID=4326;POINT(${longitude} ${latitude})`;
  }

  const { data: userLocation, error } = await supabase
    .from('user_locations')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Failed to save user location:', error);
    throw new HttpError(500, 'Failed to save location');
  }

  // Update profile default_location_id if this is the default
  if (is_default) {
    await supabase
      .from('profiles')
      .update({ default_location_id: userLocation.id })
      .eq('id', userId);
  }

  return jsonResponse({ user_location: userLocation }, 201);
}
