import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { theme } from '../theme/tokens.js';
import { Typography, Price, Card, Badge } from '../components/index.js';
import { OrderStatus } from '@staple/shared';

export const OrdersScreen: React.FC = () => {
  const sampleOrders = [
    {
      id: 'ord-1',
      orderNumber: 'STP-ORD-20260908-482910',
      productName: 'Mama Gold Premium Parboiled Rice (50kg)',
      quantity: 2,
      totalAmount: 165750,
      walletAmount: 10000,
      gatewayAmount: 155750,
      status: OrderStatus.PAID,
      collectionCode: 'STP-7821',
      collectionPoint: 'staple Hub — Lekki Admiralty',
      date: 'Sep 08, 2026',
    },
    {
      id: 'ord-2',
      orderNumber: 'STP-ORD-20260825-109283',
      productName: 'Kings Pure Vegetable Cooking Oil (25 Litres)',
      quantity: 1,
      totalAmount: 48000,
      walletAmount: 0,
      gatewayAmount: 48000,
      status: OrderStatus.COLLECTED,
      collectionCode: 'STP-3319',
      collectionPoint: 'staple Hub — Lekki Admiralty',
      date: 'Aug 25, 2026',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Typography variant="h2" style={styles.title}>
          My Orders
        </Typography>

        {sampleOrders.map((order) => (
          <Card key={order.id} elevated style={styles.orderCard}>
            <View style={styles.orderTopRow}>
              <Typography variant="caption" color={theme.textMuted} weight="bold">
                {order.orderNumber}
              </Typography>
              <Badge status={order.status} />
            </View>

            <Typography variant="h3" style={styles.productName}>
              {order.productName}
            </Typography>

            <Typography variant="bodySm" color={theme.textSecondary}>
              Quantity: {order.quantity} • {order.date}
            </Typography>

            <View style={styles.totalRow}>
              <Typography variant="bodySm" color={theme.textMuted}>
                Total Paid
              </Typography>
              <Price amount={order.totalAmount} size="md" color={theme.brandGreen} />
            </View>

            {/* Split breakdown */}
            <Typography variant="caption" color={theme.textMuted}>
              Funded via: Wallet ₦{order.walletAmount.toLocaleString()} + Paystack ₦{order.gatewayAmount.toLocaleString()}
            </Typography>

            {/* Pickup Code Box */}
            <View style={styles.pickupBox}>
              <View>
                <Typography variant="caption" color={theme.textMuted}>
                  PICKUP CODE
                </Typography>
                <Typography variant="h3" color={theme.brandGreen} weight="bold">
                  {order.collectionCode}
                </Typography>
              </View>
              <View style={styles.pickupDetails}>
                <Typography variant="caption" color={theme.textSecondary}>
                  📍 {order.collectionPoint}
                </Typography>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: theme.spacing[4],
  },
  title: {
    marginBottom: theme.spacing[4],
  },
  orderCard: {
    marginBottom: theme.spacing[4],
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  productName: {
    marginBottom: theme.spacing[1],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing[2],
    paddingTop: theme.spacing[2],
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
  },
  pickupBox: {
    marginTop: theme.spacing[3],
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  pickupDetails: {
    flex: 1,
    marginLeft: theme.spacing[3],
  },
});
