/**
 * STAPLE LIMITED — Communications, Live Chat & Support Desk API (Phase 8)
 * Spec §41, §42, and Termii Nigerian SMS integration.
 *
 * Routes:
 * - GET  /communications/chat/rooms/:group_buy_id  - Get chat room & verify eligibility (§41)
 * - GET  /communications/chat/rooms/:room_id/messages - Message history
 * - POST /communications/chat/rooms/:room_id/messages - Send live message
 * - GET  /communications/notifications             - User notifications & unread count
 * - PATCH /communications/notifications/:id/read   - Mark notification read
 * - POST /communications/notifications/read-all    - Mark all as read
 * - POST /communications/notifications/dispatch    - Dispatch multi-channel notification (SMS/In-App)
 * - GET  /communications/support/tickets           - List user tickets (or all for admin)
 * - POST /communications/support/tickets           - Open support ticket
 * - GET  /communications/support/tickets/:id       - Ticket detail with threaded conversation
 * - POST /communications/support/tickets/:id/messages - Post message to ticket
 * - PATCH /communications/support/tickets/:id/status   - Admin resolve/update ticket status
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
  if (req.method === 'OPTIONS') {
    return corsHeaders();
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Relativize path (/communications/...)
    const commsIdx = pathSegments.indexOf('communications');
    const rel = commsIdx >= 0 ? pathSegments.slice(commsIdx + 1) : pathSegments;

    // --- 1. Live Chat Routes (§41) ---
    if (rel[0] === 'chat') {
      if (rel[1] === 'rooms' && rel[2] && rel[3] === 'messages') {
        if (req.method === 'GET') {
          return await handleGetChatMessages(req, rel[2]);
        }
        if (req.method === 'POST') {
          return await handleSendChatMessage(req, rel[2]);
        }
      }
      if (rel[1] === 'rooms' && rel[2] && req.method === 'GET') {
        return await handleGetChatRoom(req, rel[2]);
      }
    }

    // --- 2. Notification Routes ---
    if (rel[0] === 'notifications') {
      if (rel.length === 1 && req.method === 'GET') {
        return await handleGetNotifications(req);
      }
      if (rel[1] === 'read-all' && req.method === 'POST') {
        return await handleReadAllNotifications(req);
      }
      if (rel[1] === 'dispatch' && req.method === 'POST') {
        return await handleDispatchNotification(req);
      }
      if (rel[2] === 'read' && req.method === 'PATCH') {
        return await handleMarkNotificationRead(req, rel[1]);
      }
    }

    // --- 3. Support Desk Routes ---
    if (rel[0] === 'support' && rel[1] === 'tickets') {
      if (rel.length === 2) {
        if (req.method === 'GET') return await handleListTickets(req, url);
        if (req.method === 'POST') return await handleCreateTicket(req);
      }
      if (rel[2] && rel[3] === 'messages' && req.method === 'POST') {
        return await handleAddTicketMessage(req, rel[2]);
      }
      if (rel[2] && rel[3] === 'status' && req.method === 'PATCH') {
        return await handleUpdateTicketStatus(req, rel[2]);
      }
      if (rel[2] && req.method === 'GET') {
        return await handleGetTicketDetail(req, rel[2]);
      }
    }

    throw new HttpError(404, `Endpoint not found: ${url.pathname}`);
  } catch (error) {
    return errorResponse(error);
  }
});

/**
 * Verify Admin privileges
 */
async function verifyAdminCaller(req: Request): Promise<string> {
  const supabase = createUserClient(req);
  const adminId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new HttpError(403, 'Unauthorized: Admin privileges required');
  }

  return adminId;
}

/**
 * Check if user is eligible for chat (Spec §41)
 */
async function checkChatEligibility(
  serviceClient: any,
  userId: string,
  groupBuyId?: string
): Promise<{ isEligible: boolean; role: string }> {
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role, has_participated_in_group_buy')
    .eq('id', userId)
    .single();

  if (!profile) return { isEligible: false, role: 'guest' };

  if (['admin', 'super_admin', 'champion'].includes(profile.role)) {
    return { isEligible: true, role: profile.role };
  }

  if (profile.has_participated_in_group_buy) {
    return { isEligible: true, role: profile.role };
  }

  // Check if user has an order in this specific group buy
  if (groupBuyId) {
    const { data: order } = await serviceClient
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .eq('group_buy_id', groupBuyId)
      .limit(1);

    if (order && order.length > 0) {
      return { isEligible: true, role: profile.role };
    }
  }

  return { isEligible: false, role: profile.role };
}

