/**
 * STAPLE LIMITED — OrderConfirmationScreen (Mobile)
 * Post-payment confirmation with pickup verification code and collection hub details
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '../theme/tokens.js';
import {
  Typography,
  Button,
  Card,
  Badge,
} from '../components/index.js';
import { formatNaira } from '@staple/shared';

export interface OrderConfirmationScreenProps {
  orderNumber: string;
  pickupCode: string;
  totalAmount: number;
  walletUsed: number;
  gatewayPaid: number;
  collectionHub: string;
  onViewOrders: () => void;
  onShare: () => void;
}

export const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({
  orderNumber,
  pickupCode,
  totalAmount,
  walletUsed,
  gatewayPaid,
  collectionHub,
  onViewOrders,
  onShare,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success Hero */}
      <View style={styles.heroBox}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
        <Typography variant="h2" style={{ textAlign: 'center', marginTop: 12 }}>
          Order Confirmed!
        </Typography>
        <Typography variant="body" color={theme.textSecondary} style={{ textAlign: 'center', marginTop: 4 }}>
          Your payment has been received and your units are reserved.
        </Typography>
      </View>

      {/* Pickup Verification Code Card */}
      <Card style={styles.pickupCodeCard}>
        <Typography variant="caption" color={theme.textMuted} style={{ textAlign: 'center' }}>
          COLLECTION VERIFICATION CODE
        </Typography>
        <Text style={styles.pickupCodeText}>{pickupCode}</Text>
        <Typography variant="caption" color={theme.textSecondary} style={{ textAlign: 'center' }}>
          Show this code to the Hub Manager when collecting your goods.
        </Typography>
      </Card>

      {/* Order Receipt Details */}
      <Card style={styles.detailsCard}>
        <Typography variant="h3" style={{ marginBottom: 12 }}>
          Payment Breakdown
        </Typography>

        <View style={styles.row}>
          <Text style={styles.label}>Order Number</Text>
          <Text style={styles.value}>{orderNumber}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Total Order Amount</Text>
          <Text style={styles.valueBold}>{formatNaira(totalAmount)}</Text>
        </View>

        {walletUsed > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Paid from STAPLE Wallet</Text>
            <Text style={styles.valueGreen}>{formatNaira(walletUsed)}</Text>
          </View>
        )}

        {gatewayPaid > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Paid via Paystack</Text>
            <Text style={styles.value}>{formatNaira(gatewayPaid)}</Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Badge label="PAID & CONFIRMED" variant="success" />
        </View>
      </Card>

      {/* Pickup Location Info */}
      <Card style={styles.hubCard}>
        <Text style={{ fontSize: 24, marginRight: 12 }}>📍</Text>
        <View style={{ flex: 1 }}>
          <Typography variant="label" color={theme.textPrimary}>
            Pickup Location
          </Typography>
          <Text style={styles.hubAddress}>{collectionHub}</Text>
        </View>
      </Card>

      {/* Action Buttons */}
      <Button
        title="📣 Share with Neighbors (Lower Your Price!)"
        variant="primary"
        size="lg"
        onPress={onShare}
        style={{ marginBottom: 12 }}
      />

      <Button
        title="View in Orders Tab"
        variant="outline"
        size="lg"
        onPress={onViewOrders}
        style={{ marginBottom: 32 }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 20,
    paddingTop: 36,
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  pickupCodeCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: theme.colors.surface.subtle,
    borderColor: theme.brandGreen,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  pickupCodeText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.brandGreen,
    letterSpacing: 2,
    marginVertical: 8,
  },
  detailsCard: {
    padding: 18,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  label: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  value: {
    fontSize: 13,
    color: theme.textPrimary,
  },
  valueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  valueGreen: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.brandGreen,
  },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 24,
  },
  hubAddress: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
});
