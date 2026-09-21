'use client';

import React from 'react';
import { AdminNav } from '../../components/AdminNav';
import Link from 'next/link';

interface ServiceAreaRow {
  id: string;
  name: string;
  state: string;
  lga: string;
  city: string;
  radiusKm: number;
  collectionPointsCount: number;
  activeGroupBuys: number;
  isActive: boolean;
}

const serviceAreas: ServiceAreaRow[] = [
  {
    id: '00000000-0000-0000-0004-000000000001',
    name: 'Lekki Phase 1',
    state: 'Lagos',
    lga: 'Eti-Osa',
    city: 'Lekki',
    radiusKm: 8.0,
    collectionPointsCount: 2,
    activeGroupBuys: 6,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0004-000000000002',
    name: 'Victoria Island Central',
    state: 'Lagos',
    lga: 'Eti-Osa',
    city: 'Victoria Island',
    radiusKm: 5.0,
    collectionPointsCount: 1,
    activeGroupBuys: 4,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0004-000000000003',
    name: 'Ikeja GRA & Central',
    state: 'Lagos',
    lga: 'Ikeja',
    city: 'Ikeja',
    radiusKm: 6.5,
    collectionPointsCount: 1,
    activeGroupBuys: 3,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0004-000000000004',
    name: 'Maitama Central',
    state: 'Federal Capital Territory',
    lga: 'Abuja Municipal',
    city: 'Maitama',
    radiusKm: 7.0,
    collectionPointsCount: 1,
    activeGroupBuys: 1,
    isActive: true,
  },
];

export default function LocationManagementPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/locations" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Location & Service Areas
            </h1>
            <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
              5-tier geographical hierarchy (Country → State → LGA → City → Service Area) and PostGIS proximity boundaries.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href="/locations/collection-points"
              style={styles.primaryBtn}
            >
              📍 Manage Pickup Hubs ({serviceAreas.reduce((acc, a) => acc + a.collectionPointsCount, 0)})
            </Link>
          </div>
        </header>

        {/* Hierarchy Stats Cards */}
        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>1</span>
            <span style={styles.statLabel}>Active Country (Nigeria)</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>5</span>
            <span style={styles.statLabel}>Operating States (LA, FC, RI, OG, OY)</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{serviceAreas.length}</span>
            <span style={styles.statLabel}>Active Service Areas</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>
              {serviceAreas.reduce((acc, a) => acc + a.collectionPointsCount, 0)}
            </span>
            <span style={styles.statLabel}>Collection Hubs</span>
          </div>
        </section>

        {/* Service Areas Table */}
        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
            Configured Service Areas
          </h2>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Service Area</th>
                  <th style={styles.th}>State / Region</th>
                  <th style={styles.th}>LGA / District</th>
                  <th style={styles.th}>City / Locality</th>
                  <th style={styles.th}>PostGIS Radius</th>
                  <th style={styles.th}>Pickup Hubs</th>
                  <th style={styles.th}>Active Group Buys</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {serviceAreas.map((sa) => (
                  <tr key={sa.id} style={styles.tr}>
                    <td style={styles.tdBold}>{sa.name}</td>
                    <td style={styles.td}>{sa.state}</td>
                    <td style={styles.td}>{sa.lga}</td>
                    <td style={styles.td}>{sa.city}</td>
                    <td style={styles.td}>{sa.radiusKm} km radius</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#16A34A' }}>
                      {sa.collectionPointsCount} Official Hubs
                    </td>
                    <td style={styles.td}>{sa.activeGroupBuys} Live</td>
                    <td style={styles.td}>
                      <span style={sa.isActive ? styles.badgeSuccess : styles.badgeMuted}>
                        {sa.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  primaryBtn: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '28px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#16A34A',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: 500,
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
  badgeSuccess: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
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
};
