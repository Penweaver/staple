/**
 * STAPLE LIMITED — CheckoutScreen (Mobile)
 * Order checkout with split payment allocation (STAPLE Wallet + Paystack) (Spec §23)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
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
import { formatNaira, calculateSplitPayment } from '@staple/shared';

export interface CheckoutScreenProps {
  itemTitle: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  collectionHub: string;
  onBack: () => void;
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
  onPaymentSuccess,
}) => {
  const [useWallet, setUseWallet] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sample user wallet balance
  const walletBalance = 15000; // ₦15,000 available in wallet
  const totalAmount = unitPrice * quantity;

  const split = calculateSplitPayment({
    totalAmount,
    walletBalance,
    useWallet,
  });

  const handleConfirmOrder = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const randOrder = `STP-ORD-${Date.now().toString().slice(-6)}`;
      const randCode = `STP-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;

      onPaymentSuccess({
        orderNumber: randOrder,
        pickupCode: randCode,
        totalAmount,
        walletUsed: split.walletAmount,
        gatewayPaid: split.gatewayAmount,
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

        {/* Split Funding / Wallet Selector Card (§23) */}
        <Card style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={{ flex: 1 }}>
              <Typography variant="label" color={theme.textPrimary}>
                Apply STAPLE Wallet Balance
              </Typography>
              <Typography variant="caption" color={theme.brandGreen} style={{ marginTop: 2 }}>
                Available credit: {formatNaira(walletBalance)}
              </Typography>
            </View>

            <Switch
              value={useWallet}
              onValueChange={setUseWallet}
              trackColor={{ false: theme.colors.neutral[300], true: theme.brandGreen }}
            />
          </View>

          {useWallet && split.walletAmount > 0 && (
            <View style={styles.splitBreakdown}>
              <View style={styles.splitRow}>
                <Text style={styles.splitLabel}>Wallet Deduction:</Text>
                <Text style={styles.walletDeductValue}>- {formatNaira(split.walletAmount)}</Text>
              </View>

              <View style={styles.splitRow}>
                <Text style={styles.splitLabel}>Remaining Gateway Balance:</Text>
                <Text style={styles.gatewayDueValue}>{formatNaira(split.gatewayAmount)}</Text>
              </View>
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
              : split.isFullyFundedByWallet
              ? `Confirm & Pay ${formatNaira(totalAmount)} from Wallet`
              : `Pay with Paystack (${formatNaira(split.gatewayAmount)})`
          }
          variant="primary"
          size="lg"
          loading={isProcessing}
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
  gatewayDueValue: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textPrimary,
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
