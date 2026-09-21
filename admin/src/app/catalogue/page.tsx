'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import Link from 'next/link';

interface ProductRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number;
  minTarget: number;
  maxTarget: number;
  mvfq: number;
  isActive: boolean;
  serviceAreasCount: number;
}

interface BasketRow {
  id: string;
  name: string;
  itemCount: number;
  totalPrice: number;
  mvfq: number;
  isFestive: boolean;
  isActive: boolean;
}

const initialProducts: ProductRow[] = [
  {
    id: '00000000-0000-0000-0007-000000000001',
    name: 'Mama Gold Premium Parboiled Rice (50kg)',
    category: 'Grains & Flours',
    unit: '50kg bag',
    basePrice: 85000,
    minTarget: 20,
    maxTarget: 200,
    mvfq: 20,
    isActive: true,
    serviceAreasCount: 3,
  },
  {
    id: '00000000-0000-0000-0007-000000000002',
    name: 'Oloyin Honey Beans (50kg)',
    category: 'Grains & Flours',
    unit: '50kg bag',
    basePrice: 75000,
    minTarget: 15,
    maxTarget: 150,
    mvfq: 15,
    isActive: true,
    serviceAreasCount: 3,
  },
  {
    id: '00000000-0000-0000-0007-000000000003',
    name: 'Kings Pure Vegetable Cooking Oil (25L)',
    category: 'Oils & Condiments',
    unit: '25L keg',
    basePrice: 48000,
    minTarget: 20,
    maxTarget: 200,
    mvfq: 15,
    isActive: true,
    serviceAreasCount: 3,
  },
  {
    id: '00000000-0000-0000-0007-000000000004',
    name: 'White Garri Ijebu (50kg Bag)',
    category: 'Grains & Flours',
    unit: '50kg bag',
    basePrice: 32000,
    minTarget: 15,
    maxTarget: 100,
    mvfq: 10,
    isActive: true,
    serviceAreasCount: 3,
  },
];

const initialBaskets: BasketRow[] = [
  {
    id: '00000000-0000-0000-0008-000000000001',
    name: 'Student Essentials Basket',
    itemCount: 4,
    totalPrice: 38000,
    mvfq: 10,
    isFestive: false,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0008-000000000002',
    name: 'Family Monthly Basket',
    itemCount: 5,
    totalPrice: 165000,
    mvfq: 8,
    isFestive: false,
    isActive: true,
  },
];

export default function CatalogueManagementPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'baskets'>('products');
  const [products] = useState<ProductRow[]>(initialProducts);
  const [baskets] = useState<BasketRow[]>(initialBaskets);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/catalogue" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Catalogue Management
            </h1>
            <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
              Configure category-agnostic products, curated baskets, MVFQs, and location availability rules.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href="/catalogue/products/new"
              style={styles.primaryBtn}
            >
              + Add Product
            </Link>
            <Link
              href="/catalogue/baskets/new"
              style={styles.secondaryBtn}
            >
              + Create Basket
            </Link>
          </div>
        </header>

        {/* Tab switcher */}
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              ...styles.tabBtn,
              borderBottom: activeTab === 'products' ? '3px solid #16A34A' : '3px solid transparent',
              color: activeTab === 'products' ? '#16A34A' : '#6B7280',
              fontWeight: activeTab === 'products' ? 700 : 500,
            }}
          >
            🌾 Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('baskets')}
            style={{
              ...styles.tabBtn,
              borderBottom: activeTab === 'baskets' ? '3px solid #16A34A' : '3px solid transparent',
              color: activeTab === 'baskets' ? '#16A34A' : '#6B7280',
              fontWeight: activeTab === 'baskets' ? 700 : 500,
            }}
          >
            🧺 Curated Baskets ({baskets.length})
          </button>
        </div>

        {/* Products Table */}
        {activeTab === 'products' && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Unit Size</th>
                  <th style={styles.th}>Base Price (NGN)</th>
                  <th style={styles.th}>Target Range</th>
                  <th style={styles.th}>MVFQ (Addendum A1)</th>
                  <th style={styles.th}>Service Areas</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={styles.tr}>
                    <td style={styles.tdBold}>{p.name}</td>
                    <td style={styles.td}>{p.category}</td>
                    <td style={styles.td}>{p.unit}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#16A34A' }}>
                      ₦{p.basePrice.toLocaleString()}
                    </td>
                    <td style={styles.td}>{p.minTarget} – {p.maxTarget}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#B45309' }}>
                      {p.mvfq} units min
                    </td>
                    <td style={styles.td}>{p.serviceAreasCount} Active Hubs</td>
                    <td style={styles.td}>
                      <span style={p.isActive ? styles.badgeSuccess : styles.badgeMuted}>
                        {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <Link
                        href={`/catalogue/products/${p.id}`}
                        style={styles.actionLink}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Baskets Table */}
        {activeTab === 'baskets' && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Basket Name</th>
                  <th style={styles.th}>Items Count</th>
                  <th style={styles.th}>Bundle Price (NGN)</th>
                  <th style={styles.th}>MVFQ Threshold</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {baskets.map((b) => (
                  <tr key={b.id} style={styles.tr}>
                    <td style={styles.tdBold}>{b.name}</td>
                    <td style={styles.td}>{b.itemCount} food items</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#16A34A' }}>
                      ₦{b.totalPrice.toLocaleString()}
                    </td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#B45309' }}>
                      {b.mvfq} baskets min
                    </td>
                    <td style={styles.td}>
                      <span style={b.isFestive ? styles.badgeWarning : styles.badgeInfo}>
                        {b.isFestive ? 'Festive' : 'Everyday'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={b.isActive ? styles.badgeSuccess : styles.badgeMuted}>
                        {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <Link
                        href={`/catalogue/baskets/${b.id}`}
                        style={styles.actionLink}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  primaryBtn: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    color: '#374151',
    border: '1px solid #D1D5DB',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
  },
  tabContainer: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid #E5E7EB',
    marginBottom: '20px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '12px 4px',
    fontSize: '15px',
    cursor: 'pointer',
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
    padding: '16px',
    color: '#374151',
  },
  tdBold: {
    padding: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  badgeSuccess: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    fontWeight: 700,
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
  badgeMuted: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    fontWeight: 600,
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontWeight: 700,
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
  badgeInfo: {
    backgroundColor: '#E1EFFE',
    color: '#1E429F',
    fontWeight: 700,
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
  actionLink: {
    color: '#16A34A',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
