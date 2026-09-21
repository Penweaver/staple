'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import { formatNaira, FestiveCategory } from '@staple/shared';

interface AdminInstalmentRow {
  id: string;
  instalmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidAt?: string;
}

interface AdminPlanRow {
  id: string;
  planNumber: string;
  customerName: string;
  customerPhone: string;
  category: FestiveCategory;
  seasonName: string;
  basketName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  deliveryDate: string;
  hubName: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  isFullyPaid: boolean;
  hasOverdue: boolean;
  maxDaysOverdue: number;
  isBeyondGrace: boolean; // Overdue > 7 days
  daysRemainingInGrace: number;
  enrolledAt: string;
  instalments: AdminInstalmentRow[];
}

interface AdminSeasonCard {
  id: string;
  category: FestiveCategory;
  name: string;
  year: number;
  deliveryWindow: string;
  planningDates: string;
  activePlansCount: number;
  committedGmvNaira: number;
  isActive: boolean;
}

const initialSeasons: AdminSeasonCard[] = [
  {
    id: 's-owambe-2026',
    category: FestiveCategory.OWAMBE_PARTY,
    name: 'Owambe & Family Milestone Celebrations 2026',
    year: 2026,
    deliveryWindow: 'Custom User Event Dates (42–100 Day Window)',
    planningDates: 'Jan 1 – Dec 31, 2026',
    activePlansCount: 92,
    committedGmvNaira: 22080000,
    isActive: true,
  },
  {
    id: 's-xmas-2026',
    category: FestiveCategory.CHRISTMAS,
    name: 'Christmas & End-of-Year 2026 Celebration',
    year: 2026,
    deliveryWindow: 'Dec 18 – Dec 24, 2026',
    planningDates: 'Sep 1 – Dec 10, 2026',
    activePlansCount: 68,
    committedGmvNaira: 14960000,
    isActive: true,
  },
  {
    id: 's-ileya-2026',
    category: FestiveCategory.ILEYA,
    name: 'Eid-el-Kabir (Ileya) 2026 Feast',
    year: 2026,
    deliveryWindow: 'May 20 – May 26, 2026',
    planningDates: 'Feb 1 – May 15, 2026',
    activePlansCount: 24,
    committedGmvNaira: 7120000,
    isActive: true,
  },
];

