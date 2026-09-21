/**
 * STAPLE LIMITED — Festive & Seasonal Planning Screen (Phase 7)
 * Spec §31–§40, §74, and Founder Addendum v1 (B5, A2).
 * Covers Christmas, Ileya, and Owambe (42–100 day planning window),
 * flexible instalment calculators, and plan progress tracking.
 */

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
  Card,
  Badge,
  ProgressBar,
  Button,
  Header,
  EmptyState,
} from '../components/index.js';
import {
  formatNaira,
  validateOwambeDeliveryDate,
  generateInstalmentSchedule,
  evaluateInstalmentOverdue,
  BUSINESS_RULES,
  FestiveCategory,
} from '@staple/shared';
import {
  InstalmentPaymentModal,
  InstalmentPaymentItem,
} from './InstalmentPaymentModal.js';

interface FestiveSeasonItem {
  id: string;
  category: FestiveCategory;
  name: string;
  badge: string;
  description: string;
  icon: string;
  deliveryWindow: string;
}

interface CuratedBasketItem {
  id: string;
  name: string;
  category: FestiveCategory;
  price: number;
  itemsSummary: string;
}

interface UserFestivePlanItem {
  id: string;
  title: string;
  category: FestiveCategory;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  deliveryDate: string;
  hubName: string;
  isFullyPaid: boolean;
  status: 'active' | 'fulfilled' | 'cancelled';
  instalments: Array<{
    id: string;
    instalmentNumber: number;
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  }>;
}

