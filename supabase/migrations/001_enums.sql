-- ============================================================================
-- STAPLE LIMITED — Migration 001: Enums
-- Authoritative system enums as specified in Implementation Plan v1.1
-- ============================================================================

-- Extensions required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Identity & Roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'champion', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE champion_status AS ENUM ('inactive', 'active', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Group Buying
DO $$ BEGIN
  CREATE TYPE group_buy_type AS ENUM ('regular', 'festive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE group_buy_status AS ENUM (
    'draft', 'pending_activation', 'live', 'target_reached',
    'lifespan_expired', 'delivery_fulfilment', 'completed', 'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE group_buy_creator_type AS ENUM ('admin', 'champion');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Orders & Refunds
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending', 'payment_processing', 'paid', 'fulfilment_ready',
    'in_fulfilment', 'fulfilled', 'collected', 'cancelled', 'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE refund_reason AS ENUM (
    'user_cancelled', 'mvfq_not_met', 'fulfilment_failed', 'festive_season_cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payments
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'initiated', 'pending', 'successful', 'failed', 'refunded', 'abandoned'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('gateway', 'wallet', 'split');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_gateway_provider AS ENUM ('paystack', 'flutterwave');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Wallet
DO $$ BEGIN
  CREATE TYPE wallet_transaction_type AS ENUM (
    'credit_price_adjustment', 'credit_promotional', 'credit_operational',
    'credit_champion_milestone', 'credit_refund',
    'debit_purchase', 'debit_reversal'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE wallet_entry_side AS ENUM ('debit', 'credit');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Festive
DO $$ BEGIN
  CREATE TYPE festive_category AS ENUM ('christmas', 'ileya', 'owambe_party');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE festive_payment_type AS ENUM ('outright', 'instalment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE instalment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Fulfilment
DO $$ BEGIN
  CREATE TYPE fulfilment_status AS ENUM (
    'pending', 'preparing', 'ready_for_collection', 'in_delivery',
    'collected', 'delivered', 'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfilment_method AS ENUM ('collection', 'delivery');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Communication & Notifications
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'group_buy_created', 'group_buy_live', 'group_buy_shared',
    'pricing_tier_reached', 'wallet_credited', 'target_approaching',
    'target_reached', 'group_buy_expiring', 'group_buy_fulfilment',
    'order_confirmed', 'payment_successful', 'payment_failed',
    'fulfilment_ready', 'collection_ready', 'festive_instalment_reminder',
    'champion_approved', 'champion_suspended', 'support_response',
    'general'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('push', 'sms', 'email', 'in_app');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Support
DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
