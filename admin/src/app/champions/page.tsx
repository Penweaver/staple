'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import Link from 'next/link';

interface ApplicationRow {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  state: string;
  lga: string;
  neighborhood: string;
  estimatedReach: number;
  motivation: string;
  experience?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

interface ChampionRow {
  id: string;
  fullName: string;
  phone: string;
  state: string;
  lga: string;
  neighborhood: string;
  activeBuysCount: number;
  maxActiveBuys: number;
  completedBuysCount: number;
  totalGmvNaira: number;
  milestonesEarnedNaira: number;
  status: 'active' | 'suspended';
  approvedAt: string;
  suspensionReason?: string;
}

interface MilestonePayoutRow {
  id: string;
  championName: string;
  groupBuyTitle: string;
  groupBuySlug: string;
  targetQuantity: number;
  paidQuantity: number;
  amountNaira: number;
  creditedAt: string;
  ledgerRef: string;
}

const initialApplications: ApplicationRow[] = [
  {
    id: 'app-1',
    userId: 'user-app-1',
    fullName: 'Babatunde Adeleke',
    phone: '+2348031112233',
    state: 'Lagos',
    lga: 'Eti-Osa',
    neighborhood: 'Lekki Phase 1 (Admiralty Way)',
    estimatedReach: 40,
    motivation: 'I lead the Lekki Residents Welfare Committee. We want to organize bulk food purchases to bypass retail market markups.',
    experience: 'Estate Exco Member for 3 years',
    status: 'pending',
    appliedAt: '2026-09-21 08:30',
  },
  {
    id: 'app-2',
    userId: 'user-app-2',
    fullName: 'Grace Okon',
    phone: '+2348052223344',
    state: 'Rivers',
    lga: 'Port Harcourt',
    neighborhood: 'GRA Phase 2',
    estimatedReach: 25,
    motivation: 'I organize cooperative bulk food buys for teachers and bank workers in our estate.',
    experience: 'Cooperative Treasurer',
    status: 'pending',
    appliedAt: '2026-09-20 16:45',
  },
  {
    id: 'app-3',
    userId: 'user-app-3',
    fullName: 'Ibrahim Danladi',
    phone: '+2348093334455',
    state: 'FCT Abuja',
    lga: 'Municipal Area Council',
    neighborhood: 'Wuse 2',
    estimatedReach: 30,
    motivation: 'Coordination for civil servants buying rice and cooking oil in bulk.',
    experience: 'Community WhatsApp group admin (500+ members)',
    status: 'pending',
    appliedAt: '2026-09-20 11:15',
  },
  {
    id: 'app-4',
    userId: 'user-app-4',
    fullName: 'Ngozi Okafor',
    phone: '+2348064445566',
    state: 'Oyo',
    lga: 'Ibadan North',
    neighborhood: 'Bodija Market Area',
    estimatedReach: 20,
    motivation: 'Neighborhood group buying for young families.',
    status: 'approved',
    appliedAt: '2026-09-18 14:00',
  },
];

const initialChampions: ChampionRow[] = [
  {
    id: 'champ-1',
    fullName: 'Dele Adeyemi',
    phone: '+2348011223344',
    state: 'Lagos',
    lga: 'Eti-Osa',
    neighborhood: 'Lekki Phase 1',
    activeBuysCount: 1,
    maxActiveBuys: 2,
    completedBuysCount: 6,
    totalGmvNaira: 2850000,
    milestonesEarnedNaira: 12000,
    status: 'active',
    approvedAt: '2026-08-15',
  },
  {
    id: 'champ-2',
    fullName: 'Tunde Bakare',
    phone: '+2348022334455',
    state: 'Lagos',
    lga: 'Ikeja',
    neighborhood: 'Ikeja GRA',
    activeBuysCount: 2,
    maxActiveBuys: 2,
    completedBuysCount: 8,
    totalGmvNaira: 3950000,
    milestonesEarnedNaira: 16000,
    status: 'active',
    approvedAt: '2026-08-10',
  },
  {
    id: 'champ-3',
    fullName: 'Amina Bello',
    phone: '+2348033445566',
    state: 'FCT Abuja',
    lga: 'Municipal',
    neighborhood: 'Maitama / Wuse',
    activeBuysCount: 1,
    maxActiveBuys: 2,
    completedBuysCount: 5,
    totalGmvNaira: 2100000,
    milestonesEarnedNaira: 10000,
    status: 'active',
    approvedAt: '2026-08-20',
  },
  {
    id: 'champ-4',
    fullName: 'Emeka Nwosu',
    phone: '+2348044556677',
    state: 'Rivers',
    lga: 'Port Harcourt',
    neighborhood: 'Trans-Amadi',
    activeBuysCount: 0,
    maxActiveBuys: 2,
    completedBuysCount: 3,
    totalGmvNaira: 1420000,
    milestonesEarnedNaira: 6000,
    status: 'suspended',
    approvedAt: '2026-08-01',
    suspensionReason: 'Investigating suspected off-platform payment solicitations',
  },
];

const mockMilestonePayouts: MilestonePayoutRow[] = [
  {
    id: 'ms-1',
    championName: 'Dele Adeyemi',
    groupBuyTitle: 'Mama Gold Premium Parboiled Rice (50kg)',
    groupBuySlug: 'mama-gold-rice-lekki',
    targetQuantity: 100,
    paidQuantity: 100,
    amountNaira: 2000,
    creditedAt: '2026-09-19 18:45',
    ledgerRef: 'WTX-MS-20260919-001',
  },
  {
    id: 'ms-2',
    championName: 'Tunde Bakare',
    groupBuyTitle: 'Kings Cooking Oil (25L Jerrycan)',
    groupBuySlug: 'kings-cooking-oil-ikeja',
    targetQuantity: 50,
    paidQuantity: 50,
    amountNaira: 2000,
    creditedAt: '2026-09-18 14:10',
    ledgerRef: 'WTX-MS-20260918-002',
  },
  {
    id: 'ms-3',
    championName: 'Amina Bello',
    groupBuyTitle: 'Royal Stallion Rice (50kg)',
    groupBuySlug: 'royal-stallion-wuse',
    targetQuantity: 80,
    paidQuantity: 80,
    amountNaira: 2000,
    creditedAt: '2026-09-16 11:30',
    ledgerRef: 'WTX-MS-20260916-003',
  },
  {
    id: 'ms-4',
    championName: 'Dele Adeyemi',
    groupBuyTitle: 'Honey Beans Oloyin (50kg Bag)',
    groupBuySlug: 'oloyin-beans-lekki',
    targetQuantity: 40,
    paidQuantity: 40,
    amountNaira: 2000,
    creditedAt: '2026-09-12 09:20',
    ledgerRef: 'WTX-MS-20260912-004',
  },
];

export default function ChampionsPage() {
  const [activeTab, setActiveTab] = useState<'applications' | 'champions' | 'milestones'>('applications');
  const [applications, setApplications] = useState<ApplicationRow[]>(initialApplications);
  const [champions, setChampions] = useState<ChampionRow[]>(initialChampions);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedApp, setSelectedApp] = useState<ApplicationRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [suspendTarget, setSuspendTarget] = useState<ChampionRow | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Calculations
  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const activeChampionsCount = champions.filter((c) => c.status === 'active').length;
  const totalChampionGmv = champions.reduce((acc, c) => acc + c.totalGmvNaira, 0);
  const totalMilestonesDisbursed = mockMilestonePayouts.reduce((acc, m) => acc + m.amountNaira, 0);

