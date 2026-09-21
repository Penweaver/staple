'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../../components/AdminNav';
import Link from 'next/link';

interface ParticipantOrder {
  id: string;
  orderNumber: string;
  userName: string;
  userPhone: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentStatus: string;
  isChampion: boolean;
  joinedAt: string;
}

export default function GroupBuyMonitorPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState<string>('live');
  const [milestoneTriggered, setMilestoneTriggered] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Group Buy details
  const groupBuy = {
    id: params.id,
    slug: 'mama-gold-rice-lekki',
    title: 'Mama Gold Premium Parboiled Rice (50kg)',
    creatorName: 'Dele Adeyemi (Champion)',
    creatorRole: 'champion',
    creatorPhone: '+2348011223344',
    serviceArea: 'Lekki Phase 1',
    collectionHub: 'staple Hub — Lekki Admiralty (42 Admiralty Way)',
    targetQuantity: 100,
    paidQuantity: 58,
    minFulfilmentQuantity: 20, // MVFQ Addendum A1
    basePrice: 85000,
    currentPrice: 82875,
    activeTierDiscount: '2.5%',
    daysRemaining: 9,
    lifespanDays: 14,
    deepLink: 'https://staple.ng/gb/mama-gold-rice-lekki',
  };

  const participantOrders: ParticipantOrder[] = [
    {
      id: 'ord-1',
      orderNumber: 'ORD-ACT-882194',
      userName: 'Dele Adeyemi',
      userPhone: '+2348011223344',
      quantity: 3,
      unitPrice: 85000,
      totalAmount: 255000,
      paymentStatus: 'PAID',
      isChampion: true,
      joinedAt: '2026-09-12 10:14',
    },
    {
      id: 'ord-2',
      orderNumber: 'ORD-2026-00412',
      userName: 'Fatima Bello',
      userPhone: '+2348022334455',
      quantity: 10,
      unitPrice: 85000,
      totalAmount: 850000,
      paymentStatus: 'PAID',
      isChampion: false,
      joinedAt: '2026-09-13 14:22',
    },
    {
      id: 'ord-3',
      orderNumber: 'ORD-2026-00418',
      userName: 'Chinedu Eze',
      userPhone: '+2348033445566',
      quantity: 5,
      unitPrice: 85000,
      totalAmount: 425000,
      paymentStatus: 'PAID',
      isChampion: false,
      joinedAt: '2026-09-14 09:45',
    },
    {
      id: 'ord-4',
      orderNumber: 'ORD-2026-00425',
      userName: 'Kemi Adebayo',
      userPhone: '+2348044556677',
      quantity: 10,
      unitPrice: 82875,
      totalAmount: 828750,
      paymentStatus: 'PAID',
      isChampion: false,
      joinedAt: '2026-09-16 11:30',
    },
  ];

  const handleTriggerFulfilment = () => {
    setStatus('delivery_fulfilment');
    setAlertMsg('Status changed to DELIVERY_FULFILMENT. Supplier dispatch notification queued.');
  };

  const handleTriggerMilestone = () => {
    setMilestoneTriggered(true);
    setAlertMsg('Champion Milestone Reward (₦2,000) credited to Dele Adeyemi wallet!');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/group-buys" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link href="/group-buys" style={styles.backLink}>
            ← Back to Group Buys
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {groupBuy.title}
                </h1>
                <span style={status === 'live' ? styles.badgeLive : styles.badgeInfo}>
                  {status.toUpperCase()}
                </span>
              </div>
              <p style={{ color: '#6B7280', marginTop: '4px', fontSize: '13px' }}>
                Slug: <code>{groupBuy.slug}</code> • Organizer: <strong>{groupBuy.creatorName}</strong> ({groupBuy.creatorPhone})
              </p>
            </div>

            {/* Quick Action Controls */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleTriggerFulfilment}
                style={styles.primaryBtn}
              >
                🚚 Proceed to Fulfilment
              </button>
              <button
                onClick={handleTriggerMilestone}
                disabled={milestoneTriggered}
                style={{
                  ...styles.secondaryBtn,
                  opacity: milestoneTriggered ? 0.6 : 1,
                }}
              >
                {milestoneTriggered ? '✅ Milestone Disbursed' : '🏆 Disburse ₦2,000 Reward'}
              </button>
            </div>
          </div>
        </div>

        {alertMsg && (
          <div style={styles.alertNotice}>
            ℹ️ {alertMsg}
          </div>
        )}

        {/* Overview Metric Cards */}
        <div style={styles.grid4}>
          <div style={styles.card}>
            <span style={styles.cardLabel}>TARGET PROGRESS</span>
            <div style={styles.cardValue}>{groupBuy.paidQuantity} / {groupBuy.targetQuantity}</div>
            <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>
              58% reached • 42 units left
            </span>
          </div>

          <div style={styles.card}>
            <span style={styles.cardLabel}>MVFQ BREAK-EVEN (A1)</span>
            <div style={{ ...styles.cardValue, color: '#0E9F6E' }}>20 units min</div>
            <span style={{ fontSize: '12px', color: '#0E9F6E', fontWeight: 600 }}>
              ✅ Satisfied (58 ≥ 20)
            </span>
          </div>

          <div style={styles.card}>
            <span style={styles.cardLabel}>ACTIVE TIER DISCOUNT</span>
            <div style={{ ...styles.cardValue, color: '#16A34A' }}>₦{groupBuy.currentPrice.toLocaleString()}</div>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              Tier 1 active ({groupBuy.activeTierDiscount} off ₦{groupBuy.basePrice.toLocaleString()})
            </span>
          </div>

          <div style={styles.card}>
            <span style={styles.cardLabel}>LIFESPAN REMAINING</span>
            <div style={styles.cardValue}>{groupBuy.daysRemaining} days</div>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              Expires in {groupBuy.daysRemaining} of {groupBuy.lifespanDays} days
            </span>
          </div>
        </div>

        {/* Location & Deep Link Details */}
        <div style={styles.infoBanner}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Pickup Hub: </span>
            <span style={{ fontSize: '13px', color: '#374151' }}>{groupBuy.collectionHub}</span>
          </div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Consumer Deep Link: </span>
            <a href={groupBuy.deepLink} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#16A34A', fontWeight: 600 }}>
              {groupBuy.deepLink}
            </a>
          </div>
        </div>

        {/* Participants Table */}
        <section style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Participant Orders ({participantOrders.length})
            </h2>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Enforcing max 10 units limit per household (§74)
            </span>
          </div>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Order #</th>
                  <th style={styles.th}>Participant</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Quantity Ordered</th>
                  <th style={styles.th}>Unit Price</th>
                  <th style={styles.th}>Total Amount (NGN)</th>
                  <th style={styles.th}>Payment Status</th>
                  <th style={styles.th}>Order Date</th>
                </tr>
              </thead>
              <tbody>
                {participantOrders.map((ord) => (
                  <tr key={ord.id} style={styles.tr}>
                    <td style={styles.tdBold}>{ord.orderNumber}</td>
                    <td style={styles.td}>
                      {ord.userName}{' '}
                      {ord.isChampion && (
                        <span style={styles.badgeChamp}>Champion Activation</span>
                      )}
                    </td>
                    <td style={styles.td}>{ord.userPhone}</td>
                    <td style={{ ...styles.td, fontWeight: 700 }}>
                      {ord.quantity} bags
                    </td>
                    <td style={styles.td}>₦{ord.unitPrice.toLocaleString()}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#16A34A' }}>
                      ₦{ord.totalAmount.toLocaleString()}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badgeSuccess}>{ord.paymentStatus}</span>
                    </td>
                    <td style={{ ...styles.td, fontSize: '12px', color: '#6B7280' }}>
                      {ord.joinedAt}
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
  backLink: {
    color: '#16A34A',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
  },
  primaryBtn: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    border: '1px solid #FCD34D',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  alertNotice: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '20px',
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  cardLabel: {
    fontSize: '11px',
    color: '#6B7280',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  cardValue: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#111827',
  },
  infoBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: '16px 20px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    alignItems: 'center',
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
  badgeLive: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    fontWeight: 700,
    fontSize: '12px',
    padding: '3px 10px',
    borderRadius: '9999px',
  },
  badgeInfo: {
    backgroundColor: '#E1EFFE',
    color: '#1E429F',
    fontWeight: 700,
    fontSize: '12px',
    padding: '3px 10px',
    borderRadius: '9999px',
  },
  badgeSuccess: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    fontWeight: 700,
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  badgeChamp: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontWeight: 700,
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '6px',
  },
};
