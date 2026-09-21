/**
 * STAPLE LIMITED — Champion Application Modal
 * In-app form enabling neighborhood organizers to apply for Champion status
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { theme } from '../theme/tokens';
import { Typography, Button, Input, Card, Badge } from './index';
import {
  ChampionApplicationInput,
  validateChampionApplication,
  NIGERIA_INITIAL_STATES,
} from '@staple/shared';

export interface ChampionApplicationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ChampionApplicationInput) => void;
  isSubmitting?: boolean;
}

export const ChampionApplicationModal: React.FC<ChampionApplicationModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedState, setSelectedState] = useState('Lagos');
  const [lga, setLga] = useState('Eti-Osa');
  const [neighborhood, setNeighborhood] = useState('Lekki Phase 1');
  const [networkSize, setNetworkSize] = useState('25');
  const [motivation, setMotivation] = useState(
    'I want to organize bulk foodstuff purchases for our estate residents so we can get wholesale prices on rice and oil.',
  );
  const [experience, setExperience] = useState('Estate Resident Association Exco member');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const input: ChampionApplicationInput = {
      full_name: fullName,
      phone,
      state: selectedState,
      lga,
      neighborhood,
      estimated_network_size: parseInt(networkSize, 10) || 0,
      motivation,
      experience,
    };

    const validation = validateChampionApplication(input);
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Incomplete Application', validation.errors[0]);
      return;
    }

    setErrors([]);
    onSubmit(input);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Typography variant="body" color={theme.textSecondary}>✕ Close</Typography>
          </TouchableOpacity>
          <Typography variant="h3">Apply as Champion</Typography>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Champion Value Prop Banner */}
          <Card elevated style={styles.bannerCard}>
            <View style={styles.badgeRow}>
              <Badge status="Community Leader" variant="success" />
              <Typography variant="caption" color={theme.brandGreen} weight="bold">
                ₦2,000 Milestone Bonus
              </Typography>
            </View>
            <Typography variant="h3" style={styles.bannerTitle}>
              Lead Collective Buying for Your Neighborhood
            </Typography>
            <Typography variant="bodySm" color={theme.textSecondary}>
              Champions organize neighbors to unlock wholesale prices on Rice, Garri, Beans, and Oil with zero commercial risk.
            </Typography>
          </Card>

          {errors.length > 0 && (
            <View style={styles.errorBox}>
              <Typography variant="bodySm" color={theme.colors.error.main} weight="bold">
                Please fix the following:
              </Typography>
              {errors.map((err, i) => (
                <Typography key={i} variant="caption" color={theme.colors.error.main}>
                  • {err}
                </Typography>
              ))}
            </View>
          )}

          {/* Form Fields */}
          <Input
            label="Full Legal Name"
            placeholder="e.g. Babatunde Adeleke"
            value={fullName}
            onChangeText={setFullName}
          />

          <Input
            label="Nigerian Mobile Phone (WhatsApp Enabled)"
            placeholder="e.g. 08031234567"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            helperText="We send Group Buy participant notifications and verification via SMS/WhatsApp."
          />

          <Typography variant="caption" color={theme.textSecondary} style={styles.fieldLabel}>
            Launch State
          </Typography>
          <View style={styles.statePillsRow}>
            {NIGERIA_INITIAL_STATES.map((st) => (
              <TouchableOpacity
                key={st}
                style={[
                  styles.statePill,
                  selectedState === st && styles.statePillActive,
                ]}
                onPress={() => setSelectedState(st)}
              >
                <Typography
                  variant="caption"
                  color={selectedState === st ? theme.colors.primary[800] : theme.textPrimary}
                  weight={selectedState === st ? 'bold' : 'regular'}
                >
                  {st}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Local Government Area (LGA)"
            placeholder="e.g. Eti-Osa, Ikeja, Surulere"
            value={lga}
            onChangeText={setLga}
          />

          <Input
            label="Neighborhood / Estate / Community Name"
            placeholder="e.g. Lekki Phase 1, Magodo Shangisha, Bodija"
            value={neighborhood}
            onChangeText={setNeighborhood}
            helperText="The specific area where you will coordinate pickups and inform neighbors."
          />

          <Input
            label="Estimated Community Reach (Households / People)"
            placeholder="e.g. 25"
            keyboardType="number-pad"
            value={networkSize}
            onChangeText={setNetworkSize}
            helperText="How many households in your estate or circle buy foodstuff together?"
          />

          <Input
            label="Why do you want to become a STAPLE Champion?"
            placeholder="Tell us about your community role or estate group..."
            multiline
            numberOfLines={3}
            value={motivation}
            onChangeText={setMotivation}
            style={styles.textArea}
          />

          <Input
            label="Community Leadership Experience (Optional)"
            placeholder="e.g. Estate CDA Secretary, Cooperative member, PTA executive"
            value={experience}
            onChangeText={setExperience}
          />

          <Button
            title={isSubmitting ? 'Submitting Application...' : 'Submit Champion Application'}
            size="lg"
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: theme.spacing[2],
  },
  scrollContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  bannerCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  bannerTitle: {
    fontSize: theme.typography.fontSize.lg,
    color: '#166534',
    marginBottom: theme.spacing[1],
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing[4],
  },
  fieldLabel: {
    marginBottom: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  statePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[4],
  },
  statePill: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  statePillActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: theme.spacing[4],
  },
});
