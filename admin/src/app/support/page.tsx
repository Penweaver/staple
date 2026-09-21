'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import { TicketStatus } from '@staple/shared';

interface AdminTicketMessage {
  id: string;
  senderName: string;
  senderRole: 'user' | 'admin' | 'system';
  message: string;
  time: string;
}

interface AdminTicketRow {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  category: string;
  status: TicketStatus;
  assignedAgent: string;
  createdAt: string;
  messages: AdminTicketMessage[];
}

const initialTickets: AdminTicketRow[] = [
  {
    id: 't-1',
    ticketNumber: 'STP-TCK-2026-0042',
    customerName: 'Babatunde Adeleke',
    customerPhone: '+2348011223344',
    subject: 'Proxy collection authorization for driver at Lekki Admiralty Hub',
    category: 'Order & Fulfilment',
    status: TicketStatus.IN_PROGRESS,
    assignedAgent: 'Kemi Adebayo',
    createdAt: '2026-09-21 09:15',
    messages: [
      {
        id: 'm-1',
        senderName: 'Babatunde Adeleke',
        senderRole: 'user',
        message: 'Good day. My driver Ibrahim will be collecting my 2 bags of Mama Gold Rice tomorrow morning. I have shared my code STP-782-910 with him. Kindly confirm he will be attended to.',
        time: '09:15 AM',
      },
      {
        id: 'm-2',
        senderName: 'Kemi Adebayo (Support)',
        senderRole: 'admin',
        message: 'Hello Mr. Adeleke! Yes, perfectly fine. Our hub terminal staff will ask for his name and record him as the proxy collector upon verification of your 6-digit code.',
        time: '09:22 AM',
      },
    ],
  },
  {
    id: 't-2',
    ticketNumber: 'STP-TCK-2026-0043',
    customerName: 'Grace Okon',
    customerPhone: '+2348052223344',
    subject: 'Refund question for closed Vegetable Oil Group Buy',
    category: 'Wallet & Payment',
    status: TicketStatus.OPEN,
    assignedAgent: 'Unassigned',
    createdAt: '2026-09-21 10:40',
    messages: [
      {
        id: 'm-3',
        senderName: 'Grace Okon',
        senderRole: 'user',
        message: 'The vegetable oil group buy reached 18/50 and expired today. I received an in-app notice about wallet credit. Please verify the funds are available.',
        time: '10:40 AM',
      },
    ],
  },
  {
    id: 't-3',
    ticketNumber: 'STP-TCK-2026-0040',
    customerName: 'Fatima Bello',
    customerPhone: '+2348099887766',
    subject: 'Owambe Party instalment due date clarification',
    category: 'Festive Plan',
    status: TicketStatus.RESOLVED,
    assignedAgent: 'Chidi Okafor',
    createdAt: '2026-09-20 14:05',
    messages: [
      {
        id: 'm-4',
        senderName: 'Fatima Bello',
        senderRole: 'user',
        message: 'My wedding date is in November. When is the final instalment due to ensure delivery to Wuse 2 Hub?',
        time: '02:05 PM',
      },
      {
        id: 'm-5',
        senderName: 'Chidi Okafor (Support)',
        senderRole: 'admin',
        message: 'Hello Fatima! All instalments conclude 7 days prior to your target delivery date (Nov 3, 2026) to allow procurement aggregation.',
        time: '02:18 PM',
      },
    ],
  },
];

