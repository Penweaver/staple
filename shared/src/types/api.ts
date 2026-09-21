/**
 * STAPLE LIMITED — API Request/Response Types
 * Type contracts for Supabase Edge Function endpoints (Phase 2: Catalogue & Location)
 */

import type {
  Country,
  StateRegion,
  DistrictLGA,
  CityLocality,
  ServiceArea,
  CollectionPoint,
  UserLocation,
  Product,
  ProductImage,
  ProductCategory,
  Basket,
  BasketItem,
} from './entities.js';

// ──────────────────────────────────────────────
// Location API Types
// ──────────────────────────────────────────────

/** POST /functions/v1/locations/detect */
export interface DetectLocationRequest {
  latitude: number;
  longitude: number;
}

export interface DetectLocationResponse {
  service_area: ServiceArea | null;
  city: CityLocality | null;
  district: DistrictLGA | null;
  state: StateRegion | null;
  country: Country | null;
  nearest_collection_points: CollectionPointWithDistance[];
}

export interface CollectionPointWithDistance extends CollectionPoint {
  distance_km: number;
}

/** GET /functions/v1/locations/hierarchy */
export interface LocationHierarchyResponse {
  countries: CountryWithChildren[];
}

export interface CountryWithChildren extends Country {
  states: StateWithChildren[];
}

export interface StateWithChildren extends StateRegion {
  districts: DistrictWithChildren[];
}

export interface DistrictWithChildren extends DistrictLGA {
  cities: CityWithChildren[];
}

export interface CityWithChildren extends CityLocality {
  service_areas: ServiceArea[];
}

/** POST /functions/v1/locations/user-location */
export interface SaveUserLocationRequest {
  country_id: string;
  state_region_id: string;
  district_lga_id?: string;
  city_locality_id?: string;
  service_area_id?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
  is_auto_detected?: boolean;
}

export interface SaveUserLocationResponse {
  user_location: UserLocation;
}

/** GET /functions/v1/locations/nearby?lat=&lng=&radius_km= */
export interface NearbyCollectionPointsRequest {
  latitude: number;
  longitude: number;
  radius_km?: number; // Default: 15km (BUSINESS_RULES.DEFAULT_DISCOVERY_RADIUS_METERS / 1000)
}

export interface NearbyCollectionPointsResponse {
  collection_points: CollectionPointWithDistance[];
  service_area: ServiceArea | null;
}

// ──────────────────────────────────────────────
// Catalogue API Types
// ──────────────────────────────────────────────

/** GET /functions/v1/catalogue/products?category_id=&service_area_id=&search=&page=&limit= */
export interface ProductListRequest {
  category_id?: string;
  service_area_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  is_festive?: boolean;
}

export interface ProductListResponse {
  products: ProductWithImages[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
  primary_image_url: string | null;
  category_name: string;
}

/** GET /functions/v1/catalogue/products/:id */
export interface ProductDetailResponse {
  product: ProductWithImages;
  location_availability: ProductLocationAvailability[];
}

export interface ProductLocationAvailability {
  country_name: string;
  state_name: string | null;
  service_area_name: string | null;
  is_available: boolean;
}

/** GET /functions/v1/catalogue/categories */
export interface CategoryListResponse {
  categories: ProductCategory[];
}

/** GET /functions/v1/catalogue/baskets?service_area_id=&is_festive= */
export interface BasketListRequest {
  service_area_id?: string;
  is_festive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BasketListResponse {
  baskets: BasketWithItems[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface BasketWithItems extends Basket {
  items: BasketItemWithProduct[];
  primary_image_url: string | null;
}

export interface BasketItemWithProduct extends BasketItem {
  product: Product;
}

/** GET /functions/v1/catalogue/baskets/:id */
export interface BasketDetailResponse {
  basket: BasketWithItems;
}

// ──────────────────────────────────────────────
// Admin Catalogue API Types
// ──────────────────────────────────────────────

/** POST /functions/v1/catalogue/products (Admin) */
export interface CreateProductRequest {
  category_id: string;
  name: string;
  slug?: string; // Auto-generated from name if omitted
  description?: string;
  unit: string;
  weight_value?: number;
  weight_unit?: string;
  base_price: number;
  min_group_buy_target: number;
  max_group_buy_target: number;
  max_units_per_user?: number;
  minimum_fulfilment_quantity: number;
  is_active?: boolean;
  is_festive?: boolean;
  metadata?: Record<string, unknown>;
}

/** PUT /functions/v1/catalogue/products/:id (Admin) */
export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

/** POST /functions/v1/catalogue/baskets (Admin) */
export interface CreateBasketRequest {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  total_price: number;
  max_units_per_user?: number;
  minimum_fulfilment_quantity: number;
  is_active?: boolean;
  is_festive?: boolean;
  festive_category?: string;
  items: { product_id: string; quantity: number }[];
}

/** POST /functions/v1/catalogue/images/upload (Admin) */
export interface UploadProductImageRequest {
  product_id: string;
  alt_text?: string;
  is_primary?: boolean;
}

export interface UploadProductImageResponse {
  image: ProductImage;
}

// ──────────────────────────────────────────────
// Admin Location API Types
// ──────────────────────────────────────────────

/** POST /functions/v1/locations/service-areas (Admin) */
export interface CreateServiceAreaRequest {
  city_locality_id: string;
  name: string;
  description?: string;
  center_latitude: number;
  center_longitude: number;
  radius_km: number;
  is_active?: boolean;
}

/** POST /functions/v1/locations/collection-points (Admin) */
export interface CreateCollectionPointRequest {
  service_area_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone?: string;
  contact_name?: string;
  operating_hours?: Record<string, { open: string; close: string }>;
  is_active?: boolean;
}

// ──────────────────────────────────────────────
// Common API Types
// ──────────────────────────────────────────────

/** Standard error response from all Edge Functions */
export interface ApiErrorResponse {
  error: string;
  message: string;
  status: number;
}

/** Standard paginated request parameters */
export interface PaginationParams {
  page?: number;
  limit?: number;
}
