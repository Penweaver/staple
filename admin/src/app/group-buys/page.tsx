'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import Link from 'next/link';

interface GroupBuyRow {
  id: string;
  slug: string;
  title: string;
  creatorType: 'champion' | 'admin';
  creatorName: string;
  areaName: string;
  targetQuantity: number;
  paidQuantity: number;
  mvfq: number;
  currentPrice: number;
  originalPrice: number;
  status: 'live' | 'pending_activation' | 'target_reached' | 'delivery_fulfilment' | 'completed' | 'closed';
  daysRemaining: number;
}

const mockGroupBuys: GroupBuyRow[] = [
  {
    id: 'gb-1',
    slug: 'mama-gold-rice-lekki',
    title: 'Mama Gold Premium Parboiled Rice (50kg)',
    creatorType: 'champion',
    creatorName: 'Dele Adeyemi (Champion)',
    areaName: 'Lekki Phase 1',
    targetQuantity: 100,
    paidQuantity: 58,
    mvfq: 20,
    currentPrice: 82875,
    originalPrice: 85000,
    status: 'live',
    daysRemaining: 9,
  },
  {
    id: 'gb-2',
    slug: 'kings-cooking-oil-vi',
    title: 'Kings Pure Vegetable Cooking Oil (25L)',
    creatorType: 'admin',
    creatorName: 'STAPLE Operations',
    areaName: 'Victoria Island Central',
    targetQuantity: 50,
    paidQuantity: 50,
    mvfq: 15,
    currentPrice: 44160,
    originalPrice: 48000,
    status: 'target_reached',
    daysRemaining: 12,
  },
  {
    id: 'gb-3',
    slug: 'family-basket-lekki',
    title: 'Family Monthly Essentials Basket',
    creatorType: 'champion',
    creatorName: 'Grace Okon (Champion)',
    areaName: 'Lekki Phase 1',
    targetQuantity: 20,
    paidQuantity: 8,
    mvfq: 8,
    currentPrice: 165000,
    originalPrice: 165000,
    status: 'live',
    daysRemaining: 6,
  },
  {
    id: 'gb-4',
    slug: 'white-garri-ikeja',
    title: 'White Garri Ijebu (50kg Bag)',
    creatorType: 'champion',
    creatorName: 'Tunde Babatunde (Champion)',
    areaName: 'Ikeja GRA',
    targetQuantity: 40,
    paidQuantity: 7,
    mvfq: 10,
    currentPrice: 32000,
    originalPrice: 32000,
    status: 'live',
    daysRemaining: 4,
  },
];

export default function GroupBuysAdminPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = statusFilter === 'all'
    ? mockGroupBuys
    : mockGroupBuys.filter((g) => g.status === statusFilter);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/group-buys" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Group Buy Monitoring & Engine
            </h1>
            <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
              Track collective orders, MVFQ break-even statuses, discount tiers, and Champion rewards across Nigeria.
            </p>
          </div>
        </header>

        {/* Filter Pills */}
        <div style={styles.filterRow}>
          {[
            { id: 'all', label: 'All Deals' },
            { id: 'live', label: '🟢 LIVE' },
            { id: 'target_reached', label: '🎯 Target Reached' },
            { id: 'delivery_fulfilment', label: '🚚 Fulfilment' },
            { id: 'closed', label: 'Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                ...styles.filterBtn,
                backgroundColor: statusFilter === tab.id ? '#16A34A' : '#FFFFFF',
                color: statusFilter === tab.id ? '#FFFFFF' : '#4B5563',
                borderColor: statusFilter === tab.id ? '#16A34A' : '#D1D5DB',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Deal & Neighborhood</th>
                <th style={styles.th}>Organizer</th>
                <th style={styles.th}>Target Progress</th>
                <th style={styles.th}>MVFQ Status (A1)</th>
                <th style={styles.th}>Active Price (NGN)</th>
                <th style={styles.th}>Lifespan Left</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((gb) => {
                const progressPct = Math.round((gb.paidQuantity / gb.targetQuantity) * 100);
                const mvfqMet = gb.paidQuantity >= gb.mvfq;

                return (
                  <tr key={gb.id} style={styles.tr}>
                    <td style={styles.tdBold}>
                      <div>{gb.title}</div>
                      <small style={{ color: '#6B7280', fontWeight: 400 }}>📍 {gb.areaName}</small>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: 600, color: gb.creatorType === 'champion' ? '#B45309' : '#1E429F' }}>
                        {gb.creatorName}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>
                        {gb.paidQuantity} / {gb.targetQuantity} units ({progressPct}%)
                      </div>
                      <div style={styles.progressBarBg}>
                        <div
                          style={{
                            ...styles.progressBarFill,
                            width: `${Math.min(100, progressPct)}%`,
                            backgroundColor: progressPct >= 100 ? '#16A34A' : '#3B82F6',
                          }}
                        />
                      </div>
                    </td>
                    <td style={styles.td}>
                      {mvfqMet ? (
                        <span style={{ color: '#0E9F6E', fontWeight: 700, fontSize: '13px' }}>
                          ✅ Met ({gb.paidQuantity} ≥ {gb.mvfq})
                        </span>
                      ) : (
                        <span style={{ color: '#C27803', fontWeight: 700, fontSize: '13px' }}>
                          ⏳ {gb.paidQuantity}/{gb.mvfq} units
                        </span>
                      )}
                    </td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#16A34A' }}>
                      ₦{gb.currentPrice.toLocaleString()}
                      {gb.currentPrice < gb.originalPrice && (
                        <div style={{ fontSize: '11px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                          ₦{gb.originalPrice.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      ⏳ {gb.daysRemaining} days
                    </td>
                    <td style={styles.td}>
                      <span
                        style={
                          gb.status === 'target_reached'
                            ? styles.badgeInfo
                            : gb.status === 'live'
                            ? styles.badgeSuccess
                            : styles.badgeMuted
                        }
                      >
                        {gb.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <Link
                        href={`/group-buys/${gb.id}`}
                        style={styles.actionBtn}
                      >
                        Monitor
                      </Link>
                    </td>
                  </tr>
                );
              })}
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
    padding: '16px',
    color: '#374151',
  },
  tdBold: {
    padding: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  progressBarBg: {
    width: '100px',
    height: '6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '6px',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
  },
  badgeSuccess: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    fontWeight: 700,
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
  badgeInfo: {
    backgroundColor: '#E1EFFE',
    color: '#1E429F',
    fontWeight: 700,
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
  badgeMuted: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    fontWeight: 600,
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
  actionBtn: {
    color: '#16A34A',
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: '13px',
  },
};
