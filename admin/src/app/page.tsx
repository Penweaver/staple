import React from 'react';
import { AdminNav } from '../components/AdminNav';

const metrics = [
  { label: 'Gross Merchandise Value (GMV)', value: '₦4,850,000', change: '+18.4% this week', positive: true },
  { label: 'Active LIVE Group Buys', value: '14', change: '8 Champion / 6 Admin', positive: true },
  { label: 'Units Paid / Sourced', value: '412 units', change: '88% toward target', positive: true },
  { label: 'Approved Active Champions', value: '9', change: 'Max 2 active GBs/champ', positive: true },
  { label: 'Fulfilment Success Rate', value: '96.2%', change: 'All MVFQs satisfied', positive: true },
  { label: 'STAPLE Wallet Credits Disbursed', value: '₦142,500', change: 'Dynamic tier refunds', positive: false },
];

export default function AdminDashboardPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: 0 }}>
            Platform Overview
          </h1>
          <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
            Authoritative performance metrics for STAPLE LIMITED collective purchasing platform.
          </p>
        </header>

        {/* Metrics Grid */}
        <section style={styles.metricsGrid}>
          {metrics.map((m, idx) => (
            <div key={idx} style={styles.metricCard}>
              <div style={styles.metricLabel}>{m.label}</div>
              <div style={styles.metricValue}>{m.value}</div>
              <div style={{ ...styles.metricChange, color: m.positive ? '#0E9F6E' : '#6B7280' }}>
                {m.change}
              </div>
            </div>
          ))}
        </section>

        {/* Operational Highlights Section */}
        <section style={styles.section}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
            Active Group Buys Pending Review
          </h2>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Product / Basket</th>
                  <th style={styles.th}>Area / Hub</th>
                  <th style={styles.th}>Organizer</th>
                  <th style={styles.th}>Paid Progress</th>
                  <th style={styles.th}>MVFQ Status</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={styles.tr}>
                  <td style={styles.tdBold}>Mama Gold Rice (50kg)</td>
                  <td style={styles.td}>Lekki Phase 1</td>
                  <td style={styles.td}>Champion (Dele A.)</td>
                  <td style={styles.td}>58 / 100 bags (58%)</td>
                  <td style={{ ...styles.td, color: '#0E9F6E', fontWeight: 600 }}>MVFQ Met (58 ≥ 20)</td>
                  <td style={styles.td}><span style={styles.badgeSuccess}>LIVE</span></td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.tdBold}>Kings Cooking Oil (25L)</td>
                  <td style={styles.td}>Victoria Island</td>
                  <td style={styles.td}>STAPLE Admin</td>
                  <td style={styles.td}>18 / 50 kegs (36%)</td>
                  <td style={{ ...styles.td, color: '#0E9F6E', fontWeight: 600 }}>MVFQ Met (18 ≥ 15)</td>
                  <td style={styles.td}><span style={styles.badgeSuccess}>LIVE</span></td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.tdBold}>Ijebu Garri White (50kg)</td>
                  <td style={styles.td}>Ikeja GRA</td>
                  <td style={styles.td}>Champion (Tunde B.)</td>
                  <td style={styles.td}>7 / 40 bags (18%)</td>
                  <td style={{ ...styles.td, color: '#C27803', fontWeight: 600 }}>Pending MVFQ (7 / 10)</td>
                  <td style={styles.td}><span style={styles.badgeSuccess}>LIVE</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '36px',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  metricValue: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#111827',
    marginBottom: '4px',
  },
  metricChange: {
    fontSize: '13px',
    fontWeight: 500,
  },
  section: {
    marginTop: '24px',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
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
};
