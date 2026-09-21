'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import Link from 'next/link';
import { formatPickupCode, validatePickupCode } from '@staple/shared';

interface HubLoadRow {
  id: string;
  name: string;
  serviceArea: string;
  address: string;
  contactPhone: string;
  operatingHours: string;
  isOpen: boolean;
  readyUnits: number;
  collectedUnits: number;
  pendingUnits: number;
}

interface StagedOrderRow {
  id: string;
  orderNumber: string;
  pickupCode: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  hubId: string;
  hubName: string;
  status: 'ready_for_collection' | 'preparing' | 'collected';
  collectedAt?: string;
  collectedBy?: string;
}

const initialHubs: HubLoadRow[] = [
  {
    id: 'hub-1',
    name: 'staple Hub — Lekki Admiralty',
    serviceArea: 'Lekki Phase 1',
    address: '42 Admiralty Way, Lekki Phase 1, Lagos',
    contactPhone: '+2348012345678',
    operatingHours: 'Mon–Sat: 08:00 – 18:00',
    isOpen: true,
    readyUnits: 140,
    collectedUnits: 98,
    pendingUnits: 42,
  },
  {
    id: 'hub-2',
    name: 'staple Hub — Ikeja GRA',
    serviceArea: 'Ikeja / Maryland',
    address: '15 Isaac John Street, Ikeja GRA, Lagos',
    contactPhone: '+2348023456789',
    operatingHours: 'Mon–Sat: 08:00 – 18:00',
    isOpen: true,
    readyUnits: 95,
    collectedUnits: 70,
    pendingUnits: 25,
  },
  {
    id: 'hub-3',
    name: 'staple Hub — Wuse 2',
    serviceArea: 'Abuja Municipal / Wuse',
    address: '12 Aminu Kano Crescent, Wuse 2, Abuja',
    contactPhone: '+2348034567890',
    operatingHours: 'Mon–Sat: 08:30 – 18:30',
    isOpen: true,
    readyUnits: 80,
    collectedUnits: 60,
    pendingUnits: 20,
  },
  {
    id: 'hub-4',
    name: 'staple Hub — GRA Phase 2',
    serviceArea: 'Port Harcourt GRA',
    address: '8 Tombia Street, GRA Phase 2, Port Harcourt',
    contactPhone: '+2348045678901',
    operatingHours: 'Mon–Sat: 08:00 – 17:30',
    isOpen: true,
    readyUnits: 45,
    collectedUnits: 30,
    pendingUnits: 15,
  },
];

const initialOrders: StagedOrderRow[] = [
  {
    id: 'ful-1',
    orderNumber: 'STP-ORD-20260921-884192',
    pickupCode: 'STP-782-910',
    customerName: 'Babatunde Adeleke',
    customerPhone: '+2348011223344',
    productName: 'Mama Gold Premium Parboiled Rice (50kg)',
    quantity: 2,
    totalAmount: 165750,
    hubId: 'hub-1',
    hubName: 'staple Hub — Lekki Admiralty',
    status: 'ready_for_collection',
  },
  {
    id: 'ful-2',
    orderNumber: 'STP-ORD-20260921-771239',
    pickupCode: 'STP-519-204',
    customerName: 'Fatima Bello',
    customerPhone: '+2348022334455',
    productName: 'Mama Gold Premium Parboiled Rice (50kg)',
    quantity: 10,
    totalAmount: 828750,
    hubId: 'hub-1',
    hubName: 'staple Hub — Lekki Admiralty',
    status: 'ready_for_collection',
  },
  {
    id: 'ful-3',
    orderNumber: 'STP-ORD-20260920-554182',
    pickupCode: 'STP-419-332',
    customerName: 'Chinedu Eze',
    customerPhone: '+2348033445566',
    productName: 'Kings Pure Vegetable Cooking Oil (25L)',
    quantity: 2,
    totalAmount: 92000,
    hubId: 'hub-2',
    hubName: 'staple Hub — Ikeja GRA',
    status: 'ready_for_collection',
  },
  {
    id: 'ful-4',
    orderNumber: 'STP-ORD-20260919-221948',
    pickupCode: 'STP-331-904',
    customerName: 'Amina Danladi',
    customerPhone: '+2348044556677',
    productName: 'Ijebu Garri White (50kg Bag)',
    quantity: 1,
    totalAmount: 32000,
    hubId: 'hub-3',
    hubName: 'staple Hub — Wuse 2',
    status: 'collected',
    collectedAt: '2026-09-20 15:40',
    collectedBy: 'Amina Danladi (Customer)',
  },
];

