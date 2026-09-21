-- ============================================================================
-- STAPLE LIMITED — Migration 019: System Hardening & Automated Maintenance (Phase 9)
-- Daily double-entry wallet reconciliation, automated group buy expiry, and delayed tier rebate release
-- ============================================================================

-- 1. Daily Double-Entry Wallet Ledger Reconciliation
CREATE OR REPLACE FUNCTION reconcile_wallet_ledger()
RETURNS TABLE (
  total_wallets INTEGER,
  balanced_wallets INTEGER,
  discrepant_wallets INTEGER,
  total_system_liability DECIMAL(15, 2),
  discrepant_wallet_ids UUID[]
) AS $$
DECLARE
  v_total INTEGER := 0;
  v_balanced INTEGER := 0;
  v_discrepant INTEGER := 0;
  v_liability DECIMAL(15, 2) := 0.00;
  v_bad_ids UUID[] := '{}';
  r RECORD;
BEGIN
  -- Sum total system liability
  SELECT COALESCE(SUM(balance), 0.00), COUNT(*)::INTEGER
  INTO v_liability, v_total
  FROM wallets
  WHERE is_active = TRUE;

  -- Iterate each wallet to verify double-entry math
  FOR r IN
    SELECT
      w.id AS wallet_id,
      w.balance AS current_balance,
      COALESCE(
        SUM(
          CASE
            WHEN tx.entry_side = 'credit' THEN tx.amount
            WHEN tx.entry_side = 'debit' THEN -tx.amount
            ELSE 0.00
          END
        ),
        0.00
      ) AS ledger_balance
    FROM wallets w
    LEFT JOIN wallet_transactions tx ON tx.wallet_id = w.id
    WHERE w.is_active = TRUE
    GROUP BY w.id, w.balance
  LOOP
    IF r.current_balance = r.ledger_balance THEN
      v_balanced := v_balanced + 1;
    ELSE
      v_discrepant := v_discrepant + 1;
      v_bad_ids := array_append(v_bad_ids, r.wallet_id);
    END IF;
  END LOOP;

  -- Log reconciliation audit record
  INSERT INTO audit_logs (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    new_state,
    metadata
  )
  VALUES (
    NULL,
    'admin',
    'wallet_reconciliation_audit',
    'system_reconciliation',
    gen_random_uuid(),
    jsonb_build_object(
      'total_wallets', v_total,
      'balanced_wallets', v_balanced,
      'discrepant_wallets', v_discrepant,
      'total_system_liability', v_liability
    ),
    jsonb_build_object(
      'discrepant_wallet_ids', v_bad_ids,
      'is_clean', (v_discrepant = 0)
    )
  );

  RETURN QUERY SELECT v_total, v_balanced, v_discrepant, v_liability, v_bad_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Automated Group Buy Expiry & MVFQ Auto-Resolution (Addendum A1 & A2)
CREATE OR REPLACE FUNCTION process_expired_group_buys()
RETURNS TABLE (
  processed_count INTEGER,
  fulfilled_count INTEGER,
  closed_count INTEGER,
  total_refunded_naira DECIMAL(15, 2)
) AS $$
DECLARE
  v_processed INTEGER := 0;
  v_fulfilled INTEGER := 0;
  v_closed INTEGER := 0;
  v_refunded DECIMAL(15, 2) := 0.00;
  gb RECORD;
  ord RECORD;
  v_wallet_id UUID;
  v_balance_before DECIMAL(15, 2);
  v_balance_after DECIMAL(15, 2);
  now_iso TIMESTAMPTZ := now();
