'use client';

import React from 'react';

const navItems = [
  { label: 'Dashboard', icon: '📊', path: '/' },
  { label: 'Group Buys', icon: '🛒', path: '/group-buys' },
  { label: 'Champions', icon: '⭐', path: '/champions' },
  { label: 'Orders', icon: '📦', path: '/orders' },
  { label: 'Fulfilment', icon: '🚚', path: '/fulfilment' },
  { label: 'Products & Baskets', icon: '🌾', path: '/catalogue' },
  { label: 'Festive Plans', icon: '🎉', path: '/festive' },
  { label: 'Support & Tickets', icon: '🎧', path: '/support' },
  { label: 'Broadcast & Comms', icon: '📢', path: '/communications' },
  { label: 'Payments & Wallet', icon: '💳', path: '/finance' },
  { label: 'Locations & Hubs', icon: '📍', path: '/locations' },
  { label: 'Audit Logs', icon: '🛡️', path: '/audit-logs' },
  { label: 'System Settings', icon: '⚙️', path: '/settings' },
];

export const AdminNav: React.FC<{ currentPath?: string }> = ({ currentPath = '/' }) => {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brandContainer}>
        <img
          src="/logo-horizontal.png"
          alt="staple"
          style={{ height: '30px', objectFit: 'contain' }}
        />
        <span style={styles.brandTag}>ADMIN</span>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <a
              key={item.path}
              href={item.path}
              style={{
                ...styles.navLink,
                backgroundColor: isActive ? '#DCFCE7' : 'transparent',
                color: isActive ? '#14532D' : '#374151',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <div style={styles.userCard}>
          <div style={styles.userAvatar}>AD</div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>Super Admin</div>
            <div style={styles.userRole}>Operations Lead</div>
          </div>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to sign out of STAPLE Admin Console?')) {
              window.location.href = '/login';
            }
          }}
          style={styles.signOutButton}
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>

        <div style={styles.versionRow}>
          <small style={{ color: '#9CA3AF' }}>STAPLE LIMITED v1.1 • Production</small>
        </div>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '20px 16px',
    boxSizing: 'border-box' as const,
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '28px',
    paddingLeft: '8px',
  },
  brandLogo: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#16A34A',
    letterSpacing: '-0.5px',
  },
  brandTag: {
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'background-color 0.15s ease',
  },
  navIcon: {
    fontSize: '16px',
  },
  footer: {
    paddingTop: '16px',
    borderTop: '1px solid #F3F4F6',
    paddingLeft: '4px',
    paddingRight: '4px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    marginBottom: '10px',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '12px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  userName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111827',
  },
  userRole: {
    fontSize: '11px',
    color: '#6B7280',
  },
  signOutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #FCA5A5',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'background-color 0.15s ease',
  },
  versionRow: {
    textAlign: 'center' as const,
    paddingTop: '4px',
  },
};

