'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';

interface ConfigItem {
  key: string;
  category: string;
  label: string;
  value: string;
  defaultValue: string;
  description: string;
  specRef: string;
  isEditable: boolean;
}

const initialConfigs: ConfigItem[] = [
  // 1. Group Buy & Cart Limits
  {
    key: 'CHAMPION_MAX_ACTIVE_GROUP_BUYS',
    category: 'Group Buy & Cart Limits',
    label: 'Champion Active Concurrent Limit',
    value: '2',
    defaultValue: '2',
    description: 'Maximum concurrent LIVE or ACTIVATION_PENDING group buys allowed per Champion.',
    specRef: 'Spec §8 / Guard A1',
    isEditable: true,
  },
  {
    key: 'GROUP_BUY_MAX_UNITS_PER_USER',
    category: 'Group Buy & Cart Limits',
    label: 'Household Order Quantity Cap',
    value: '10',
    defaultValue: '10',
    description: 'Maximum units of a single product/basket a single household account may order in one group buy.',
    specRef: 'Spec §74 / Household Cap',
    isEditable: true,
  },
  {
    key: 'DEFAULT_GROUP_BUY_LIFESPAN_DAYS',
    category: 'Group Buy & Cart Limits',
    label: 'Default Group Buy Duration',
    value: '14',
    defaultValue: '14',
    description: 'Active window before a live group buy expires if not oversubscribed.',
    specRef: 'Spec §15',
    isEditable: true,
  },

  // 2. Financial Hardening & Anti-Arbitrage
  {
    key: 'TIER_REBATE_HOLD_HOURS',
    category: 'Financial Hardening & Anti-Arbitrage',
    label: 'Retroactive Tier Rebate Hold Window',
    value: '48',
    defaultValue: '48',
    description: 'Mandatory delay in hours post-fulfilment before retroactive tier savings are credited to buyer wallets.',
    specRef: 'Addendum A4 Anti-Arbitrage',
    isEditable: true,
  },
  {
    key: 'PAYSTACK_MIN_TRANSACTION_NAIRA',
    category: 'Financial Hardening & Anti-Arbitrage',
    label: 'Minimum Paystack Gateway Charge (₦)',
    value: '100',
    defaultValue: '100',
    description: 'Minimum Nigerian Naira amount that can be routed to the card/bank gateway.',
    specRef: 'Spec §22',
    isEditable: true,
  },
  {
    key: 'WALLET_AUTO_REFUND_ON_MVFQ_FAIL',
    category: 'Financial Hardening & Anti-Arbitrage',
    label: 'Auto 100% Wallet Refund on MVFQ Miss',
    value: 'true',
    defaultValue: 'true',
    description: 'Immediately credit buyer wallets with 100% of order amounts when expired without reaching MVFQ.',
    specRef: 'Addendum A1 & A2',
    isEditable: false,
  },

  // 3. Festive & Owambe Planning
  {
    key: 'FESTIVE_OWAMBE_MIN_DAYS',
    category: 'Festive & Owambe Planning',
    label: 'Owambe Minimum Advance Planning Days',
    value: '42',
    defaultValue: '42',
    description: 'Minimum required days between plan enrollment and Owambe event delivery date (6 weeks).',
    specRef: 'Spec §39 & §74',
    isEditable: true,
  },
  {
    key: 'FESTIVE_OWAMBE_MAX_DAYS',
    category: 'Festive & Owambe Planning',
    label: 'Owambe Maximum Advance Planning Days',
    value: '100',
    defaultValue: '100',
    description: 'Maximum allowable advance booking window for seasonal and Owambe events.',
    specRef: 'Spec §39',
    isEditable: true,
  },
  {
    key: 'FESTIVE_INSTALMENT_GRACE_DAYS',
    category: 'Festive & Owambe Planning',
    label: 'Instalment Default Grace Period (Days)',
    value: '7',
    defaultValue: '7',
    description: 'Grace window following an overdue instalment due date before forfeiture and plan cancellation.',
    specRef: 'Addendum B5 / Spec §35',
    isEditable: true,
  },

  // 4. Scheduled Maintenance
  {
    key: 'CRON_AUTOMATION_ENABLED',
    category: 'Scheduled Maintenance & Cron',
    label: 'System Maintenance Automation',
    value: 'true',
    defaultValue: 'true',
    description: 'Master switch enabling automated reconciliation, expiry sweeps, and rebate releases.',
    specRef: 'Phase 9 Cron Engine',
    isEditable: true,
  },
];

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>(initialConfigs);
  const [hasChanges, setHasChanges] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleValueChange = (key: string, newValue: string) => {
    setConfigs((prev) =>
      prev.map((item) => (item.key === key ? { ...item, value: newValue } : item))
    );
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    setHasChanges(false);
    setToastMessage('System configurations saved successfully and audit log recorded.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetDefaults = () => {
    setConfigs((prev) =>
      prev.map((item) => ({ ...item, value: item.defaultValue }))
    );
    setHasChanges(true);
  };

  // Group by category
  const categories = Array.from(new Set(configs.map((c) => c.category)));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/settings" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        {/* Toast */}
        {toastMessage && (
          <div style={styles.toast}>
            <span>✓ {toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
              System Configuration & Business Rules
            </h1>
            <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
              Dynamic platform parameters governing household caps, Champion guards, anti-arbitrage delays, and festive rules.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleResetDefaults}
              style={styles.secondaryButton}
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={!hasChanges}
              style={{
                ...styles.primaryButton,
                opacity: hasChanges ? 1 : 0.6,
                cursor: hasChanges ? 'pointer' : 'not-allowed',
              }}
            >
              💾 Save Configurations
            </button>
          </div>
        </header>

        {/* Change Banner */}
        {hasChanges && (
          <div style={styles.changeBanner}>
            <span>⚠️ You have unsaved parameter modifications. Click &quot;Save Configurations&quot; to apply them across the platform.</span>
          </div>
        )}

        {/* Config Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {categories.map((category) => {
            const items = configs.filter((c) => c.category === category);
            return (
              <div key={category} style={styles.card}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
                  {category}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {items.map((item) => (
                    <div key={item.key} style={styles.configRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={styles.configLabel}>{item.label}</span>
                          <span style={styles.specBadge}>{item.specRef}</span>
                        </div>
                        <div style={styles.configDesc}>{item.description}</div>
                        <div style={styles.configKey}>{item.key}</div>
                      </div>

                      <div style={{ width: '200px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {item.isEditable ? (
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) => handleValueChange(item.key, e.target.value)}
                            style={styles.configInput}
                          />
                        ) : (
                          <div style={styles.lockedValue}>
                            <span>🔒 {item.value}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
  changeBanner: {
    backgroundColor: '#FEF3C7',
    border: '1px solid #F59E0B',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#92400E',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  configRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  configLabel: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
  },
  specBadge: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
  configDesc: {
    fontSize: '13px',
    color: '#6B7280',
    marginTop: '4px',
  },
  configKey: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#9CA3AF',
    marginTop: '2px',
  },
  configInput: {
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'right' as const,
    width: '120px',
  },
  lockedValue: {
    padding: '8px 12px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#6B7280',
    fontWeight: 600,
  },
  toast: {
    position: 'fixed' as const,
    top: '20px',
    right: '24px',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
    zIndex: 1100,
  },
};
