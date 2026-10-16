'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@staple.africa');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoRow}>
            <img
              src="/logo-horizontal.png"
              alt="staple"
              style={{ height: '36px', objectFit: 'contain' }}
            />
            <span style={styles.brandTag}>ADMIN</span>
          </div>
          <h1 style={styles.title}>Operations Console</h1>
          <p style={styles.subtitle}>
            Sign in to manage group buys, double-entry financial reconciliation, and hub fulfilment.
          </p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@staple.africa"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Security Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>

        <div style={styles.demoSection}>
          <div style={styles.demoDivider}>
            <span style={styles.demoDividerText}>OR TEST ACCESS</span>
          </div>

          <button
            onClick={() => handleLogin()}
            style={styles.demoButton}
          >
            ⚡ Instant 1-Tap Demo Access (Super Admin)
          </button>
        </div>

        <div style={styles.footer}>
          <small style={{ color: '#9CA3AF' }}>
            STAPLE LIMITED • Restricted to Authorized Platform Administrators
          </small>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '36px 32px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #E5E7EB',
  },
  header: {
    marginBottom: '28px',
    textAlign: 'center' as const,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  brandLogo: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#16A34A',
    letterSpacing: '-0.5px',
  },
  brandTag: {
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#DCFCE7',
    color: '#14532D',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#6B7280',
    margin: 0,
    lineHeight: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
  },
  submitButton: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '6px',
    transition: 'background-color 0.15s ease',
  },
  demoSection: {
    marginTop: '24px',
    textAlign: 'center' as const,
  },
  demoDivider: {
    position: 'relative' as const,
    borderTop: '1px solid #E5E7EB',
    marginBottom: '18px',
  },
  demoDividerText: {
    position: 'absolute' as const,
    top: '-9px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#FFFFFF',
    padding: '0 8px',
    fontSize: '11px',
    color: '#9CA3AF',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  demoButton: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    color: '#374151',
    border: '1px solid #D1D5DB',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  footer: {
    marginTop: '28px',
    textAlign: 'center' as const,
  },
};