  // Handlers
  const handleApproveApp = (app: ApplicationRow) => {
    if (confirm(`Approve ${app.fullName} as an Active Champion for ${app.neighborhood}?`)) {
      setApplications(
        applications.map((a) => (a.id === app.id ? { ...a, status: 'approved' } : a)),
      );
      const newChamp: ChampionRow = {
        id: `champ-${Date.now()}`,
        fullName: app.fullName,
        phone: app.phone,
        state: app.state,
        lga: app.lga,
        neighborhood: app.neighborhood,
        activeBuysCount: 0,
        maxActiveBuys: 2,
        completedBuysCount: 0,
        totalGmvNaira: 0,
        milestonesEarnedNaira: 0,
        status: 'active',
        approvedAt: new Date().toISOString().split('T')[0],
      };
      setChampions([newChamp, ...champions]);
      alert(`🎉 ${app.fullName} is now an Active Champion!`);
    }
  };

  const handleConfirmReject = () => {
    if (!selectedApp) return;
    setApplications(
      applications.map((a) => (a.id === selectedApp.id ? { ...a, status: 'rejected' } : a)),
    );
    setShowRejectModal(false);
    setSelectedApp(null);
    setRejectReason('');
    alert(`Application for ${selectedApp.fullName} rejected.`);
  };

