import React from 'react';

const navItems = [
  { label: 'Dashboard', icon: '📊', path: '/' },
  { label: 'Group Buys', icon: '🛒', path: '/group-buys' },
  { label: 'Champions', icon: '⭐', path: '/champions' },
  { label: 'Orders', icon: '📦', path: '/orders' },
  { label: 'Fulfilment', icon: '🚚', path: '/fulfilment' },
  { label: 'Products & Baskets', icon: '🌾', path: '/catalogue' },
  { label: 'Festive Plans', icon: '🎉', path: '/festive' },
  { label: 'Payments & Wallet', icon: '💳', path: '/finance' },
  { label: 'Locations & Hubs', icon: '📍', path: '/locations' },
  { label: 'Audit Logs', icon: '🛡️', path: '/audit-logs' },
  { label: 'System Settings', icon: '⚙️', path: '/settings' },
];

export const AdminNav: React.FC<{ currentPath?: string }> = ({ currentPath = '/' }) => {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brandContainer}>
        <span style={styles.brandLogo}>staple</span>
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
        <small style={{ color: '#9CA3AF' }}>STAPLE LIMITED v1.1</small>
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
    paddingLeft: '8px',
  },
};
