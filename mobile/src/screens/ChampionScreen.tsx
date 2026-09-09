import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { theme } from '../theme/tokens.js';
import { Typography, Card, Badge, Button } from '../components/index.js';
import { BUSINESS_RULES, ChampionStatus } from '@staple/shared';

export const ChampionScreen: React.FC<{
  championStatus?: ChampionStatus;
  activeGroupBuysCount?: number;
  onCreateGroupBuy?: () => void;
}> = ({
  championStatus = ChampionStatus.ACTIVE,
  activeGroupBuysCount = 1,
  onCreateGroupBuy,
}) => {
  const maxActive = BUSINESS_RULES.MAX_CHAMPION_ACTIVE_GROUP_BUYS;
  const canCreate = championStatus === ChampionStatus.ACTIVE && activeGroupBuysCount < maxActive;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Typography variant="h2">Champion Portal</Typography>
          <Badge
            status={
              championStatus === ChampionStatus.ACTIVE
                ? 'Active Champion'
                : championStatus === ChampionStatus.SUSPENDED
                ? 'Suspended'
                : 'Not a Champion'
            }
            variant={championStatus === ChampionStatus.ACTIVE ? 'success' : 'warning'}
          />
        </View>

        <Typography variant="body" color={theme.textSecondary} style={styles.subtitle}>
          Organize collective demand in your area. Champions lead group buys and unlock wholesale value for their neighborhood.
        </Typography>

        {/* Active Capacity Card (§8) */}
        <Card elevated style={styles.card}>
          <Typography variant="caption" color={theme.textMuted} weight="bold">
            GROUP BUY CAPACITY
          </Typography>
          <View style={styles.capacityRow}>
            <Typography variant="h1" color={theme.brandGreen}>
              {activeGroupBuysCount} / {maxActive}
            </Typography>
            <Typography variant="bodySm" color={theme.textSecondary} style={styles.capacityText}>
              Active Group Buys currently running. Max {maxActive} allowed concurrently.
            </Typography>
          </View>
        </Card>

        {/* Champion Rules & Milestone Incentive Card (Addendum A3) */}
        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>
            How Champion Buys Work
          </Typography>

          <View style={styles.ruleItem}>
            <Typography variant="bodySm" weight="bold">
              1. Zero Commercial Manipulation
            </Typography>
            <Typography variant="caption" color={theme.textSecondary}>
              Products, pricing, and discount tiers are strictly configured by STAPLE. Champions choose the item and target quantity.
            </Typography>
          </View>

          <View style={styles.ruleItem}>
            <Typography variant="bodySm" weight="bold">
              2. Activation via Participant Order
            </Typography>
            <Typography variant="caption" color={theme.textSecondary}>
              To make your Group Buy LIVE, you make the first purchase (1–10 units). This is an actual product purchase, never an activation fee!
            </Typography>
          </View>

          <View style={styles.ruleItem}>
            <Typography variant="bodySm" weight="bold">
              3. Milestone Reward (₦{BUSINESS_RULES.CHAMPION_MILESTONE_REWARD_AMOUNT.toLocaleString()})
            </Typography>
            <Typography variant="caption" color={theme.textSecondary}>
              When your Group Buy reaches 100% of target, you receive a flat ₦{BUSINESS_RULES.CHAMPION_MILESTONE_REWARD_AMOUNT.toLocaleString()} reward credited directly to your STAPLE Wallet.
            </Typography>
          </View>
        </Card>

        {/* Action Button */}
        <Button
          title={
            canCreate
              ? 'Create New Group Buy'
              : activeGroupBuysCount >= maxActive
              ? 'Limit Reached (2 Active)'
              : 'Champion Status Inactive'
          }
          size="lg"
          disabled={!canCreate}
          onPress={onCreateGroupBuy}
        />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    marginBottom: theme.spacing[4],
    lineHeight: theme.typography.lineHeight.base,
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
    marginTop: theme.spacing[2],
  },
  capacityText: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: theme.spacing[3],
  },
  ruleItem: {
    marginBottom: theme.spacing[3],
  },
});
