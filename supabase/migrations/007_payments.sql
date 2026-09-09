-- ============================================================================
-- STAPLE LIMITED — Migration 007: Payments & Webhooks
-- Paystack integration, anti-gaming fingerprinting (Addendum A4), idempotent webhooks
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(100) NOT NULL UNIQUE, -- STP-PAY-YYYYMMDD-XXXXXX
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),

  -- Amounts
  amount DECIMAL(15, 2) NOT NULL,
  wallet_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  gateway_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',

  -- Status & Methods
  status payment_status NOT NULL DEFAULT 'initiated',
  method payment_method NOT NULL,
  gateway_provider payment_gateway_provider,

  -- Gateway details
  gateway_reference VARCHAR(200),
  gateway_authorization_code VARCHAR(200),
  gateway_channel VARCHAR(50),
  gateway_response JSONB,

  -- Anti-Gaming Fingerprint (Addendum A4)
  -- Paystack authorization.signature / card/account fingerprint hash
  payment_fingerprint VARCHAR(200),

  -- Server-side verification
  verified_at TIMESTAMPTZ,
  verified_by VARCHAR(50),

  -- Idempotency
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_payment_amount_pos CHECK (amount > 0),
  CONSTRAINT chk_payment_split_sum CHECK (wallet_amount + gateway_amount = amount)
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_ref ON payment_transactions(gateway_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payments_fingerprint ON payment_transactions(payment_fingerprint) WHERE payment_fingerprint IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider payment_gateway_provider NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  reference VARCHAR(200),
  payload JSONB NOT NULL,
  signature VARCHAR(500),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  idempotency_key VARCHAR(200) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_reference ON payment_webhooks(reference);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON payment_webhooks(is_processed);
CREATE INDEX IF NOT EXISTS idx_webhooks_idempotency ON payment_webhooks(idempotency_key);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL CHECK (source IN ('wallet', 'gateway')),
  amount DECIMAL(15, 2) NOT NULL,
  wallet_transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_alloc_amount_pos CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_allocations_payment ON payment_allocations(payment_id);
