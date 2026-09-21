'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';

interface PaymentRow {
  id: string;
  reference: string;
  orderNumber: string;
  customerName: string;
  gatewayAmount: number;
  channel: string;
  fingerprint: string;
  isCollision: boolean;
  status: 'successful' | 'initiated' | 'failed';
  verifiedAt: string;
}

const mockPayments: PaymentRow[] = [
  {
    id: 'pay-1',
    reference: 'STP-PAY-20260921-884192',
    orderNumber: 'STP-ORD-20260921-884192',
    customerName: 'Dele Adeyemi',
    gatewayAmount: 255000,
    channel: 'card (Mastercard *** 4821)',
    fingerprint: 'auth_sig_lagos_998124',
    isCollision: false,
    status: 'successful',
    verifiedAt: '2026-09-21 09:16:04',
  },
  {
    id: 'pay-2',
    reference: 'STP-PAY-20260921-771239',
    orderNumber: 'STP-ORD-20260921-771239',
    customerName: 'Fatima Bello',
    gatewayAmount: 800000,
    channel: 'card (Visa *** 1190)',
    fingerprint: 'auth_sig_vi_441290',
    isCollision: false,
    status: 'successful',
    verifiedAt: '2026-09-21 10:21:30',
  },
  {
    id: 'pay-3',
    reference: 'STP-PAY-20260920-554182',
    orderNumber: 'STP-ORD-20260920-554182',
    customerName: 'Chinedu Eze',
    gatewayAmount: 100000,
    channel: 'card (Mastercard *** 9901)',
    fingerprint: 'auth_sig_shared_cartel_001',
    isCollision: true, // 🚨 Fingerprint collision!
    status: 'successful',
    verifiedAt: '2026-09-20 16:42:11',
  },
];

export default function AdminPaymentsPage() {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'collisions'
    ? mockPayments.filter((p) => p.isCollision)
    : mockPayments;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/payments" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Payments & Anti-Gaming Audit
            </h1>
            <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
              Paystack gateway webhook audit, kobo-to-naira reconciliations, and card fingerprint collision tracking (Addendum A4).
            </p>
          </div>
        </header>

        {/* Anti-Gaming Highlight Banner */}
        <div style={styles.alertBanner}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>🛡️</Text>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#92400E', fontSize: '14px' }}>
              Anti-Gaming Fingerprint Detection Active (Founder Addendum A4)
            </div>
            <div style={{ color: '#B45309', fontSize: '13px', marginTop: '2px' }}>
              Card authorization signatures are captured on Paystack charge. Shared fingerprints across distinct user accounts are flagged to hold delayed pricing tier rebates for 48 hours.
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={styles.filterRow}>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterBtn,
              backgroundColor: filter === 'all' ? '#16A34A' : '#FFFFFF',
              color: filter === 'all' ? '#FFFFFF' : '#4B5563',
              borderColor: filter === 'all' ? '#16A34A' : '#D1D5DB',
            }}
          >
            All Gateway Transactions ({mockPayments.length})
          </button>
          <button
            onClick={() => setFilter('collisions')}
            style={{
              ...styles.filterBtn,
              backgroundColor: filter === 'collisions' ? '#DC2626' : '#FFFFFF',
              color: filter === 'collisions' ? '#FFFFFF' : '#4B5563',
              borderColor: filter === 'collisions' ? '#DC2626' : '#D1D5DB',
            }}
          >
            🚨 Fingerprint Collisions ({mockPayments.filter((p) => p.isCollision).length})
          </button>
        </div>

        {/* Table */}
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Paystack Reference</th>
                <th style={styles.th}>Order #</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Gateway Paid (NGN)</th>
                <th style={styles.th}>Channel</th>
                <th style={styles.th}>Fingerprint (A4)</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Verified At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pay) => (
                <tr key={pay.id} style={styles.tr}>
                  <td style={styles.tdBold}>{pay.reference}</td>
                  <td style={styles.td}>{pay.orderNumber}</td>
                  <td style={styles.td}>{pay.customerName}</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: '#16A34A' }}>
                    ₦{pay.gatewayAmount.toLocaleString()}
                  </td>
                  <td style={styles.td}>{pay.channel}</td>
                  <td style={styles.td}>
                    <code>{pay.fingerprint}</code>
                    {pay.isCollision && (
                      <div style={styles.collisionBadge}>
                        🚨 Collision: Multi-account reuse
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badgeSuccess}>
                      {pay.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontSize: '12px', color: '#6B7280' }}>
                    {pay.verifiedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

const styles = {
  alertBanner: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: '10px',
    padding: '16px 20px',
    marginBottom: '20px',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  filterBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '14px',
  },
  thRow: {
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 16px',
    color: '#4B5563',
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #F3F4F6',
  },
  td: {
    padding: '14px 16px',
    color: '#374151',
  },
  tdBold: {
    padding: '14px 16px',
    fontWeight: 600,
    color: '#111827',
  },
  collisionBadge: {
    marginTop: '4px',
    backgroundColor: '#FDE8E8',
    color: '#9B1C1C',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-block',
  },
  badgeSuccess: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    fontWeight: 700,
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
};
