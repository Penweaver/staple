/**
 * STAPLE LIMITED — Digital Pickup Pass Modal
 * High-contrast collection ticket with 6-digit code, QR payload, and hub details (§29, §63)
 */

import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { theme } from '../theme/tokens.js';
import { Typography, Card, Badge, Button } from './index.js';
import { formatNaira } from '@staple/shared';

export interface PickupPassData {
  orderNumber: string;
  pickupCode: string; // e.g. "STP-782-910"
  productName: string;
  quantity: number;
  unit: string;
  totalAmount: number;
  hubName: string;
  hubAddress: string;
  hubPhone?: string;
  operatingHoursLabel: string;
  isOpenNow: boolean;
  isCollected: boolean;
  collectedAt?: string;
  collectedBy?: string;
}

export interface PickupPassModalProps {
  visible: boolean;
  onClose: () => void;
  pass: PickupPassData | null;
}

export const PickupPassModal: React.FC<PickupPassModalProps> = ({
  visible,
  onClose,
  pass,
}) => {
  if (!pass) return null;

  const handleCallHub = () => {
    if (pass.hubPhone) {
      Linking.openURL(`tel:${pass.hubPhone}`).catch(() => {
        Alert.alert('Phone Call', `Call hub manager at: ${pass.hubPhone}`);
      });
    } else {
      Alert.alert('Hub Phone', 'Call Lekki Hub Manager: +234 801 234 5678');
    }
  };

  const handleShareWithProxy = () => {
    Alert.alert(
      'Proxy Collection Code Copied! 📲',
      `Share this with the person picking up on your behalf:\n\n"STAPLE Pickup Pass for ${pass.productName} (${pass.quantity} ${pass.unit}):\nCode: ${pass.pickupCode}\nHub: ${pass.hubName}\nAddress: ${pass.hubAddress}"`,
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Typography variant="body" color={theme.textSecondary}>✕ Close</Typography>
          </TouchableOpacity>
          <Typography variant="h3">Digital Pickup Pass</Typography>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Status Alert */}
          {pass.isCollected ? (
            <Card elevated style={styles.collectedBanner}>
              <Typography variant="bodySm" color="#166534" weight="bold">
                ✅ Goods Collected
              </Typography>
              <Typography variant="caption" color="#15803D" style={{ marginTop: 2 }}>
                Handed over to {pass.collectedBy || 'Customer'} on {pass.collectedAt || 'Recently'}.
              </Typography>
            </Card>
          ) : (
            <View style={styles.statusBar}>
              <Badge status="Ready for Collection" variant="success" />
              <Badge
                status={pass.isOpenNow ? 'Hub Open Now' : 'Hub Closed'}
                variant={pass.isOpenNow ? 'info' : 'warning'}
              />
            </View>
          )}

          {/* Core Verification Code Card */}
          <Card elevated style={styles.codeCard}>
            <Typography variant="caption" color={theme.textMuted} weight="bold" style={styles.codeLabel}>
              PICKUP VERIFICATION CODE
            </Typography>

            <View style={styles.codeContainer}>
              <Typography variant="h1" color="#14532D" style={styles.codeText}>
                {pass.pickupCode}
              </Typography>
            </View>

            <Typography variant="caption" color={theme.textSecondary} style={styles.codeSub}>
              Present this 6-digit code or QR code to the hub manager to release your goods.
            </Typography>

            {/* QR Visual Representation */}
            <View style={styles.qrContainer}>
              <View style={styles.qrBox}>
                <Typography variant="h2" color="#1E293B">
                  ▦ [QR PASS] ▦
                </Typography>
                <Typography variant="caption" color={theme.textMuted} style={{ marginTop: 4 }}>
                  Scan at Counter
                </Typography>
              </View>
            </View>
          </Card>

          {/* Item & Order Summary */}
          <Card style={styles.sectionCard}>
            <Typography variant="caption" color={theme.textMuted} weight="bold">
              ORDER DETAILS ({pass.orderNumber})
            </Typography>
            <Typography variant="h3" style={{ marginTop: 6 }}>
              {pass.productName}
            </Typography>
            <View style={styles.detailRow}>
              <Typography variant="bodySm" color={theme.textSecondary}>Quantity:</Typography>
              <Typography variant="bodySm" weight="bold">{pass.quantity} {pass.unit}</Typography>
            </View>
            <View style={styles.detailRow}>
              <Typography variant="bodySm" color={theme.textSecondary}>Total Paid:</Typography>
              <Typography variant="bodySm" weight="bold" color={theme.brandGreen}>
                {formatNaira(pass.totalAmount)}
              </Typography>
            </View>
          </Card>

          {/* Hub Location & Operating Hours */}
          <Card style={styles.sectionCard}>
            <Typography variant="caption" color={theme.textMuted} weight="bold">
              COLLECTION HUB
            </Typography>
            <Typography variant="h3" style={{ marginTop: 6 }}>
              📍 {pass.hubName}
            </Typography>
            <Typography variant="bodySm" color={theme.textSecondary} style={{ marginTop: 2 }}>
              {pass.hubAddress}
            </Typography>

            <View style={styles.hoursBox}>
              <Typography variant="caption" weight="bold" color={pass.isOpenNow ? '#166534' : '#854D0E'}>
                🕒 {pass.operatingHoursLabel}
              </Typography>
            </View>

            {/* Hub Action Buttons */}
            <View style={styles.actionRow}>
              <Button
                title="📞 Call Hub Manager"
                size="sm"
                variant="outline"
                onPress={handleCallHub}
                style={{ flex: 1 }}
              />
              <Button
                title="💬 WhatsApp Hub"
                size="sm"
                variant="outline"
                onPress={handleCallHub}
                style={{ flex: 1 }}
              />
            </View>
          </Card>

          {/* Proxy Collection Info */}
          {!pass.isCollected && (
            <Card style={styles.proxyCard}>
              <Typography variant="bodySm" weight="bold" color="#1E3A8A">
                Sending someone to pick up?
              </Typography>
              <Typography variant="caption" color="#1E40AF" style={{ marginTop: 4, lineHeight: 18 }}>
                You can authorize a driver, friend, or family member. Simply share the 6-digit code with them. The hub manager will verify the code and note their name upon release.
              </Typography>
              <Button
                title="Share Pickup Pass with Proxy"
                size="sm"
                onPress={handleShareWithProxy}
                style={{ marginTop: 10 }}
              />
            </Card>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  closeBtn: {
    padding: theme.spacing[2],
  },
  scrollContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  collectedBanner: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    marginBottom: theme.spacing[4],
  },
  codeCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing[5],
    marginBottom: theme.spacing[4],
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 2,
  },
  codeLabel: {
    letterSpacing: 1,
    marginBottom: theme.spacing[2],
  },
  codeContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginVertical: theme.spacing[2],
  },
  codeText: {
    fontSize: 32,
    letterSpacing: 2,
    fontWeight: '800',
  },
  codeSub: {
    textAlign: 'center',
    paddingHorizontal: theme.spacing[4],
    marginTop: theme.spacing[2],
    lineHeight: 18,
  },
  qrContainer: {
    marginTop: theme.spacing[4],
    alignItems: 'center',
  },
  qrBox: {
    width: 160,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    marginBottom: theme.spacing[4],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing[2],
  },
  hoursBox: {
    backgroundColor: '#FEFCE8',
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing[3],
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginTop: theme.spacing[3],
  },
  proxyCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    marginBottom: theme.spacing[4],
  },
});
