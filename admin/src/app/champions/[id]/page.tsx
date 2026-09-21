'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../../components/AdminNav';
import Link from 'next/link';

export default function ChampionDossierPage({ params }: { params: { id: string } }) {
  const [championStatus, setChampionStatus] = useState<'active' | 'suspended'>('active');
  const [suspensionReason, setSuspensionReason] = useState<string>('');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [activeBuysCount, setActiveBuysCount] = useState(1);

  const champion = {
    id: params.id,
    fullName: 'Dele Adeyemi',
    phone: '+2348011223344',
    email: 'dele.adeyemi@gmail.com',
    state: 'Lagos',
    lga: 'Eti-Osa',
    neighborhood: 'Lekki Phase 1',
    communityRole: 'Lekki Phase 1 Residents Association Welfare Secretary',
    approvedAt: '2026-08-15',
    approvedBy: 'Admin (System Super-Admin)',
    tier: 'Silver Community Organizer',
    tierBadge: '🥈',
    maxActiveBuys: 2,
    totalGmvNaira: 2850000,
    totalCompletedBuys: 6,
    totalMilestonesEarned: 12000, // 6 * 2000
    walletBalanceNaira: 14500,
  };

  const championBuys = [
    {
      id: 'gb-1',
      slug: 'mama-gold-rice-lekki',
      itemTitle: 'Mama Gold Premium Parboiled Rice (50kg)',
      targetQuantity: 100,
      paidQuantity: 58,
      minFulfilmentQuantity: 20,
      status: 'LIVE',
      unitPrice: 82875,
      createdAt: '2026-09-15',
      milestoneEligible: 'Pending Target',
    },
    {
      id: 'gb-2',
      slug: 'kings-cooking-oil-lekki',
      itemTitle: 'Kings Cooking Oil (25L Jerrycan)',
      targetQuantity: 50,
      paidQuantity: 50,
      minFulfilmentQuantity: 15,
      status: 'COMPLETED',
      unitPrice: 46000,
      createdAt: '2026-08-25',
      milestoneEligible: 'Paid (₦2,000)',
    },
    {
      id: 'gb-3',
      slug: 'oloyin-beans-lekki',
      itemTitle: 'Honey Beans Oloyin (50kg Bag)',
      targetQuantity: 40,
      paidQuantity: 40,
      minFulfilmentQuantity: 10,
      status: 'COMPLETED',
      unitPrice: 72000,
      createdAt: '2026-08-18',
      milestoneEligible: 'Paid (₦2,000)',
    },
  ];

  const handleConfirmSuspend = () => {
    if (!suspensionReason.trim()) {
      alert('Please provide a reason for suspension.');
      return;
    }
    setChampionStatus('suspended');
    setShowSuspendDialog(false);
    alert('Champion suspended. Live buys will run to fulfilment; new creations blocked.');
  };

  const handleReactivate = () => {
    if (confirm('Reactivate this Champion account?')) {
      setChampionStatus('active');
      setSuspensionReason('');
      alert('Champion account has been restored to Active.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/champions" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        {/* Breadcrumb Navigation */}
        <div style={{ marginBottom: '16px', fontSize: '13px', color: '#6B7280' }}>
          <Link href="/champions" style={{ color: '#16A34A', textDecoration: 'none' }}>
            ← Back to Champions Roster
          </Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>Dossier: {champion.fullName}</span>
        </div>

        {/* Header with Badges and Actions */}
        <header style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {champion.fullName}
                </h1>
                <span
                  style={
                    championStatus === 'active' ? styles.badgeApproved : styles.badgeRejected
                  }
                >
                  {championStatus.toUpperCase()}
                </span>
                <span style={styles.badgeTier}>
                  {champion.tierBadge} {champion.tier}
                </span>
              </div>
              <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
                {champion.neighborhood}, {champion.lga}, {champion.state} • {champion.phone} • {champion.email}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {championStatus === 'active' ? (
                <button
                  onClick={() => setShowSuspendDialog(true)}
                  style={styles.suspendBtn}
                >
                  Suspend Champion
                </button>
              ) : (
                <button onClick={handleReactivate} style={styles.reactivateBtn}>
                  Reactivate Champion
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Capacity & Performance Grid */}
        <section style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>ACTIVE BUY CAPACITY (§8)</span>
            <span
              style={{
                ...styles.kpiValue,
                color: activeBuysCount >= champion.maxActiveBuys ? '#DC2626' : '#16A34A',
              }}
            >
              {activeBuysCount} / {champion.maxActiveBuys}
            </span>
            <span style={styles.kpiSub}>
              {activeBuysCount < champion.maxActiveBuys ? 'Capacity available' : 'Max 2 buys reached'}
            </span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>TOTAL GMV MOBILIZED</span>
            <span style={styles.kpiValue}>₦{champion.totalGmvNaira.toLocaleString()}</span>
            <span style={styles.kpiSub}>{champion.totalCompletedBuys} successful group buys</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>MILESTONE EARNINGS (A3)</span>
            <span style={{ ...styles.kpiValue, color: '#D97706' }}>
              ₦{champion.totalMilestonesEarned.toLocaleString()}
            </span>
            <span style={styles.kpiSub}>Flat ₦2,000 on TARGET_REACHED</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>WALLET BALANCE</span>
            <span style={{ ...styles.kpiValue, color: '#16A34A' }}>
              ₦{champion.walletBalanceNaira.toLocaleString()}
            </span>
            <span style={styles.kpiSub}>STAPLE in-app wallet balance</span>
          </div>
        </section>

        {/* Community & Verification Dossier */}
        <div style={styles.detailCard}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
            Champion Community Profile
          </h2>
          <div style={styles.grid2}>
            <div>
              <span style={styles.metaLabel}>Community Role / Affiliation</span>
              <p style={styles.metaValue}>{champion.communityRole}</p>
            </div>
            <div>
              <span style={styles.metaLabel}>Approval Date & Auditor</span>
              <p style={styles.metaValue}>
                Approved on {champion.approvedAt} by {champion.approvedBy}
              </p>
            </div>
            <div>
              <span style={styles.metaLabel}>Commercial Governance Rule (§9)</span>
              <p style={{ ...styles.metaValue, color: '#059669' }}>
                ✅ Zero price or discount manipulation privileges (Pricing locked by STAPLE)
              </p>
            </div>
            <div>
              <span style={styles.metaLabel}>Milestone Allocation Model (Addendum A3)</span>
              <p style={styles.metaValue}>
                Flat ₦2,000 credited per Group Buy reaching 100% of target (No % commission)
              </p>
            </div>
          </div>
        </div>

        {/* Group Buys Organized Table */}
        <div style={{ ...styles.detailCard, marginTop: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
            Group Buys Organized by {champion.fullName}
          </h2>

          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Group Buy Title</th>
                <th style={styles.th}>Target</th>
                <th style={styles.th}>Paid Progress</th>
                <th style={styles.th}>MVFQ Status (A1)</th>
                <th style={styles.th}>Milestone Reward (A3)</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {championBuys.map((gb) => (
                <tr key={gb.id} style={styles.tr}>
                  <td style={styles.tdBold}>{gb.itemTitle}</td>
                  <td style={styles.td}>{gb.targetQuantity} units</td>
                  <td style={styles.td}>
                    {gb.paidQuantity} / {gb.targetQuantity} units ({Math.round((gb.paidQuantity / gb.targetQuantity) * 100)}%)
                  </td>
                  <td style={{ ...styles.td, color: '#059669', fontWeight: 600 }}>
                    MVFQ Met ({gb.paidQuantity} ≥ {gb.minFulfilmentQuantity})
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        color: gb.milestoneEligible.includes('Paid') ? '#16A34A' : '#6B7280',
                        fontWeight: 600,
                      }}
                    >
                      {gb.milestoneEligible}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={gb.status === 'LIVE' ? styles.badgeApproved : styles.badgeCompleted}>
                      {gb.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <Link href={`/group-buys/${gb.slug}`} style={styles.viewBtn}>
                      Monitor
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Suspend Modal Dialog */}
        {showSuspendDialog && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#DC2626', margin: '0 0 12px 0' }}>
                Suspend Champion: {champion.fullName}
              </h3>
              <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px' }}>
                This will prevent {champion.fullName} from launching any new Group Buys. Ongoing group buys will run to fulfilment.
              </p>
              <textarea
                rows={3}
                style={styles.modalTextarea}
                placeholder="Reason for suspension..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button onClick={() => setShowSuspendDialog(false)} style={styles.modalCancelBtn}>
                  Cancel
                </button>
                <button onClick={handleConfirmSuspend} style={styles.modalConfirmSuspendBtn}>
                  Confirm Suspension
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.5px',
  },
  kpiValue: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#111827',
  },
  kpiSub: {
    fontSize: '12px',
    color: '#6B7280',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    padding: '24px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  metaLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  metaValue: {
    fontSize: '14px',
    color: '#111827',
    marginTop: '4px',
    fontWeight: 500,
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
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4B5563',
    textTransform: 'uppercase',
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
  badgeApproved: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeRejected: {
    backgroundColor: '#FDE8E8',
    color: '#9B1C1C',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeCompleted: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeTier: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  suspendBtn: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  reactivateBtn: {
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  viewBtn: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: '1px solid #D1D5DB',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    width: '460px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalTextarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  modalCancelBtn: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  modalConfirmSuspendBtn: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
