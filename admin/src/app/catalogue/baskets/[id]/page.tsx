'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../../../components/AdminNav';
import Link from 'next/link';

interface BasketFormState {
  name: string;
  slug: string;
  description: string;
  totalPrice: number;
  maxUnitsPerUser: number;
  minimumFulfilmentQuantity: number;
  isActive: boolean;
  isFestive: boolean;
  items: Array<{ productId: string; productName: string; quantity: number }>;
}

export default function BasketEditPage({ params }: { params: { id: string } }) {
  const isNew = params.id === 'new';

  const [form, setForm] = useState<BasketFormState>({
    name: isNew ? '' : 'Student Essentials Basket',
    slug: isNew ? '' : 'student-essentials-basket',
    description: 'Includes parboiled rice, honey beans, pure vegetable oil, and Ijebu garri.',
    totalPrice: 38000,
    maxUnitsPerUser: 5,
    minimumFulfilmentQuantity: 10,
    isActive: true,
    isFestive: false,
    items: [
      { productId: '00000000-0000-0000-0007-000000000001', productName: 'Mama Gold Rice (10kg)', quantity: 1 },
      { productId: '00000000-0000-0000-0007-000000000002', productName: 'Oloyin Honey Beans (5kg)', quantity: 1 },
      { productId: '00000000-0000-0000-0007-000000000003', productName: 'Kings Cooking Oil (5L)', quantity: 1 },
      { productId: '00000000-0000-0000-0007-000000000004', productName: 'White Garri Ijebu (10kg)', quantity: 1 },
    ],
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/catalogue" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link href="/catalogue" style={styles.backLink}>
            ← Back to Catalogue
          </Link>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', marginTop: '8px', margin: 0 }}>
            {isNew ? 'Create Curated Basket' : `Edit Basket: ${form.name}`}
          </h1>
          <p style={{ color: '#6B7280', marginTop: '4px', fontSize: '14px' }}>
            Configure bundled food packages, total bundle price, and Minimum Viable Fulfilment Quantity.
          </p>
        </div>

        {saved && (
          <div style={styles.alertSuccess}>
            ✅ Basket saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.formCard}>
          <div style={styles.grid2}>
            {/* Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Basket Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            {/* Slug */}
            <div style={styles.formGroup}>
              <label style={styles.label}>URL Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            {/* Total Price */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Total Bundle Price in Naira (₦) *</label>
              <input
                type="number"
                value={form.totalPrice}
                onChange={(e) => setForm({ ...form, totalPrice: Number(e.target.value) })}
                style={styles.input}
                required
              />
            </div>

            {/* MVFQ */}
            <div style={styles.formGroupHighlight}>
              <label style={{ ...styles.label, color: '#B45309', fontWeight: 700 }}>
                Minimum Viable Fulfilment Quantity (MVFQ) *
              </label>
              <input
                type="number"
                value={form.minimumFulfilmentQuantity}
                onChange={(e) => setForm({ ...form, minimumFulfilmentQuantity: Number(e.target.value) })}
                style={styles.input}
                required
              />
              <small style={{ color: '#92400E', marginTop: '4px', display: 'block', fontSize: '12px' }}>
                Minimum total basket orders across community before supplier fulfilment unlocks.
              </small>
            </div>

            {/* Max Units Per User */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Max Units Per User Cap</label>
              <input
                type="number"
                value={form.maxUnitsPerUser}
                onChange={(e) => setForm({ ...form, maxUnitsPerUser: Number(e.target.value) })}
                style={styles.input}
                required
              />
            </div>

            {/* Status Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <strong>Is Active</strong>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isFestive}
                  onChange={(e) => setForm({ ...form, isFestive: e.target.checked })}
                />
                <strong>Is Festive Season Plan</strong>
              </label>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginTop: '16px' }}>
            <label style={styles.label}>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ ...styles.input, resize: 'vertical' as const }}
            />
          </div>

          {/* Items Breakdown */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
              Included Products in this Bundle
            </h3>

            <div style={styles.itemsTable}>
              {form.items.map((item, idx) => (
                <div key={idx} style={styles.itemRow}>
                  <span style={{ fontWeight: 600, color: '#111827', flex: 1 }}>
                    {idx + 1}. {item.productName}
                  </span>
                  <span style={{ color: '#4B5563', fontSize: '13px' }}>
                    Qty: {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
            <button type="submit" style={styles.submitBtn}>
              Save Basket
            </button>
            <Link href="/catalogue" style={styles.cancelBtn}>
              Cancel
            </Link>
          </div>
        </form>
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
  alertSuccess: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '20px',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    maxWidth: '900px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  formGroupHighlight: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    backgroundColor: '#FFFBEB',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #FDE68A',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
    outline: 'none',
  },
  itemsTable: {
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  submitBtn: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    color: '#4B5563',
    border: '1px solid #D1D5DB',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
};
