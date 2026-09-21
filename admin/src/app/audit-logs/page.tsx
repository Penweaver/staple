'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import { formatAuditActionLabel } from '@staple/shared';

interface AuditLogRow {
  id: string;
  actorId: string | null;
  actorRole: 'admin' | 'system' | 'champion' | 'user';
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

const mockAuditLogs: AuditLogRow[] = [
  {
    id: 'aud-001',
    actorId: null,
    actorRole: 'system',
    actorName: 'System Maintenance Cron',
    action: 'wallet_reconciliation_audit',
    entityType: 'system_reconciliation',
    entityId: 'rec-20260921-0200',
    previousState: null,
    newState: {
      total_wallets: 148,
      balanced_wallets: 148,
      discrepant_wallets: 0,
      total_system_liability: 3420500.0,
      status: 'clean',
    },
    metadata: {
      is_clean: true,
      execution_source: 'cron_daily',
    },
    ipAddress: '127.0.0.1',
    createdAt: '2026-09-21 02:00:15',
  },
  {
    id: 'aud-002',
    actorId: null,
    actorRole: 'system',
    actorName: 'System Maintenance Cron',
    action: 'group_buy_auto_transition_fulfilment',
    entityType: 'group_buy',
    entityId: 'gb-lagos-rice-50kg',
    previousState: {
      status: 'live',
      paid_quantity: 64,
      target_quantity: 100,
      min_fulfilment_quantity: 20,
    },
    newState: {
      status: 'delivery_fulfilment',
      paid_quantity: 64,
      mvfq_met: true,
    },
    metadata: {
      rule: 'Addendum_A1_MVFQ_Met',
    },
    ipAddress: '127.0.0.1',
    createdAt: '2026-09-21 00:00:02',
  },
  {
    id: 'aud-003',
    actorId: null,
    actorRole: 'system',
    actorName: 'System Maintenance Cron',
    action: 'group_buy_auto_closed_mvfq_failed',
    entityType: 'group_buy',
    entityId: 'gb-yam-tubers-vi',
    previousState: {
      status: 'live',
      paid_quantity: 8,
      min_fulfilment_quantity: 25,
    },
    newState: {
      status: 'closed',
      refund_reason: 'mvfq_not_met',
      orders_refunded: 3,
      total_refunded_naira: 64000.0,
    },
    metadata: {
      rule: 'Addendum_A2_Automatic_100_Percent_Wallet_Refund',
    },
    ipAddress: '127.0.0.1',
    createdAt: '2026-09-20 23:59:59',
  },
  {
    id: 'aud-004',
    actorId: 'adm-001',
    actorRole: 'admin',
    actorName: 'Tunde Bakare (Head of Ops)',
    action: 'champion_application_approved',
    entityType: 'champion_application',
    entityId: 'app-chp-8821',
    previousState: {
      status: 'pending',
    },
    newState: {
      status: 'approved',
      champion_status: 'active',
      assigned_hub: 'Ikeja Central Hub',
    },
    metadata: {
      approval_notes: 'Phone interview verified, community reach confirmed.',
    },
    ipAddress: '102.89.42.11',
    createdAt: '2026-09-20 16:15:30',
  },
  {
    id: 'aud-005',
    actorId: 'adm-002',
    actorRole: 'admin',
    actorName: 'Ngozi Okonjo (Super Admin)',
    action: 'system_config_updated',
    entityType: 'system_config',
    entityId: 'TIER_REBATE_HOLD_HOURS',
    previousState: {
      value: '24',
    },
    newState: {
      value: '48',
    },
    metadata: {
      reason: 'Strict adherence to Addendum A4 anti-arbitrage policy',
    },
    ipAddress: '102.89.33.89',
    createdAt: '2026-09-19 11:04:12',
  },
];

export default function AdminAuditLogsPage() {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const filteredLogs = mockAuditLogs.filter((log) => {
    if (roleFilter !== 'all' && log.actorRole !== roleFilter) return false;
    if (entityFilter !== 'all' && log.entityType !== entityFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchEntity = log.entityId.toLowerCase().includes(q);
      const matchActor = log.actorName.toLowerCase().includes(q);
      if (!matchAction && !matchEntity && !matchActor) return false;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/audit-logs" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        {/* Header */}
        <header style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
            System Audit Trail & Security Logs
          </h1>
          <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
            Immutable chronological record of critical system transactions, state transitions, and administrative actions.
          </p>
        </header>

        {/* Filters and Controls */}
        <div style={styles.card}>
          <div style={styles.controlsRow}>
            <input
              type="text"
              placeholder="Search by action, entity ID or actor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Actor Roles</option>
                <option value="system">System (Cron & Triggers)</option>
                <option value="admin">Administrator</option>
                <option value="champion">Champion</option>
                <option value="user">User</option>
              </select>

              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Entity Types</option>
                <option value="system_reconciliation">Reconciliation</option>
                <option value="group_buy">Group Buy</option>
                <option value="champion_application">Champion Application</option>
                <option value="system_config">System Configuration</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Timestamp</th>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Entity</th>
                <th style={styles.th}>Actor</th>
                <th style={styles.th}>IP Address</th>
                <th style={styles.th}>State Diff</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={styles.tr}>
                  <td style={{ ...styles.td, fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                    {log.createdAt}
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>
                      {formatAuditActionLabel(log.action)}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6B7280' }}>
                      {log.action}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.entityTag}>{log.entityType}</span>
                    <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px', fontFamily: 'monospace' }}>
                      {log.entityId}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          ...styles.roleBadge,
                          backgroundColor:
                            log.actorRole === 'system'
                              ? '#E0E7FF'
                              : log.actorRole === 'admin'
                              ? '#FEE2E2'
                              : '#DEF7EC',
                          color:
                            log.actorRole === 'system'
                              ? '#3730A3'
                              : log.actorRole === 'admin'
                              ? '#991B1B'
                              : '#03543F',
                        }}
                      >
                        {log.actorRole.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '13px', color: '#111827' }}>{log.actorName}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.tdCode, fontSize: '12px' }}>
                    {log.ipAddress || '—'}
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => setSelectedLog(log)}
                      style={styles.inspectButton}
                    >
                      Inspect JSON 🔍
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* State Diff Modal */}
        {selectedLog && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Audit Event Details — {formatAuditActionLabel(selectedLog.action)}
                </h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  style={styles.closeButton}
                >
                  ✕
                </button>
              </div>

              <div style={styles.modalMetaGrid}>
                <div>
                  <span style={styles.modalMetaLabel}>Audit Log ID:</span>
                  <div style={styles.tdCode}>{selectedLog.id}</div>
                </div>
                <div>
                  <span style={styles.modalMetaLabel}>Actor:</span>
                  <div>{selectedLog.actorName} ({selectedLog.actorRole})</div>
                </div>
                <div>
                  <span style={styles.modalMetaLabel}>Entity:</span>
                  <div>{selectedLog.entityType} ({selectedLog.entityId})</div>
                </div>
                <div>
                  <span style={styles.modalMetaLabel}>Logged At:</span>
                  <div>{selectedLog.createdAt}</div>
                </div>
              </div>

              {/* Diffs */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={styles.jsonHeader}>
                    <span>New State Payload (`new_state`):</span>
                  </div>
                  <pre style={styles.jsonBox}>
                    {JSON.stringify(selectedLog.newState, null, 2)}
                  </pre>
                </div>

                {selectedLog.previousState && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={styles.jsonHeader}>
                      <span>Previous State (`previous_state`):</span>
                    </div>
                    <pre style={styles.jsonBox}>
                      {JSON.stringify(selectedLog.previousState, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <div style={styles.jsonHeader}>
                      <span>Metadata:</span>
                    </div>
                    <pre style={styles.jsonBox}>
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedLog(null)}
                  style={styles.primaryButton}
                >
                  Close
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '16px',
  },
  searchInput: {
    padding: '8px 14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    width: '380px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    color: '#374151',
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
  tdCode: {
    padding: '12px 14px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#4B5563',
  },
  entityTag: {
    backgroundColor: '#F3F4F6',
    color: '#1F2937',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
  roleBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
  },
  inspectButton: {
    backgroundColor: '#F3F4F6',
    border: '1px solid #D1D5DB',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
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
    width: '640px',
    maxWidth: '90%',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#6B7280',
  },
  modalMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    fontSize: '13px',
  },
  modalMetaLabel: {
    color: '#6B7280',
    fontSize: '12px',
    display: 'block',
  },
  jsonHeader: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '4px',
  },
  jsonBox: {
    backgroundColor: '#1E293B',
    color: '#E2E8F0',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'monospace',
    overflowX: 'auto' as const,
    margin: 0,
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
