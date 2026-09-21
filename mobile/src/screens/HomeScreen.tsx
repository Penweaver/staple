import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { theme } from '../theme/tokens';
import {
  Typography,
  Price,
  Card,
  Badge,
  ProgressBar,
  Header,
  EmptyState,
} from '../components/index';
import { GroupBuyStatus } from '@staple/shared';

export interface GroupBuyItem {
  id: string;
  title: string;
  category: string;
  unitPrice: number;
  originalPrice: number;
  targetQuantity: number;
  paidQuantity: number;
  minFulfilmentQuantity: number;
  unit: string;
  status: GroupBuyStatus;
  daysRemaining: number;
  areaName: string;
  championName?: string;
}

export const HomeScreen: React.FC<{
  onSelectGroupBuy?: (id: string) => void;
  onOpenChampion?: () => void;
  onOpenFestive?: () => void;
  onOpenNotifications?: () => void;
  onOpenSupport?: () => void;
}> = ({
  onSelectGroupBuy,
  onOpenChampion,
  onOpenFestive,
  onOpenNotifications,
  onOpenSupport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sample seed group buys for discovery preview
  const sampleGroupBuys: GroupBuyItem[] = [
    {
      id: 'gb-1',
      title: 'Mama Gold Premium Parboiled Rice (50kg)',
      category: 'Grains & Flours',
      unitPrice: 82875, // 2.5% discount tier reached
      originalPrice: 85000,
      targetQuantity: 100,
      paidQuantity: 58,
      minFulfilmentQuantity: 20,
      unit: 'bag',
      status: GroupBuyStatus.LIVE,
      daysRemaining: 9,
      areaName: 'Lekki Phase 1',
      championName: 'Dele A.',
    },
    {
      id: 'gb-2',
      title: 'Kings Pure Vegetable Cooking Oil (25 Litres)',
      category: 'Oils & Condiments',
      unitPrice: 48000,
      originalPrice: 48000,
      targetQuantity: 50,
      paidQuantity: 18,
      minFulfilmentQuantity: 15,
      unit: 'keg',
      status: GroupBuyStatus.LIVE,
      daysRemaining: 12,
      areaName: 'Lekki Phase 1',
    },
    {
      id: 'gb-3',
      title: 'Family Monthly Essentials Basket',
      category: 'Curated Baskets',
      unitPrice: 165000,
      originalPrice: 165000,
      targetQuantity: 20,
      paidQuantity: 8,
      minFulfilmentQuantity: 8,
      unit: 'basket',
      status: GroupBuyStatus.LIVE,
      daysRemaining: 6,
      areaName: 'Lekki Phase 1',
      championName: 'Grace O.',
    },
  ];

  const categories = [
    { id: 'all', name: 'All Buys' },
    { id: 'Grains & Flours', name: 'Grains & Rice' },
    { id: 'Oils & Condiments', name: 'Cooking Oils' },
    { id: 'Curated Baskets', name: 'Baskets' },
  ];

  const filteredDeals =
    selectedCategory === 'all'
      ? sampleGroupBuys
      : sampleGroupBuys.filter((item) => item.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <Header locationName="Lekki Phase 1, Lagos" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Utility Bar: Notifications & Support */}
        <View style={styles.topUtilityBar}>
          <TouchableOpacity
            style={styles.utilityBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
          >
            <Typography variant="bodySm">🔔 Notifications</Typography>
            <View style={styles.utilityBadge}>
              <Typography variant="caption" color={theme.colors.neutral[0]} weight="bold" style={{ fontSize: 10 }}>
                2
              </Typography>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.utilityBtn}
            onPress={onOpenSupport}
            activeOpacity={0.8}
          >
            <Typography variant="bodySm">🎧 Help & Support</Typography>
          </TouchableOpacity>
        </View>

        {/* Value Proposition Hero Banner */}
        <Card style={styles.heroCard}>
          <Typography variant="caption" color={theme.colors.secondary[700]} weight="bold">
            COLLECTIVE PURCHASING
          </Typography>
          <Typography variant="h2" style={styles.heroTitle}>
            Buy together. Unlock bulk prices.
          </Typography>
          <Typography variant="bodySm" color={theme.textSecondary}>
            Join neighbors in Lekki Phase 1 to pool orders on everyday essentials.
          </Typography>
        </Card>

        {/* Festive & Owambe Planning Quick Banner */}
        <TouchableOpacity activeOpacity={0.85} onPress={onOpenFestive} style={styles.festiveBannerContainer}>
          <Card style={styles.festiveBannerCard}>
            <View style={styles.festiveBannerRow}>
              <View style={{ flex: 1 }}>
                <Typography variant="caption" color={theme.brandGreen} weight="bold">
                  👑 OWAMBE & FESTIVE SAVINGS
                </Typography>
                <Typography variant="h3" style={{ color: theme.colors.primary[900], marginVertical: 2 }}>
                  Plan Parties 42–100 Days Ahead
                </Typography>
                <Typography variant="caption" color={theme.textSecondary}>
                  Lock wholesale rice & oil prices with flexible instalments.
                </Typography>
              </View>
              <Typography variant="h1">🎉</Typography>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Typography
                  variant="bodySm"
                  weight={isSelected ? 'bold' : 'medium'}
                  color={isSelected ? theme.colors.neutral[0] : theme.textSecondary}
                >
                  {cat.name}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Group Buys Feed */}
        <View style={styles.sectionHeader}>
          <Typography variant="h3">Nearby Group Buys</Typography>
          <Typography variant="caption" color={theme.textSecondary}>
            {filteredDeals.length} active
          </Typography>
        </View>

        {filteredDeals.length === 0 ? (
          <EmptyState
            title="No Group Buys Found"
            description="There are currently no active group buys in this category near your location."
            actionTitle="Broaden Area"
            onAction={() => setSelectedCategory('all')}
          />
        ) : (
          filteredDeals.map((gb) => (
            <TouchableOpacity
              key={gb.id}
              activeOpacity={0.9}
              onPress={() => onSelectGroupBuy?.(gb.id)}
            >
              <Card elevated style={styles.dealCard}>
                <View style={styles.cardTopRow}>
                  <Badge status={gb.status} />
                  <Typography variant="caption" color={theme.textSecondary}>
                    ⏳ {gb.daysRemaining} days left
                  </Typography>
                </View>

                <Typography variant="h3" style={styles.dealTitle}>
                  {gb.title}
                </Typography>

                {gb.championName && (
                  <Typography variant="caption" color={theme.colors.secondary[700]}>
                    Organized by Champion: {gb.championName}
                  </Typography>
                )}

                <View style={styles.pricingRow}>
                  <View>
                    <Price
                      amount={gb.unitPrice}
                      size="lg"
                      color={theme.brandGreen}
                      unit={gb.unit}
                    />
                    {gb.unitPrice < gb.originalPrice && (
                      <Typography
                        variant="caption"
                        color={theme.textMuted}
                        style={styles.strikethrough}
                      >
                        ₦{gb.originalPrice.toLocaleString()}
                      </Typography>
                    )}
                  </View>

                  <View style={styles.locationTag}>
                    <Typography variant="caption" color={theme.textSecondary}>
                      📍 {gb.areaName}
                    </Typography>
                  </View>
                </View>

                {/* Progress Bar with MVFQ marker */}
                <ProgressBar
                  paidQuantity={gb.paidQuantity}
                  targetQuantity={gb.targetQuantity}
                  minFulfilmentQuantity={gb.minFulfilmentQuantity}
                  unit={gb.unit}
                />
              </Card>
            </TouchableOpacity>
          ))
        )}
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
    paddingBottom: theme.spacing[12],
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[3],
  },
  utilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  utilityBadge: {
    backgroundColor: theme.colors.error.main,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.borderRadius.full,
  },
  heroCard: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
    marginBottom: theme.spacing[4],
  },
  heroTitle: {
    color: theme.colors.primary[900],
    marginVertical: theme.spacing[1],
  },
  festiveBannerContainer: {
    marginBottom: theme.spacing[4],
  },
  festiveBannerCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  festiveBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing[4],
  },
  categoryPill: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginRight: theme.spacing[2],
  },
  categoryPillActive: {
    backgroundColor: theme.brandGreen,
    borderColor: theme.brandGreen,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  dealCard: {
    marginBottom: theme.spacing[4],
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  dealTitle: {
    marginBottom: theme.spacing[1],
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[1],
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  locationTag: {
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.sm,
  },
});
