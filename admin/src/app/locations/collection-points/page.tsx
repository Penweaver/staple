'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../../components/AdminNav';
import Link from 'next/link';

interface CollectionPointRow {
  id: string;
  name: string;
  serviceArea: string;
  address: string;
  contactName: string;
  contactPhone: string;
  operatingHours: string;
  isActive: boolean;
}

const initialHubs: CollectionPointRow[] = [
  {
    id: '00000000-0000-0000-0005-000000000001',
    name: 'staple Hub — Lekki Admiralty',
    serviceArea: 'Lekki Phase 1',
    address: '42 Admiralty Way, Lekki Phase 1, Lagos',
    contactName: 'Tunde Babatunde',
    contactPhone: '+2348012345678',
    operatingHours: 'Mon-Fri: 08:00–18:00, Sat: 09:00–16:00',
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0005-000000000002',
    name: 'staple Hub — VI Bishop Oluwole',
    serviceArea: 'Victoria Island Central',
    address: '15 Bishop Oluwole Street, Victoria Island, Lagos',
    contactName: 'Amina Mohammed',
    contactPhone: '+2348023456789',
    operatingHours: 'Mon-Fri: 08:00–18:00, Sat: 09:00–16:00',
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0005-000000000003',
    name: 'staple Hub — Ikeja GRA',
    serviceArea: 'Ikeja GRA & Central',
    address: '8 Isaac John Street, GRA Ikeja, Lagos',
    contactName: 'Emeka Nwosu',
    contactPhone: '+2348034567890',
    operatingHours: 'Mon-Fri: 08:00–18:00, Sat: 09:00–16:00',
    isActive: true,
  },
];

export default function CollectionPointsPage() {
  const [hubs, setHubs] = useState<CollectionPointRow[]>(initialHubs);
  const [showModal, setShowModal] = useState(false);
  const [newHub, setNewHub] = useState({
    name: '',
    serviceArea: 'Lekki Phase 1',
    address: '',
    contactName: '',
    contactPhone: '',
    operatingHours: 'Mon-Sat: 08:00–18:00',
  });

  const handleCreateHub = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CollectionPointRow = {
      id: crypto.randomUUID(),
      ...newHub,
      isActive: true,
    };
    setHubs([...hubs, created]);
    setShowModal(false);
    setNewHub({
      name: '',
      serviceArea: 'Lekki Phase 1',
      address: '',
      contactName: '',
      contactPhone: '',
      operatingHours: 'Mon-Sat: 08:00–18:00',
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <AdminNav currentPath="/locations" />

      <main style={{ flex: 1, padding: '32px 40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link href="/locations" style={styles.backLink}>
            ← Back to Locations
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
                Pickup Hubs & Collection Points
              </h1>
              <p style={{ color: '#6B7280', marginTop: '4px', fontSize: '14px' }}>
                Manage physical staple distribution hubs where Group Buy participants collect their bulk orders.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              style={styles.primaryBtn}
            >
              + Add Collection Hub
            </button>
          </div>
        </div>

        {/* Collection Hubs Table */}
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Hub Name</th>
                <th style={styles.th}>Assigned Service Area</th>
                <th style={styles.th}>Physical Address</th>
                <th style={styles.th}>Hub Manager</th>
                <th style={styles.th}>Contact Phone</th>
                <th style={styles.th}>Operating Hours</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {hubs.map((h) => (
                <tr key={h.id} style={styles.tr}>
                  <td style={styles.tdBold}>{h.name}</td>
                  <td style={styles.td}>📍 {h.serviceArea}</td>
                  <td style={styles.td}>{h.address}</td>
                  <td style={styles.td}>{h.contactName}</td>
                  <td style={styles.td}>{h.contactPhone}</td>
                  <td style={{ ...styles.td, fontSize: '13px', color: '#6B7280' }}>
                    {h.operatingHours}
                  </td>
                  <td style={styles.td}>
                    <span style={h.isActive ? styles.badgeSuccess : styles.badgeMuted}>
                      {h.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal for adding collection hub */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginTop: 0, marginBottom: '16px' }}>
                Add New Collection Hub
              </h2>

              <form onSubmit={handleCreateHub}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Hub Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. staple Hub — Chevron Toll"
                    value={newHub.name}
                    onChange={(e) => setNewHub({ ...newHub, name: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Service Area *</label>
                  <select
                    value={newHub.serviceArea}
                    onChange={(e) => setNewHub({ ...newHub, serviceArea: e.target.value })}
                    style={styles.input}
                  >
                    <option value="Lekki Phase 1">Lekki Phase 1</option>
                    <option value="Victoria Island Central">Victoria Island Central</option>
                    <option value="Ikeja GRA & Central">Ikeja GRA & Central</option>
                    <option value="Maitama Central">Maitama Central</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Physical Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Street address in Lagos/Abuja"
                    value={newHub.address}
                    onChange={(e) => setNewHub({ ...newHub, address: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Manager Name *</label>
                    <input
                      type="text"
                      required
                      value={newHub.contactName}
                      onChange={(e) => setNewHub({ ...newHub, contactName: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone Number (+234) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+23480..."
                      value={newHub.contactPhone}
                      onChange={(e) => setNewHub({ ...newHub, contactPhone: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Operating Hours</label>
                  <input
                    type="text"
                    value={newHub.operatingHours}
                    onChange={(e) => setNewHub({ ...newHub, operatingHours: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.primaryBtn}>
                    Create Hub
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    color: '#4B5563',
    border: '1px solid #D1D5DB',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
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
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    width: '520px',
    maxWidth: '90%',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    marginBottom: '14px',
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
};
