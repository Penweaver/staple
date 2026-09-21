/**
 * STAPLE LIMITED — CheckoutScreen (Mobile)
 * Wallet-only checkout for MVP manual payment flow.
 * If wallet balance is insufficient, user is prompted to fund via bank transfer.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { theme } from '../theme/tokens';
import {
  Typography,
  Button,
  Card,
  Badge,
  Header,
} from '../components/index';
import { formatNaira } from '@staple/shared';

export interface CheckoutScreenProps {
  itemTitle: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  collectionHub: string;
  onBack: () => void;
  onFundWallet?: () => void;
  onPaymentSuccess: (orderData: {
    orderNumber: string;
    pickupCode: string;
    totalAmount: number;
    walletUsed: number;
    gatewayPaid: number;
  }) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  itemTitle,
  unit,
  unitPrice,
  quantity,
  collectionHub,
  onBack,
  onFundWallet,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sample user wallet balance
  const walletBalance = 15000; // ₦15,000 available in wallet
  const totalAmount = unitPrice * quantity;

  const hasEnoughBalance = walletBalance >= totalAmount;
  const shortfall = totalAmount - walletBalance;

  const handleConfirmOrder = () => {
    if (!hasEnoughBalance) {
      Alert.alert(
        'Insufficient Wallet Balance',
        `You need ${formatNaira(shortfall)} more. Please fund your wallet via bank transfer first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Wallet',
            onPress: () => onFundWallet?.(),
          },
        ],
      );
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const randOrder = `STP-ORD-${Date.now().toString().slice(-6)}`;
      const randCode = `STP-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;

      onPaymentSuccess({
        orderNumber: randOrder,
        pickupCode: randCode,
        totalAmount,
        walletUsed: totalAmount,
        gatewayPaid: 0,
      });
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Order Checkout"
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order Summary Card */}
        <Card style={styles.summaryCard}>
          <Typography variant="caption" color={theme.textMuted}>
            ITEM SUMMARY
          </Typography>
          <Typography variant="h3" style={{ marginTop: 2 }}>
            {itemTitle}
          </Typography>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Quantity</Text>
            <Text style={styles.specValue}>{quantity} {unit}{quantity > 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Effective Unit Price</Text>
            <Text style={styles.specValue}>{formatNaira(unitPrice)}</Text>
          </View>

          <View style={[styles.specRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatNaira(totalAmount)}</Text>
          </View>
        </Card>

        {/* Wallet Balance Card */}
        <Card style={[styles.walletCard, !hasEnoughBalance && styles.walletCardInsufficient]}>
          <View style={styles.walletHeader}>
            <View style={{ flex: 1 }}>
              <Typography variant="label" color={theme.textPrimary}>
                💳 STAPLE Wallet Balance
              </Typography>
              <Typography
                variant="h3"
                color={hasEnoughBalance ? theme.brandGreen : '#EF4444'}
                style={{ marginTop: 4 }}
              >
                {formatNaira(walletBalance)}
              </Typography>
            </View>

            {hasEnoughBalance ? (
              <Badge label="✓ Sufficient" variant="success" />
            ) : (
              <Badge label="Insufficient" variant="error" />
            )}
          </View>

          {hasEnoughBalance ? (
            <View style={styles.splitBreakdown}>
              <View style={styles.splitRow}>
                <Text style={styles.splitLabel}>Wallet Deduction:</Text>
                <Text style={styles.walletDeductValue}>- {formatNaira(totalAmount)}</Text>
              </View>
              <View style={styles.splitRow}>
                <Text style={styles.splitLabel}>Remaining after purchase:</Text>
                <Text style={styles.remainingValue}>{formatNaira(walletBalance - totalAmount)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.insufficientBox}>
              <Typography variant="bodySm" color="#991B1B" weight="bold">
                You need {formatNaira(shortfall)} more to complete this order.
              </Typography>
              <Typography variant="caption" color="#6B7280" style={{ marginTop: 4 }}>
                Transfer to the STAPLE bank account in your Wallet tab, send proof to Admin, and your balance will be credited.
              </Typography>
              <Button
                title="🏦  Go to Wallet to Fund"
                variant="outline"
                size="md"
                onPress={() => onFundWallet?.()}
                style={{ marginTop: 12 }}
              />
            </View>
          )}
        </Card>

        {/* Collection Hub Info */}
        <Card style={styles.hubCard}>
          <Text style={{ fontSize: 22, marginRight: 10 }}>📍</Text>
          <View style={{ flex: 1 }}>
            <Typography variant="label" color={theme.textPrimary}>
              Free Collection Hub Pickup
            </Typography>
            <Typography variant="caption" color={theme.textSecondary} style={{ marginTop: 2 }}>
              {collectionHub}
            </Typography>
          </View>
          <Badge label="Free" variant="success" />
        </Card>

        {/* Guarantee Info */}
        <View style={styles.guaranteeBox}>
          <Text style={styles.guaranteeText}>
            💡 <Text style={{ fontWeight: 'bold' }}>Dynamic Tier Rebate Guarantee:</Text> If your Group Buy reaches higher volume tiers before closing, the discounted difference will be automatically credited back to your STAPLE Wallet!
          </Text>
        </View>

        {/* Payment Button */}
        <Button
          title={
            isProcessing
              ? 'Processing Payment...'
              : hasEnoughBalance
              ? `Confirm & Pay ${formatNaira(totalAmount)} from Wallet`
              : `Fund Wallet to Continue (${formatNaira(shortfall)} needed)`
          }
          variant="primary"
          size="lg"
          loading={isProcessing}
          disabled={!hasEnoughBalance}
          onPress={handleConfirmOrder}
          style={{ marginTop: 12, marginBottom: 32 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    padding: 18,
    marginBottom: 16,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  specLabel: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.brandGreen,
  },
  walletCard: {
    padding: 18,
    marginBottom: 16,
    borderColor: theme.brandGreen,
    borderWidth: 1,
  },
  walletCardInsufficient: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitBreakdown: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    gap: 6,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  walletDeductValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.brandGreen,
  },
  remainingValue: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  insufficientBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FCA5A5',
  },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  guaranteeBox: {
    padding: 14,
    backgroundColor: theme.colors.surface.subtle,
    borderRadius: 8,
    marginBottom: 20,
  },
  guaranteeText: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
  },
});
