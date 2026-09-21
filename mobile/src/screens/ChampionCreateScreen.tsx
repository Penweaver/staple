/**
 * STAPLE LIMITED — Champion 6-Step Group Buy Creation Wizard (Spec §9)
 * Steps: Item -> Target -> Area/Hub -> Lifespan -> Terms & Reward -> Activation Purchase
 */

import React, { useState } from 'react';
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
  Header,
} from '../components/index.js';
import { formatNaira, BUSINESS_RULES } from '@staple/shared';
import { SEED_PRODUCTS, ProductItem } from './ProductListScreen.js';

export interface ChampionCreateScreenProps {
  onBack: () => void;
  onSuccess: (groupBuySlug: string) => void;
}

export const ChampionCreateScreen: React.FC<ChampionCreateScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form state across 6 steps
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(SEED_PRODUCTS[0]);
  const [targetQuantity, setTargetQuantity] = useState<number>(50);
  const [selectedArea, setSelectedArea] = useState<string>('Lekki Phase 1');
  const [selectedHub, setSelectedHub] = useState<string>('staple Hub — Lekki Admiralty');
  const [lifespanDays, setLifespanDays] = useState<number>(14);
  const [activationUnits, setActivationUnits] = useState<number>(2); // 1-10 units
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activationTotal = selectedProduct.basePrice * activationUnits;

  const handleNext = () => {
    if (currentStep === 5 && !termsAgreed) {
      Alert.alert('Agreement Required', 'Please confirm the Champion Terms and Milestone Rules to continue.');
      return;
    }
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      // Step 6: Complete activation
      handleCompleteActivation();
    }
  };

  const handleCompleteActivation = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Group Buy Activated! 🎉',
        `Your Group Buy for ${selectedProduct.name} is now LIVE in ${selectedArea}! Your initial ${activationUnits} unit(s) have been confirmed. Start sharing with your neighbors!`,
        [
          {
            text: 'View My Group Buy',
            onPress: () => onSuccess(`${selectedProduct.id.slice(0, 8)}-lekki`),
          },
        ],
      );
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Champion Wizard (${currentStep}/6)`}
        showBack
        onBack={() => {
          if (currentStep > 1) setCurrentStep(currentStep - 1);
          else onBack();
        }}
      />

      {/* Wizard Progress Bar */}
      <View style={styles.stepProgressBar}>
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <View
            key={step}
            style={[
              styles.stepIndicator,
              step <= currentStep && styles.stepIndicatorActive,
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step 1: Choose Product */}
        {currentStep === 1 && (
          <View>
            <Typography variant="h2" style={styles.stepTitle}>
              Step 1: Choose Item
            </Typography>
            <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: 16 }}>
              Select the staple foodstuff your community wants to buy in bulk:
            </Typography>

            {SEED_PRODUCTS.map((prod) => {
              const isSelected = selectedProduct.id === prod.id;
              return (
                <TouchableOpacity
                  key={prod.id}
                  onPress={() => setSelectedProduct(prod)}
                  activeOpacity={0.8}
                >
                  <Card style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
                    <Text style={styles.itemEmoji}>{prod.imageEmoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Typography variant="h3">{prod.name}</Typography>
                      <Text style={styles.itemPrice}>
                        {formatNaira(prod.basePrice)} / {prod.unit}
                      </Text>
                      <Text style={styles.itemMvfq}>
                        Minimum Bulk MOQ: {prod.mvfq} units
                      </Text>
                    </View>
                    {isSelected && <Badge label="Selected" variant="success" />}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 2: Set Target Quantity */}
        {currentStep === 2 && (
          <View>
            <Typography variant="h2" style={styles.stepTitle}>
              Step 2: Set Target Quantity
            </Typography>
            <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: 16 }}>
              How many units do you aim to pool together? (Min: {selectedProduct.minTarget}, Max: {selectedProduct.maxTarget})
            </Typography>

            <Card style={styles.targetCard}>
              <Text style={styles.targetNumber}>{targetQuantity}</Text>
              <Text style={styles.targetUnit}>{selectedProduct.unit}s</Text>

              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setTargetQuantity(Math.max(selectedProduct.minTarget, targetQuantity - 10))}
                >
                  <Text style={styles.stepperBtnText}>- 10</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setTargetQuantity(Math.min(selectedProduct.maxTarget, targetQuantity + 10))}
                >
                  <Text style={styles.stepperBtnText}>+ 10</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.presetRow}>
                {[20, 50, 100, 200].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.presetPill, targetQuantity === num && styles.presetPillActive]}
                    onPress={() => setTargetQuantity(num)}
                  >
                    <Text style={[styles.presetText, targetQuantity === num && styles.presetTextActive]}>
                      {num} {selectedProduct.unit}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            <Card style={styles.infoCard}>
              <Text style={styles.infoText}>
                💡 Reaching 100% of this target unlocks the highest volume discount tier for all buyers AND your ₦2,000 Champion Milestone Reward!
              </Text>
            </Card>
          </View>
        )}

        {/* Step 3: Choose Service Area & Hub */}
        {currentStep === 3 && (
          <View>
            <Typography variant="h2" style={styles.stepTitle}>
              Step 3: Service Area & Hub
            </Typography>
            <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: 16 }}>
              Where will your participants pick up their orders?
            </Typography>

            {[
              { area: 'Lekki Phase 1', hub: 'staple Hub — Lekki Admiralty', address: '42 Admiralty Way, Lekki' },
              { area: 'Victoria Island Central', hub: 'staple Hub — VI Bishop Oluwole', address: '15 Bishop Oluwole St, VI' },
              { area: 'Ikeja GRA & Central', hub: 'staple Hub — Ikeja GRA', address: '8 Isaac John St, Ikeja' },
            ].map((loc) => {
              const isSelected = selectedArea === loc.area;
              return (
                <TouchableOpacity
                  key={loc.area}
                  onPress={() => {
                    setSelectedArea(loc.area);
                    setSelectedHub(loc.hub);
                  }}
                  activeOpacity={0.8}
                >
                  <Card style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Typography variant="h3">{loc.area}</Typography>
                      <Text style={styles.itemPrice}>{loc.hub}</Text>
                      <Text style={styles.itemMvfq}>{loc.address}</Text>
                    </View>
                    {isSelected && <Badge label="Selected" variant="success" />}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 4: Lifespan */}
        {currentStep === 4 && (
          <View>
            <Typography variant="h2" style={styles.stepTitle}>
              Step 4: Duration / Lifespan
            </Typography>
            <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: 16 }}>
              How many days should this Group Buy remain open for your community to join?
            </Typography>

            <View style={{ gap: 12 }}>
              {[
                { days: 7, label: '7 Days (Fast Turnaround)', desc: 'Best for urgent orders and small neighborhood clusters' },
                { days: 14, label: '14 Days (Recommended)', desc: 'Standard staple window allowing ample time to invite neighbors' },
                { days: 21, label: '21 Days (Extended)', desc: 'Ideal for larger targets (100+ units) and estate-wide buys' },
              ].map((opt) => {
                const isSelected = lifespanDays === opt.days;
                return (
                  <TouchableOpacity
                    key={opt.days}
                    onPress={() => setLifespanDays(opt.days)}
                    activeOpacity={0.8}
                  >
                    <Card style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
                      <View style={{ flex: 1 }}>
                        <Typography variant="h3">{opt.label}</Typography>
                        <Text style={styles.itemMvfq}>{opt.desc}</Text>
                      </View>
                      {isSelected && <Badge label="Selected" variant="success" />}
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 5: Terms & Milestone Reward */}
        {currentStep === 5 && (
          <View>
            <Typography variant="h2" style={styles.stepTitle}>
              Step 5: Champion Terms & Rewards
            </Typography>
            <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: 16 }}>
              Review your responsibilities and rewards as a community Champion:
            </Typography>

            <Card style={styles.rewardCard}>
              <Text style={styles.rewardIcon}>🏆</Text>
              <Typography variant="h2" color={theme.colors.secondary[900]}>
                ₦2,000 Milestone Reward
              </Typography>
              <Text style={styles.rewardDesc}>
                When your Group Buy reaches 100% of the {targetQuantity} {selectedProduct.unit}s target, a flat ₦2,000 reward will be credited directly to your staple wallet!
              </Text>
            </Card>

            <View style={styles.termsList}>
              <Text style={styles.termItem}>
                ✅ <Text style={{ fontWeight: 'bold' }}>Max 2 Active Buys:</Text> Champions can organize up to 2 concurrent Group Buys (Spec §8).
              </Text>
              <Text style={styles.termItem}>
                ✅ <Text style={{ fontWeight: 'bold' }}>MVFQ Protection:</Text> If less than {selectedProduct.mvfq} units are ordered at expiry, 100% refunds are issued automatically.
              </Text>
              <Text style={styles.termItem}>
                ✅ <Text style={{ fontWeight: 'bold' }}>Community Hub Pickup:</Text> All goods will be delivered to {selectedHub} for free pickup.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setTermsAgreed(!termsAgreed)}
            >
              <Text style={styles.checkboxSquare}>{termsAgreed ? '☑️' : '⬜'}</Text>
              <Text style={styles.checkboxLabel}>
                I understand the Champion guidelines and agree to coordinate my local group buy.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 6: Initial Activation Purchase */}
        {currentStep === 6 && (
          <View>
            <Typography variant="h2" style={styles.stepTitle}>
              Step 6: Activation Purchase
            </Typography>
            <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: 16 }}>
              To ensure commitment and activate the buy as LIVE, Champions purchase their own units upfront (min 1, max 10 per Spec §9 Step 6):
            </Typography>

            <Card style={styles.activationCard}>
              <Typography variant="h3" style={{ marginBottom: 8 }}>
                Your Personal Order
              </Typography>

              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setActivationUnits(Math.max(1, activationUnits - 1))}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.qtyDisplay}>
                  {activationUnits} {selectedProduct.unit}{activationUnits > 1 ? 's' : ''}
                </Text>

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setActivationUnits(Math.min(BUSINESS_RULES.MAX_UNITS_PER_USER_PER_GROUP_BUY, activationUnits + 1))}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.priceBreakdown}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Unit Price</Text>
                  <Text style={styles.breakdownValue}>{formatNaira(selectedProduct.basePrice)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Quantity</Text>
                  <Text style={styles.breakdownValue}>{activationUnits}</Text>
                </View>
                <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: theme.borderSubtle, paddingTop: 8 }]}>
                  <Text style={styles.totalLabel}>Total Activation Payment</Text>
                  <Text style={styles.totalValue}>{formatNaira(activationTotal)}</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.guaranteeCard}>
              <Text style={styles.guaranteeText}>
                🛡️ <Text style={{ fontWeight: 'bold' }}>Price Protection:</Text> If your Group Buy unlocks lower pricing tiers as more neighbors join, the price difference will be refunded back to your wallet!
              </Text>
            </Card>
          </View>
        )}

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Button
            title={currentStep === 6 ? (isSubmitting ? 'Activating...' : `Pay ${formatNaira(activationTotal)} & Go LIVE`) : 'Continue ➔'}
            variant="primary"
            size="lg"
            loading={isSubmitting}
            onPress={handleNext}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  stepProgressBar: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: theme.colors.surface.subtle,
  },
  stepIndicator: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.neutral[300],
  },
  stepIndicatorActive: {
    backgroundColor: theme.brandGreen,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  stepTitle: {
    marginBottom: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: theme.borderSubtle,
  },
  itemCardSelected: {
    borderColor: theme.brandGreen,
    backgroundColor: theme.colors.primary[50],
  },
  itemEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.brandGreen,
    marginTop: 2,
  },
  itemMvfq: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  targetCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  targetNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.brandGreen,
  },
  targetUnit: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  stepperBtn: {
    backgroundColor: theme.colors.surface.subtle,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderDefault,
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  presetPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderDefault,
    backgroundColor: theme.cardBg,
  },
  presetPillActive: {
    backgroundColor: theme.brandGreen,
    borderColor: theme.brandGreen,
  },
  presetText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  presetTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoCard: {
    padding: 14,
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.primary[900],
    lineHeight: 18,
  },
  rewardCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: theme.colors.secondary[50],
    borderColor: theme.colors.secondary[200],
    borderWidth: 1,
    marginBottom: 20,
  },
  rewardIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  rewardDesc: {
    fontSize: 13,
    color: theme.colors.secondary[900],
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  termsList: {
    marginBottom: 20,
    gap: 10,
  },
  termItem: {
    fontSize: 13,
    color: theme.textPrimary,
    lineHeight: 19,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.surface.subtle,
    borderRadius: 8,
    marginBottom: 24,
  },
  checkboxSquare: {
    fontSize: 20,
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 12,
    color: theme.textPrimary,
    flex: 1,
    lineHeight: 17,
  },
  activationCard: {
    padding: 20,
    marginBottom: 16,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.borderDefault,
  },
  qtyBtnText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  qtyDisplay: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    marginHorizontal: 24,
  },
  priceBreakdown: {
    marginTop: 8,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.brandGreen,
  },
  guaranteeCard: {
    padding: 14,
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
    borderWidth: 1,
    marginBottom: 24,
  },
  guaranteeText: {
    fontSize: 12,
    color: theme.colors.primary[900],
    lineHeight: 18,
  },
  footerRow: {
    marginTop: 8,
  },
});
