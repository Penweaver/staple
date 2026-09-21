import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '../theme/tokens';
import {
  Typography,
  Card,
  Badge,
  Button,
  ProgressBar,
  ChampionApplicationModal,
} from '../components/index';
import {
  BUSINESS_RULES,
  ChampionStatus,
  formatNaira,
  canChampionCreateGroupBuy,
  calculateChampionTier,
  generateChampionBroadcastMessage,
  ChampionApplicationInput,
} from '@staple/shared';
import { useSystemConfig } from '../services/config';

export interface ChampionScreenProps {
  championStatus?: ChampionStatus;
  activeGroupBuysCount?: number;
  milestoneRewardAmount?: number;
  onCreateGroupBuy?: () => void;
  onContactSupport?: () => void;
}

export const ChampionScreen: React.FC<ChampionScreenProps> = ({
  championStatus: initialStatus = ChampionStatus.ACTIVE,
  activeGroupBuysCount = 1,
  milestoneRewardAmount,
  onCreateGroupBuy,
  onContactSupport,
}) => {
  const [currentStatus, setCurrentStatus] = useState<ChampionStatus>(initialStatus);
  const [hasPendingApplication, setHasPendingApplication] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [isSubmittingApp, setIsSubmittingApp] = useState<boolean>(false);
  const [broadcastDialect, setBroadcastDialect] = useState<'standard' | 'pidgin'>('standard');

  // Dynamically query champion_milestone_reward_amount from system_config (Addendum A3)
  const { value: dynamicReward } = useSystemConfig<number>(
    'champion_milestone_reward_amount',
    BUSINESS_RULES.CHAMPION_MILESTONE_REWARD_AMOUNT,
  );
  const rewardAmount = milestoneRewardAmount ?? dynamicReward;

  const maxActive = BUSINESS_RULES.MAX_CHAMPION_ACTIVE_GROUP_BUYS;
  const capacityCheck = canChampionCreateGroupBuy(currentStatus, activeGroupBuysCount, maxActive);
  const canCreate = capacityCheck.allowed;

  // Mock performance data for active champion
  const totalCompletedBuys = 6;
  const totalGmv = 2_850_000;
  const milestoneRewardsEarned = 12_000; // 6 * 2000
  const tierInfo = calculateChampionTier(totalCompletedBuys, totalGmv);

  const sampleGroupBuy = {
    title: 'Mama Gold Premium Parboiled Rice (50kg)',
    unitPrice: 82875,
    targetQuantity: 50,
    paidQuantity: 38,
    areaName: 'Lekki Phase 1',
    shareUrl: 'https://staple.ng/gb/mama-gold-rice-50kg-lekki',
    championName: 'Dele A.',
  };

  const broadcastMessage = generateChampionBroadcastMessage({
    groupBuyTitle: sampleGroupBuy.title,
    unitPrice: sampleGroupBuy.unitPrice,
    targetQuantity: sampleGroupBuy.targetQuantity,
    currentPaidQuantity: sampleGroupBuy.paidQuantity,
    areaName: sampleGroupBuy.areaName,
    shareUrl: sampleGroupBuy.shareUrl,
    championName: sampleGroupBuy.championName,
    dialect: broadcastDialect,
  });

  const handleApplicationSubmit = (input: ChampionApplicationInput) => {
    setIsSubmittingApp(true);
    setTimeout(() => {
      setIsSubmittingApp(false);
      setShowApplyModal(false);
      setHasPendingApplication(true);
      Alert.alert(
        'Application Submitted! 🎉',
        `Thank you ${input.full_name}. We received your application to become the STAPLE Champion for ${input.neighborhood}, ${input.lga}. Our neighborhood team will review it within 24–48 hours.`,
      );
    }, 600);
  };

  const handleCopyBroadcast = () => {
    Alert.alert(
      'Broadcast Message Copied! 📲',
      'The WhatsApp message has been prepared for your neighborhood or estate group.',
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Typography variant="h2">Champion Portal</Typography>
          <Badge
            status={
              currentStatus === ChampionStatus.ACTIVE
                ? `${tierInfo.badge} Active Champion`
                : currentStatus === ChampionStatus.SUSPENDED
                ? 'Suspended'
                : hasPendingApplication
                ? 'Review Pending'
                : 'Community Organizer'
            }
            variant={
              currentStatus === ChampionStatus.ACTIVE
                ? 'success'
                : currentStatus === ChampionStatus.SUSPENDED
                ? 'error'
                : 'warning'
            }
          />
        </View>

        <Typography variant="body" color={theme.textSecondary} style={styles.subtitle}>
          Organize collective food purchasing for your neighborhood. Unlock wholesale farm prices with zero commercial risk.
        </Typography>

        {/* ============================================================ */}
        {/* STATE A: INACTIVE / NOT A CHAMPION YET */}
        {/* ============================================================ */}
        {currentStatus === ChampionStatus.INACTIVE && !hasPendingApplication && (
          <View>
            <Card elevated style={styles.promoCard}>
              <Typography variant="h2" color="#166534" style={styles.promoTitle}>
                Become a STAPLE Champion 🌟
              </Typography>
              <Typography variant="bodySm" color={theme.textSecondary} style={styles.promoDesc}>
                Help your estate, church, mosque, or neighborhood beat food inflation. Organize bulk purchases for staple foodstuff like Rice, Beans, Garri, and Oil.
              </Typography>

              <View style={styles.perksGrid}>
                <View style={styles.perkItem}>
                  <Typography variant="bodySm" weight="bold" color="#14532D">
                    💰 ₦{rewardAmount.toLocaleString()} Cash Milestone
                  </Typography>
                  <Typography variant="caption" color={theme.textSecondary}>
                    Credited to your STAPLE Wallet on every Group Buy that hits target.
                  </Typography>
                </View>

                <View style={styles.perkItem}>
                  <Typography variant="bodySm" weight="bold" color="#14532D">
                    🛡️ Zero Commercial Risk
                  </Typography>
                  <Typography variant="caption" color={theme.textSecondary}>
                    You never buy stock upfront. You only purchase your own household quota.
                  </Typography>
                </View>

                <View style={styles.perkItem}>
                  <Typography variant="bodySm" weight="bold" color="#14532D">
                    🚚 Free Hub Delivery
                  </Typography>
                  <Typography variant="caption" color={theme.textSecondary}>
                    Goods arrive sorted at your nearest verified staple collection hub.
                  </Typography>
                </View>
              </View>

              <Button
                title="Apply to Become a Champion"
                size="lg"
                onPress={() => setShowApplyModal(true)}
                style={styles.actionBtn}
              />
            </Card>
          </View>
        )}

        {/* ============================================================ */}
        {/* STATE B: APPLICATION UNDER REVIEW */}
        {/* ============================================================ */}
        {hasPendingApplication && currentStatus === ChampionStatus.INACTIVE && (
          <Card elevated style={styles.pendingCard}>
            <View style={styles.pendingHeader}>
              <Typography variant="h3" color="#854D0E">
                ⏳ Application Under Review
              </Typography>
              <Badge status="24–48h SLA" variant="warning" />
            </View>
            <Typography variant="bodySm" color="#713F12" style={{ marginTop: 6, lineHeight: 20 }}>
              Your application to coordinate group buys in your neighborhood is currently being verified by our local operations team. We will send you an SMS confirmation once approved!
            </Typography>
            <View style={styles.pendingFooter}>
              <Typography variant="caption" color="#A16207">
                Applied on: Today • Expected verification within 48 hours
              </Typography>
            </View>
          </Card>
        )}

        {/* ============================================================ */}
        {/* STATE C: SUSPENDED NOTICE */}
        {/* ============================================================ */}
        {currentStatus === ChampionStatus.SUSPENDED && (
          <Card elevated style={styles.suspendedCard}>
            <Typography variant="h3" color="#991B1B">
              ⚠️ Champion Account Suspended
            </Typography>
            <Typography variant="bodySm" color="#7F1D1D" style={{ marginTop: 8 }}>
              Your Champion privileges have been temporarily paused. Ongoing group buys created before suspension will continue to natural fulfilment, but you cannot launch new buys.
            </Typography>
            <Button
              title="Contact STAPLE Support"
              variant="outline"
              size="sm"
              onPress={onContactSupport || (() => Alert.alert('Support', 'Please email support@staple.ng'))}
              style={{ marginTop: 12 }}
            />
          </Card>
        )}

        {/* ============================================================ */}
        {/* STATE D: ACTIVE CHAMPION DASHBOARD */}
        {/* ============================================================ */}
        {currentStatus === ChampionStatus.ACTIVE && (
          <View>
            {/* Active Capacity Dial Card (§8) */}
            <Card elevated style={styles.card}>
              <View style={styles.capacityHeader}>
                <Typography variant="caption" color={theme.textMuted} weight="bold">
                  ACTIVE GROUP BUY CAPACITY (§8)
                </Typography>
                <Badge
                  status={canCreate ? 'Capacity Available' : 'Limit Reached'}
                  variant={canCreate ? 'success' : 'error'}
                />
              </View>

              <View style={styles.capacityRow}>
                <Typography variant="h1" color={canCreate ? theme.brandGreen : theme.colors.error.main}>
                  {activeGroupBuysCount} / {maxActive}
                </Typography>
                <View style={{ flex: 1 }}>
                  <Typography variant="bodySm" weight="bold">
                    {canCreate ? 'You can launch 1 more buy' : 'Max 2 active buys running'}
                  </Typography>
                  <Typography variant="caption" color={theme.textSecondary}>
                    STAPLE caps Champions at {maxActive} concurrent active buys to protect fulfilment reliability.
                  </Typography>
                </View>
              </View>

              <Button
                title={canCreate ? '＋ Launch New Group Buy' : 'Active Limit Reached (2/2)'}
                size="md"
                disabled={!canCreate}
                onPress={onCreateGroupBuy}
                style={{ marginTop: theme.spacing[3] }}
              />
            </Card>

            {/* Performance KPIs Grid */}
            <View style={styles.kpiGrid}>
              <Card style={styles.kpiCard}>
                <Typography variant="caption" color={theme.textMuted}>
                  TOTAL GMV MOBILIZED
                </Typography>
                <Typography variant="h2" color={theme.brandGreen} style={styles.kpiValue}>
                  {formatNaira(totalGmv)}
                </Typography>
                <Typography variant="caption" color={theme.textSecondary}>
                  Wholesale food unlocked
                </Typography>
              </Card>

              <Card style={styles.kpiCard}>
                <Typography variant="caption" color={theme.textMuted}>
                  MILESTONES EARNED (A3)
                </Typography>
                <Typography variant="h2" color="#D97706" style={styles.kpiValue}>
                  {formatNaira(milestoneRewardsEarned)}
                </Typography>
                <Typography variant="caption" color={theme.textSecondary}>
                  {totalCompletedBuys} × ₦{rewardAmount.toLocaleString()} in wallet
                </Typography>
              </Card>
            </View>

            {/* Champion Tier Badge Card */}
            <Card style={styles.card}>
              <View style={styles.tierHeader}>
                <Typography variant="h3">
                  {tierInfo.badge} {tierInfo.tierName}
                </Typography>
                <Badge status={`Rank ${tierInfo.rank}`} variant="info" />
              </View>
              <Typography variant="bodySm" color={theme.textSecondary} style={{ marginTop: 4 }}>
                {tierInfo.nextTierRequirement || 'Highest Champion tier achieved!'}
              </Typography>
            </Card>

            {/* Active Group Buys Roster */}
            <Card style={styles.card}>
              <Typography variant="h3" style={{ marginBottom: theme.spacing[2] }}>
                My Running Group Buys
              </Typography>

              <View style={styles.buyItem}>
                <View style={styles.buyItemHeader}>
                  <Typography variant="bodySm" weight="bold" style={{ flex: 1 }}>
                    {sampleGroupBuy.title}
                  </Typography>
                  <Badge status="LIVE" variant="success" />
                </View>
                <Typography variant="caption" color={theme.textSecondary}>
                  {sampleGroupBuy.areaName} • {formatNaira(sampleGroupBuy.unitPrice)} / bag
                </Typography>

                <View style={{ marginVertical: 8 }}>
                  <ProgressBar
                    paidQuantity={sampleGroupBuy.paidQuantity}
                    targetQuantity={sampleGroupBuy.targetQuantity}
                  />
                </View>

                <View style={styles.buyItemFooter}>
                  <Typography variant="caption" weight="bold">
                    {sampleGroupBuy.paidQuantity} of {sampleGroupBuy.targetQuantity} units paid (76%)
                  </Typography>
                  <Typography variant="caption" color={theme.brandGreen} weight="bold">
                    MVFQ Met ✅
                  </Typography>
                </View>
              </View>
            </Card>

            {/* Neighborhood WhatsApp Toolkit */}
            <Card style={styles.card}>
              <View style={styles.toolkitHeader}>
                <Typography variant="h3">Neighborhood Broadcast Toolkit 📲</Typography>
                <View style={styles.dialectToggle}>
                  <TouchableOpacity
                    onPress={() => setBroadcastDialect('standard')}
                    style={[styles.dialectBtn, broadcastDialect === 'standard' && styles.dialectBtnActive]}
                  >
                    <Typography variant="caption" weight={broadcastDialect === 'standard' ? 'bold' : 'regular'}>
                      English
                    </Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setBroadcastDialect('pidgin')}
                    style={[styles.dialectBtn, broadcastDialect === 'pidgin' && styles.dialectBtnActive]}
                  >
                    <Typography variant="caption" weight={broadcastDialect === 'pidgin' ? 'bold' : 'regular'}>
                      Pidgin
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>

              <Typography variant="caption" color={theme.textSecondary} style={{ marginBottom: 8 }}>
                Copy and paste this message directly into your estate or neighborhood WhatsApp group:
              </Typography>

              <View style={styles.broadcastBox}>
                <Typography variant="caption" style={styles.broadcastText}>
                  {broadcastMessage}
                </Typography>
              </View>

              <Button
                title="Copy WhatsApp Message"
                variant="outline"
                size="md"
                onPress={handleCopyBroadcast}
                style={{ marginTop: 10 }}
              />
            </Card>
          </View>
        )}

        {/* Champion Rules & Integrity Card */}
        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>
            STAPLE Champion Charter (§6–§9)
          </Typography>

          <View style={styles.ruleItem}>
            <Typography variant="bodySm" weight="bold">
              1. Zero Commercial Manipulation
            </Typography>
            <Typography variant="caption" color={theme.textSecondary}>
              Wholesale pricing and discount tiers are strictly negotiated and locked by STAPLE. Champions choose the product and target volume.
            </Typography>
          </View>

          <View style={styles.ruleItem}>
            <Typography variant="bodySm" weight="bold">
              2. Activation via Real Food Purchase
            </Typography>
            <Typography variant="caption" color={theme.textSecondary}>
              To make a Group Buy LIVE, Champions purchase their household quota (1–10 units). This is an actual food order, never an activation fee.
            </Typography>
          </View>

          <View style={styles.ruleItem}>
            <Typography variant="bodySm" weight="bold">
              3. Flat ₦{rewardAmount.toLocaleString()} Milestone Reward (Addendum A3)
            </Typography>
            <Typography variant="caption" color={theme.textSecondary}>
              When 100% of the target is reached, ₦{rewardAmount.toLocaleString()} is credited immediately to your STAPLE Wallet for your community effort.
            </Typography>
          </View>
        </Card>
      </ScrollView>

      {/* Application Modal */}
      <ChampionApplicationModal
        visible={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSubmit={handleApplicationSubmit}
        isSubmitting={isSubmittingApp}
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
    paddingBottom: theme.spacing[8],
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
  promoCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1,
  },
  promoTitle: {
    marginBottom: theme.spacing[2],
  },
  promoDesc: {
    lineHeight: 20,
    marginBottom: theme.spacing[4],
  },
  perksGrid: {
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  perkItem: {
    backgroundColor: '#FFFFFF',
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  actionBtn: {
    marginTop: theme.spacing[2],
  },
  pendingCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
    borderWidth: 1,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingFooter: {
    marginTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: '#FEF08A',
    paddingTop: theme.spacing[2],
  },
  suspendedCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
    marginVertical: theme.spacing[2],
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  kpiCard: {
    flex: 1,
  },
  kpiValue: {
    marginVertical: theme.spacing[1],
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyItem: {
    backgroundColor: theme.colors.neutral[50],
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing[2],
  },
  buyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing[2],
  },
  buyItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  toolkitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  dialectToggle: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    overflow: 'hidden',
  },
  dialectBtn: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: 4,
    backgroundColor: theme.colors.neutral[100],
  },
  dialectBtnActive: {
    backgroundColor: '#DCFCE7',
  },
  broadcastBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    maxHeight: 160,
  },
  broadcastText: {
    fontFamily: 'monospace',
    lineHeight: 18,
    color: '#334155',
  },
  cardTitle: {
    marginBottom: theme.spacing[3],
  },
  ruleItem: {
    marginBottom: theme.spacing[3],
  },
});