BEGIN
  -- Select all expired group buys currently in 'live' status
  FOR gb IN
    SELECT id, slug, paid_quantity, min_fulfilment_quantity
    FROM group_buys
    WHERE status = 'live'
      AND expires_at < now_iso
  LOOP
    v_processed := v_processed + 1;

    -- Case A: MVFQ Met -> Proceed to delivery_fulfilment
    IF gb.paid_quantity >= gb.min_fulfilment_quantity THEN
      UPDATE group_buys
      SET status = 'delivery_fulfilment',
          updated_at = now_iso
      WHERE id = gb.id;

      v_fulfilled := v_fulfilled + 1;

      -- Log state change
      INSERT INTO audit_logs (action, entity_type, entity_id, new_state)
      VALUES (
        'group_buy_auto_transition_fulfilment',
        'group_buy',
        gb.id,
        jsonb_build_object('status', 'delivery_fulfilment', 'paid_quantity', gb.paid_quantity, 'mvfq', gb.min_fulfilment_quantity)
      );

    -- Case B: MVFQ NOT Met -> Close buy and trigger automatic 100% wallet refund (Addendum A2)
    ELSE
      UPDATE group_buys
      SET status = 'closed',
          updated_at = now_iso
      WHERE id = gb.id;

      v_closed := v_closed + 1;

      -- Iterate each paid order in this group buy to credit user's wallet
      FOR ord IN
        SELECT id, user_id, total_amount, order_number
        FROM orders
        WHERE group_buy_id = gb.id
          AND status IN ('paid', 'pending')
      LOOP
        -- Retrieve user wallet
        SELECT id, balance INTO v_wallet_id, v_balance_before
        FROM wallets
        WHERE user_id = ord.user_id;

        IF v_wallet_id IS NOT NULL THEN
          v_balance_after := v_balance_before + ord.total_amount;

          -- Credit wallet
          UPDATE wallets
          SET balance = v_balance_after,
              updated_at = now_iso
          WHERE id = v_wallet_id;

          -- Double-entry ledger record
          INSERT INTO wallet_transactions (
            wallet_id,
            user_id,
            transaction_type,
            entry_side,
            amount,
            balance_before,
            balance_after,
            currency_code,
            order_id,
            group_buy_id,
            description,
            idempotency_key,
            metadata
          )
          VALUES (
            v_wallet_id,
            ord.user_id,
            'credit_refund',
            'credit',
            ord.total_amount,
            v_balance_before,
            v_balance_after,
            'NGN',
            ord.id,
            gb.id,
            '100% Refund: Minimum Viable Quantity not reached for ' || gb.slug,
            'refund-mvfq-' || ord.id || '-' || extract(epoch from now_iso)::text,
            jsonb_build_object('refund_reason', 'mvfq_not_met', 'order_number', ord.order_number)
          );

          -- Update order status to refunded
          UPDATE orders
          SET status = 'refunded',
              refund_reason = 'mvfq_not_met',
              refunded_at = now_iso,
              updated_at = now_iso
          WHERE id = ord.id;

          -- Send in-app notification to user
          INSERT INTO notifications (
            user_id,
            type,
            channel,
            title,
            body,
            data
          )
          VALUES (
            ord.user_id,
            'wallet_credited',
            'in_app',
            'Full Refund Credited 👛',
            'Group Buy did not reach minimum target. ₦' || to_char(ord.total_amount, 'FM999,999,999') || ' has been refunded to your staple wallet.',
            jsonb_build_object('order_id', ord.id, 'refund_reason', 'mvfq_not_met')
          );

          v_refunded := v_refunded + ord.total_amount;
        END IF;
      END LOOP;

      -- Log closure audit
      INSERT INTO audit_logs (action, entity_type, entity_id, new_state)
      VALUES (
        'group_buy_auto_closed_mvfq_failed',
        'group_buy',
        gb.id,
        jsonb_build_object('status', 'closed', 'paid_quantity', gb.paid_quantity, 'mvfq', gb.min_fulfilment_quantity)
      );
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_fulfilled, v_closed, v_refunded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delayed Pricing Tier Rebate Disbursement (48h Post-Fulfilment Hold - Addendum A4)
CREATE OR REPLACE FUNCTION disburse_delayed_tier_credits()
RETURNS TABLE (
  orders_credited INTEGER,
  total_disbursed_naira DECIMAL(15, 2)
) AS $$
DECLARE
  v_count INTEGER := 0;
  v_total DECIMAL(15, 2) := 0.00;
  ord RECORD;
  v_wallet_id UUID;
  v_balance_before DECIMAL(15, 2);
  v_balance_after DECIMAL(15, 2);
  now_iso TIMESTAMPTZ := now();
BEGIN
  -- Select orders with price adjustment where 48 hours have elapsed post fulfilment
  FOR ord IN
    SELECT
      o.id AS order_id,
      o.user_id,
      o.price_adjustment_amount,
      o.order_number,
      gb.slug AS group_buy_slug
    FROM orders o
    JOIN group_buys gb ON gb.id = o.group_buy_id
    WHERE gb.status IN ('delivery_fulfilment', 'completed')
      AND o.price_adjustment_amount > 0
      AND (o.metadata->>'tier_credit_disbursed') IS NULL
      AND gb.updated_at <= (now_iso - INTERVAL '48 hours')
  LOOP
    -- Retrieve wallet
    SELECT id, balance INTO v_wallet_id, v_balance_before
    FROM wallets
    WHERE user_id = ord.user_id;

    IF v_wallet_id IS NOT NULL THEN
      v_balance_after := v_balance_before + ord.price_adjustment_amount;

      -- Credit wallet
      UPDATE wallets
      SET balance = v_balance_after,
          updated_at = now_iso
      WHERE id = v_wallet_id;

      -- Double-entry record
      INSERT INTO wallet_transactions (
        wallet_id,
        user_id,
        transaction_type,
        entry_side,
        amount,
        balance_before,
        balance_after,
        currency_code,
        order_id,
        description,
        idempotency_key,
        metadata
      )
      VALUES (
        v_wallet_id,
        ord.user_id,
        'credit_price_adjustment',
        'credit',
        ord.price_adjustment_amount,
        v_balance_before,
        v_balance_after,
        'NGN',
        ord.order_id,
        'Retroactive Tier Discount Rebate for ' || ord.group_buy_slug,
        'rebate-' || ord.order_id || '-' || extract(epoch from now_iso)::text,
        jsonb_build_object('order_number', ord.order_number, 'hold_period', '48_hours_cleared')
      );

      -- Mark order metadata
      UPDATE orders
      SET metadata = metadata || '{"tier_credit_disbursed": true}'::jsonb,
          updated_at = now_iso
      WHERE id = ord.order_id;

      -- Send notification
      INSERT INTO notifications (
        user_id,
        type,
        channel,
        title,
        body,
        data
      )
      VALUES (
        ord.user_id,
        'pricing_tier_reached',
        'in_app',
        'Price Drop Savings Disbursed! 💰',
        'Your ₦' || to_char(ord.price_adjustment_amount, 'FM999,999,999') || ' retroactive discount has been added to your wallet.',
        jsonb_build_object('order_id', ord.order_id)
      );

      v_count := v_count + 1;
      v_total := v_total + ord.price_adjustment_amount;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_count, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Composite Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gb_live_expires ON group_buys(expires_at) WHERE status = 'live';
CREATE INDEX IF NOT EXISTS idx_orders_gb_status ON orders(group_buy_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_side_amount ON wallet_transactions(wallet_id, entry_side, amount);
