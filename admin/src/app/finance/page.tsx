'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import { formatNaira } from '@staple/shared';

interface WalletRow {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  currentBalance: number;
  ledgerBalance: number;
  discrepancy: number;
  isBalanced: boolean;
  lastActivityAt: string;
}

interface TransactionRow {
  id: string;
  walletId: string;
  userName: string;
  entrySide: 'credit' | 'debit';
  transactionType: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

const mockWallets: WalletRow[] = [
  {
    id: 'wal-001',
    userId: 'usr-101',
    customerName: 'Amina Bello',
    customerEmail: 'amina.bello@example.ng',
    currentBalance: 35000,
    ledgerBalance: 35000,
    discrepancy: 0,
    isBalanced: true,
    lastActivityAt: '2026-09-21 14:10:00',
  },
  {
    id: 'wal-002',
    userId: 'usr-102',
    customerName: 'Babajide Ogundipe',
    customerEmail: 'babajide.og@example.ng',
    currentBalance: 120500,
    ledgerBalance: 120500,
    discrepancy: 0,
    isBalanced: true,
    lastActivityAt: '2026-09-21 13:45:22',
  },
  {
    id: 'wal-003',
    userId: 'usr-103',
    customerName: 'Chidinma Okafor',
    customerEmail: 'chidinma.o@example.ng',
    currentBalance: 8200,
    ledgerBalance: 8200,
    discrepancy: 0,
    isBalanced: true,
    lastActivityAt: '2026-09-21 11:20:15',
  },
  {
    id: 'wal-004',
    userId: 'usr-104',
    customerName: 'Emeka Nnamdi',
    customerEmail: 'emeka.nn@example.ng',
    currentBalance: 250000,
    ledgerBalance: 250000,
    discrepancy: 0,
    isBalanced: true,
    lastActivityAt: '2026-09-20 18:30:00',
  },
  {
    id: 'wal-005',
    userId: 'usr-105',
    customerName: 'Folake Adeleke',
    customerEmail: 'folake.ad@example.ng',
    currentBalance: 0,
    ledgerBalance: 0,
    discrepancy: 0,
    isBalanced: true,
    lastActivityAt: '2026-09-19 09:12:00',
  },
];

const mockTransactions: TransactionRow[] = [
  {
    id: 'tx-881',
    walletId: 'wal-001',
    userName: 'Amina Bello',
    entrySide: 'credit',
    transactionType: 'credit_price_adjustment',
    amount: 3500,
    balanceAfter: 35000,
    description: 'Retroactive Tier Discount Rebate for mama-gold-50kg-lekki',
    createdAt: '2026-09-21 14:10:00',
  },
  {
    id: 'tx-880',
    walletId: 'wal-002',
    userName: 'Babajide Ogundipe',
    entrySide: 'debit',
    transactionType: 'debit_purchase',
    amount: 45000,
    balanceAfter: 120500,
    description: 'Order STP-ORD-20260921-992182 split payment deduction',
    createdAt: '2026-09-21 13:45:22',
  },
  {
    id: 'tx-879',
    walletId: 'wal-003',
    userName: 'Chidinma Okafor',
    entrySide: 'credit',
    transactionType: 'credit_refund',
    amount: 8200,
    balanceAfter: 8200,
    description: '100% Refund: Minimum Viable Quantity not reached for brown-beans-ikeja',
    createdAt: '2026-09-21 11:20:15',
  },
  {
    id: 'tx-878',
    walletId: 'wal-004',
    userName: 'Emeka Nnamdi',
    entrySide: 'credit',
    transactionType: 'credit_deposit',
    amount: 250000,
    balanceAfter: 250000,
    description: 'Top-up via Paystack bank transfer (ref: PSTK_88271827)',
    createdAt: '2026-09-20 18:30:00',
  },
];

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'cron'>('wallets');
  const [walletFilter, setWalletFilter] = useState<'all' | 'balanced' | 'discrepancy'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reconciliationModal, setReconciliationModal] = useState<{
    isOpen: boolean;
    isRunning: boolean;
    result: {
      totalWallets: number;
      balancedWallets: number;
      discrepantWallets: number;
      totalSystemLiability: number;
      isClean: boolean;
      timestamp: string;
    } | null;
  }>({
    isOpen: false,
    isRunning: false,
    result: null,
  });

  // ── Mutable wallet & transaction state (so manual credits reflect immediately) ──
  const [wallets, setWallets] = useState<WalletRow[]>(mockWallets);
  const [transactions, setTransactions] = useState<TransactionRow[]>(mockTransactions);

  // ── Manual Wallet Credit Modal ──
  const [creditModal, setCreditModal] = useState<{
    isOpen: boolean;
    selectedWalletId: string;
    amount: string;
    reference: string;
    isProcessing: boolean;
  }>({
    isOpen: false,
    selectedWalletId: '',
    amount: '',
    reference: '',
    isProcessing: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRunReconciliation = () => {
    setReconciliationModal({
      isOpen: true,
      isRunning: true,
      result: null,
    });

    setTimeout(() => {
      setReconciliationModal({
        isOpen: true,
        isRunning: false,
        result: {
          totalWallets: wallets.length,
          balancedWallets: wallets.length,
          discrepantWallets: 0,
          totalSystemLiability: wallets.reduce((acc, w) => acc + w.currentBalance, 0),
          isClean: true,
          timestamp: new Date().toISOString(),
        },
      });
    }, 1000);
  };

  const handleProcessExpiries = () => {
    showToast('Checking live group buys... 2 group buys evaluated: 1 transitioned to Fulfilment (MVFQ met), 1 auto-refunded to buyer wallets.');
  };

  const handleDisburseTierCredits = () => {
    showToast('Evaluating 48-hour hold window... 4 orders matured and ₦14,000 credited to buyer wallets.');
  };

  // ── Manual Credit Handler ──
  const handleManualCredit = () => {
    const amt = parseFloat(creditModal.amount);
    if (isNaN(amt) || amt <= 0) {
      showToast('⚠️ Please enter a valid amount greater than 0.');
      return;
    }
    if (!creditModal.selectedWalletId) {
      showToast('⚠️ Please select a customer wallet.');
      return;
    }

    setCreditModal((prev) => ({ ...prev, isProcessing: true }));

    // Simulate a brief delay as if calling the backend
    setTimeout(() => {
      const walletId = creditModal.selectedWalletId;
      const ref = creditModal.reference || 'Manual Deposit — Admin Verified';

      // Update wallet balance
      setWallets((prev) =>
        prev.map((w) =>
          w.id === walletId
            ? {
                ...w,
                currentBalance: w.currentBalance + amt,
                ledgerBalance: w.ledgerBalance + amt,
                lastActivityAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              }
            : w,
        ),
      );

      // Find the wallet for the transaction entry
      const targetWallet = wallets.find((w) => w.id === walletId);
      const newBalance = (targetWallet?.currentBalance || 0) + amt;

      // Add a new transaction entry
      const newTx: TransactionRow = {
        id: `tx-${Date.now()}`,
        walletId,
        userName: targetWallet?.customerName || 'Unknown',
        entrySide: 'credit',
        transactionType: 'credit_manual_deposit',
        amount: amt,
        balanceAfter: newBalance,
        description: ref,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      setTransactions((prev) => [newTx, ...prev]);

      // Close modal and show toast
      setCreditModal({
        isOpen: false,
        selectedWalletId: '',
        amount: '',
        reference: '',
        isProcessing: false,
      });

      showToast(`✅ ${formatNaira(amt)} credited to ${targetWallet?.customerName}'s wallet. Ref: ${ref}`);
    }, 800);
  };

  const filteredWallets = wallets.filter((w) => {
    const matchesSearch =
      w.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (walletFilter === 'balanced') return w.isBalanced;
    if (walletFilter === 'discrepancy') return !w.isBalanced;
    return true;
  });

  const totalLiability = wallets.reduce((acc, w) => acc + w.currentBalance, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/finance" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div style={styles.toast}>
            <span>⚡ {toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Financial Reconciliation & Wallet Ledger
            </h1>
            <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
              Double-entry ledger accounting, liquid system liabilities, and automated maintenance triggers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRunReconciliation}
              style={styles.primaryButton}
            >
              ⚖️ Run Daily Reconciliation
            </button>
            <button
              onClick={handleProcessExpiries}
              style={styles.secondaryButton}
            >
              ⏳ Process Expiries
            </button>
            <button
              onClick={handleDisburseTierCredits}
              style={styles.secondaryButton}
            >
              💰 Disburse Tier Rebates (48h)
            </button>
            <button
              onClick={() => setCreditModal({ isOpen: true, selectedWalletId: '', amount: '', reference: '', isProcessing: false })}
              style={{ ...styles.primaryButton, backgroundColor: '#7C3AED' }}
            >
              🏦 Manual Wallet Credit
            </button>
          </div>
        </header>

        {/* Executive Metrics Cards */}
        <section style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Total System Wallet Liability</div>
            <div style={styles.metricValueLarge}>{formatNaira(totalLiability)}</div>
            <div style={styles.metricSubtitle}>Customer funds held in staple wallets</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Active Wallets Monitored</div>
            <div style={styles.metricValue}>{wallets.length}</div>
            <div style={{ ...styles.metricSubtitle, color: '#0E9F6E' }}>100% Active with KYC</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Double-Entry Audit Status</div>
            <div style={{ ...styles.metricValue, color: '#0E9F6E' }}>CLEAN (0 Discrepancy)</div>
            <div style={styles.metricSubtitle}>Σ(Credits) - Σ(Debits) = Balance verified</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>48-Hour Held Tier Savings</div>
            <div style={styles.metricValue}>{formatNaira(24500)}</div>
            <div style={styles.metricSubtitle}>Pending release post-fulfilment</div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab('wallets')}
            style={{
              ...styles.tabButton,
              borderBottom: activeTab === 'wallets' ? '2px solid #16A34A' : 'none',
              color: activeTab === 'wallets' ? '#16A34A' : '#6B7280',
              fontWeight: activeTab === 'wallets' ? 600 : 500,
            }}
          >
            Customer Wallets & Balances ({wallets.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            style={{
              ...styles.tabButton,
              borderBottom: activeTab === 'transactions' ? '2px solid #16A34A' : 'none',
              color: activeTab === 'transactions' ? '#16A34A' : '#6B7280',
              fontWeight: activeTab === 'transactions' ? 600 : 500,
            }}
          >
            Double-Entry Transaction Ledger ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('cron')}
            style={{
              ...styles.tabButton,
              borderBottom: activeTab === 'cron' ? '2px solid #16A34A' : 'none',
              color: activeTab === 'cron' ? '#16A34A' : '#6B7280',
              fontWeight: activeTab === 'cron' ? 600 : 500,
            }}
          >
            Automated Cron Pipeline Monitor
          </button>
        </div>

        {/* Tab 1: Wallets View */}
        {activeTab === 'wallets' && (
          <div style={styles.card}>
            <div style={styles.tableControls}>
              <input
                type="text"
                placeholder="Search by customer name, email or wallet ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setWalletFilter('all')}
                  style={{
                    ...styles.filterButton,
                    backgroundColor: walletFilter === 'all' ? '#16A34A' : '#FFFFFF',
                    color: walletFilter === 'all' ? '#FFFFFF' : '#374151',
                  }}
                >
                  All ({wallets.length})
                </button>
                <button
                  onClick={() => setWalletFilter('balanced')}
                  style={{
                    ...styles.filterButton,
                    backgroundColor: walletFilter === 'balanced' ? '#16A34A' : '#FFFFFF',
                    color: walletFilter === 'balanced' ? '#FFFFFF' : '#374151',
                  }}
                >
                  Balanced (100%)
                </button>
                <button
                  onClick={() => setWalletFilter('discrepancy')}
                  style={{
                    ...styles.filterButton,
                    backgroundColor: walletFilter === 'discrepancy' ? '#EF4444' : '#FFFFFF',
                    color: walletFilter === 'discrepancy' ? '#FFFFFF' : '#374151',
                  }}
                >
                  Discrepant (0)
                </button>
              </div>
            </div>

            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Wallet ID</th>
                  <th style={styles.th}>Current Balance</th>
                  <th style={styles.th}>Ledger Balance</th>
                  <th style={styles.th}>Discrepancy</th>
                  <th style={styles.th}>Integrity Status</th>
                  <th style={styles.th}>Last Activity</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWallets.map((w) => (
                  <tr key={w.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{w.customerName}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{w.customerEmail}</div>
                    </td>
                    <td style={styles.tdCode}>{w.id}</td>
                    <td style={styles.tdBold}>{formatNaira(w.currentBalance)}</td>
                    <td style={styles.td}>{formatNaira(w.ledgerBalance)}</td>
                    <td style={{ ...styles.td, color: w.discrepancy === 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                      {w.discrepancy === 0 ? '₦0.00' : formatNaira(w.discrepancy)}
                    </td>
                    <td style={styles.td}>
                      {w.isBalanced ? (
                        <span style={styles.badgeSuccess}>✓ BALANCED</span>
                      ) : (
                        <span style={styles.badgeError}>⚠️ MISMATCH</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, fontSize: '13px', color: '#6B7280' }}>
                      {w.lastActivityAt}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => setCreditModal({
                          isOpen: true,
                          selectedWalletId: w.id,
                          amount: '',
                          reference: '',
                          isProcessing: false,
                        })}
                        style={{
                          backgroundColor: '#7C3AED',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        + Credit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Transactions View */}
        {activeTab === 'transactions' && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Tx ID</th>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Side</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Balance After</th>
                  <th style={styles.th}>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={styles.tr}>
                    <td style={styles.tdCode}>{tx.id}</td>
                    <td style={{ ...styles.td, fontSize: '13px', color: '#6B7280' }}>{tx.createdAt}</td>
                    <td style={styles.tdBold}>{tx.userName}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeType}>{tx.transactionType}</span>
                    </td>
                    <td style={styles.td}>
                      {tx.entrySide === 'credit' ? (
                        <span style={styles.badgeCredit}>+ CREDIT</span>
                      ) : (
                        <span style={styles.badgeDebit}>- DEBIT</span>
                      )}
                    </td>
                    <td style={{ ...styles.tdBold, color: tx.entrySide === 'credit' ? '#0E9F6E' : '#111827' }}>
                      {tx.entrySide === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                    </td>
                    <td style={styles.td}>{formatNaira(tx.balanceAfter)}</td>
                    <td style={{ ...styles.td, fontSize: '13px', color: '#4B5563', maxWidth: '280px' }}>
                      {tx.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Automated Cron Monitor */}
        {activeTab === 'cron' && (
          <div style={styles.card}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
              Scheduled System Maintenance Tasks (`supabase/functions/cron`)
            </h3>

            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Task</th>
                  <th style={styles.th}>Frequency</th>
                  <th style={styles.th}>Purpose</th>
                  <th style={styles.th}>Specification Reference</th>
                  <th style={styles.th}>Last Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={styles.tr}>
                  <td style={styles.tdBold}>Daily Ledger Reconciliation</td>
                  <td style={styles.td}>Daily at 02:00 UTC</td>
                  <td style={styles.td}>Reconciles all wallet balances against double-entry transaction log</td>
                  <td style={styles.tdCode}>reconcile_wallet_ledger()</td>
                  <td style={styles.td}><span style={styles.badgeSuccess}>Active • Clean</span></td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.tdBold}>Group Buy Expiry & MVFQ Resolution</td>
                  <td style={styles.td}>Hourly</td>
                  <td style={styles.td}>Auto-transitions ≥MVFQ to fulfilment; auto-refunds 100% if &lt;MVFQ</td>
                  <td style={styles.tdCode}>Addendum A1 & A2</td>
                  <td style={styles.td}><span style={styles.badgeSuccess}>Active • Running</span></td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.tdBold}>Delayed Tier Rebate Disbursement</td>
                  <td style={styles.td}>Every 6 Hours</td>
                  <td style={styles.td}>Disburses retroactive tier credits after 48-hour anti-arbitrage hold</td>
                  <td style={styles.tdCode}>Addendum A4</td>
                  <td style={styles.td}><span style={styles.badgeSuccess}>Active • Running</span></td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.tdBold}>Festive Instalment Overdue Scan</td>
                  <td style={styles.td}>Daily at 04:00 UTC</td>
                  <td style={styles.td}>Enforces 7-day grace period on defaulted festive plans</td>
                  <td style={styles.tdCode}>Spec §35 / Addendum B5</td>
                  <td style={styles.td}><span style={styles.badgeSuccess}>Active • Running</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Reconciliation Modal */}
        {reconciliationModal.isOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 12px 0' }}>
                Wallet Ledger Reconciliation Report
              </h2>

              {reconciliationModal.isRunning ? (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                  <div style={{ color: '#4B5563', fontWeight: 500 }}>
                    Auditing double-entry ledger entries across all active wallets...
                  </div>
                </div>
              ) : reconciliationModal.result ? (
                <div>
                  <div style={{ ...styles.alertBox, backgroundColor: '#DEF7EC', borderColor: '#31C48D' }}>
                    <div style={{ fontWeight: 700, color: '#03543F' }}>
                      ✓ LEDGER FULLY BALANCED & VERIFIED
                    </div>
                    <div style={{ fontSize: '13px', color: '#046C4E', marginTop: '4px' }}>
                      All {reconciliationModal.result.totalWallets} active customer wallets match their transactional ledger exactly.
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={styles.statRow}>
                      <span style={{ color: '#6B7280' }}>Total Wallets Evaluated:</span>
                      <strong style={{ color: '#111827' }}>{reconciliationModal.result.totalWallets}</strong>
                    </div>
                    <div style={styles.statRow}>
                      <span style={{ color: '#6B7280' }}>Balanced Wallets:</span>
                      <strong style={{ color: '#0E9F6E' }}>{reconciliationModal.result.balancedWallets} (100%)</strong>
                    </div>
                    <div style={styles.statRow}>
                      <span style={{ color: '#6B7280' }}>Discrepant Wallets:</span>
                      <strong style={{ color: '#111827' }}>{reconciliationModal.result.discrepantWallets}</strong>
                    </div>
                    <div style={styles.statRow}>
                      <span style={{ color: '#6B7280' }}>Total Liquid System Liability:</span>
                      <strong style={{ color: '#111827' }}>{formatNaira(reconciliationModal.result.totalSystemLiability)}</strong>
                    </div>
                    <div style={styles.statRow}>
                      <span style={{ color: '#6B7280' }}>Audit Timestamp:</span>
                      <span style={{ color: '#4B5563', fontSize: '13px' }}>{reconciliationModal.result.timestamp}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setReconciliationModal({ isOpen: false, isRunning: false, result: null })}
                      style={styles.primaryButton}
                    >
                      Close Report
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ── Manual Wallet Credit Modal ── */}
        {creditModal.isOpen && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalBox, width: '480px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
                🏦 Manual Wallet Credit
              </h2>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px 0' }}>
                Credit a customer&apos;s wallet after verifying their bank transfer proof of payment.
              </p>

              {/* Customer Select */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Customer Wallet
                </label>
                <select
                  value={creditModal.selectedWalletId}
                  onChange={(e) => setCreditModal((prev) => ({ ...prev, selectedWalletId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="">— Choose a customer —</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.customerName} ({w.customerEmail}) — Balance: {formatNaira(w.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Credit Amount (₦)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 50000"
                  value={creditModal.amount}
                  onChange={(e) => setCreditModal((prev) => ({ ...prev, amount: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Reference / Note */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Transaction Reference / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank transfer verified - Receipt #12345"
                  value={creditModal.reference}
                  onChange={(e) => setCreditModal((prev) => ({ ...prev, reference: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Preview */}
              {creditModal.selectedWalletId && creditModal.amount && (
                <div style={{ ...styles.alertBox, backgroundColor: '#EBF5FF', borderColor: '#3B82F6', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#1E40AF' }}>
                    <strong>Preview:</strong> Credit <strong>{formatNaira(parseFloat(creditModal.amount) || 0)}</strong> to{' '}
                    <strong>{wallets.find((w) => w.id === creditModal.selectedWalletId)?.customerName}</strong>&apos;s wallet.
                    New balance will be{' '}
                    <strong>
                      {formatNaira(
                        (wallets.find((w) => w.id === creditModal.selectedWalletId)?.currentBalance || 0) +
                          (parseFloat(creditModal.amount) || 0),
                      )}
                    </strong>.
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setCreditModal({ isOpen: false, selectedWalletId: '', amount: '', reference: '', isProcessing: false })}
                  style={styles.secondaryButton}
                  disabled={creditModal.isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualCredit}
                  disabled={creditModal.isProcessing || !creditModal.selectedWalletId || !creditModal.amount}
                  style={{
                    ...styles.primaryButton,
                    backgroundColor: creditModal.isProcessing ? '#9CA3AF' : '#7C3AED',
                    cursor: creditModal.isProcessing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {creditModal.isProcessing ? '⏳ Processing...' : '✅ Confirm Credit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  primaryButton: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    color: '#374151',
    border: '1px solid #D1D5DB',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    padding: '20px',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: '8px',
  },
  metricValueLarge: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '4px',
  },
  metricSubtitle: {
    fontSize: '12px',
    color: '#6B7280',
  },
  tabContainer: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid #E5E7EB',
    marginBottom: '20px',
  },
  tabButton: {
    background: 'none',
    border: 'none',
    padding: '12px 4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  tableControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '16px',
  },
  searchInput: {
    padding: '8px 14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    width: '380px',
  },
  filterButton: {
    border: '1px solid #D1D5DB',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  thRow: {
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4B5563',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid #F3F4F6',
  },
  td: {
    padding: '12px 14px',
    fontSize: '14px',
    color: '#374151',
  },
  tdBold: {
    padding: '12px 14px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  tdCode: {
    padding: '12px 14px',
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#4B5563',
  },
  badgeSuccess: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeError: {
    backgroundColor: '#FDE8E8',
    color: '#9B1C1C',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeType: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
  badgeCredit: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeDebit: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  modalOverlay: {
    position: 'fixed' as const,
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
    padding: '28px',
    width: '520px',
    maxWidth: '90%',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  alertBox: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '14px 16px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #F3F4F6',
    fontSize: '14px',
  },
  toast: {
    position: 'fixed' as const,
    top: '20px',
    right: '24px',
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
    zIndex: 1100,
  },
};
