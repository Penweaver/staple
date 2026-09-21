/**
 * STAPLE LIMITED — Festive Instalment Payment Modal (Phase 7)
 * Allows customers to pay single scheduled instalments via Wallet, Paystack, or Split payment.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '../theme/tokens.js';
import { Typography, Card, Button } from '../components/index.js';
import { formatNaira } from '@staple/shared';

export interface InstalmentPaymentItem {
  id: string;
  planId: string;
  planTitle: string;
  instalmentNumber: number;
  totalInstalments: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'overdue';
  isOverdue: boolean;
  daysRemainingInGrace?: number;
}

export interface InstalmentPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  instalment: InstalmentPaymentItem | null;
  walletBalance: number;
  onPaymentSuccess: (instalmentId: string, method: string) => void;
}

export const InstalmentPaymentModal: React.FC<InstalmentPaymentModalProps> = ({
  visible,
  onClose,
  instalment,
  walletBalance,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'split'>('wallet');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!instalment) return null;

  const amountDue = instalment.amount;
  const canPayWithWallet = walletBalance >= amountDue;
  const walletDeduction = paymentMethod === 'split' ? Math.min(walletBalance, amountDue) : amountDue;
  const gatewayRemainder = Math.max(0, amountDue - walletDeduction);

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Payment Successful! 🎉',
        `Instalment #${instalment.instalmentNumber} of ${formatNaira(amountDue)} has been paid. Your plan progress has been updated.`,
        [
          {
            text: 'View Plan',
            onPress: () => {
              onPaymentSuccess(instalment.id, paymentMethod);
              onClose();
            },
          },
        ]
      );
    }, 1000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <Typography variant="h3">Pay Scheduled Instalment</Typography>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Typography variant="body" color={theme.textMuted} weight="bold">
                  ✕
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Plan Context */}
            <Typography variant="caption" color={theme.textSecondary} style={styles.planSub}>
              {instalment.planTitle}
            </Typography>

            {/* Overdue Alert Banner if applicable */}
            {instalment.isOverdue && (
              <View style={styles.overdueAlert}>
                <Typography variant="caption" color={theme.colors.warning[900]} weight="bold">
                  ⚠️ INSTALMENT OVERDUE
                </Typography>
                <Typography variant="caption" color={theme.colors.warning[800]}>
                  Grace period active: {instalment.daysRemainingInGrace ?? 0} days remaining before forfeiture cancellation (§35).
                </Typography>
              </View>
            )}

            {/* Amount Summary Card */}
            <Card elevated style={styles.amountCard}>
              <Typography variant="caption" color={theme.textMuted} weight="bold">
                PAYMENT DETAILS
              </Typography>
              <Typography variant="bodySm" color={theme.textSecondary} style={styles.instLabel}>
                Instalment #{instalment.instalmentNumber} of {instalment.totalInstalments}
              </Typography>
              <Typography variant="h1" color={theme.brandGreen} style={styles.amountText}>
                {formatNaira(amountDue)}
              </Typography>
              <Typography variant="caption" color={theme.textSecondary}>
                Due by {instalment.dueDate}
              </Typography>
            </Card>

            {/* Payment Method Selector */}
            <Typography variant="h3" style={styles.sectionHeading}>
              Select Payment Method
            </Typography>

            {/* Option 1: staple Wallet */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                paymentMethod === 'wallet' && styles.methodCardSelected,
                !canPayWithWallet && styles.methodCardDisabled,
              ]}
              onPress={() => canPayWithWallet && setPaymentMethod('wallet')}
              activeOpacity={0.8}
            >
              <View style={styles.methodLeft}>
                <Typography variant="h3">👛</Typography>
                <View>
                  <Typography variant="body" weight="bold">
                    staple Wallet Balance
                  </Typography>
                  <Typography
                    variant="caption"
                    color={canPayWithWallet ? theme.brandGreen : theme.colors.error.main}
                  >
                    Available: {formatNaira(walletBalance)} {canPayWithWallet ? '(Sufficient)' : '(Insufficient)'}
                  </Typography>
                </View>
              </View>
              <View style={[styles.radio, paymentMethod === 'wallet' && styles.radioActive]} />
            </TouchableOpacity>

            {/* Option 2: Paystack Gateway (Card / Bank Transfer) */}
            <TouchableOpacity
              style={[styles.methodCard, paymentMethod === 'card' && styles.methodCardSelected]}
              onPress={() => setPaymentMethod('card')}
              activeOpacity={0.8}
            >
              <View style={styles.methodLeft}>
                <Typography variant="h3">💳</Typography>
                <View>
                  <Typography variant="body" weight="bold">
                    Paystack Online Payment
                  </Typography>
                  <Typography variant="caption" color={theme.textSecondary}>
                    Debit Card, Bank Transfer, or USSD
                  </Typography>
                </View>
              </View>
              <View style={[styles.radio, paymentMethod === 'card' && styles.radioActive]} />
            </TouchableOpacity>

            {/* Option 3: Split Payment (Wallet + Card) */}
            {walletBalance > 0 && walletBalance < amountDue && (
              <TouchableOpacity
                style={[styles.methodCard, paymentMethod === 'split' && styles.methodCardSelected]}
                onPress={() => setPaymentMethod('split')}
                activeOpacity={0.8}
              >
                <View style={styles.methodLeft}>
                  <Typography variant="h3">⚡</Typography>
                  <View>
                    <Typography variant="body" weight="bold">
                      Split Payment (Wallet + Card)
                    </Typography>
                    <Typography variant="caption" color={theme.textSecondary}>
                      Use {formatNaira(walletDeduction)} from Wallet + {formatNaira(gatewayRemainder)} on Card
                    </Typography>
                  </View>
                </View>
                <View style={[styles.radio, paymentMethod === 'split' && styles.radioActive]} />
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                title={isProcessing ? 'Processing Payment...' : `Pay ${formatNaira(amountDue)}`}
                variant="primary"
                onPress={handleConfirmPayment}
                disabled={isProcessing}
                fullWidth
              />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={onClose}
                disabled={isProcessing}
                fullWidth
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.bg,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
  },
  scrollContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  planSub: {
    marginBottom: theme.spacing[3],
  },
  overdueAlert: {
    backgroundColor: theme.colors.warning[50],
    borderWidth: 1,
    borderColor: theme.colors.warning[300],
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing[3],
  },
  amountCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
    marginBottom: theme.spacing[4],
  },
  instLabel: {
    marginTop: theme.spacing[1],
  },
  amountText: {
    marginVertical: theme.spacing[1],
  },
  sectionHeading: {
    marginBottom: theme.spacing[3],
  },
  methodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing[3],
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginBottom: theme.spacing[3],
  },
  methodCardSelected: {
    borderColor: theme.brandGreen,
    backgroundColor: theme.colors.primary[50],
  },
  methodCardDisabled: {
    opacity: 0.6,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.borderSubtle,
  },
  radioActive: {
    borderColor: theme.brandGreen,
    backgroundColor: theme.brandGreen,
  },
  buttonContainer: {
    marginTop: theme.spacing[4],
    gap: theme.spacing[2],
  },
});