const initialPlans: AdminPlanRow[] = [
  {
    id: 'plan-1',
    planNumber: 'STP-FST-2026-0081',
    customerName: 'Adeola Adeyemi',
    customerPhone: '+2348032145678',
    category: FestiveCategory.OWAMBE_PARTY,
    seasonName: 'Owambe 2026',
    basketName: 'Owambe Mega Party Catering Basket',
    totalAmount: 240000,
    paidAmount: 160000,
    remainingAmount: 80000,
    deliveryDate: '2026-11-28',
    hubName: 'staple Hub — Lekki Admiralty',
    status: 'active',
    isFullyPaid: false,
    hasOverdue: false,
    maxDaysOverdue: 0,
    isBeyondGrace: false,
    daysRemainingInGrace: 7,
    enrolledAt: '2026-09-01 10:30',
    instalments: [
      { id: 'i-1', instalmentNumber: 1, amount: 80000, dueDate: '2026-09-01', status: 'paid', paidAt: '2026-09-01 10:32' },
      { id: 'i-2', instalmentNumber: 2, amount: 80000, dueDate: '2026-10-01', status: 'paid', paidAt: '2026-09-20 14:15' },
      { id: 'i-3', instalmentNumber: 3, amount: 80000, dueDate: '2026-11-15', status: 'pending' },
    ],
  },
  {
    id: 'plan-2',
    planNumber: 'STP-FST-2026-0082',
    customerName: 'Emeka Nwachukwu',
    customerPhone: '+2348028765432',
    category: FestiveCategory.CHRISTMAS,
    seasonName: 'Christmas 2026',
    basketName: 'Christmas Family Deluxe Hamper',
    totalAmount: 165000,
    paidAmount: 55000,
    remainingAmount: 110000,
    deliveryDate: '2026-12-22',
    hubName: 'staple Hub — Ikeja GRA',
    status: 'active',
    isFullyPaid: false,
    hasOverdue: true,
    maxDaysOverdue: 3,
    isBeyondGrace: false,
    daysRemainingInGrace: 4,
    enrolledAt: '2026-09-05 14:20',
    instalments: [
      { id: 'i-4', instalmentNumber: 1, amount: 55000, dueDate: '2026-09-05', status: 'paid', paidAt: '2026-09-05 14:25' },
      { id: 'i-5', instalmentNumber: 2, amount: 55000, dueDate: '2026-09-18', status: 'overdue' },
      { id: 'i-6', instalmentNumber: 3, amount: 55000, dueDate: '2026-11-20', status: 'pending' },
    ],
  },
  {
    id: 'plan-3',
    planNumber: 'STP-FST-2026-0083',
    customerName: 'Fatima Bello',
    customerPhone: '+2348099887766',
    category: FestiveCategory.OWAMBE_PARTY,
    seasonName: 'Owambe 2026',
    basketName: 'Owambe Mega Party Catering Basket',
    totalAmount: 240000,
    paidAmount: 80000,
    remainingAmount: 160000,
    deliveryDate: '2026-11-10',
    hubName: 'staple Hub — Wuse 2',
    status: 'active',
    isFullyPaid: false,
    hasOverdue: true,
    maxDaysOverdue: 9,
    isBeyondGrace: true, // 9 days overdue > 7-day grace period
    daysRemainingInGrace: 0,
    enrolledAt: '2026-08-20 09:15',
    instalments: [
      { id: 'i-7', instalmentNumber: 1, amount: 80000, dueDate: '2026-08-20', status: 'paid', paidAt: '2026-08-20 09:18' },
      { id: 'i-8', instalmentNumber: 2, amount: 80000, dueDate: '2026-09-12', status: 'overdue' },
      { id: 'i-9', instalmentNumber: 3, amount: 80000, dueDate: '2026-10-25', status: 'pending' },
    ],
  },
  {
    id: 'plan-4',
    planNumber: 'STP-FST-2026-0084',
    customerName: 'Chidinma Eze',
    customerPhone: '+2348051239874',
    category: FestiveCategory.ILEYA,
    seasonName: 'Ileya 2026',
    basketName: 'Ileya Celebration Feast Pack',
    totalAmount: 195000,
    paidAmount: 195000,
    remainingAmount: 0,
    deliveryDate: '2026-05-22',
    hubName: 'staple Hub — GRA Phase 2',
    status: 'active',
    isFullyPaid: true,
    hasOverdue: false,
    maxDaysOverdue: 0,
    isBeyondGrace: false,
    daysRemainingInGrace: 7,
    enrolledAt: '2026-09-02 11:45',
    instalments: [
      { id: 'i-10', instalmentNumber: 1, amount: 195000, dueDate: '2026-09-02', status: 'paid', paidAt: '2026-09-02 11:50' },
    ],
  },
];