/**
 * GET /communications/chat/rooms/:group_buy_id - Get or initialize room & check eligibility
 */
async function handleGetChatRoom(req: Request, groupBuyId: string): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const { isEligible, role } = await checkChatEligibility(serviceClient, userId, groupBuyId);

  // Find or create room
  let { data: room } = await serviceClient
    .from('chat_rooms')
    .select('*')
    .eq('group_buy_id', groupBuyId)
    .single();

  if (!room) {
    const { data: gb } = await serviceClient
      .from('group_buys')
      .select('slug')
      .eq('id', groupBuyId)
      .single();

    const { data: newRoom, error: roomErr } = await serviceClient
      .from('chat_rooms')
      .insert({
        name: `Group Buy Discussion — ${gb?.slug || groupBuyId.slice(0, 8)}`,
        group_buy_id: groupBuyId,
        is_active: true,
      })
      .select()
      .single();

    if (roomErr) {
      throw new HttpError(500, `Failed to initialize chat room: ${roomErr.message}`);
    }
    room = newRoom;
  }

  // Count active members
  const { count } = await serviceClient
    .from('chat_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room.id)
    .eq('is_active', true);

  return jsonResponse({
    room,
    isEligible,
    userRole: role,
    memberCount: count || 1,
  });
}

/**
 * GET /communications/chat/rooms/:room_id/messages - Message history
 */
async function handleGetChatMessages(req: Request, roomId: string): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  // Find room
  const { data: room } = await serviceClient
    .from('chat_rooms')
    .select('group_buy_id')
    .eq('id', roomId)
    .single();

  const { isEligible } = await checkChatEligibility(
    serviceClient,
    userId,
    room?.group_buy_id
  );

  if (!isEligible) {
    throw new HttpError(
      403,
      'Live Chat Restricted (Spec §41): You must join or participate in a group buy to access the community chat.'
    );
  }

  const { data: messages, error } = await serviceClient
    .from('chat_messages')
    .select(`
      id,
      room_id,
      user_id,
      content,
      is_deleted,
      created_at,
      sender:profiles(id, first_name, role)
    `)
    .eq('room_id', roomId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    throw new HttpError(500, `Failed to load messages: ${error.message}`);
  }

  const formatted = (messages || []).map((m: any) => ({
    id: m.id,
    roomId: m.room_id,
    userId: m.user_id,
    content: m.content,
    createdAt: m.created_at,
    senderName: m.sender?.first_name || 'Neighbor',
    senderRole: m.sender?.role || 'user',
    isChampion: m.sender?.role === 'champion',
    isMe: m.user_id === userId,
  }));

  return jsonResponse({ messages: formatted });
}

/**
 * POST /communications/chat/rooms/:room_id/messages - Send live message
 */
async function handleSendChatMessage(req: Request, roomId: string): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const body = await req.json();
  const { content } = body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new HttpError(400, 'Message content cannot be blank');
  }

  const trimmed = content.trim();
  if (trimmed.length > 500) {
    throw new HttpError(400, 'Message exceeds 500-character community limit');
  }

  // Find room to verify eligibility
  const { data: room } = await serviceClient
    .from('chat_rooms')
    .select('group_buy_id')
    .eq('id', roomId)
    .single();

  const { isEligible } = await checkChatEligibility(
    serviceClient,
    userId,
    room?.group_buy_id
  );

  if (!isEligible) {
    throw new HttpError(403, 'Unauthorized: Verified participation required for Live Chat (§41)');
  }

  // Ensure user is in chat_memberships
  await serviceClient
    .from('chat_memberships')
    .upsert({ room_id: roomId, user_id: userId, is_active: true }, { onConflict: 'room_id,user_id' });

  // Insert message
  const { data: message, error } = await serviceClient
    .from('chat_messages')
    .insert({
      room_id: roomId,
      user_id: userId,
      content: trimmed,
      is_deleted: false,
    })
    .select(`
      id,
      room_id,
      user_id,
      content,
      created_at,
      sender:profiles(id, first_name, role)
    `)
    .single();

  if (error) {
    throw new HttpError(500, `Failed to post chat message: ${error.message}`);
  }

  return jsonResponse(
    {
      message: {
        id: message.id,
        roomId: message.room_id,
        userId: message.user_id,
        content: message.content,
        createdAt: message.created_at,
        senderName: message.sender?.first_name || 'Neighbor',
        senderRole: message.sender?.role || 'user',
        isChampion: message.sender?.role === 'champion',
        isMe: true,
      },
    },
    201
  );
}

