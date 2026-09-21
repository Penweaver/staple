-- ============================================================================
-- STAPLE LIMITED — Migration 018: Communications, Live Chat & Support (Phase 8)
-- Threaded support messages, chat automation triggers, and comprehensive RLS
-- ============================================================================

-- 1. Support Ticket Messages (Threaded customer/agent replies)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user', 'champion', 'admin', 'system'
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender ON ticket_messages(sender_id);

-- Enable RLS on communications tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Policies for support_tickets
DROP POLICY IF EXISTS support_tickets_select ON support_tickets;
CREATE POLICY support_tickets_select ON support_tickets
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

DROP POLICY IF EXISTS support_tickets_insert ON support_tickets;
CREATE POLICY support_tickets_insert ON support_tickets
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS support_tickets_update ON support_tickets;
CREATE POLICY support_tickets_update ON support_tickets
  FOR UPDATE USING (
    is_admin() OR user_id = auth.uid()
  );

-- 3. Policies for ticket_messages
DROP POLICY IF EXISTS ticket_messages_select ON ticket_messages;
CREATE POLICY ticket_messages_select ON ticket_messages
  FOR SELECT USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_messages.ticket_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS ticket_messages_insert ON ticket_messages;
CREATE POLICY ticket_messages_insert ON ticket_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND (
      is_admin() OR EXISTS (
        SELECT 1 FROM support_tickets t
        WHERE t.id = ticket_messages.ticket_id
          AND t.user_id = auth.uid()
      )
    )
  );

-- 4. Policies for notifications
DROP POLICY IF EXISTS notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS notifications_admin_all ON notifications;
CREATE POLICY notifications_admin_all ON notifications
  FOR ALL USING (
    is_admin()
  );

-- 5. Trigger: Automatically create chat_room when a Group Buy is created or activated to 'live'
CREATE OR REPLACE FUNCTION auto_create_group_buy_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'live' AND (OLD.status IS NULL OR OLD.status != 'live') THEN
    INSERT INTO chat_rooms (name, group_buy_id, is_active)
    VALUES (
      'Group Buy Discussion — ' || NEW.slug,
      NEW.id,
      TRUE
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_create_group_buy_chat ON group_buys;
CREATE TRIGGER trg_auto_create_group_buy_chat
AFTER INSERT OR UPDATE OF status ON group_buys
FOR EACH ROW
EXECUTE FUNCTION auto_create_group_buy_chat_room();

-- 6. Trigger: Automatically add participant to chat_memberships on paid order & update profile participation flag
CREATE OR REPLACE FUNCTION auto_join_group_buy_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
BEGIN
  IF NEW.status = 'paid' AND NEW.group_buy_id IS NOT NULL THEN
    -- Mark profile as having participated in Group Buy (Spec §41 eligibility)
    UPDATE profiles
    SET has_participated_in_group_buy = TRUE
    WHERE id = NEW.user_id;

    -- Find chat room for this group buy
    SELECT id INTO v_room_id
    FROM chat_rooms
    WHERE group_buy_id = NEW.group_buy_id
    LIMIT 1;

    -- If room exists, add user to membership
    IF v_room_id IS NOT NULL THEN
      INSERT INTO chat_memberships (room_id, user_id, is_active)
      VALUES (v_room_id, NEW.user_id, TRUE)
      ON CONFLICT (room_id, user_id) DO UPDATE
      SET is_active = TRUE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_join_group_buy_chat ON orders;
CREATE TRIGGER trg_auto_join_group_buy_chat
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION auto_join_group_buy_chat();
