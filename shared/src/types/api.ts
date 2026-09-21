/**
 * STAPLE LIMITED — API Request/Response Types
 * Type contracts for Supabase Edge Function endpoints (Phase 2 & Phase 3)
 */

import type {
  GroupBuyStatus,
  GroupBuyType,
  GroupBuyCreatorType,
} from './enums.js';

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
  GroupBuy,
  GroupBuyPricingTier,
  GroupBuyParticipant,
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
  radius_km?: number; // Default: 15km
}

export interface NearbyCollectionPointsResponse {
  collection_points: CollectionPointWithDistance[];
  service_area: ServiceArea | null;
}

// ──────────────────────────────────────────────
// Catalogue API Types
// ──────────────────────────────────────────────

/** GET /functions/v1/catalogue/products */
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

/** GET /functions/v1/catalogue/baskets */
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
// Phase 3: Group Buy API Types
// ──────────────────────────────────────────────

/** GET /functions/v1/group-buys/discover */
export interface GroupBuyDiscoverRequest {
  service_area_id?: string;
  latitude?: number;
  longitude?: number;
  category_id?: string;
  status?: GroupBuyStatus;
  type?: GroupBuyType;
  page?: number;
  limit?: number;
}

export interface GroupBuyDiscoverItem {
  id: string;
  slug: string;
  type: GroupBuyType;
  creator_type: GroupBuyCreatorType;
  champion_name: string | null;
  title: string;
  category_name: string;
  image_url: string | null;
  unit: string;
  unit_price: number;
  original_unit_price: number;
  currency_code: string;
  target_quantity: number;
  paid_quantity: number;
  min_fulfilment_quantity: number; // MVFQ (Addendum A1)
  status: GroupBuyStatus;
  days_remaining: number;
  service_area_name: string;
  collection_point_name: string | null;
  progress_percentage: number;
  current_tier: GroupBuyPricingTier | null;
  participants_count: number;
}

export interface GroupBuyDiscoverResponse {
  group_buys: GroupBuyDiscoverItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

/** GET /functions/v1/group-buys/:id */
export interface GroupBuyDetailResponse {
  group_buy: GroupBuy & {
    product?: ProductWithImages;
    basket?: BasketWithItems;
    pricing_tiers: GroupBuyPricingTier[];
    participants_count: number;
    champion_name: string | null;
    service_area_name: string;
    collection_point_name: string | null;
    progress_percentage: number;
    days_remaining: number;
    current_tier: GroupBuyPricingTier | null;
    next_tier: GroupBuyPricingTier | null;
    user_participation?: {
      quantity: number;
      orders_count: number;
      max_units_remaining: number;
    };
  };
}

/** POST /functions/v1/group-buys/create */
export interface CreateGroupBuyRequest {
  product_id?: string;
  basket_id?: string;
  service_area_id: string;
  collection_point_id?: string;
  target_quantity: number;
  lifespan_days?: number; // Default 14
  initial_purchase_quantity?: number; // Champion initial activation units (1-10)
  description?: string;
  share_message?: string;
}

export interface CreateGroupBuyResponse {
  group_buy: GroupBuy;
  pricing_tiers: GroupBuyPricingTier[];
  activation_required: boolean;
  activation_order_id?: string;
  qr_code_url: string;
  share_url: string;
}

/** POST /functions/v1/group-buys/:id/join */
export interface JoinGroupBuyRequest {
  quantity: number; // 1-10 units
  collection_point_id?: string;
  use_wallet?: boolean;
}

export interface JoinGroupBuyResponse {
  order_id: string;
  order_number: string;
  unit_price: number;
  total_amount: number;
  wallet_amount: number;
  gateway_amount: number;
  requires_gateway_payment: boolean;
  payment_reference?: string;
  paystack_access_code?: string;
}

/** QR code & Social Sharing data contract */
export interface GroupBuyShareData {
  title: string;
  product_name: string;
  slug: string;
  share_url: string;
  qr_code_url: string;
  area_name: string;
  current_price: number;
  original_price: number;
  savings_percentage: number;
  target_quantity: number;
  paid_quantity: number;
  whatsapp_message: string;
  sms_message: string;
}

// ──────────────────────────────────────────────
// Admin Catalogue API Types
// ──────────────────────────────────────────────

/** POST /functions/v1/catalogue/products (Admin) */
export interface CreateProductRequest {
  category_id: string;
  name: string;
  slug?: string;
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

export interface ApiErrorResponse {
  error: string;
  message: string;
  status: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