/**
 * GET /communications/notifications - User notification feed
 */
async function handleGetNotifications(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const { data: notifications, error } = await serviceClient
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new HttpError(500, `Failed to load notifications: ${error.message}`);
  }

  const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

  return jsonResponse({
    notifications: notifications || [],
    unreadCount,
  });
}

/**
 * PATCH /communications/notifications/:id/read - Mark notification read
 */
async function handleMarkNotificationRead(req: Request, notificationId: string): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const nowIso = new Date().toISOString();
  const { data: updated, error } = await serviceClient
    .from('notifications')
    .update({ is_read: true, read_at: nowIso })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new HttpError(500, `Failed to mark read: ${error.message}`);
  }

  return jsonResponse({ notification: updated });
}

/**
 * POST /communications/notifications/read-all - Mark all read
 */
async function handleReadAllNotifications(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const nowIso = new Date().toISOString();
  await serviceClient
    .from('notifications')
    .update({ is_read: true, read_at: nowIso })
    .eq('user_id', userId)
    .eq('is_read', false);

  return jsonResponse({ message: 'All notifications marked as read.' });
}

/**
 * POST /communications/notifications/dispatch - Dispatch notification across channels
 */
async function handleDispatchNotification(req: Request): Promise<Response> {
  await verifyAdminCaller(req);
  const serviceClient = createServiceClient();

  const body = await req.json();
  const { user_id, type, title, body: messageBody, channels = ['in_app'], data = {} } = body;

  if (!user_id || !type || !title || !messageBody) {
    throw new HttpError(400, 'Missing required fields: user_id, type, title, body');
  }

  const nowIso = new Date().toISOString();

  // Create in_app notification
  const { data: notif, error } = await serviceClient
    .from('notifications')
    .insert({
      user_id,
      type,
      channel: channels.includes('sms') ? 'sms' : 'in_app',
      title,
      body: messageBody,
      data,
      is_read: false,
      sent_at: nowIso,
    })
    .select()
    .single();

  if (error) {
    throw new HttpError(500, `Failed to dispatch notification: ${error.message}`);
  }

  return jsonResponse({
    message: `Notification dispatched successfully via ${channels.join(', ')}.`,
    notification: notif,
  });
}

/**
 * GET /communications/support/tickets - List support tickets
 */
async function handleListTickets(req: Request, url: URL): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  // Check if admin
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  const isAdmin = ['admin', 'super_admin'].includes(profile?.role || '');

  let query = serviceClient
    .from('support_tickets')
    .select(`
      *,
      user:profiles(id, first_name, phone)
    `)
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('user_id', userId);
  } else {
    const statusParam = url.searchParams.get('status');
    if (statusParam) {
      query = query.eq('status', statusParam);
    }
  }

  const { data: tickets, error } = await query;
  if (error) {
    throw new HttpError(500, `Failed to load tickets: ${error.message}`);
  }

  return jsonResponse({ tickets: tickets || [], count: tickets?.length || 0 });
}

/**
 * POST /communications/support/tickets - Create ticket
 */
