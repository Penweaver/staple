'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import { formatNaira } from '@staple/shared';

interface BroadcastRecord {
  id: string;
  title: string;
  body: string;
  targetCohort: string;
  recipientsCount: number;
  channels: string[];
  sentAt: string;
  status: 'delivered' | 'processing';
  costNaira: number;
}

export default function CommunicationsAdminPage() {
  const [targetCohort, setTargetCohort] = useState<string>('all_users');
  const [channels, setChannels] = useState<{ inApp: boolean; sms: boolean; email: boolean }>({
    inApp: true,
    sms: true,
    email: false,
  });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [history, setHistory] = useState<BroadcastRecord[]>([
    {
      id: 'bc-1',
      title: 'Mama Gold Rice Price Drop Unlocked! 💰',
      body: 'Lekki Phase 1 neighbors unlocked Tier 1 pricing (₦82,875/bag). ₦2,125 rebate has been added to your wallet!',
      targetCohort: 'Lekki Admiralty Hub Cohort',
      recipientsCount: 480,
      channels: ['in_app', 'sms'],
      sentAt: '2026-09-21 08:30',
      status: 'delivered',
      costNaira: 1680,
    },
    {
      id: 'bc-2',
      title: 'Independence Day Owambe Bulk Savings 👑',
      body: 'Plan your October celebration 42–100 days ahead. Pay in flexible instalments on staple.',
      targetCohort: 'All Registered Users',
      recipientsCount: 1420,
      channels: ['in_app'],
      sentAt: '2026-09-20 12:00',
      status: 'delivered',
      costNaira: 0,
    },
  ]);

  // Cohort recipient estimates
  const cohortSizes: Record<string, number> = {
    all_users: 1420,
    lekki_hub: 480,
    ikeja_hub: 360,
    champions: 18,
    festive_enrollees: 184,
  };

  const recipientCount = cohortSizes[targetCohort] || 0;
  const smsUnitLength = 160;
  const smsPages = Math.max(1, Math.ceil((body.length || 1) / smsUnitLength));
  const smsCostPerUnit = 3.5; // Termii standard Nigerian route ₦3.50
  const estimatedSmsCost = channels.sms ? recipientCount * smsPages * smsCostPerUnit : 0;

  const handleSendBroadcast = () => {
    if (!title.trim() || !body.trim()) {
      alert('Please provide both a broadcast title and message body.');
      return;
    }

    setIsSending(true);

    setTimeout(() => {
      const activeChannels = [];
      if (channels.inApp) activeChannels.push('in_app');
      if (channels.sms) activeChannels.push('sms');
      if (channels.email) activeChannels.push('email');

      const newRecord: BroadcastRecord = {
        id: `bc-${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        targetCohort:
          targetCohort === 'all_users'
            ? 'All Registered Users'
            : targetCohort === 'lekki_hub'
            ? 'Lekki Admiralty Hub Cohort'
            : targetCohort === 'champions'
            ? 'Active Champions'
            : 'Festive Enrollees',
        recipientsCount: recipientCount,
        channels: activeChannels,
        sentAt: 'Just now',
        status: 'delivered',
        costNaira: estimatedSmsCost,
      };

      setHistory([newRecord, ...history]);
      setTitle('');
      setBody('');
      setIsSending(false);
      alert(
        `Broadcast dispatched to ${recipientCount} recipients via ${activeChannels.join(
          ', '
        )}!`
      );
    }, 800);
  };

  return (
    <div style={styles.layout}>
      <AdminNav currentPath="/communications" />

      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Broadcast & Communications Center</h1>
            <p style={styles.subtitle}>
              Compose and dispatch targeted notifications and Termii Nigerian SMS broadcasts to neighborhood cohorts.
            </p>
          </div>
        </header>

        {/* Composer & Stats Layout */}
        <div style={styles.grid}>
          {/* Left: Broadcast Composer */}
          <section style={styles.composerCard}>
            <h2 style={styles.cardHeading}>Compose Cohort Broadcast</h2>

            {/* Target Cohort */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Target Recipient Cohort:</label>
              <select
                style={styles.select}
                value={targetCohort}
                onChange={(e) => setTargetCohort(e.target.value)}
              >
                <option value="all_users">All Registered Users (1,420)</option>
                <option value="lekki_hub">Lekki Admiralty Hub Cohort (480)</option>
                <option value="ikeja_hub">Ikeja GRA Hub Cohort (360)</option>
                <option value="festive_enrollees">Festive & Owambe Enrollees (184)</option>
                <option value="champions">Active Community Champions (18)</option>
              </select>
            </div>

            {/* Channels */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Delivery Channels:</label>
              <div style={styles.channelsRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={channels.inApp}
                    onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })}
                  />
                  📱 In-App Notification (Instant)
                </label>

                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                  />
                  💬 Termii SMS (Nigerian DND Route)
                </label>

                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                  />
                  ✉️ Transactional Email
                </label>
              </div>
            </div>

            {/* Title */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Notification Title:</label>
              <input
                type="text"
                style={styles.input}
                placeholder="e.g. Mama Gold Rice Price Drop Unlocked! 💰"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Message Body */}
            <div style={styles.formGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Message Content:</label>
                <span style={styles.counterText}>
                  {body.length} chars ({smsPages} SMS unit{smsPages > 1 ? 's' : ''})
                </span>
              </div>
              <textarea
                style={styles.textarea}
                placeholder="Type broadcast message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={450}
              />
            </div>

            {/* Cost & Dispatch Estimation */}
            <div style={styles.costBox}>
              <div style={styles.costRow}>
                <span>Audience Reach:</span>
                <strong>{recipientCount} recipients</strong>
              </div>
              {channels.sms && (
                <div style={styles.costRow}>
                  <span>Termii SMS Units ({smsPages} x ₦3.50):</span>
                  <strong>{formatNaira(estimatedSmsCost)}</strong>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              style={styles.sendBtn}
              onClick={handleSendBroadcast}
              disabled={isSending || !title.trim() || !body.trim()}
            >
              {isSending ? 'Dispatching Broadcast...' : `Send Broadcast to ${recipientCount} Users`}
            </button>
          </section>

          {/* Right: Broadcast History */}
          <section style={styles.historyCard}>
            <h2 style={styles.cardHeading}>Recent Broadcast Dispatches</h2>

            <div style={styles.historyList}>
              {history.map((item) => (
                <div key={item.id} style={styles.historyItem}>
                  <div style={styles.historyTop}>
                    <strong style={{ fontSize: '14px' }}>{item.title}</strong>
                    <span style={styles.statusPill}>{item.status.toUpperCase()}</span>
                  </div>

                  <p style={styles.historyBody}>{item.body}</p>

                  <div style={styles.historyMeta}>
                    <span>👥 {item.targetCohort} ({item.recipientsCount})</span>
                    <span>🕒 {item.sentAt}</span>
                    {item.costNaira > 0 && <span>💰 {formatNaira(item.costNaira)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
  },
  composerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '24px',
  },
  cardHeading: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827',
    marginTop: 0,
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '18px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    display: 'block',
    marginBottom: '6px',
  },
  counterText: {
    fontSize: '12px',
    color: '#6B7280',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box' as const,
  },
  channelsRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    backgroundColor: '#F9FAFB',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    height: '100px',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    resize: 'vertical' as const,
  },
  costBox: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    fontSize: '13px',
  },
  costRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sendBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '24px',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  historyItem: {
    padding: '14px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  historyTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  statusPill: {
    fontSize: '10px',
    fontWeight: 700,
    backgroundColor: '#DCFCE7',
    color: '#14532D',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  historyBody: {
    fontSize: '13px',
    color: '#4B5563',
    margin: '0 0 10px 0',
    lineHeight: 1.4,
  },
  historyMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#6B7280',
    borderTop: '1px solid #E5E7EB',
    paddingTop: '8px',
  },
};
