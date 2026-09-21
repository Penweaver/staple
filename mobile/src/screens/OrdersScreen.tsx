import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../theme/tokens';
import {
  Typography,
  Price,
  Card,
  Badge,
  Button,
  PickupPassModal,
  PickupPassData,
} from '../components/index';
import { OrderStatus, formatPickupCode } from '@staple/shared';

interface OrderItemModel {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  totalAmount: number;
  walletAmount: number;
  gatewayAmount: number;
  status: OrderStatus;
  collectionCode: string;
  collectionPoint: string;
  hubAddress: string;
  hubPhone: string;
  operatingHoursLabel: string;
  isOpenNow: boolean;
  date: string;
  isReady: boolean;
  isCollected: boolean;
  collectedAt?: string;
  collectedBy?: string;
}

const sampleOrders: OrderItemModel[] = [
  {
    id: 'ord-1',
    orderNumber: 'STP-ORD-20260921-884192',
    productName: 'Mama Gold Premium Parboiled Rice (50kg)',
    quantity: 2,
    unit: 'bags',
    totalAmount: 165750,
    walletAmount: 10000,
    gatewayAmount: 155750,
    status: OrderStatus.FULFILMENT_READY,
    collectionCode: 'STP-782-910',
    collectionPoint: 'staple Hub — Lekki Admiralty',
    hubAddress: '42 Admiralty Way, Lekki Phase 1, Lagos',
    hubPhone: '+2348012345678',
    operatingHoursLabel: 'Open today until 6:00 PM',
    isOpenNow: true,
    date: 'Sep 21, 2026',
    isReady: true,
    isCollected: false,
  },
  {
    id: 'ord-2',
    orderNumber: 'STP-ORD-20260918-482910',
    productName: 'Kings Pure Vegetable Cooking Oil (25 Litres)',
    quantity: 1,
    unit: 'keg',
    totalAmount: 48000,
    walletAmount: 0,
    gatewayAmount: 48000,
    status: OrderStatus.PAID,
    collectionCode: 'STP-419-332',
    collectionPoint: 'staple Hub — Ikeja GRA',
    hubAddress: '15 Isaac John Street, Ikeja GRA, Lagos',
    hubPhone: '+2348023456789',
    operatingHoursLabel: 'Opens at 8:00 AM',
    isOpenNow: true,
    date: 'Sep 18, 2026',
    isReady: false,
    isCollected: false,
  },
  {
    id: 'ord-3',
    orderNumber: 'STP-ORD-20260825-109283',
    productName: 'Ijebu Garri White (50kg Bag)',
    quantity: 1,
    unit: 'bag',
    totalAmount: 32000,
    walletAmount: 32000,
    gatewayAmount: 0,
    status: OrderStatus.COLLECTED,
    collectionCode: 'STP-331-904',
    collectionPoint: 'staple Hub — Lekki Admiralty',
    hubAddress: '42 Admiralty Way, Lekki Phase 1, Lagos',
    hubPhone: '+2348012345678',
    operatingHoursLabel: 'Closed on Sundays',
    isOpenNow: false,
    date: 'Aug 25, 2026',
    isReady: false,
    isCollected: true,
    collectedAt: 'Aug 26, 2026 at 3:15 PM',
    collectedBy: 'Babatunde (Customer)',
  },
];

