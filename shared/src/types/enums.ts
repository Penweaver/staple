/**
 * STAPLE LIMITED — Core Enums
 * Authoritative system enums matching PostgreSQL database schema (v1.1)
 */

// Identity & Roles
export enum UserRole {
  USER = 'user',
  CHAMPION = 'champion',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum ChampionStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum ChampionApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Group Buying
export enum GroupBuyType {
  REGULAR = 'regular',
  FESTIVE = 'festive',
}

export enum GroupBuyStatus {
  DRAFT = 'draft',
  PENDING_ACTIVATION = 'pending_activation',
  LIVE = 'live',
  TARGET_REACHED = 'target_reached',
  LIFESPAN_EXPIRED = 'lifespan_expired',
  DELIVERY_FULFILMENT = 'delivery_fulfilment',
  COMPLETED = 'completed',
  CLOSED = 'closed',
}

export enum GroupBuyCreatorType {
  ADMIN = 'admin',
  CHAMPION = 'champion',
}

// Orders & Refunds
export enum OrderStatus {
  PENDING = 'pending',
  PAYMENT_PROCESSING = 'payment_processing',
  PAID = 'paid',
  FULFILMENT_READY = 'fulfilment_ready',
  IN_FULFILMENT = 'in_fulfilment',
  FULFILLED = 'fulfilled',
  COLLECTED = 'collected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum RefundReason {
  USER_CANCELLED = 'user_cancelled',
  MVFQ_NOT_MET = 'mvfq_not_met',
  FULFILMENT_FAILED = 'fulfilment_failed',
  FESTIVE_SEASON_CANCELLED = 'festive_season_cancelled',
}

// Payments
export enum PaymentStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  ABANDONED = 'abandoned',
}

export enum PaymentMethod {
  GATEWAY = 'gateway',
  WALLET = 'wallet',
  SPLIT = 'split',
}

export enum PaymentGatewayProvider {
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
}

// Wallet
export enum WalletTransactionType {
  CREDIT_PRICE_ADJUSTMENT = 'credit_price_adjustment',
  CREDIT_PROMOTIONAL = 'credit_promotional',
  CREDIT_OPERATIONAL = 'credit_operational',
  CREDIT_CHAMPION_MILESTONE = 'credit_champion_milestone',
  CREDIT_REFUND = 'credit_refund',
  DEBIT_PURCHASE = 'debit_purchase',
  DEBIT_REVERSAL = 'debit_reversal',
}

export enum WalletEntrySide {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

// Festive
export enum FestiveCategory {
  CHRISTMAS = 'christmas',
  ILEYA = 'ileya',
  OWAMBE_PARTY = 'owambe_party',
}

export enum FestivePaymentType {
  OUTRIGHT = 'outright',
  INSTALMENT = 'instalment',
}

export enum InstalmentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

// Fulfilment
export enum FulfilmentStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY_FOR_COLLECTION = 'ready_for_collection',
  IN_DELIVERY = 'in_delivery',
  COLLECTED = 'collected',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum FulfilmentMethod {
  COLLECTION = 'collection',
  DELIVERY = 'delivery',
}

// Communication & Support
export enum NotificationType {
  GROUP_BUY_CREATED = 'group_buy_created',
  GROUP_BUY_LIVE = 'group_buy_live',
  GROUP_BUY_SHARED = 'group_buy_shared',
  PRICING_TIER_REACHED = 'pricing_tier_reached',
  WALLET_CREDITED = 'wallet_credited',
  TARGET_APPROACHING = 'target_approaching',
  TARGET_REACHED = 'target_reached',
  GROUP_BUY_EXPIRING = 'group_buy_expiring',
  GROUP_BUY_FULFILMENT = 'group_buy_fulfilment',
  ORDER_CONFIRMED = 'order_confirmed',
  PAYMENT_SUCCESSFUL = 'payment_successful',
  PAYMENT_FAILED = 'payment_failed',
  FULFILMENT_READY = 'fulfilment_ready',
  COLLECTION_READY = 'collection_ready',
  FESTIVE_INSTALMENT_REMINDER = 'festive_instalment_reminder',
  CHAMPION_APPROVED = 'champion_approved',
  CHAMPION_SUSPENDED = 'champion_suspended',
  SUPPORT_RESPONSE = 'support_response',
  GENERAL = 'general',
}

export enum NotificationChannel {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}
