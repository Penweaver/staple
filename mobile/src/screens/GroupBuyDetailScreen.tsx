import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { theme } from '../theme/tokens.js';
import {
  Typography,
  Price,
  Card,
  Badge,
  ProgressBar,
  Button,
} from '../components/index.js';
import { GroupBuyStatus, BUSINESS_RULES } from '@staple/shared';

export const GroupBuyDetailScreen: React.FC<{
  groupBuyId?: string;
  onBack?: () => void;
  onProceedToCheckout?: (quantity: number) => void;
}> = ({ onBack, onProceedToCheckout }) => {
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Mock group buy model matching schema
  const groupBuy = {
    id: 'gb-1',
    title: 'Mama Gold Premium Parboiled Rice (50kg)',
    description:
      'Stone-free, high-grade long grain parboiled Nigerian rice. Sourced in bulk directly from millers in Kebbi to unlock direct wholesale savings.',
    unitPrice: 82875, // 2.5% discount tier reached
    originalPrice: 85000,
    targetQuantity: 100,
    paidQuantity: 58,
    minFulfilmentQuantity: 20, // MVFQ
    unit: 'bag',
    status: GroupBuyStatus.LIVE,
    daysRemaining: 9,
    areaName: 'Lekki Phase 1',
    collectionPoint: 'staple Hub — Lekki Admiralty (42 Admiralty Way)',
    tiers: [
      { minPct: 0, maxPct: 49, discount: '0%', price: 85000, active: false },
      { minPct: 50, maxPct: 74, discount: '2.5%', price: 82875, active: true },
      { minPct: 75, maxPct: 100, discount: '5.0%', price: 80750, active: false },
    ],
  };

  const handleIncrement = () => {
    if (selectedQuantity < BUSINESS_RULES.MAX_UNITS_PER_USER_PER_GROUP_BUY) {
      setSelectedQuantity((prev) => prev + 1);
    } else {
      Alert.alert(
        'Purchase Limit Reached',
        `Maximum ${BUSINESS_RULES.MAX_UNITS_PER_USER_PER_GROUP_BUY} units allowed per user per Group Buy.`
      );
    }
  };

  const handleDecrement = () => {
    if (selectedQuantity > 1) {
      setSelectedQuantity((prev) => prev - 1);
    }
  };

  const subtotal = groupBuy.unitPrice * selectedQuantity;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Typography variant="body" weight="bold">
            ← Back
          </Typography>
        </TouchableOpacity>
        <Badge status={groupBuy.status} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Typography variant="caption" color={theme.colors.secondary[700]} weight="bold">
          LIVE GROUP BUY • ⏳ {groupBuy.daysRemaining} DAYS REMAINING
        </Typography>

        <Typography variant="h2" style={styles.title}>
          {groupBuy.title}
        </Typography>

        <Typography variant="body" color={theme.textSecondary} style={styles.description}>
          {groupBuy.description}
        </Typography>

        {/* Pricing & Progress Card */}
        <Card elevated style={styles.sectionCard}>
          <View style={styles.priceRow}>
            <View>
              <Typography variant="caption" color={theme.textMuted}>
                CURRENT UNIT PRICE
              </Typography>
              <Price amount={groupBuy.unitPrice} size="xl" color={theme.brandGreen} unit={groupBuy.unit} />
              {groupBuy.unitPrice < groupBuy.originalPrice && (
                <Typography variant="caption" color={theme.textMuted} style={styles.strikethrough}>
                  Original price: ₦{groupBuy.originalPrice.toLocaleString()}
                </Typography>
              )}
            </View>

            <View style={styles.savingsBadge}>
              <Typography variant="caption" weight="bold" color={theme.colors.success.dark}>
                Save ₦{(groupBuy.originalPrice - groupBuy.unitPrice).toLocaleString()}
              </Typography>
            </View>
          </View>

          {/* Target Progress Bar with MVFQ marker */}
          <ProgressBar
            paidQuantity={groupBuy.paidQuantity}
            targetQuantity={groupBuy.targetQuantity}
            minFulfilmentQuantity={groupBuy.minFulfilmentQuantity}
            unit={groupBuy.unit}
          />
        </Card>

        {/* Dynamic Pricing Tiers Table (§20) */}
        <Card style={styles.sectionCard}>
          <Typography variant="h3" style={styles.cardHeader}>
            Group Pricing Milestones
          </Typography>
          <Typography variant="caption" color={theme.textSecondary} style={styles.tierExplanation}>
            When the group reaches higher participation tiers, the new discount applies to everyone. Prior buyers automatically receive the difference as STAPLE Wallet credit!
          </Typography>

          <View style={styles.tiersList}>
            {groupBuy.tiers.map((t, idx) => (
              <View
                key={idx}
                style={[
                  styles.tierRow,
                  t.active ? styles.tierRowActive : null,
                ]}
              >
                <View>
                  <Typography variant="bodySm" weight={t.active ? 'bold' : 'medium'}>
                    {t.minPct}%–{t.maxPct}% Target ({t.discount} OFF)
                  </Typography>
                  <Typography variant="caption" color={t.active ? theme.brandGreen : theme.textMuted}>
                    {t.active ? '● Current Active Tier' : 'Upcoming Tier'}
                  </Typography>
                </View>
                <Typography variant="body" weight="bold" color={t.active ? theme.brandGreen : theme.textPrimary}>
                  ₦{t.price.toLocaleString()}
                </Typography>
              </View>
            ))}
          </View>
        </Card>

        {/* Collection Information */}
        <Card style={styles.sectionCard}>
          <Typography variant="h3" style={styles.cardHeader}>
            Collection Point
          </Typography>
          <Typography variant="bodySm" color={theme.textPrimary}>
            {groupBuy.collectionPoint}
          </Typography>
          <Typography variant="caption" color={theme.textSecondary} style={styles.collectionNote}>
            All members of this Group Buy collect their orders from this central pickup point once the buy is fulfilled.
          </Typography>
        </Card>
      </ScrollView>

      {/* Sticky Bottom Order Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityPicker}>
          <TouchableOpacity
            style={[styles.qtyButton, selectedQuantity <= 1 && styles.qtyButtonDisabled]}
            onPress={handleDecrement}
            disabled={selectedQuantity <= 1}
          >
            <Typography variant="h3">−</Typography>
          </TouchableOpacity>

          <View style={styles.qtyDisplay}>
            <Typography variant="h3" weight="bold">
              {selectedQuantity}
            </Typography>
            <Typography variant="caption" color={theme.textMuted}>
              {groupBuy.unit}
            </Typography>
          </View>

          <TouchableOpacity
            style={[
              styles.qtyButton,
              selectedQuantity >= BUSINESS_RULES.MAX_UNITS_PER_USER_PER_GROUP_BUY && styles.qtyButtonDisabled,
            ]}
            onPress={handleIncrement}
            disabled={selectedQuantity >= BUSINESS_RULES.MAX_UNITS_PER_USER_PER_GROUP_BUY}
          >
            <Typography variant="h3">+</Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.actionContainer}>
          <Button
            title={`Join Buy • ₦${subtotal.toLocaleString()}`}
            size="lg"
            onPress={() => onProceedToCheckout?.(selectedQuantity)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  navBar: {
    height: 50,
    paddingHorizontal: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    backgroundColor: theme.colors.surface.card,
  },
  backButton: {
    paddingVertical: theme.spacing[1],
  },
  content: {
    padding: theme.spacing[4],
    paddingBottom: 120,
  },
  title: {
    marginVertical: theme.spacing[2],
  },
  description: {
    marginBottom: theme.spacing[4],
    lineHeight: theme.typography.lineHeight.base,
  },
  sectionCard: {
    marginBottom: theme.spacing[4],
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    backgroundColor: theme.colors.success.light,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
  },
  cardHeader: {
    marginBottom: theme.spacing[2],
  },
  tierExplanation: {
    marginBottom: theme.spacing[3],
    lineHeight: theme.typography.lineHeight.sm,
  },
  tiersList: {
    gap: theme.spacing[2],
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface.background,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  tierRowActive: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.brandGreen,
  },
  collectionNote: {
    marginTop: theme.spacing[1],
    color: theme.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface.card,
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[6],
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  quantityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[1],
  },
  qtyButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.md,
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyDisplay: {
    paddingHorizontal: theme.spacing[3],
    alignItems: 'center',
  },
  actionContainer: {
    flex: 1,
  },
});
