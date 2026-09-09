-- ============================================================================
-- STAPLE LIMITED — Migration 008: Wallet & Double-Entry Ledger
-- Materialized balance with strict audit ledger, no bank withdrawals in MVP (§24)
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_wallet_balance_non_neg CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  transaction_type wallet_transaction_type NOT NULL,
  entry_side wallet_entry_side NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  balance_before DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',

  -- Entity links
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  group_buy_id UUID REFERENCES group_buys(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,

  description TEXT NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_tx_amount_pos CHECK (amount > 0),
  CONSTRAINT chk_balance_math CHECK (
    (entry_side = 'credit' AND balance_after = balance_before + amount) OR
    (entry_side = 'debit' AND balance_after = balance_before - amount)
  )
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_idempotency ON wallet_transactions(idempotency_key);

-- Link payment allocations to wallet transactions
DO $$ BEGIN
  ALTER TABLE payment_allocations
    ADD CONSTRAINT fk_alloc_wallet_tx
    FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