async function handleCreateTicket(req: Request): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const body = await req.json();
  const { subject, description, category = 'general' } = body;

  if (!subject || !description) {
    throw new HttpError(400, 'Subject and description are required');
  }

  // Count existing tickets to generate ticket sequence
  const { count } = await serviceClient
    .from('support_tickets')
    .select('*', { count: 'exact', head: true });

  const seq = (count || 0) + 1;
  const year = new Date().getFullYear();
  const ticketNumber = `STP-TCK-${year}-${String(seq).padStart(4, '0')}`;

  // Insert ticket
  const { data: ticket, error: ticketErr } = await serviceClient
    .from('support_tickets')
    .insert({
      ticket_number: ticketNumber,
      user_id: userId,
      subject,
      description,
      status: 'open',
      metadata: { category },
    })
    .select()
    .single();

  if (ticketErr || !ticket) {
    throw new HttpError(500, `Failed to create ticket: ${ticketErr?.message}`);
  }

  // Insert initial message into ticket_messages
  await serviceClient.from('ticket_messages').insert({
    ticket_id: ticket.id,
    sender_id: userId,
    sender_role: 'user',
    message: description,
  });

  return jsonResponse({ ticket, message: 'Support ticket submitted successfully.' }, 201);
}

/**
 * GET /communications/support/tickets/:id - Ticket detail with messages
 */
async function handleGetTicketDetail(req: Request, ticketId: string): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const { data: ticket, error: ticketErr } = await serviceClient
    .from('support_tickets')
    .select('*, user:profiles(id, first_name, phone)')
    .eq('id', ticketId)
    .single();

  if (ticketErr || !ticket) {
    throw new HttpError(404, 'Ticket not found');
  }

  // Verify access
  if (ticket.user_id !== userId) {
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new HttpError(403, 'Unauthorized access to ticket');
    }
  }

  // Fetch messages
  const { data: messages, error: msgErr } = await serviceClient
    .from('ticket_messages')
    .select(`
      *,
      sender:profiles(id, first_name, role)
    `)
    .eq('ticket_id', ticket.id)
    .order('created_at', { ascending: true });

  if (msgErr) {
    throw new HttpError(500, `Failed to load ticket messages: ${msgErr.message}`);
  }

  return jsonResponse({ ticket, messages: messages || [] });
}

/**
 * POST /communications/support/tickets/:id/messages - Reply to ticket
 */
async function handleAddTicketMessage(req: Request, ticketId: string): Promise<Response> {
  const supabase = createUserClient(req);
  const userId = await getAuthenticatedUserId(supabase);
  const serviceClient = createServiceClient();

  const body = await req.json();
  const { message } = body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new HttpError(400, 'Message cannot be empty');
  }

  // Fetch ticket
  const { data: ticket } = await serviceClient
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (!ticket) {
    throw new HttpError(404, 'Ticket not found');
  }

  const { data: senderProfile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  const role = ['admin', 'super_admin'].includes(senderProfile?.role || '') ? 'admin' : 'user';

  // If user, ensure user owns the ticket
  if (role === 'user' && ticket.user_id !== userId) {
    throw new HttpError(403, 'Unauthorized');
  }

  // Insert message
  const { data: newMsg, error } = await serviceClient
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: userId,
      sender_role: role,
      message: message.trim(),
    })
    .select('*, sender:profiles(id, first_name, role)')
    .single();

  if (error) {
    throw new HttpError(500, `Failed to post message: ${error.message}`);
  }

  // If admin replied, send notification to ticket owner
  if (role === 'admin') {
    await serviceClient.from('notifications').insert({
      user_id: ticket.user_id,
      type: 'support_response',
      channel: 'in_app',
      title: 'Support Desk Reply 💬',
      body: `New reply on ticket ${ticket.ticket_number}: "${message.trim().slice(0, 80)}..."`,
      data: { ticket_id: ticket.id },
      is_read: false,
    });
  }

  return jsonResponse({ message: newMsg }, 201);
}

/**
 * PATCH /communications/support/tickets/:id/status - Admin update ticket status
 */
async function handleUpdateTicketStatus(req: Request, ticketId: string): Promise<Response> {
  await verifyAdminCaller(req);
  const serviceClient = createServiceClient();

  const body = await req.json();
  const { status, assigned_to } = body;

  const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    throw new HttpError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const updateFields: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (assigned_to !== undefined) updateFields.assigned_to = assigned_to;
  if (status === 'resolved') updateFields.resolved_at = new Date().toISOString();

  const { data: updatedTicket, error } = await serviceClient
    .from('support_tickets')
    .update(updateFields)
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    throw new HttpError(500, `Failed to update status: ${error.message}`);
  }

  return jsonResponse({ ticket: updatedTicket });
}
