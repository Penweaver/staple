'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../../components/AdminNav';
import Link from 'next/link';

interface CollectionRecord {
  id: string;
  orderNumber: string;
  pickupCode: string;
  customerName: string;
  customerPhone: string;
  collectedBy: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  hubName: string;
  collectedAt: string;
  staffVerifier: string;
}

const mockCollections: CollectionRecord[] = [
  {
    id: 'col-1',
    orderNumber: 'STP-ORD-20260921-102948',
    pickupCode: 'STP-782-910',
    customerName: 'Babatunde Adeleke',
    customerPhone: '+2348011223344',
    collectedBy: 'Babatunde Adeleke (Customer)',
    productName: 'Mama Gold Premium Parboiled Rice (50kg)',
    quantity: 2,
    totalAmount: 165750,
    hubName: 'staple Hub — Lekki Admiralty',
    collectedAt: '2026-09-21 12:45',
    staffVerifier: 'Admin (Lekki Hub Manager)',
  },
  {
    id: 'col-2',
    orderNumber: 'STP-ORD-20260920-554182',
    pickupCode: 'STP-419-332',
    customerName: 'Chinedu Eze',
    customerPhone: '+2348033445566',
    collectedBy: 'Suleiman Garba (Driver / Proxy)',
    productName: 'Kings Pure Vegetable Cooking Oil (25L)',
    quantity: 2,
    totalAmount: 92000,
    hubName: 'staple Hub — Ikeja GRA',
    collectedAt: '2026-09-20 16:30',
    staffVerifier: 'Admin (Ikeja Hub Staff)',
  },
  {
    id: 'col-3',
    orderNumber: 'STP-ORD-20260919-221948',
    pickupCode: 'STP-331-904',
    customerName: 'Amina Danladi',
    customerPhone: '+2348044556677',
    collectedBy: 'Amina Danladi (Customer)',
    productName: 'Ijebu Garri White (50kg Bag)',
    quantity: 1,
    totalAmount: 32000,
    hubName: 'staple Hub — Wuse 2',
    collectedAt: '2026-09-20 15:40',
    staffVerifier: 'Admin (Abuja Hub Manager)',
  },
  {
    id: 'col-4',
    orderNumber: 'STP-ORD-20260918-771239',
    pickupCode: 'STP-902-184',
    customerName: 'Dele Adeyemi',
    customerPhone: '+2348011223344',
    collectedBy: 'Dele Adeyemi (Champion Activation Units)',
    productName: 'Mama Gold Premium Parboiled Rice (50kg)',
    quantity: 3,
    totalAmount: 248625,
    hubName: 'staple Hub — Lekki Admiralty',
    collectedAt: '2026-09-18 11:15',
    staffVerifier: 'Admin (Lekki Hub Manager)',
  },
];

export default function CollectionsAuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHub, setSelectedHub] = useState('all');

  const filteredCollections = mockCollections.filter((c) => {
    if (selectedHub !== 'all' && !c.hubName.includes(selectedHub)) return false;
    if (
      searchTerm &&
      !c.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.pickupCode.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.collectedBy.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalCollectedUnits = mockCollections.reduce((sum, c) => sum + c.quantity, 0);
  const totalValueNaira = mockCollections.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/fulfilment" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '16px', fontSize: '13px', color: '#6B7280' }}>
          <Link href="/fulfilment" style={{ color: '#16A34A', textDecoration: 'none' }}>
            ← Back to Fulfilment Operations
          </Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>Collections Audit Ledger</span>
        </div>

        {/* Header */}
        <header style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
            Completed Collections & Handoff Audit Log
          </h1>
          <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
            Immutable audit record of goods released at collection hubs with 6-digit verification codes and proxy collector signatures.
          </p>
        </header>

        {/* Top Summary */}
        <section style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>TOTAL HANDOFFS</span>
            <span style={styles.summaryValue}>{mockCollections.length} orders</span>
            <span style={styles.summarySub}>100% verified via 6-digit codes</span>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>TOTAL UNITS DISPENSED</span>
            <span style={{ ...styles.summaryValue, color: '#16A34A' }}>
              {totalCollectedUnits} units
            </span>
            <span style={styles.summarySub}>Bags of rice, garri, and kegs of oil</span>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>TOTAL WHOLESALE VALUE</span>
            <span style={{ ...styles.summaryValue, color: '#2563EB' }}>
              ₦{totalValueNaira.toLocaleString()}
            </span>
            <span style={styles.summarySub}>Fulfilled to community members</span>
          </div>
        </section>

        {/* Table Card */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by code, order #, customer, proxy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                style={styles.selectFilter}
              >
                <option value="all">All Hubs</option>
                <option value="Lekki">Lekki Admiralty</option>
                <option value="Ikeja">Ikeja GRA</option>
                <option value="Wuse">Wuse 2 Abuja</option>
              </select>
            </div>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Showing {filteredCollections.length} verified handoffs
            </span>
          </div>

          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Pickup Code</th>
                <th style={styles.th}>Order Number</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Collected By (Proxy)</th>
                <th style={styles.th}>Product & Units</th>
                <th style={styles.th}>Collection Hub</th>
                <th style={styles.th}>Timestamp</th>
                <th style={styles.th}>Verifier</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.map((col) => (
                <tr key={col.id} style={styles.tr}>
                  <td style={styles.tdBoldCode}>{col.pickupCode}</td>
                  <td style={styles.td}>{col.orderNumber}</td>
                  <td style={styles.td}>
                    <strong>{col.customerName}</strong>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>{col.customerPhone}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badgeProxy}>{col.collectedBy}</span>
                  </td>
                  <td style={styles.td}>
                    <strong>{col.quantity} units</strong> • {col.productName}
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      ₦{col.totalAmount.toLocaleString()}
                    </div>
                  </td>
                  <td style={styles.td}>{col.hubName}</td>
                  <td style={styles.td}>{col.collectedAt}</td>
                  <td style={styles.td}>
                    <span style={styles.badgeVerifier}>{col.staffVerifier}</span>
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

const styles: Record<string, React.CSSProperties> = {
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '28px',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  summaryLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.5px',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#111827',
  },
  summarySub: {
    fontSize: '12px',
    color: '#6B7280',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
  },
  tableHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    padding: '8px 14px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '13px',
    width: '320px',
  },
  selectFilter: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  thRow: {
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  th: {
    padding: '12px 18px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #F3F4F6',
  },
  td: {
    padding: '14px 18px',
    color: '#374151',
  },
  tdBoldCode: {
    padding: '14px 18px',
    fontWeight: 700,
    fontFamily: 'monospace',
    color: '#16A34A',
    fontSize: '14px',
  },
  badgeProxy: {
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
  },
  badgeVerifier: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
  },
};