export const OrdersScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pickups' | 'all'>('pickups');
  const [selectedPass, setSelectedPass] = useState<PickupPassData | null>(null);

  const displayedOrders =
    activeTab === 'pickups'
      ? sampleOrders.filter((o) => o.status !== OrderStatus.COLLECTED)
      : sampleOrders;

  const handleOpenPass = (order: OrderItemModel) => {
    setSelectedPass({
      orderNumber: order.orderNumber,
      pickupCode: formatPickupCode(order.collectionCode),
      productName: order.productName,
      quantity: order.quantity,
      unit: order.unit,
      totalAmount: order.totalAmount,
      hubName: order.collectionPoint,
      hubAddress: order.hubAddress,
      hubPhone: order.hubPhone,
      operatingHoursLabel: order.operatingHoursLabel,
      isOpenNow: order.isOpenNow,
      isCollected: order.isCollected,
      collectedAt: order.collectedAt,
      collectedBy: order.collectedBy,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Typography variant="h2" style={styles.title}>
          My Orders & Pickups
        </Typography>

        {/* Tab Toggle */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pickups' && styles.tabBtnActive]}
            onPress={() => setActiveTab('pickups')}
          >
            <Typography
              variant="bodySm"
              weight={activeTab === 'pickups' ? 'bold' : 'regular'}
              color={activeTab === 'pickups' ? theme.colors.primary[800] : theme.textSecondary}
            >
              Active Pickups ({sampleOrders.filter((o) => !o.isCollected).length})
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            onPress={() => setActiveTab('all')}
          >
            <Typography
              variant="bodySm"
              weight={activeTab === 'all' ? 'bold' : 'regular'}
              color={activeTab === 'all' ? theme.colors.primary[800] : theme.textSecondary}
            >
              Order History ({sampleOrders.length})
            </Typography>
          </TouchableOpacity>
        </View>

        {displayedOrders.map((order) => (
          <Card key={order.id} elevated style={styles.orderCard}>
            <View style={styles.orderTopRow}>
              <Typography variant="caption" color={theme.textMuted} weight="bold">
                {order.orderNumber}
              </Typography>
              <Badge
                status={
                  order.isCollected
                    ? 'Collected'
                    : order.isReady
                    ? 'Ready for Collection'
                    : 'Order Paid • Staging'
                }
                variant={
                  order.isCollected
                    ? 'neutral'
                    : order.isReady
                    ? 'success'
                    : 'warning'
                }
              />
            </View>

            <Typography variant="h3" style={styles.productName}>
              {order.productName}
            </Typography>

            <Typography variant="bodySm" color={theme.textSecondary}>
              Quantity: {order.quantity} {order.unit} • {order.date}
            </Typography>

            <View style={styles.totalRow}>
              <Typography variant="bodySm" color={theme.textMuted}>
                Total Paid
              </Typography>
              <Price amount={order.totalAmount} size="md" color={theme.brandGreen} />
            </View>

            {/* Split breakdown */}
            <Typography variant="caption" color={theme.textMuted} style={{ marginTop: 4 }}>
              Funded via: Wallet ₦{order.walletAmount.toLocaleString()} + Paystack ₦{order.gatewayAmount.toLocaleString()}
            </Typography>

            {/* Pickup Code Box */}
            <View style={styles.pickupBox}>
              <View>
                <Typography variant="caption" color={theme.textMuted} weight="bold">
                  PICKUP CODE (§29)
                </Typography>
                <Typography variant="h2" color="#14532D" weight="bold">
                  {formatPickupCode(order.collectionCode)}
                </Typography>
              </View>
              <View style={styles.pickupDetails}>
                <Typography variant="caption" color={theme.textSecondary} weight="bold">
                  📍 {order.collectionPoint}
                </Typography>
                <Typography variant="caption" color={order.isOpenNow ? '#15803D' : '#854D0E'}>
                  {order.isOpenNow ? '🟢 Open Now' : '🟡 Closed'}
                </Typography>
              </View>
            </View>

            {/* Digital Pass Button */}
            <Button
              title="View Digital Pickup Pass 🎟️"
              size="md"
              variant={order.isReady ? 'primary' : 'outline'}
              onPress={() => handleOpenPass(order)}
              style={{ marginTop: theme.spacing[3] }}
            />
          </Card>
        ))}
      </ScrollView>

      {/* Pickup Pass Modal */}
      <PickupPassModal
        visible={!!selectedPass}
        onClose={() => setSelectedPass(null)}
        pass={selectedPass}
      />
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
    marginBottom: theme.spacing[3],
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginBottom: theme.spacing[4],
  },
  tabBtn: {
    flex: 1,
    paddingVertical: theme.spacing[2],
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    backgroundColor: '#F0FDF4',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  pickupDetails: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