export default function SupportAdminPage() {
  const [tickets, setTickets] = useState<AdminTicketRow[]>(initialTickets);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<AdminTicketRow | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // KPIs
  const openCount = tickets.filter((t) => t.status === TicketStatus.OPEN).length;
  const inProgressCount = tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length;
  const resolvedCount = tickets.filter((t) => t.status === TicketStatus.RESOLVED).length;

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const handleSendReply = () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    setIsSending(true);

    setTimeout(() => {
      const newMsg: AdminTicketMessage = {
        id: `m-${Date.now()}`,
        senderName: 'You (Support Staff)',
        senderRole: 'admin',
        message: replyMessage.trim(),
        time: 'Just now',
      };

      const updated = {
        ...selectedTicket,
        status: TicketStatus.IN_PROGRESS,
        messages: [...selectedTicket.messages, newMsg],
      };

      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
      setReplyMessage('');
      setIsSending(false);
    }, 400);
  };

  const handleUpdateStatus = (newStatus: TicketStatus) => {
    if (!selectedTicket) return;

    const updated = {
      ...selectedTicket,
      status: newStatus,
    };

    setSelectedTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
  };

  return (
    <div style={styles.layout}>
      <AdminNav currentPath="/support" />

      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Customer Support & Ticket Desk</h1>
            <p style={styles.subtitle}>
              Manage customer inquiries across group buy coordination, hub handoffs, wallet refunds, and seasonal plans.
            </p>
          </div>
        </header>

        {/* KPIs */}
        <section style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>OPEN TICKETS</span>
            <span style={{ ...styles.kpiValue, color: openCount > 0 ? '#DC2626' : '#111827' }}>
              {openCount}
            </span>
            <span style={{ fontSize: '12px', color: '#B45309' }}>Awaiting first staff response</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>IN PROGRESS</span>
            <span style={{ ...styles.kpiValue, color: '#D97706' }}>{inProgressCount}</span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Active investigations</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>RESOLVED TODAY</span>
            <span style={{ ...styles.kpiValue, color: '#16A34A' }}>{resolvedCount}</span>
            <span style={{ fontSize: '12px', color: '#16A34A' }}>Closed with customer confirmation</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>AVG RESOLUTION TIME</span>
            <span style={styles.kpiValue}>18 mins</span>
            <span style={{ fontSize: '12px', color: '#4B5563' }}>Nigerian business hours SLA: &lt;30m</span>
          </div>
        </section>

        {/* Tickets Section */}
        <section style={styles.tableSection}>
          <div style={styles.filterBar}>
            <label style={styles.filterLabel}>Status Filter:</label>
            <select
              style={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({tickets.length})</option>
              <option value={TicketStatus.OPEN}>Open ({openCount})</option>
              <option value={TicketStatus.IN_PROGRESS}>In Progress ({inProgressCount})</option>
              <option value={TicketStatus.RESOLVED}>Resolved ({resolvedCount})</option>
            </select>
          </div>

          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>Ticket Number</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Subject & Category</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Assigned To</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <strong>{ticket.ticketNumber}</strong>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{ticket.customerName}</div>
                    <div style={styles.subText}>{ticket.customerPhone}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 500 }}>{ticket.subject}</div>
                    <span style={styles.categoryPill}>{ticket.category}</span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor:
                          ticket.status === TicketStatus.OPEN
                            ? '#FEE2E2'
                            : ticket.status === TicketStatus.IN_PROGRESS
                            ? '#FEF3C7'
                            : '#DCFCE7',
                        color:
                          ticket.status === TicketStatus.OPEN
                            ? '#991B1B'
                            : ticket.status === TicketStatus.IN_PROGRESS
                            ? '#92400E'
                            : '#14532D',
                      }}
                    >
                      {ticket.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.td}>{ticket.assignedAgent}</td>
                  <td style={styles.td}>
                    <span style={styles.subText}>{ticket.createdAt}</span>
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.openBtn}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      Open Conversation
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      {/* Ticket Drawer */}
      {selectedTicket && (
        <div style={styles.drawerOverlay}>
          <div style={styles.drawerCard}>
            <div style={styles.drawerHeader}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedTicket.ticketNumber}</h3>
                <div style={styles.subText}>
                  {selectedTicket.customerName} • {selectedTicket.customerPhone}
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            <div style={styles.subjectBox}>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{selectedTicket.subject}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <span style={styles.categoryPill}>{selectedTicket.category}</span>
                <span style={styles.subText}>Created: {selectedTicket.createdAt}</span>
              </div>
            </div>

            {/* Messages Thread */}
            <div style={styles.messagesContainer}>
              {selectedTicket.messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    ...styles.messageBox,
                    alignSelf: m.senderRole === 'admin' ? 'flex-end' : 'flex-start',
                    backgroundColor: m.senderRole === 'admin' ? '#DCFCE7' : '#F3F4F6',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#374151' }}>
                    {m.senderName} • {m.time}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '13px' }}>{m.message}</div>
                </div>
              ))}
            </div>

            {/* Status Switcher */}
            <div style={styles.statusActionRow}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Set Status:</span>
              <button
                style={styles.statusChangeBtn}
                onClick={() => handleUpdateStatus(TicketStatus.IN_PROGRESS)}
              >
                In Progress
              </button>
              <button
                style={{ ...styles.statusChangeBtn, backgroundColor: '#DCFCE7', color: '#14532D', borderColor: '#86EFAC' }}
                onClick={() => handleUpdateStatus(TicketStatus.RESOLVED)}
              >
                Resolve Ticket ✅
              </button>
            </div>

            {/* Staff Reply Box */}
            <div style={styles.replyArea}>
              <textarea
                style={styles.replyTextarea}
                placeholder="Type response to customer (they will receive an in-app & SMS notification)..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              />
              <button
                style={styles.sendBtn}
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || isSending}
              >
                {isSending ? 'Sending...' : 'Send Staff Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  main: {
    flex: 1,
    padding: '32px 40px',
    boxSizing: 'border-box' as const,
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6B7280',
    marginTop: '4px',
    marginBottom: 0,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '28px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.5px',
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#111827',
  },
  tableSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  select: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  tableHeadRow: {
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4B5563',
  },
  tableRow: {
    borderBottom: '1px solid #F3F4F6',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
  },
  subText: {
    fontSize: '12px',
    color: '#6B7280',
  },
  categoryPill: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    marginTop: '2px',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
  },
  openBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  drawerOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  drawerCard: {
    backgroundColor: '#FFFFFF',
    width: '520px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '24px',
    boxSizing: 'border-box' as const,
    boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #E5E7EB',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#6B7280',
  },
  subjectBox: {
    backgroundColor: '#F9FAFB',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    marginBottom: '16px',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    paddingRight: '6px',
    marginBottom: '16px',
  },
  messageBox: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '8px',
  },
  statusActionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 0',
    borderTop: '1px solid #E5E7EB',
    marginBottom: '12px',
  },
  statusChangeBtn: {
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  replyArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  replyTextarea: {
    width: '100%',
    height: '80px',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  sendBtn: {
    padding: '10px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
