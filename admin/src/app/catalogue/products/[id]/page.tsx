'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../../../components/AdminNav';
import Link from 'next/link';

interface ProductFormState {
  name: string;
  slug: string;
  category: string;
  unit: string;
  weightValue: number;
  weightUnit: string;
  basePrice: number;
  minTarget: number;
  maxTarget: number;
  maxUnitsPerUser: number;
  minimumFulfilmentQuantity: number;
  isActive: boolean;
  isFestive: boolean;
  description: string;
}

export default function ProductEditPage({ params }: { params: { id: string } }) {
  const isNew = params.id === 'new';

  const [form, setForm] = useState<ProductFormState>({
    name: isNew ? '' : 'Mama Gold Premium Parboiled Rice (50kg)',
    slug: isNew ? '' : 'mama-gold-rice-50kg',
    category: 'Grains & Flours',
    unit: '50kg bag',
    weightValue: 50,
    weightUnit: 'kg',
    basePrice: 85000,
    minTarget: 20,
    maxTarget: 200,
    maxUnitsPerUser: 10,
    minimumFulfilmentQuantity: 20, // MVFQ Addendum A1
    isActive: true,
    isFestive: false,
    description: 'Stone-free, high-grade long grain parboiled Nigerian rice in 50kg bag.',
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
            {isNew ? 'Create New Product' : `Edit Product: ${form.name}`}
          </h1>
          <p style={{ color: '#6B7280', marginTop: '4px', fontSize: '14px' }}>
            Configure pricing, bulk break-even thresholds (MVFQ), and inventory specifications.
          </p>
        </div>

        {saved && (
          <div style={styles.alertSuccess}>
            ✅ Product saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.formCard}>
          <div style={styles.grid2}>
            {/* Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Product Name *</label>
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

            {/* Category */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Product Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={styles.input}
              >
                <option value="Grains & Flours">Grains & Flours</option>
                <option value="Oils & Condiments">Oils & Condiments</option>
                <option value="Curated Baskets">Curated Baskets</option>
              </select>
            </div>

            {/* Unit */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Unit Representation *</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g. 50kg bag, 25L keg, carton"
                style={styles.input}
                required
              />
            </div>

            {/* Base Price */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Base Price in Nigerian Naira (₦) *</label>
              <input
                type="number"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                style={styles.input}
                required
              />
            </div>

            {/* Minimum Viable Fulfilment Quantity (MVFQ) */}
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
                🛡️ Supplier MOQ threshold (Addendum A1). If a Group Buy expires below this quantity, all buyers receive an automatic 100% refund.
              </small>
            </div>

            {/* Min Target */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Min Group Buy Target (Units)</label>
              <input
                type="number"
                value={form.minTarget}
                onChange={(e) => setForm({ ...form, minTarget: Number(e.target.value) })}
                style={styles.input}
                required
              />
            </div>

            {/* Max Target */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Max Group Buy Target (Units)</label>
              <input
                type="number"
                value={form.maxTarget}
                onChange={(e) => setForm({ ...form, maxTarget: Number(e.target.value) })}
                style={styles.input}
                required
              />
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
              <small style={{ color: '#6B7280', fontSize: '12px' }}>Anti-hoarding limit (Default 10 per Spec §74)</small>
            </div>

            {/* Status checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <strong>Is Active in Catalogue</strong>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isFestive}
                  onChange={(e) => setForm({ ...form, isFestive: e.target.checked })}
                />
                <strong>Is Festive Season Item</strong>
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

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
            <button type="submit" style={styles.submitBtn}>
              Save Product Details
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