export default function FulfilmentPage() {
  const [hubs, setHubs] = useState<HubLoadRow[]>(initialHubs);
  const [orders, setOrders] = useState<StagedOrderRow[]>(initialOrders);
  const [filterHub, setFilterHub] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Verification Terminal State
  const [searchCode, setSearchCode] = useState<string>('');
  const [terminalOrder, setTerminalOrder] = useState<StagedOrderRow | null>(null);
  const [terminalError, setTerminalError] = useState<string | null>(null);
  const [collectorName, setCollectorName] = useState<string>('');
  const [terminalSuccess, setTerminalSuccess] = useState<string | null>(null);

  // Reassignment Modal State
  const [reassignOrder, setReassignOrder] = useState<StagedOrderRow | null>(null);
  const [targetHubId, setTargetHubId] = useState<string>('hub-2');

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (filterHub !== 'all' && o.hubId !== filterHub) return false;
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    return true;
  });

  // KPI Calculations
  const totalReadyUnits = orders
    .filter((o) => o.status === 'ready_for_collection')
    .reduce((sum, o) => sum + o.quantity, 0);

  const totalCollectedUnits = orders
    .filter((o) => o.status === 'collected')
    .reduce((sum, o) => sum + o.quantity, 0);

  const handleVerifyLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setTerminalError(null);
    setTerminalSuccess(null);

    const formatted = formatPickupCode(searchCode);
    if (!formatted) {
      setTerminalError('Please enter a 6-digit pickup code or scan QR code.');
      return;
    }

    const match = orders.find(
      (o) =>
        formatPickupCode(o.pickupCode) === formatted ||
        o.orderNumber.toLowerCase().includes(searchCode.toLowerCase().trim()),
    );

    if (!match) {
      setTerminalError(`No order found matching code "${formatted}".`);
      setTerminalOrder(null);
      return;
    }

    setTerminalOrder(match);
    setCollectorName(match.customerName);
  };

  const handleConfirmHandoff = () => {
    if (!terminalOrder) return;
    const nowStr = new Date().toLocaleString();
    const proxy = collectorName.trim() || terminalOrder.customerName;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === terminalOrder.id
          ? {
              ...o,
              status: 'collected',
              collectedAt: nowStr,
              collectedBy: proxy,
            }
          : o,
      ),
    );

    setTerminalSuccess(
      `✅ Success: ${terminalOrder.quantity} units of ${terminalOrder.productName} handed over to ${proxy}!`,
    );
    setTerminalOrder(null);
    setSearchCode('');
  };

  const handleConfirmReassign = () => {
    if (!reassignOrder) return;
    const newHub = hubs.find((h) => h.id === targetHubId);
    if (!newHub) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === reassignOrder.id
          ? { ...o, hubId: newHub.id, hubName: newHub.name }
          : o,
      ),
    );

    setReassignOrder(null);
    alert(`Order ${reassignOrder.orderNumber} reassigned to ${newHub.name}.`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/fulfilment" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        {/* Header */}
        <header style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
                Fulfilment & Collection Hub Operations
              </h1>
              <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
                Manage physical bulk food staging, verify 6-digit pickup codes (§29, §63), and record safe customer handoffs.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/fulfilment/collections" style={styles.secondaryLinkBtn}>
                📋 Collections Audit Ledger
              </Link>
              <span style={styles.badgeRule}>Addendum B4: PostGIS Nearest Hub</span>
            </div>
          </div>
        </header>

        {/* Top KPIs */}
        <section style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>TOTAL ACTIVE HUBS</span>
            <span style={styles.kpiValue}>{hubs.length}</span>
            <span style={styles.kpiSub}>Lagos, Abuja, Port Harcourt</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>UNITS READY FOR PICKUP</span>
            <span style={{ ...styles.kpiValue, color: '#16A34A' }}>{totalReadyUnits}</span>
            <span style={styles.kpiSub}>Staged & verified at counters</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>UNITS COLLECTED</span>
            <span style={{ ...styles.kpiValue, color: '#2563EB' }}>{totalCollectedUnits}</span>
            <span style={styles.kpiSub}>Successfully handed over</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>AVERAGE COLLECTION TIME</span>
            <span style={styles.kpiValue}>1.4 days</span>
            <span style={styles.kpiSub}>Post-group buy target reached</span>
          </div>
        </section>

        {/* ============================================================ */}
        {/* HUB STAFF VERIFICATION TERMINAL */}
        {/* ============================================================ */}
        <section style={styles.terminalCard}>
          <div style={styles.terminalHeader}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#14532D', margin: 0 }}>
                ⚡ Hub Counter Verification Terminal (§29, §63)
              </h2>
              <p style={{ fontSize: '13px', color: '#166534', margin: '4px 0 0 0' }}>
                Scan customer QR code or enter 6-digit pickup verification code to authenticate and release goods.
              </p>
            </div>
            <span style={styles.badgeLiveTerminal}>TERMINAL LIVE</span>
          </div>

          <form onSubmit={handleVerifyLookup} style={styles.terminalForm}>
            <input
              type="text"
              placeholder="e.g. STP-782-910 or 782910"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              style={styles.terminalInput}
            />
            <button type="submit" style={styles.terminalSearchBtn}>
              Verify Pickup Code
            </button>
          </form>

          {terminalError && (
            <div style={styles.terminalErrorBox}>
              <span style={{ fontWeight: 600 }}>Error:</span> {terminalError}
            </div>
          )}

          {terminalSuccess && (
            <div style={styles.terminalSuccessBox}>{terminalSuccess}</div>
          )}

          {/* Verified Order Modal/Card inside Terminal */}
          {terminalOrder && (
            <div style={styles.orderVerificationPanel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={styles.verifiedTag}>CODE VERIFIED ✅</span>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '8px 0 4px 0' }}>
                    {terminalOrder.productName}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#4B5563', margin: 0 }}>
                    Order: <strong>{terminalOrder.orderNumber}</strong> • Code:{' '}
                    <strong>{formatPickupCode(terminalOrder.pickupCode)}</strong>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={styles.quantityBig}>{terminalOrder.quantity} UNITS</span>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                    Total: ₦{terminalOrder.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={styles.verificationDetailsGrid}>
                <div>
                  <span style={styles.metaLabel}>Customer Details</span>
                  <p style={styles.metaVal}>{terminalOrder.customerName} ({terminalOrder.customerPhone})</p>
                </div>
                <div>
                  <span style={styles.metaLabel}>Assigned Hub</span>
                  <p style={styles.metaVal}>{terminalOrder.hubName}</p>
                </div>
                <div>
                  <span style={styles.metaLabel}>Current Status</span>
                  <p style={styles.metaVal}>
                    <span style={terminalOrder.status === 'collected' ? styles.badgeCollected : styles.badgeReady}>
                      {terminalOrder.status === 'collected' ? 'ALREADY COLLECTED' : 'READY FOR PICKUP'}
                    </span>
                  </p>
                </div>
              </div>

              {terminalOrder.status !== 'collected' ? (
                <div style={{ marginTop: '20px', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Collector Name / Proxy ID (if driver or family member):
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      value={collectorName}
                      onChange={(e) => setCollectorName(e.target.value)}
                      placeholder="e.g. Babatunde Adeleke (or Driver Name)"
                      style={styles.collectorInput}
                    />
                    <button onClick={handleConfirmHandoff} style={styles.confirmReleaseBtn}>
                      Confirm Handoff & Release Goods
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '16px', color: '#DC2626', fontSize: '13px', fontWeight: 600 }}>
                  ⚠️ This order was already collected on {terminalOrder.collectedAt} by {terminalOrder.collectedBy}.
                </div>
              )}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* ACTIVE HUBS DIRECTORY */}
        {/* ============================================================ */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Active Collection Hubs (Inventory Staging)
            </h2>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Free neighborhood collection hubs for food collective buyers.
            </span>
          </div>

          <div style={styles.hubGrid}>
            {hubs.map((hub) => (
              <div key={hub.id} style={styles.hubCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    {hub.name}
                  </h3>
                  <span style={hub.isOpen ? styles.badgeOpen : styles.badgeClosed}>
                    {hub.isOpen ? 'OPEN NOW' : 'CLOSED'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#4B5563', margin: '6px 0 12px 0' }}>
                  📍 {hub.address}
                </p>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>
                  📞 {hub.contactPhone} • 🕒 {hub.operatingHours}
                </div>

                <div style={styles.hubLoadBar}>
                  <div style={styles.hubLoadStat}>
                    <span style={styles.hubStatNum}>{hub.readyUnits}</span>
                    <span style={styles.hubStatLbl}>Ready Units</span>
                  </div>
                  <div style={styles.hubLoadStat}>
                    <span style={{ ...styles.hubStatNum, color: '#16A34A' }}>{hub.collectedUnits}</span>
                    <span style={styles.hubStatLbl}>Collected</span>
                  </div>
                  <div style={styles.hubLoadStat}>
                    <span style={{ ...styles.hubStatNum, color: '#D97706' }}>{hub.pendingUnits}</span>
                    <span style={styles.hubStatLbl}>In Transit</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* STAGED ORDERS QUEUE */}
        {/* ============================================================ */}
        <section style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Staged Participant Orders
              </h2>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>
                Every order is auto-assigned to the nearest collection hub (Addendum B4).
              </span>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <select
                value={filterHub}
                onChange={(e) => setFilterHub(e.target.value)}
                style={styles.selectFilter}
              >
                <option value="all">All Hubs</option>
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={styles.selectFilter}
              >
                <option value="all">All Statuses</option>
                <option value="ready_for_collection">Ready for Pickup</option>
                <option value="preparing">Preparing</option>
                <option value="collected">Collected</option>
              </select>
            </div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Order / Code</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Product Item</th>
                <th style={styles.th}>Quantity</th>
                <th style={styles.th}>Staged Hub (B4)</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => (
                <tr key={ord.id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{ord.orderNumber}</strong>
                    <div style={{ fontFamily: 'monospace', color: '#16A34A', fontWeight: 700 }}>
                      {formatPickupCode(ord.pickupCode)}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <strong>{ord.customerName}</strong>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{ord.customerPhone}</div>
                  </td>
                  <td style={styles.tdBold}>{ord.productName}</td>
                  <td style={styles.td}>
                    <strong>{ord.quantity} units</strong>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      ₦{ord.totalAmount.toLocaleString()}
                    </div>
                  </td>
                  <td style={styles.td}>
                    📍 {ord.hubName}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={
                        ord.status === 'collected'
                          ? styles.badgeCollected
                          : ord.status === 'ready_for_collection'
                          ? styles.badgeReady
                          : styles.badgePending
                      }
                    >
                      {ord.status === 'ready_for_collection'
                        ? 'READY FOR PICKUP'
                        : ord.status.toUpperCase()}
                    </span>
                    {ord.collectedAt && (
                      <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
                        by {ord.collectedBy}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {ord.status !== 'collected' && (
                        <button
                          onClick={() => {
                            setReassignOrder(ord);
                            setTargetHubId(ord.hubId === 'hub-1' ? 'hub-2' : 'hub-1');
                          }}
                          style={styles.reassignBtn}
                        >
                          Reassign Hub
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSearchCode(ord.pickupCode);
                          setTerminalOrder(ord);
                          setCollectorName(ord.customerName);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={styles.terminalBtn}
                      >
                        Terminal
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Reassignment Modal (Addendum B4) */}
        {reassignOrder && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 12px 0' }}>
                Reassign Collection Hub (Addendum B4)
              </h3>
              <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px' }}>
                Order: <strong>{reassignOrder.orderNumber}</strong> ({reassignOrder.customerName})
                <br />
                Current Hub: {reassignOrder.hubName}
              </p>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Select New Collection Point:
              </label>
              <select
                value={targetHubId}
                onChange={(e) => setTargetHubId(e.target.value)}
                style={styles.modalSelect}
              >
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>{h.name} ({h.serviceArea})</option>
                ))}
              </select>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setReassignOrder(null)} style={styles.modalCancelBtn}>
                  Cancel
                </button>
                <button onClick={handleConfirmReassign} style={styles.modalConfirmBtn}>
                  Confirm Reassignment
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
  secondaryLinkBtn: {
    backgroundColor: '#FFFFFF',
    color: '#374151',
    border: '1px solid #D1D5DB',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
  },
  badgeRule: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  terminalCard: {
    backgroundColor: '#F0FDF4',
    border: '2px solid #86EFAC',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
  },
  terminalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  badgeLiveTerminal: {
    backgroundColor: '#DCFCE7',
    color: '#14532D',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.5px',
  },
  terminalForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  terminalInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '16px',
    fontWeight: 600,
    borderRadius: '8px',
    border: '1px solid #86EFAC',
    backgroundColor: '#FFFFFF',
    textTransform: 'uppercase',
  },
  terminalSearchBtn: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 700,
    borderRadius: '8px',
    cursor: 'pointer',
  },
  terminalErrorBox: {
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '12px',
    border: '1px solid #FECACA',
  },
  terminalSuccessBox: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    border: '1px solid #BBF7D0',
  },
  orderVerificationPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid #BBF7D0',
    marginTop: '12px',
  },
  verifiedTag: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 800,
  },
  quantityBig: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#16A34A',
  },
  verificationDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginTop: '16px',
    backgroundColor: '#F9FAFB',
    padding: '12px 16px',
    borderRadius: '8px',
  },
  metaLabel: {
    fontSize: '11px',
    color: '#6B7280',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: '14px',
    color: '#111827',
    fontWeight: 600,
    margin: '4px 0 0 0',
  },
  collectorInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
  },
  confirmReleaseBtn: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  hubGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  hubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid #E5E7EB',
  },
  badgeOpen: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeClosed: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  hubLoadBar: {
    display: 'flex',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    padding: '12px',
    justifyContent: 'space-around',
    border: '1px solid #F3F4F6',
  },
  hubLoadStat: {
    textAlign: 'center',
  },
  hubStatNum: {
    display: 'block',
    fontSize: '18px',
    fontWeight: 800,
    color: '#111827',
  },
  hubStatLbl: {
    fontSize: '11px',
    color: '#6B7280',
    fontWeight: 500,
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
  selectFilter: {
    padding: '6px 12px',
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
  tdBold: {
    padding: '14px 18px',
    fontWeight: 600,
    color: '#111827',
  },
  badgeReady: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeCollected: {
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  reassignBtn: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: '1px solid #D1D5DB',
    padding: '4px 8px',
    borderRadius: '5px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  terminalBtn: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '5px',
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
    width: '440px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalSelect: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '16px',
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
  modalConfirmBtn: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