export default function FestiveAdminPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'seasons'>('plans');
  const [plans, setPlans] = useState<AdminPlanRow[]>(initialPlans);
  const [seasons, setSeasons] = useState<AdminSeasonCard[]>(initialSeasons);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  // Modals
  const [inspectPlan, setInspectPlan] = useState<AdminPlanRow | null>(null);
  const [cancelModalPlan, setCancelModalPlan] = useState<AdminPlanRow | null>(null);
  const [cancelModalSeason, setCancelModalSeason] = useState<AdminSeasonCard | null>(null);

  // Cancel form
  const [cancelReason, setCancelReason] = useState<string>('Instalment default beyond 7-day grace period');
  const [seasonCancelReason, setSeasonCancelReason] = useState<string>('Supply disruption / logistics suspension');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Summary Metrics
  const totalCommittedGmv = plans.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPaidToDate = plans.reduce((sum, p) => sum + p.paidAmount, 0);
  const overduePlansCount = plans.filter((p) => p.hasOverdue).length;
  const defaultedCount = plans.filter((p) => p.isBeyondGrace).length;

  // Filtered Plans
  const filteredPlans = plans.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (overdueOnly && !p.hasOverdue) return false;
    return true;
  });

  // Action: Admin Cancel Defaulted Plan (Spec §35 / Addendum B5)
  const handleConfirmCancelPlan = () => {
    if (!cancelModalPlan) return;
    setIsProcessing(true);

    setTimeout(() => {
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== cancelModalPlan.id) return p;
          return {
            ...p,
            status: 'cancelled',
            instalments: p.instalments.map((i) =>
              i.status === 'paid' ? i : { ...i, status: 'cancelled' as const }
            ),
          };
        })
      );
      setIsProcessing(false);
      alert(
        `Plan ${cancelModalPlan.planNumber} cancelled. Forfeited amount: ${formatNaira(
          cancelModalPlan.paidAmount
        )} per §35 policy.`
      );
      setCancelModalPlan(null);
    }, 600);
  };

  // Action: Admin Emergency Season Cancellation (Founder Addendum A2 - 100% Wallet Refund)
  const handleConfirmCancelSeason = () => {
    if (!cancelModalSeason) return;
    setIsProcessing(true);

    setTimeout(() => {
      // Deactivate season
      setSeasons((prev) =>
        prev.map((s) => (s.id === cancelModalSeason.id ? { ...s, isActive: false } : s))
      );

      // Refund all plans under this category
      let totalRefunded = 0;
      let countRefunded = 0;

      setPlans((prev) =>
        prev.map((p) => {
          if (p.category !== cancelModalSeason.category) return p;
          if (p.paidAmount > 0) {
            totalRefunded += p.paidAmount;
            countRefunded++;
          }
          return {
            ...p,
            status: 'cancelled',
            instalments: p.instalments.map((i) => ({ ...i, status: 'cancelled' as const })),
          };
        })
      );

      setIsProcessing(false);
      alert(
        `Season "${cancelModalSeason.name}" cancelled! 100% refund of ${formatNaira(
          totalRefunded
        )} credited to user wallets for ${countRefunded} plan(s) with refund_reason='festive_season_cancelled'.`
      );
      setCancelModalSeason(null);
    }, 800);
  };

  return (
    <div style={styles.layout}>
      <AdminNav currentPath="/festive" />

      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Festive & Seasonal Planning Console</h1>
            <p style={styles.subtitle}>
              Monitor Owambe 42–100 day milestones, Christmas & Ileya bulk orders, and enforce 7-day instalment grace rules.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === 'plans' ? '#16A34A' : '#FFFFFF',
                color: activeTab === 'plans' ? '#FFFFFF' : '#374151',
              }}
              onClick={() => setActiveTab('plans')}
            >
              📋 Customer Plans ({plans.length})
            </button>
            <button
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === 'seasons' ? '#16A34A' : '#FFFFFF',
                color: activeTab === 'seasons' ? '#FFFFFF' : '#374151',
              }}
              onClick={() => setActiveTab('seasons')}
            >
              🎉 Active Campaigns ({seasons.length})
            </button>
          </div>
        </header>

        {/* Metric Summary Cards */}
        <section style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>TOTAL COMMITTED GMV</span>
            <span style={styles.kpiValue}>{formatNaira(totalCommittedGmv)}</span>
            <span style={{ fontSize: '12px', color: '#16A34A' }}>Across {plans.length} festive plans</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>COLLECTED TO DATE</span>
            <span style={{ ...styles.kpiValue, color: '#16A34A' }}>{formatNaira(totalPaidToDate)}</span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              {Math.round((totalPaidToDate / totalCommittedGmv) * 100)}% payment realization
            </span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>OVERDUE / AT-RISK</span>
            <span style={{ ...styles.kpiValue, color: overduePlansCount > 0 ? '#DC2626' : '#16A34A' }}>
              {overduePlansCount} Plans
            </span>
            <span style={{ fontSize: '12px', color: '#B45309' }}>
              {defaultedCount} eligible for §35 default forfeiture
            </span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>OWAMBE 42–100D POLICY</span>
            <span style={styles.kpiValue}>100% Compliant</span>
            <span style={{ fontSize: '12px', color: '#4B5563' }}>Spec §39 planning window active</span>
          </div>
        </section>

        {activeTab === 'plans' ? (
          /* Plans Operations View */
          <section style={styles.tableSection}>
            {/* Filter Bar */}
            <div style={styles.filterBar}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Campaign:</label>
                <select
                  style={styles.select}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Campaigns</option>
                  <option value={FestiveCategory.OWAMBE_PARTY}>Owambe Parties</option>
                  <option value={FestiveCategory.CHRISTMAS}>Christmas 2026</option>
                  <option value={FestiveCategory.ILEYA}>Ileya 2026</option>
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Status:</label>
                <select
                  style={styles.select}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                />
                Show Overdue / At-Risk Only ({overduePlansCount})
              </label>
            </div>

            {/* Plans Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={styles.th}>Plan ID & Date</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Campaign & Basket</th>
                    <th style={styles.th}>Target Delivery & Hub</th>
                    <th style={styles.th}>Paid / Total (₦)</th>
                    <th style={styles.th}>Grace & Overdue Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={styles.emptyTd}>
                        No festive plans match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredPlans.map((plan) => {
                      const pct = Math.round((plan.paidAmount / plan.totalAmount) * 100);

                      return (
                        <tr key={plan.id} style={styles.tableRow}>
                          <td style={styles.td}>
                            <strong>{plan.planNumber}</strong>
                            <div style={styles.subText}>{plan.enrolledAt}</div>
                          </td>

                          <td style={styles.td}>
                            <div style={{ fontWeight: 600 }}>{plan.customerName}</div>
                            <div style={styles.subText}>{plan.customerPhone}</div>
                          </td>

                          <td style={styles.td}>
                            <span style={styles.categoryBadge}>{plan.seasonName}</span>
                            <div style={{ fontSize: '13px', marginTop: '2px' }}>{plan.basketName}</div>
                          </td>

                          <td style={styles.td}>
                            <div style={{ fontWeight: 500 }}>📅 {plan.deliveryDate}</div>
                            <div style={styles.subText}>📍 {plan.hubName}</div>
                          </td>

                          <td style={styles.td}>
                            <div>
                              <strong>{formatNaira(plan.paidAmount)}</strong> / {formatNaira(plan.totalAmount)}
                            </div>
                            <div style={styles.progressBarBg}>
                              <div
                                style={{
                                  ...styles.progressBarFill,
                                  width: `${pct}%`,
                                  backgroundColor: plan.isFullyPaid ? '#16A34A' : '#3B82F6',
                                }}
                              />
                            </div>
                            <div style={styles.subText}>{pct}% paid</div>
                          </td>

                          <td style={styles.td}>
                            {plan.status === 'cancelled' ? (
                              <span style={styles.badgeCancelled}>Cancelled</span>
                            ) : plan.isFullyPaid ? (
                              <span style={styles.badgeSuccess}>✅ Fully Paid</span>
                            ) : plan.isBeyondGrace ? (
                              <span style={styles.badgeDefault}>
                                ⚠️ Defaulted: {plan.maxDaysOverdue}d overdue (§35)
                              </span>
                            ) : plan.hasOverdue ? (
                              <span style={styles.badgeGrace}>
                                ⏳ Overdue: {plan.daysRemainingInGrace}d left in grace
                              </span>
                            ) : (
                              <span style={styles.badgeOnTrack}>On Track</span>
                            )}
                          </td>

                          <td style={styles.td}>
                            <div style={styles.actionRow}>
                              <button
                                style={styles.viewBtn}
                                onClick={() => setInspectPlan(plan)}
                              >
                                View Schedule
                              </button>

                              {plan.status === 'active' && plan.isBeyondGrace && (
                                <button
                                  style={styles.cancelBtn}
                                  onClick={() => setCancelModalPlan(plan)}
                                >
                                  Cancel (Forfeit)
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          /* Seasons & Campaigns View */
          <section style={styles.seasonsSection}>
            <div style={styles.seasonsGrid}>
              {seasons.map((season) => (
                <div key={season.id} style={styles.seasonCard}>
                  <div style={styles.seasonCardHeader}>
                    <h3 style={styles.seasonTitle}>{season.name}</h3>
                    <span
                      style={{
                        ...styles.statusPill,
                        backgroundColor: season.isActive ? '#DCFCE7' : '#FEE2E2',
                        color: season.isActive ? '#14532D' : '#991B1B',
                      }}
                    >
                      {season.isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </div>

                  <p style={styles.seasonDesc}>
                    <strong>Planning Window:</strong> {season.planningDates}
                  </p>
                  <p style={styles.seasonDesc}>
                    <strong>Delivery Window:</strong> {season.deliveryWindow}
                  </p>

                  <div style={styles.seasonStats}>
                    <div>
                      <div style={styles.subText}>Active Plans</div>
                      <div style={{ fontSize: '18px', fontWeight: 700 }}>{season.activePlansCount}</div>
                    </div>
                    <div>
                      <div style={styles.subText}>Committed GMV</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#16A34A' }}>
                        {formatNaira(season.committedGmvNaira)}
                      </div>
                    </div>
                  </div>

                  {season.isActive && (
                    <button
                      style={styles.emergencyCancelBtn}
                      onClick={() => setCancelModalSeason(season)}
                    >
                      🚨 Emergency Season Cancellation (100% Refund)
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal 1: Inspect Schedule */}
      {inspectPlan && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0 }}>Payment Schedule: {inspectPlan.planNumber}</h3>
                <div style={styles.subText}>{inspectPlan.customerName} ({inspectPlan.customerPhone})</div>
              </div>
              <button style={styles.closeBtn} onClick={() => setInspectPlan(null)}>✕</button>
            </div>

            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <table style={{ ...styles.table, width: '100%' }}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Due Date</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectPlan.instalments.map((inst) => (
                    <tr key={inst.id} style={styles.tableRow}>
                      <td style={styles.td}>Instalment #{inst.instalmentNumber}</td>
                      <td style={styles.td}><strong>{formatNaira(inst.amount)}</strong></td>
                      <td style={styles.td}>{inst.dueDate}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusPill,
                            backgroundColor:
                              inst.status === 'paid'
                                ? '#DCFCE7'
                                : inst.status === 'overdue'
                                ? '#FEE2E2'
                                : '#FEF3C7',
                            color:
                              inst.status === 'paid'
                                ? '#14532D'
                                : inst.status === 'overdue'
                                ? '#991B1B'
                                : '#92400E',
                          }}
                        >
                          {inst.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>{inst.paidAt || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button style={styles.viewBtn} onClick={() => setInspectPlan(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Default Forfeiture Cancellation (Spec §35 / Addendum B5) */}
      {cancelModalPlan && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#DC2626' }}>
                Cancel Defaulted Plan (Spec §35 Forfeiture)
              </h3>
              <button style={styles.closeBtn} onClick={() => setCancelModalPlan(null)}>✕</button>
            </div>

            <div style={styles.forfeitureWarning}>
              <p style={{ margin: 0, fontWeight: 600 }}>⚠️ Spec §35 & Addendum B5 Default Policy Notice:</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                This plan has exceeded the 7-day grace period ({cancelModalPlan.maxDaysOverdue} days overdue). Cancelling this plan will forfeit prior paid amounts ({formatNaira(cancelModalPlan.paidAmount)}) to cover wholesale procurement losses. The customer acknowledged this non-refundable policy upon enrolment.
              </p>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={styles.filterLabel}>Cancellation Reason:</label>
              <input
                type="text"
                style={styles.modalInput}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                style={styles.ghostBtn}
                onClick={() => setCancelModalPlan(null)}
                disabled={isProcessing}
              >
                Go Back
              </button>
              <button
                style={styles.dangerBtn}
                onClick={handleConfirmCancelPlan}
                disabled={isProcessing}
              >
                {isProcessing ? 'Cancelling...' : 'Confirm Forfeiture & Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Emergency Season Cancellation (Addendum A2 - 100% Refund) */}
      {cancelModalSeason && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#DC2626' }}>
                Emergency Season Cancellation (Founder Addendum A2)
              </h3>
              <button style={styles.closeBtn} onClick={() => setCancelModalSeason(null)}>✕</button>
            </div>

            <div style={styles.refundNotice}>
              <p style={{ margin: 0, fontWeight: 600 }}>🚨 Full Refund Protection Rule:</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                Cancelling this entire season triggers <strong>100% automatic wallet refunds</strong> for all customer instalments paid to date under &quot;{cancelModalSeason.name}&quot; with <code>refund_reason = &apos;festive_season_cancelled&apos;</code>.
              </p>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={styles.filterLabel}>Operational Reason for Cancellation:</label>
              <input
                type="text"
                style={styles.modalInput}
                value={seasonCancelReason}
                onChange={(e) => setSeasonCancelReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                style={styles.ghostBtn}
                onClick={() => setCancelModalSeason(null)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                style={styles.dangerBtn}
                onClick={handleConfirmCancelSeason}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing 100% Refunds...' : 'Confirm Season Cancellation & 100% Refunds'}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  tabBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
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
    gap: '20px',
    padding: '16px 20px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#991B1B',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  tableContainer: {
    overflowX: 'auto' as const,
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
  emptyTd: {
    padding: '32px',
    textAlign: 'center' as const,
    color: '#6B7280',
  },
  subText: {
    fontSize: '12px',
    color: '#6B7280',
  },
  categoryBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#EEF2FF',
    color: '#3730A3',
  },
  progressBarBg: {
    width: '100px',
    height: '6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '3px',
    marginTop: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
  },
  badgeSuccess: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: '#DCFCE7',
    color: '#14532D',
  },
  badgeGrace: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  badgeDefault: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  badgeCancelled: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
  },
  badgeOnTrack: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
  },
  actionRow: {
    display: 'flex',
    gap: '6px',
  },
  viewBtn: {
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #FCA5A5',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  seasonsSection: {
    marginTop: '8px',
  },
  seasonsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  seasonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  seasonCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  seasonTitle: {
    fontSize: '16px',
    fontWeight: 700,
    margin: 0,
    color: '#111827',
  },
  statusPill: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  seasonDesc: {
    fontSize: '13px',
    color: '#4B5563',
    margin: '4px 0',
  },
  seasonStats: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: '12px',
    borderRadius: '6px',
    margin: '16px 0',
  },
  emergencyCancelBtn: {
    marginTop: 'auto',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #FCA5A5',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    padding: '24px',
    width: '560px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#6B7280',
  },
  forfeitureWarning: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #F87171',
    borderRadius: '6px',
    padding: '12px',
    color: '#991B1B',
  },
  refundNotice: {
    backgroundColor: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: '6px',
    padding: '12px',
    color: '#92400E',
  },
  modalInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '13px',
    marginTop: '6px',
    boxSizing: 'border-box' as const,
  },
  ghostBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  dangerBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
