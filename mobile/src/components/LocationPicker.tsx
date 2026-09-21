/**
 * STAPLE LIMITED — LocationPicker Component
 * Reusable modal/selector for Nigerian 5-tier location hierarchy (Spec §47)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { theme } from '../theme/tokens.js';
import { Button } from './Button.js';
import { Badge } from './Badge.js';
import { Typography } from './Typography.js';

// Pre-seeded hierarchy for Nigeria
const NIGERIA_LOCATIONS = [
  {
    state: 'Lagos',
    lgas: [
      {
        name: 'Eti-Osa',
        cities: [
          {
            name: 'Lekki',
            areas: [
              { id: '00000000-0000-0000-0004-000000000001', name: 'Lekki Phase 1', hub: 'staple Hub — Lekki Admiralty' },
              { id: '00000000-0000-0000-0004-000000000004', name: 'Chevron & Conservation', hub: 'staple Hub — Chevron Toll' },
            ],
          },
          {
            name: 'Victoria Island',
            areas: [
              { id: '00000000-0000-0000-0004-000000000002', name: 'Victoria Island Central', hub: 'staple Hub — VI Bishop Oluwole' },
            ],
          },
        ],
      },
      {
        name: 'Ikeja',
        cities: [
          {
            name: 'Ikeja',
            areas: [
              { id: '00000000-0000-0000-0004-000000000003', name: 'Ikeja GRA & Central', hub: 'staple Hub — Ikeja GRA' },
            ],
          },
        ],
      },
    ],
  },
  {
    state: 'Federal Capital Territory',
    lgas: [
      {
        name: 'Abuja Municipal',
        cities: [
          {
            name: 'Maitama',
            areas: [
              { id: '00000000-0000-0000-0004-000000000005', name: 'Maitama Central', hub: 'staple Hub — Maitama' },
            ],
          },
        ],
      },
    ],
  },
  {
    state: 'Rivers',
    lgas: [
      {
        name: 'Port Harcourt',
        cities: [
          {
            name: 'Old GRA',
            areas: [
              { id: '00000000-0000-0000-0004-000000000006', name: 'Port Harcourt Old GRA', hub: 'staple Hub — PH GRA' },
            ],
          },
        ],
      },
    ],
  },
];

export interface SelectedLocationData {
  state: string;
  lga: string;
  city: string;
  areaId: string;
  areaName: string;
  hubName: string;
}

export interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (selected: SelectedLocationData) => void;
  currentAreaId?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onSelect,
  currentAreaId,
}) => {
  const [selectedState, setSelectedState] = useState<string>('Lagos');
  const [selectedLga, setSelectedLga] = useState<string>('Eti-Osa');
  const [selectedCity, setSelectedCity] = useState<string>('Lekki');

  const currentState = NIGERIA_LOCATIONS.find((s) => s.state === selectedState);
  const currentLga = currentState?.lgas.find((l) => l.name === selectedLga) || currentState?.lgas[0];
  const currentCity = currentLga?.cities.find((c) => c.name === selectedCity) || currentLga?.cities[0];

  const handleSelectArea = (area: { id: string; name: string; hub: string }) => {
    onSelect({
      state: selectedState,
      lga: currentLga?.name || '',
      city: currentCity?.name || '',
      areaId: area.id,
      areaName: area.name,
      hubName: area.hub,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View>
              <Typography variant="h3">Choose Your Location</Typography>
              <Typography variant="caption" color={theme.textSecondary}>
                Showing Group Buys delivering to your area
              </Typography>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* State Selection */}
          <Text style={styles.sectionLabel}>STATE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {NIGERIA_LOCATIONS.map((item) => (
              <TouchableOpacity
                key={item.state}
                onPress={() => {
                  setSelectedState(item.state);
                  const firstLga = item.lgas[0];
                  setSelectedLga(firstLga.name);
                  setSelectedCity(firstLga.cities[0].name);
                }}
                style={[
                  styles.chip,
                  selectedState === item.state && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedState === item.state && styles.chipTextActive,
                  ]}
                >
                  {item.state}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* LGA Selection */}
          {currentState && (
            <>
              <Text style={styles.sectionLabel}>DISTRICT / LGA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {currentState.lgas.map((lga) => (
                  <TouchableOpacity
                    key={lga.name}
                    onPress={() => {
                      setSelectedLga(lga.name);
                      setSelectedCity(lga.cities[0].name);
                    }}
                    style={[
                      styles.chip,
                      selectedLga === lga.name && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedLga === lga.name && styles.chipTextActive,
                      ]}
                    >
                      {lga.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Service Areas */}
          <Text style={styles.sectionLabel}>SERVICE AREA & COLLECTION HUB</Text>
          <ScrollView style={styles.areaList}>
            {currentCity?.areas.map((area) => {
              const isSelected = area.id === currentAreaId;
              return (
                <TouchableOpacity
                  key={area.id}
                  onPress={() => handleSelectArea(area)}
                  style={[styles.areaCard, isSelected && styles.areaCardActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Typography variant="label" color={isSelected ? theme.brandGreen : theme.textPrimary}>
                      {area.name}
                    </Typography>
                    <Text style={styles.hubText}>📍 Hub: {area.hub}</Text>
                  </View>
                  {isSelected ? (
                    <Badge label="Selected" variant="success" />
                  ) : (
                    <Text style={styles.selectArrow}>➔</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={onClose}
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    fontSize: 20,
    color: theme.textMuted,
    fontWeight: 'bold',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderDefault,
    marginRight: 8,
    backgroundColor: theme.colors.surface.subtle,
  },
  chipActive: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.brandGreen,
  },
  chipText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: theme.brandGreen,
    fontWeight: '700',
  },
  areaList: {
    maxHeight: 220,
  },
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginBottom: 8,
    backgroundColor: theme.cardBg,
  },
  areaCardActive: {
    borderColor: theme.brandGreen,
    backgroundColor: theme.colors.primary[50],
  },
  hubText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  selectArrow: {
    fontSize: 14,
    color: theme.textMuted,
  },
});