  const handleConfirmSuspend = () => {
    if (!suspendTarget) return;
    setChampions(
      champions.map((c) =>
        c.id === suspendTarget.id
          ? { ...c, status: 'suspended', suspensionReason: suspendReason }
          : c,
      ),
    );
    setSuspendTarget(null);
    setSuspendReason('');
    alert(`Champion ${suspendTarget.fullName} has been suspended.`);
  };

  const handleReactivate = (champ: ChampionRow) => {
    if (confirm(`Reactivate ${champ.fullName} as an Active Champion?`)) {
      setChampions(
        champions.map((c) =>
          c.id === champ.id ? { ...c, status: 'active', suspensionReason: undefined } : c,
        ),
      );
      alert(`Champion ${champ.fullName} is now reactivated.`);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/champions" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        {/* Header */}
        <header style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
                Champion Management & Network
              </h1>
              <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
                Manage neighborhood organizers, review applications, enforce 2-active capacity caps (§8), and audit milestone payouts (Addendum A3).
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={styles.badgeInfo}>Addendum A3: Flat ₦2,000 Milestone</span>
              <span style={styles.badgeRule}>Spec §8: Max 2 Active Buys</span>
            </div>
          </div>
        </header>

        {/* Top KPI Cards */}
        <section style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>ACTIVE CHAMPIONS</span>
            <span style={styles.kpiValue}>{activeChampionsCount}</span>
            <span style={{ ...styles.kpiSub, color: '#16A34A' }}>Estate & community leaders</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>PENDING APPLICATIONS</span>
            <span style={{ ...styles.kpiValue, color: pendingCount > 0 ? '#D97706' : '#111827' }}>
              {pendingCount}
            </span>
            <span style={styles.kpiSub}>Awaiting operations review</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>CHAMPION GMV MOBILIZED</span>
            <span style={styles.kpiValue}>₦{totalChampionGmv.toLocaleString()}</span>
            <span style={{ ...styles.kpiSub, color: '#16A34A' }}>Total wholesale value unlocked</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>MILESTONE REWARDS PAID (A3)</span>
            <span style={{ ...styles.kpiValue, color: '#2563EB' }}>
              ₦{totalMilestonesDisbursed.toLocaleString()}
            </span>
            <span style={styles.kpiSub}>
              {mockMilestonePayouts.length} × ₦2,000 wallet credits
            </span>
          </div>
        </section>

        {/* Tab Selector */}
        <div style={styles.tabBar}>
          <button
            onClick={() => setActiveTab('applications')}
            style={{
              ...styles.tabBtn,
              borderBottom: activeTab === 'applications' ? '3px solid #16A34A' : '3px solid transparent',
              color: activeTab === 'applications' ? '#16A34A' : '#6B7280',
              fontWeight: activeTab === 'applications' ? 600 : 400,
            }}
          >
            Applications Pipeline {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            onClick={() => setActiveTab('champions')}
            style={{
              ...styles.tabBtn,
              borderBottom: activeTab === 'champions' ? '3px solid #16A34A' : '3px solid transparent',
              color: activeTab === 'champions' ? '#16A34A' : '#6B7280',
              fontWeight: activeTab === 'champions' ? 600 : 400,
            }}
          >
            Active Champions Roster ({champions.length})
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            style={{
              ...styles.tabBtn,
              borderBottom: activeTab === 'milestones' ? '3px solid #16A34A' : '3px solid transparent',
              color: activeTab === 'milestones' ? '#16A34A' : '#6B7280',
              fontWeight: activeTab === 'milestones' ? 600 : 400,
            }}
          >
            Milestone Payouts Audit (₦2,000 Ledger)
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: APPLICATIONS PIPELINE */}
        {/* ============================================================ */}
        {activeTab === 'applications' && (
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Candidate Champion Applications
              </h2>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>
                All applicants verify Nigerian phone number and neighborhood coordinate reach.
              </span>
            </div>

            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Applicant</th>
                  <th style={styles.th}>Phone (WhatsApp)</th>
                  <th style={styles.th}>Neighborhood / LGA</th>
                  <th style={styles.th}>Reach</th>
                  <th style={styles.th}>Motivation / Experience</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} style={styles.tr}>
                    <td style={styles.tdBold}>{app.fullName}</td>
                    <td style={styles.td}>{app.phone}</td>
                    <td style={styles.td}>
                      <strong>{app.neighborhood}</strong>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {app.lga}, {app.state}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badgeReach}>~{app.estimatedReach} households</span>
                    </td>
                    <td style={{ ...styles.td, maxWidth: '280px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>
                        "{app.motivation}"
                      </p>
                      {app.experience && (
                        <span style={{ fontSize: '11px', color: '#059669', display: 'block', marginTop: '4px' }}>
                          Exp: {app.experience}
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={
                          app.status === 'approved'
                            ? styles.badgeApproved
                            : app.status === 'rejected'
                            ? styles.badgeRejected
                            : styles.badgePending
                        }
                      >
                        {app.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {app.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApproveApp(app)}
                            style={styles.approveBtn}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setShowRejectModal(true);
                            }}
                            style={styles.rejectBtn}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: ACTIVE CHAMPIONS ROSTER */}
        {/* ============================================================ */}
        {activeTab === 'champions' && (
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Active Champions Directory
              </h2>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>
                Champions can manage up to 2 concurrent Group Buys (§8). Pricing & discounts are system-locked (§9).
              </span>
            </div>

            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Champion</th>
                  <th style={styles.th}>Location / Hub Area</th>
                  <th style={styles.th}>Active Buys (§8)</th>
                  <th style={styles.th}>Completed Buys</th>
                  <th style={styles.th}>GMV Mobilized</th>
                  <th style={styles.th}>Milestones (A3)</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {champions.map((champ) => {
                  const isAtLimit = champ.activeBuysCount >= champ.maxActiveBuys;
                  return (
                    <tr key={champ.id} style={styles.tr}>
                      <td style={styles.td}>
                        <Link
                          href={`/champions/${champ.id}`}
                          style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}
                        >
                          {champ.fullName}
                        </Link>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{champ.phone}</div>
                      </td>
                      <td style={styles.td}>
                        <strong>{champ.neighborhood}</strong>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {champ.lga}, {champ.state}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isAtLimit ? '#DC2626' : '#16A34A',
                          }}
                        >
                          {champ.activeBuysCount} / {champ.maxActiveBuys}
                        </span>
                        {isAtLimit && (
                          <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600 }}>
                            Capped (2/2)
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>{champ.completedBuysCount} successful</td>
                      <td style={styles.tdBold}>₦{champ.totalGmvNaira.toLocaleString()}</td>
                      <td style={{ ...styles.td, color: '#D97706', fontWeight: 600 }}>
                        ₦{champ.milestonesEarnedNaira.toLocaleString()}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={
                            champ.status === 'active'
                              ? styles.badgeApproved
                              : styles.badgeRejected
                          }
                        >
                          {champ.status.toUpperCase()}
                        </span>
                        {champ.suspensionReason && (
                          <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '2px' }}>
                            {champ.suspensionReason}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link href={`/champions/${champ.id}`} style={styles.viewBtn}>
                            Dossier
                          </Link>
                          {champ.status === 'active' ? (
                            <button
                              onClick={() => setSuspendTarget(champ)}
                              style={styles.suspendBtn}
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(champ)}
                              style={styles.reactivateBtn}
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: MILESTONE PAYOUTS AUDIT LEDGER */}
        {/* ============================================================ */}
        {activeTab === 'milestones' && (
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Addendum A3 — Champion Milestone Reward Audit Log
              </h2>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>
                ₦2,000 credited strictly on TARGET_REACHED (zero commission model). Expiry at MVFQ does not qualify.
              </span>
            </div>

            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Ledger Ref</th>
                  <th style={styles.th}>Champion</th>
                  <th style={styles.th}>Group Buy</th>
                  <th style={styles.th}>Target Volume</th>
                  <th style={styles.th}>Paid Units</th>
                  <th style={styles.th}>Reward Credited</th>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockMilestonePayouts.map((row) => (
                  <tr key={row.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px' }}>
                      {row.ledgerRef}
                    </td>
                    <td style={styles.tdBold}>{row.championName}</td>
                    <td style={styles.td}>
                      <Link
                        href={`/group-buys/${row.groupBuySlug}`}
                        style={{ color: '#16A34A', textDecoration: 'none' }}
                      >
                        {row.groupBuyTitle}
                      </Link>
                    </td>
                    <td style={styles.td}>{row.targetQuantity} units</td>
                    <td style={{ ...styles.td, color: '#16A34A', fontWeight: 600 }}>
                      {row.paidQuantity} / {row.targetQuantity} (100%)
                    </td>
                    <td style={{ ...styles.tdBold, color: '#16A34A' }}>
                      +₦{row.amountNaira.toLocaleString()}
                    </td>
                    <td style={styles.td}>{row.creditedAt}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeApproved}>CREDITED (WALLET)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reject Application Modal */}
        {showRejectModal && selectedApp && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 12px 0' }}>
                Reject Application: {selectedApp.fullName}
              </h3>
              <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px' }}>
                Please provide a rejection reason for compliance and applicant feedback.
              </p>
              <textarea
                rows={3}
                style={styles.modalTextarea}
                placeholder="Reason (e.g. Unverified location, insufficient household network)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedApp(null);
                  }}
                  style={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button onClick={handleConfirmReject} style={styles.modalConfirmRejectBtn}>
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suspend Champion Modal */}
        {suspendTarget && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#DC2626', margin: '0 0 12px 0' }}>
                Suspend Champion: {suspendTarget.fullName}
              </h3>
              <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px' }}>
                Suspension immediately locks the Champion from initiating new Group Buys. Ongoing group buys will run to fulfilment.
              </p>
              <textarea
                rows={3}
                style={styles.modalTextarea}
                placeholder="Enter formal suspension reason (audited in system logs)..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button onClick={() => setSuspendTarget(null)} style={styles.modalCancelBtn}>
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
    marginBottom: '28px',
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
    fontSize: '26px',
    fontWeight: 800,
    color: '#111827',
  },
  kpiSub: {
    fontSize: '12px',
    color: '#6B7280',
  },
  tabBar: {
    display: 'flex',
    gap: '32px',
    borderBottom: '1px solid #E5E7EB',
    marginBottom: '24px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '12px 4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
  },
  tableHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    padding: '12px 20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #F3F4F6',
  },
  td: {
    padding: '14px 20px',
    color: '#374151',
  },
  tdBold: {
    padding: '14px 20px',
    fontWeight: 600,
    color: '#111827',
  },
  badgeReach: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
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
  badgeInfo: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  badgeRule: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  approveBtn: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rejectBtn: {
    backgroundColor: '#F3F4F6',
    color: '#DC2626',
    border: '1px solid #E5E7EB',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
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
  suspendBtn: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    border: 'none',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  reactivateBtn: {
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
    border: 'none',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
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
  modalConfirmRejectBtn: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
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
