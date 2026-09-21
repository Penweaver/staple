/**
 * STAPLE LIMITED — Core Entity Interfaces
 * Reflecting the PostgreSQL schema defined in Implementation Plan v1.1
 */

import {
  UserRole,
  ChampionStatus,
  ChampionApplicationStatus,
  GroupBuyType,
  GroupBuyStatus,
  GroupBuyCreatorType,
  OrderStatus,
  RefundReason,
  PaymentStatus,
  PaymentMethod,
  PaymentGatewayProvider,
  WalletTransactionType,
  WalletEntrySide,
  FestiveCategory,
  FestivePaymentType,
  InstalmentStatus,
  FulfilmentStatus,
  FulfilmentMethod,
  NotificationType,
  NotificationChannel,
  TicketStatus,
} from './enums.js';

// --- Identity ---
export interface Profile {
  id: string;
  phone: string | null;
  email: string | null;
  first_name: string;
  last_name: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  champion_status: ChampionStatus;
  champion_approved_at: string | null;
  champion_approved_by: string | null;
  champion_suspended_at: string | null;
  champion_suspended_by: string | null;
  champion_suspension_reason: string | null;
  default_location_id: string | null;
  has_participated_in_group_buy: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChampionApplication {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  state: string;
  lga: string;
  neighborhood: string;
  service_area_id: string | null;
  estimated_network_size: number;
  motivation: string;
  experience: string | null;
  status: ChampionApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChampionMetrics {
  userId: string;
  championStatus: ChampionStatus;
  activeGroupBuysCount: number;
  maxActiveGroupBuys: number;
  totalGroupBuysOrganized: number;
  successfulGroupBuysCount: number;
  totalGmvNaira: number;
  milestoneRewardsEarnedNaira: number;
  communityMembersReached: number;
}

// --- Location Hierarchy ---
export interface Country {
  id: string;
  name: string;
  iso_code: string;
  currency_code: string;
  is_active: boolean;
  created_at: string;
}

export interface StateRegion {
  id: string;
  country_id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DistrictLGA {
  id: string;
  state_region_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface CityLocality {
  id: string;
  district_lga_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface ServiceArea {
  id: string;
  city_locality_id: string;
  name: string;
  description: string | null;
  radius_km: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionPoint {
  id: string;
  service_area_id: string;
  name: string;
  address: string;
  contact_phone: string | null;
  contact_name: string | null;
  operating_hours: Record<string, { open: string; close: string }> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLocation {
  id: string;
  user_id: string;
  country_id: string;
  state_region_id: string;
  district_lga_id: string | null;
  city_locality_id: string | null;
  service_area_id: string | null;
  is_default: boolean;
  is_auto_detected: boolean;
  created_at: string;
  updated_at: string;
}

// --- Catalogue ---
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  parent_category_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  unit: string;
  weight_value: number | null;
  weight_unit: string | null;
  base_price: number;
  currency_code: string;
  min_group_buy_target: number;
  max_group_buy_target: number;
  max_units_per_user: number;
  minimum_fulfilment_quantity: number; // MVFQ (Addendum A1)
  is_active: boolean;
  is_festive: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Basket {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  total_price: number;
  currency_code: string;
  max_units_per_user: number;
  minimum_fulfilment_quantity: number; // MVFQ (Addendum A1)
  is_active: boolean;
  is_festive: boolean;
  festive_category: FestiveCategory | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BasketItem {
  id: string;
  basket_id: string;
  product_id: string;
  quantity: number;
  sort_order: number;
  created_at: string;
  product?: Product;
}

// --- Group Buys ---
export interface GroupBuy {
  id: string;
  slug: string;
  qr_code_url: string | null;
  type: GroupBuyType;
  creator_type: GroupBuyCreatorType;
  created_by: string;
  product_id: string | null;
  basket_id: string | null;
  unit_price: number;
  original_unit_price: number;
  currency_code: string;
  target_quantity: number;
  paid_quantity: number;
  max_units_per_user: number;
  min_fulfilment_quantity: number; // MVFQ (Addendum A1)
  status: GroupBuyStatus;
  lifespan_days: number;
  live_at: string | null;
  expires_at: string | null;
  target_reached_at: string | null;
  closed_at: string | null;
  completed_at: string | null;
  service_area_id: string | null;
  collection_point_id: string | null;
  festive_category: FestiveCategory | null;
  has_minimum_threshold: boolean;
  allow_oversubscription: boolean;
  description: string | null;
  share_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;

  // Joined relations (optional)
  product?: Product;
  basket?: Basket;
  pricing_tiers?: GroupBuyPricingTier[];
  participants_count?: number;
}

export interface GroupBuyPricingTier {
  id: string;
  group_buy_id: string;
  min_percentage: number;
  max_percentage: number | null;
  discount_percentage: number;
  discounted_price: number;
  is_active: boolean;
  activated_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface GroupBuyParticipant {
  id: string;
  group_buy_id: string;
  user_id: string;
  is_champion: boolean;
  total_quantity: number;
  joined_at: string;
  updated_at: string;
}

export interface GroupBuyEvent {
  id: string;
  group_buy_id: string;
  event_type: string;
  previous_status: GroupBuyStatus | null;
  new_status: GroupBuyStatus | null;
  triggered_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// --- Orders ---
export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  group_buy_id: string | null;
  product_id: string | null;
  basket_id: string | null;
  quantity: number;
  unit_price_at_purchase: number;
  total_amount: number;
  currency_code: string;
  status: OrderStatus;
  wallet_amount: number;
  gateway_amount: number;
  price_adjustment_amount: number;
  effective_unit_price: number | null;
  idempotency_key: string;
  is_festive_plan: boolean;
  festive_plan_id: string | null;
  is_champion_activation: boolean;
  refund_reason: RefundReason | null; // Addendum A2
  refunded_at: string | null;
  refunded_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// --- Payments ---
export interface PaymentTransaction {
  id: string;
  reference: string;
  order_id: string;
  user_id: string;
  amount: number;
  wallet_amount: number;
  gateway_amount: number;
  currency_code: string;
  status: PaymentStatus;
  method: PaymentMethod;
  gateway_provider: PaymentGatewayProvider | null;
  gateway_reference: string | null;
  gateway_authorization_code: string | null;
  gateway_channel: string | null;
  gateway_response: Record<string, unknown> | null;
  payment_fingerprint: string | null; // Anti-gaming (Addendum A4)
  verified_at: string | null;
  verified_by: string | null;
  idempotency_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaymentWebhook {
  id: string;
  provider: PaymentGatewayProvider;
  event_type: string;
  reference: string | null;
  payload: Record<string, unknown>;
  signature: string | null;
  is_verified: boolean;
  is_processed: boolean;
  processed_at: string | null;
  processing_error: string | null;
  idempotency_key: string;
  created_at: string;
}

// --- Wallet ---
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  transaction_type: WalletTransactionType;
  entry_side: WalletEntrySide;
  amount: number;
  balance_before: number;
  balance_after: number;
  currency_code: string;
  order_id: string | null;
  group_buy_id: string | null;
  payment_id: string | null;
  description: string;
  idempotency_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// --- Festive ---
export interface FestiveSeason {
  id: string;
  category: FestiveCategory;
  name: string;
  year: number;
  event_date: string | null;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  planning_start_date: string | null;
  planning_end_date: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FestivePlan {
  id: string;
  season_id: string;
  user_id: string;
  basket_id: string;
  payment_type: FestivePaymentType;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  currency_code: string;
  preferred_delivery_date: string | null;
  delivery_date: string | null;
  collection_point_id: string | null;
  is_fully_paid: boolean;
  status: string;
  no_refund_acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

export interface FestiveInstalment {
  id: string;
  plan_id: string;
  instalment_number: number;
  amount: number;
  due_date: string;
  status: InstalmentStatus;
  paid_at: string | null;
  order_id: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

// --- Fulfilment ---
export interface Fulfilment {
  id: string;
  group_buy_id: string | null;
  order_id: string;
  user_id: string;
  method: FulfilmentMethod;
  status: FulfilmentStatus;
  collection_point_id: string | null;
  scheduled_date: string | null;
  scheduled_slot: string | null;
  collected_at: string | null;
  delivered_at: string | null;
  collected_by: string | null;
  collection_code: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface HubStagingLoad {
  collectionPointId: string;
  hubName: string;
  address: string;
  contactPhone: string | null;
  contactName: string | null;
  operatingHours: Record<string, { open: string; close: string }> | null;
  readyUnitsCount: number;
  collectedUnitsCount: number;
  pendingUnitsCount: number;
  totalOrdersCount: number;
}

// --- System Configuration & Audit ---
export interface SystemConfig {
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// --- Communications & Live Chat ---
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  assigned_to: string | null;
  resolved_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  user?: Profile;
  assigned_profile?: Profile;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'user' | 'champion' | 'admin' | 'system';
  message: string;
  attachments: string[];
  created_at: string;
  sender?: Profile;
}

export interface ChatRoom {
  id: string;
  name: string;
  group_buy_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ChatMembership {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  sender_name?: string;
  sender_role?: string;
  is_champion?: boolean;
}