export const FestiveScreen: React.FC<{
  onBack?: () => void;
  walletBalance?: number;
}> = ({ onBack, walletBalance = 85000 }) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'my-plans'>('plan');

  // Seasons catalogue
  const seasons: FestiveSeasonItem[] = [
    {
      id: 'season-owambe',
      category: FestiveCategory.OWAMBE_PARTY,
      name: 'Owambe & Family Milestone Parties',
      badge: '42–100 Days Planning',
      description: 'Lock wholesale farm-gate prices for weddings, birthdays, burials, and milestones.',
      icon: '👑',
      deliveryWindow: 'Custom Event Date (6–14 weeks ahead)',
    },
    {
      id: 'season-xmas',
      category: FestiveCategory.CHRISTMAS,
      name: 'Christmas & End-of-Year 2026',
      badge: 'Yuletide Bulk Savings',
      description: 'Premium parboiled rice, vegetable oil kegs, and holiday food hampers for December.',
      icon: '🎄',
      deliveryWindow: 'Dec 18 – Dec 24, 2026',
    },
    {
      id: 'season-ileya',
      category: FestiveCategory.ILEYA,
      name: 'Eid-el-Kabir (Ileya) 2026 Feast',
      badge: 'Sallah Essentials',
      description: 'Livestock aggregation, grains, and seasoning essentials delivered before Eid prayer.',
      icon: '🌙',
      deliveryWindow: 'May 20 – May 26, 2026',
    },
  ];

  // Curated baskets
  const baskets: CuratedBasketItem[] = [
    {
      id: 'b-owambe-mega',
      name: 'Owambe Mega Party Catering Basket',
      category: FestiveCategory.OWAMBE_PARTY,
      price: 240000,
      itemsSummary: '2x 50kg Mama Gold Rice, 2x 25L Kings Oil, 1x 50kg White Garri, Spices & Seasonings',
    },
    {
      id: 'b-xmas-family',
      name: 'Christmas Family Deluxe Hamper',
      category: FestiveCategory.CHRISTMAS,
      price: 165000,
      itemsSummary: '1x 50kg Royal Stallion Rice, 1x 25L Devon King’s Oil, 25kg Beans, Assorted Condiments',
    },
    {
      id: 'b-ileya-feast',
      name: 'Ileya Celebration Feast Pack',
      category: FestiveCategory.ILEYA,
      price: 195000,
      itemsSummary: '1x 50kg Big Bull Rice, 1x 25L Pure Soya Oil, 50kg Brown Beans, Peppers & Onions Bag',
    },
  ];

  // User's enrolled sample plan
  const [userPlans, setUserPlans] = useState<UserFestivePlanItem[]>([
    {
      id: 'plan-101',
      title: 'Adeyemi Wedding Owambe Plan',
      category: FestiveCategory.OWAMBE_PARTY,
      totalAmount: 240000,
      paidAmount: 80000,
      remainingAmount: 160000,
      deliveryDate: '2026-11-28',
      hubName: 'staple Hub — Lekki Admiralty',
      isFullyPaid: false,
      status: 'active',
      instalments: [
        {
          id: 'inst-1',
          instalmentNumber: 1,
          amount: 80000,
          dueDate: '2026-09-05',
          status: 'paid',
        },
        {
          id: 'inst-2',
          instalmentNumber: 2,
          amount: 80000,
          dueDate: '2026-10-10',
          status: 'pending',
        },
        {
          id: 'inst-3',
          instalmentNumber: 3,
          amount: 80000,
          dueDate: '2026-11-15',
          status: 'pending',
        },
      ],
    },
  ]);

  // Form State for "Explore & Plan"
  const [selectedSeasonCategory, setSelectedSeasonCategory] = useState<FestiveCategory>(
    FestiveCategory.OWAMBE_PARTY
  );
  const [selectedBasketId, setSelectedBasketId] = useState<string>('b-owambe-mega');
  const [paymentType, setPaymentType] = useState<'outright' | 'instalment'>('instalment');
  const [numberOfInstalments, setNumberOfInstalments] = useState<number>(3);

  // Delivery date offsets for Owambe (default 65 days ahead)
  const defaultFutureDate = new Date();
  defaultFutureDate.setDate(defaultFutureDate.getDate() + 65);
  const [deliveryDateString, setDeliveryDateString] = useState<string>(
    defaultFutureDate.toISOString().split('T')[0]
  );
  const [daysOffsetInput, setDaysOffsetInput] = useState<number>(65);

  const [acknowledgedNoRefund, setAcknowledgedNoRefund] = useState<boolean>(false);
  const [selectedHub, setSelectedHub] = useState<string>('staple Hub — Lekki Admiralty');

  // Modal State for Paying Instalments
  const [paymentModalItem, setPaymentModalItem] = useState<InstalmentPaymentItem | null>(null);

  // Calculated validation for Owambe
  const selectedBasket = baskets.find((b) => b.id === selectedBasketId) || baskets[0];
  const targetDeliveryDate = new Date(deliveryDateString);
  const owambeValidation = validateOwambeDeliveryDate(targetDeliveryDate, new Date());

  // Calculated schedule preview
  const schedulePreview = generateInstalmentSchedule(
    selectedBasket.price,
    paymentType === 'outright' ? 1 : numberOfInstalments,
    new Date(),
    targetDeliveryDate
  );

  const handleUpdateDaysOffset = (delta: number) => {
    const newOffset = Math.max(20, Math.min(120, daysOffsetInput + delta));
    setDaysOffsetInput(newOffset);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + newOffset);
    setDeliveryDateString(newDate.toISOString().split('T')[0]);
  };

  const handleCreatePlan = () => {
    if (selectedSeasonCategory === FestiveCategory.OWAMBE_PARTY && !owambeValidation.isValid) {
      Alert.alert('Invalid Planning Window', owambeValidation.error);
      return;
    }

    if (!acknowledgedNoRefund) {
      Alert.alert(
        'Policy Agreement Required',
        'Please acknowledge the 7-day grace period and non-refundable default forfeiture policy (§35) to proceed.'
      );
      return;
    }

    // Success simulation
    const newPlan: UserFestivePlanItem = {
      id: `plan-${Date.now()}`,
      title: `${selectedBasket.name} Plan`,
      category: selectedSeasonCategory,
      totalAmount: selectedBasket.price,
      paidAmount: 0,
      remainingAmount: selectedBasket.price,
      deliveryDate: deliveryDateString,
      hubName: selectedHub,
      isFullyPaid: false,
      status: 'active',
      instalments: schedulePreview.map((item, idx) => ({
        id: `inst-${Date.now()}-${idx}`,
        instalmentNumber: item.instalmentNumber,
        amount: item.amount,
        dueDate: item.dueDate,
        status: 'pending',
      })),
    };

    setUserPlans([newPlan, ...userPlans]);
    setActiveTab('my-plans');
    Alert.alert(
      'Festive Plan Created! 🎉',
      `Your ${paymentType === 'outright' ? 'outright' : `${numberOfInstalments}-instalment`} plan for ${selectedBasket.name} has been enrolled.`
    );
  };

  const handleOpenPayment = (plan: UserFestivePlanItem, inst: UserFestivePlanItem['instalments'][0]) => {
    const overdueStatus = evaluateInstalmentOverdue(inst.dueDate);
    setPaymentModalItem({
      id: inst.id,
      planId: plan.id,
      planTitle: plan.title,
      instalmentNumber: inst.instalmentNumber,
      totalInstalments: plan.instalments.length,
      amount: inst.amount,
      dueDate: inst.dueDate,
      status: inst.status === 'overdue' ? 'overdue' : 'pending',
      isOverdue: overdueStatus.isOverdue,
      daysRemainingInGrace: overdueStatus.daysRemainingInGrace,
    });
  };

  const handleInstalmentPaidSuccess = (instalmentId: string) => {
    setUserPlans((prev) =>
      prev.map((p) => {
        const hasInstalment = p.instalments.some((i) => i.id === instalmentId);
        if (!hasInstalment) return p;

        const updatedInstalments = p.instalments.map((i) =>
          i.id === instalmentId ? { ...i, status: 'paid' as const } : i
        );

        const newPaid = updatedInstalments
          .filter((i) => i.status === 'paid')
          .reduce((sum, i) => sum + i.amount, 0);

        const isFullyPaid = newPaid >= p.totalAmount;

        return {
          ...p,
          paidAmount: newPaid,
          remainingAmount: Math.max(0, p.totalAmount - newPaid),
          isFullyPaid,
          instalments: updatedInstalments,
        };
      })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header locationName="Festive & Owambe Planning" />

      {/* Segmented Top Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plan' && styles.tabActive]}
          onPress={() => setActiveTab('plan')}
          activeOpacity={0.8}
        >
          <Typography
            variant="body"
            weight={activeTab === 'plan' ? 'bold' : 'regular'}
            color={activeTab === 'plan' ? theme.brandGreen : theme.textSecondary}
          >
            🎉 Plan Celebration
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-plans' && styles.tabActive]}
          onPress={() => setActiveTab('my-plans')}
          activeOpacity={0.8}
        >
          <Typography
            variant="body"
            weight={activeTab === 'my-plans' ? 'bold' : 'regular'}
            color={activeTab === 'my-plans' ? theme.brandGreen : theme.textSecondary}
          >
            📋 My Plans ({userPlans.length})
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'plan' ? (
          <>
            {/* Value Proposition Hero */}
            <Card style={styles.heroCard}>
              <Typography variant="caption" color={theme.colors.secondary[800]} weight="bold">
                CULTURE & CELEBRATIONS
              </Typography>
              <Typography variant="h2" style={styles.heroTitle}>
                Beat Festive Inflation.
              </Typography>
              <Typography variant="bodySm" color={theme.textSecondary}>
                Plan your Owambe, Christmas, or Ileya party 6–14 weeks ahead. Pool with family, pay in small instalments, and pick up fresh foodstuff at your local hub.
              </Typography>
            </Card>

            {/* Step 1: Select Season */}
            <Typography variant="h3" style={styles.stepTitle}>
              1. Choose Your Celebration
            </Typography>
            {seasons.map((season) => {
              const isSelected = selectedSeasonCategory === season.category;
              return (
                <TouchableOpacity
                  key={season.id}
                  style={[styles.seasonCard, isSelected && styles.seasonCardSelected]}
                  onPress={() => setSelectedSeasonCategory(season.category)}
                  activeOpacity={0.8}
                >
                  <View style={styles.seasonHeader}>
                    <Typography variant="h2">{season.icon}</Typography>
                    <View style={styles.seasonMeta}>
                      <Typography variant="body" weight="bold">
                        {season.name}
                      </Typography>
                      <Typography variant="caption" color={theme.brandGreen} weight="medium">
                        {season.badge}
                      </Typography>
                    </View>
                  </View>
                  <Typography variant="caption" color={theme.textSecondary} style={styles.seasonDesc}>
                    {season.description}
                  </Typography>
                  <Typography variant="caption" color={theme.textMuted}>
                    📅 Delivery Window: {season.deliveryWindow}
                  </Typography>
                </TouchableOpacity>
              );
            })}

            {/* Step 2: Date Selector (Owambe 42-100 Day Rule) */}
            {selectedSeasonCategory === FestiveCategory.OWAMBE_PARTY && (
              <View style={styles.dateSelectorBox}>
                <Typography variant="h3" style={styles.stepTitle}>
                  2. Owambe Planning Window (Spec §39)
                </Typography>
                <Typography variant="caption" color={theme.textSecondary}>
                  Party date must be between 42 days (6 wks) and 100 days (~14 wks) ahead.
                </Typography>

                <View style={styles.dateAdjuster}>
                  <TouchableOpacity
                    style={styles.dateAdjustBtn}
                    onPress={() => handleUpdateDaysOffset(-7)}
                  >
                    <Typography variant="body" weight="bold">
                      -7 Days
                    </Typography>
                  </TouchableOpacity>
                  <View style={styles.dateDisplay}>
                    <Typography variant="h3" color={theme.colors.primary[900]}>
                      {daysOffsetInput} Days Ahead
                    </Typography>
                    <Typography variant="caption" color={theme.textSecondary}>
                      Target: {deliveryDateString}
                    </Typography>
                  </View>
                  <TouchableOpacity
                    style={styles.dateAdjustBtn}
                    onPress={() => handleUpdateDaysOffset(+7)}
                  >
                    <Typography variant="body" weight="bold">
                      +7 Days
                    </Typography>
                  </TouchableOpacity>
                </View>

                {/* Validation Banner */}
                <View
                  style={[
                    styles.validationBadge,
                    owambeValidation.isValid
                      ? styles.validationValid
                      : styles.validationInvalid,
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    color={
                      owambeValidation.isValid
                        ? theme.colors.success[900]
                        : theme.colors.error.main
                    }
                  >
                    {owambeValidation.isValid
                      ? `✅ Valid Window: ${daysOffsetInput} days matches 42–100 day requirement.`
                      : `⚠️ ${owambeValidation.error}`}
                  </Typography>
                </View>
              </View>
            )}

            {/* Step 3: Select Curated Basket */}
            <Typography variant="h3" style={styles.stepTitle}>
              {selectedSeasonCategory === FestiveCategory.OWAMBE_PARTY ? '3.' : '2.'} Select Curated Basket
            </Typography>
            {baskets.map((basket) => {
              const isSelected = selectedBasketId === basket.id;
              return (
                <TouchableOpacity
                  key={basket.id}
                  style={[styles.basketCard, isSelected && styles.basketCardSelected]}
                  onPress={() => setSelectedBasketId(basket.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.basketTop}>
                    <Typography variant="body" weight="bold">
                      {basket.name}
                    </Typography>
                    <Typography variant="h3" color={theme.brandGreen}>
                      {formatNaira(basket.price)}
                    </Typography>
                  </View>
                  <Typography variant="caption" color={theme.textSecondary} style={styles.basketSummary}>
                    {basket.itemsSummary}
                  </Typography>
                </TouchableOpacity>
              );
            })}

            {/* Step 4: Payment Plan Breakdown */}
            <Typography variant="h3" style={styles.stepTitle}>
              {selectedSeasonCategory === FestiveCategory.OWAMBE_PARTY ? '4.' : '3.'} Payment Structure
            </Typography>

            <View style={styles.paymentTypeRow}>
              <TouchableOpacity
                style={[styles.paymentTypeBtn, paymentType === 'outright' && styles.paymentTypeBtnActive]}
                onPress={() => setPaymentType('outright')}
              >
                <Typography
                  variant="bodySm"
                  weight="bold"
                  color={paymentType === 'outright' ? theme.colors.neutral[0] : theme.textSecondary}
                >
                  Outright (100%)
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentTypeBtn, paymentType === 'instalment' && styles.paymentTypeBtnActive]}
                onPress={() => setPaymentType('instalment')}
              >
                <Typography
                  variant="bodySm"
                  weight="bold"
                  color={paymentType === 'instalment' ? theme.colors.neutral[0] : theme.textSecondary}
                >
                  Instalments (2–4x)
                </Typography>
              </TouchableOpacity>
            </View>

            {paymentType === 'instalment' && (
              <View style={styles.instalmentCountRow}>
                {[2, 3, 4].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.countPill,
                      numberOfInstalments === count && styles.countPillActive,
                    ]}
                    onPress={() => setNumberOfInstalments(count)}
                  >
                    <Typography
                      variant="caption"
                      weight="bold"
                      color={numberOfInstalments === count ? theme.colors.neutral[0] : theme.textSecondary}
                    >
                      {count} Payments
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Schedule Preview Table */}
            <Card style={styles.scheduleCard}>
              <Typography variant="caption" color={theme.textMuted} weight="bold">
                ESTIMATED PAYMENT SCHEDULE
              </Typography>
              {schedulePreview.map((item) => (
                <View key={item.instalmentNumber} style={styles.scheduleRow}>
                  <Typography variant="bodySm">
                    Instalment #{item.instalmentNumber} (Due {item.dueDate})
                  </Typography>
                  <Typography variant="bodySm" weight="bold" color={theme.brandGreen}>
                    {formatNaira(item.amount)}
                  </Typography>
                </View>
              ))}
              <View style={styles.scheduleTotalRow}>
                <Typography variant="body" weight="bold">
                  Total Plan Amount:
                </Typography>
                <Typography variant="h3" color={theme.brandGreen}>
                  {formatNaira(selectedBasket.price)}
                </Typography>
              </View>
            </Card>

            {/* Mandatory No-Refund Checkbox (Spec §35 & Addendum B5) */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAcknowledgedNoRefund(!acknowledgedNoRefund)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, acknowledgedNoRefund && styles.checkboxChecked]}>
                {acknowledgedNoRefund && (
                  <Typography variant="caption" color={theme.colors.neutral[0]} weight="bold">
                    ✓
                  </Typography>
                )}
              </View>
              <View style={styles.checkboxTextContainer}>
                <Typography variant="caption" weight="bold" color={theme.colors.warning[900]}>
                  Non-Refundable Instalment Default Agreement (Spec §35)
                </Typography>
                <Typography variant="caption" color={theme.textSecondary}>
                  I acknowledge that each instalment must be paid on time. If an instalment is missed, a 7-day grace period applies. Unpaid instalments beyond 7 days will lead to plan cancellation and forfeiture of prior payments to cover wholesale food procurement.
                </Typography>
              </View>
            </TouchableOpacity>

            {/* Submit Button */}
            <Button
              title="Enrol in Festive Plan"
              variant="primary"
              onPress={handleCreatePlan}
              fullWidth
              style={styles.submitBtn}
            />
          </>
        ) : (
          /* My Plans Tab */
          <>
            {userPlans.length === 0 ? (
              <EmptyState
                title="No Enrolled Festive Plans"
                description="You have not set up any festive or Owambe savings plans yet."
                actionTitle="Create Celebration Plan"
                onAction={() => setActiveTab('plan')}
              />
            ) : (
              userPlans.map((plan) => {
                const nextUnpaid = plan.instalments.find((i) =>
                  ['pending', 'overdue'].includes(i.status)
                );
                const progressPct = Math.round((plan.paidAmount / plan.totalAmount) * 100);

                return (
                  <Card key={plan.id} elevated style={styles.planProgressCard}>
                    <View style={styles.planCardHeader}>
                      <Typography variant="h3">{plan.title}</Typography>
                      <Badge status={plan.isFullyPaid ? 'completed' : 'live'} />
                    </View>

                    <Typography variant="caption" color={theme.textSecondary}>
                      📍 Collection Hub: {plan.hubName}
                    </Typography>
                    <Typography variant="caption" color={theme.textSecondary}>
                      📅 Target Delivery: {plan.deliveryDate}
                    </Typography>

                    {/* Progress */}
                    <View style={styles.planProgressBar}>
                      <ProgressBar
                        paidQuantity={plan.paidAmount}
                        targetQuantity={plan.totalAmount}
                        unit="NGN"
                      />
                    </View>

                    <View style={styles.planAmountSummary}>
                      <View>
                        <Typography variant="caption" color={theme.textMuted}>
                          Paid to date:
                        </Typography>
                        <Typography variant="body" weight="bold" color={theme.brandGreen}>
                          {formatNaira(plan.paidAmount)} ({progressPct}%)
                        </Typography>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Typography variant="caption" color={theme.textMuted}>
                          Remaining:
                        </Typography>
                        <Typography variant="body" weight="bold">
                          {formatNaira(plan.remainingAmount)}
                        </Typography>
                      </View>
                    </View>

                    {/* Next Action */}
                    {nextUnpaid && !plan.isFullyPaid && (
                      <View style={styles.nextInstalmentBanner}>
                        <View style={{ flex: 1 }}>
                          <Typography variant="caption" weight="bold" color={theme.colors.primary[900]}>
                            Next: Instalment #{nextUnpaid.instalmentNumber} ({formatNaira(nextUnpaid.amount)})
                          </Typography>
                          <Typography variant="caption" color={theme.textSecondary}>
                            Due by {nextUnpaid.dueDate}
                          </Typography>
                        </View>
                        <Button
                          title="Pay Now"
                          variant="primary"
                          onPress={() => handleOpenPayment(plan, nextUnpaid)}
                          style={{ minWidth: 90 }}
                        />
                      </View>
                    )}

                    {/* Instalment Schedule Checklist */}
                    <Typography variant="caption" color={theme.textMuted} weight="bold" style={styles.scheduleHeader}>
                      INSTALMENT TIMELINE
                    </Typography>
                    {plan.instalments.map((inst) => (
                      <View key={inst.id} style={styles.instalmentRowItem}>
                        <Typography variant="bodySm">
                          {inst.status === 'paid' ? '✅' : '⏳'} Instalment #{inst.instalmentNumber} — {formatNaira(inst.amount)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={inst.status === 'paid' ? theme.brandGreen : theme.textSecondary}
                          weight="medium"
                        >
                          {inst.status === 'paid' ? 'Paid' : `Due ${inst.dueDate}`}
                        </Typography>
                      </View>
                    ))}
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <InstalmentPaymentModal
        visible={!!paymentModalItem}
        onClose={() => setPaymentModalItem(null)}
        instalment={paymentModalItem}
        walletBalance={walletBalance}
        onPaymentSuccess={handleInstalmentPaidSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    backgroundColor: theme.colors.surface.card,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.brandGreen,
  },
  content: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[12],
  },
  heroCard: {
    backgroundColor: theme.colors.secondary[50],
    borderColor: theme.colors.secondary[200],
    marginBottom: theme.spacing[4],
  },
  heroTitle: {
    color: theme.colors.secondary[900],
    marginVertical: theme.spacing[1],
  },
  stepTitle: {
    marginTop: theme.spacing[3],
    marginBottom: theme.spacing[2],
  },
  seasonCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[3],
  },
  seasonCardSelected: {
    borderColor: theme.brandGreen,
    backgroundColor: theme.colors.primary[50],
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[1],
  },
  seasonMeta: {
    flex: 1,
  },
  seasonDesc: {
    marginVertical: theme.spacing[1],
  },
  dateSelectorBox: {
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
    marginBottom: theme.spacing[3],
  },
  dateAdjuster: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: theme.spacing[3],
  },
  dateAdjustBtn: {
    backgroundColor: theme.colors.surface.card,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  dateDisplay: {
    alignItems: 'center',
  },
  validationBadge: {
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.sm,
  },
  validationValid: {
    backgroundColor: theme.colors.success[100],
  },
  validationInvalid: {
    backgroundColor: theme.colors.error.light,
  },
  basketCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[3],
  },
  basketCardSelected: {
    borderColor: theme.brandGreen,
    backgroundColor: theme.colors.primary[50],
  },
  basketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  basketSummary: {
    marginTop: theme.spacing[1],
  },
  paymentTypeRow: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[3],
  },
  paymentTypeBtn: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    alignItems: 'center',
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  paymentTypeBtnActive: {
    backgroundColor: theme.brandGreen,
    borderColor: theme.brandGreen,
  },
  instalmentCountRow: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[3],
  },
  countPill: {
    flex: 1,
    paddingVertical: theme.spacing[2],
    alignItems: 'center',
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  countPillActive: {
    backgroundColor: theme.colors.primary[800],
    borderColor: theme.colors.primary[800],
  },
  scheduleCard: {
    backgroundColor: theme.colors.neutral[50],
    marginBottom: theme.spacing[4],
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  scheduleTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing[3],
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    alignItems: 'flex-start',
    backgroundColor: theme.colors.warning[50],
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.warning[200],
    marginBottom: theme.spacing[4],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.warning[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.warning[700],
  },
  checkboxTextContainer: {
    flex: 1,
  },
  submitBtn: {
    marginBottom: theme.spacing[6],
  },
  planProgressCard: {
    marginBottom: theme.spacing[4],
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  planProgressBar: {
    marginVertical: theme.spacing[3],
  },
  planAmountSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  nextInstalmentBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing[3],
  },
  scheduleHeader: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[1],
  },
  instalmentRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
});
