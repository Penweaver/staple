'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import Link from 'next/link';

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemTitle: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  walletAmount: number;
  gatewayAmount: number;
  status: 'paid' | 'pending' | 'fulfilment_ready' | 'refunded';
  refundReason?: string;
  groupBuySlug: string;
  pickupHub: string;
  createdAt: string;
}

const mockOrders: OrderRow[] = [
  {
    id: 'ord-1',
    orderNumber: 'STP-ORD-20260921-884192',
    customerName: 'Dele Adeyemi',
    customerPhone: '+2348011223344',
    itemTitle: 'Mama Gold Rice (50kg)',
    quantity: 3,
    unitPrice: 85000,
    totalAmount: 255000,
    walletAmount: 0,
    gatewayAmount: 255000,
    status: 'paid',
    groupBuySlug: 'mama-gold-rice-lekki',
    pickupHub: 'staple Hub — Lekki Admiralty',
    createdAt: '2026-09-21 09:15',
  },
  {
    id: 'ord-2',
    orderNumber: 'STP-ORD-20260921-771239',
    customerName: 'Fatima Bello',
    customerPhone: '+2348022334455',
    itemTitle: 'Mama Gold Rice (50kg)',
    quantity: 10,
    unitPrice: 85000,
    totalAmount: 850000,
    walletAmount: 50000,
    gatewayAmount: 800000,
    status: 'paid',
    groupBuySlug: 'mama-gold-rice-lekki',
    pickupHub: 'staple Hub — Lekki Admiralty',
    createdAt: '2026-09-21 10:20',
  },
  {
    id: 'ord-3',
    orderNumber: 'STP-ORD-20260920-554182',
    customerName: 'Chinedu Eze',
    customerPhone: '+2348033445566',
    itemTitle: 'Kings Cooking Oil (25L)',
    quantity: 2,
    unitPrice: 48000,
    totalAmount: 96000,
    walletAmount: 96000,
    gatewayAmount: 0,
    status: 'paid',
    groupBuySlug: 'kings-cooking-oil-vi',
    pickupHub: 'staple Hub — VI Bishop Oluwole',
    createdAt: '2026-09-20 16:40',
  },
  {
    id: 'ord-4',
    orderNumber: 'STP-ORD-20260919-221940',
    customerName: 'Kemi Adebayo',
    customerPhone: '+2348044556677',
    itemTitle: 'White Garri Ijebu (50kg)',
    quantity: 4,
    unitPrice: 32000,
    totalAmount: 128000,
    walletAmount: 28000,
    gatewayAmount: 100000,
    status: 'refunded',
    refundReason: 'mvfq_not_met',
    groupBuySlug: 'white-garri-ikeja',
    pickupHub: 'staple Hub — Ikeja GRA',
    createdAt: '2026-09-19 11:10',
  },
];

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? mockOrders
    : mockOrders.filter((o) => o.status === filter);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/orders" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Orders & Fulfilment Audit
            </h1>
            <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
              Order management with multi-funding split allocation (STAPLE Wallet + Paystack) and 10-unit quota enforcement.
            </p>
          </div>
        </header>

        {/* Filters */}
        <div style={styles.filterRow}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'paid', label: '✅ Paid' },
            { id: 'pending', label: '⏳ Pending' },
            { id: 'refunded', label: '↩️ Refunded' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                ...styles.filterBtn,
                backgroundColor: filter === tab.id ? '#16A34A' : '#FFFFFF',
                color: filter === tab.id ? '#FFFFFF' : '#4B5563',
                borderColor: filter === tab.id ? '#16A34A' : '#D1D5DB',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Order #</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Item & Qty</th>
                <th style={styles.th}>Total (NGN)</th>
                <th style={styles.th}>Funding Split (§23)</th>
                <th style={styles.th}>Pickup Hub</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Order Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ord) => (
                <tr key={ord.id} style={styles.tr}>
                  <td style={styles.tdBold}>{ord.orderNumber}</td>
                  <td style={styles.td}>
                    <div>{ord.customerName}</div>
                    <small style={{ color: '#6B7280' }}>{ord.customerPhone}</small>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{ord.itemTitle}</div>
                    <small style={{ color: '#6B7280' }}>{ord.quantity} units (≤10 limit)</small>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 700, color: '#16A34A' }}>
                    ₦{ord.totalAmount.toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    {ord.walletAmount > 0 ? (
                      <div style={{ fontSize: '12px', color: '#03543F' }}>
                        💳 Wallet: ₦{ord.walletAmount.toLocaleString()}
                      </div>
                    ) : null}
                    {ord.gatewayAmount > 0 ? (
                      <div style={{ fontSize: '12px', color: '#1E429F' }}>
                        🏦 Paystack: ₦{ord.gatewayAmount.toLocaleString()}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ ...styles.td, fontSize: '12px' }}>
                    📍 {ord.pickupHub}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={
                        ord.status === 'paid'
                          ? styles.badgeSuccess
                          : ord.status === 'refunded'
                          ? styles.badgeError
                          : styles.badgeWarning
                      }
                    >
                      {ord.status.toUpperCase()}
                      {ord.refundReason && ` (${ord.refundReason})`}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontSize: '12px', color: '#6B7280' }}>
                    {ord.createdAt}
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
  badgeSuccess: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    fontWeight: 700,
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontWeight: 700,
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
  badgeError: {
    backgroundColor: '#FDE8E8',
    color: '#9B1C1C',
    fontWeight: 700,
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
};
