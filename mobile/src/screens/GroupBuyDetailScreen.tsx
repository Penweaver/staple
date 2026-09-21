import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  Image,
  Text,
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
import { shareGroupBuy, shareToWhatsApp } from '../services/share.js';

export const GroupBuyDetailScreen: React.FC<{
  groupBuyId?: string;
  onBack?: () => void;
  onProceedToCheckout?: (quantity: number) => void;
}> = ({ onBack, onProceedToCheckout }) => {
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Mock group buy model matching schema
  const groupBuy = {
    id: 'gb-1',
    slug: 'mama-gold-rice-lekki',
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
    hubName: 'staple Hub — Lekki Admiralty',
    collectionPoint: 'staple Hub — Lekki Admiralty (42 Admiralty Way)',
    championName: 'Dele A.',
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

  const handleShareWhatsApp = () => {
    shareToWhatsApp({
      slug: groupBuy.slug,
      itemTitle: groupBuy.title,
      unit: groupBuy.unit,
      areaName: groupBuy.areaName,
      currentPrice: groupBuy.unitPrice,
      originalPrice: groupBuy.originalPrice,
      paidQuantity: groupBuy.paidQuantity,
      targetQuantity: groupBuy.targetQuantity,
      hubName: groupBuy.hubName,
      championName: groupBuy.championName,
    });
  };

  const handleNativeShare = () => {
    shareGroupBuy({
      slug: groupBuy.slug,
      itemTitle: groupBuy.title,
      unit: groupBuy.unit,
      areaName: groupBuy.areaName,
      currentPrice: groupBuy.unitPrice,
      originalPrice: groupBuy.originalPrice,
      paidQuantity: groupBuy.paidQuantity,
      targetQuantity: groupBuy.targetQuantity,
      hubName: groupBuy.hubName,
      championName: groupBuy.championName,
    });
  };

  const subtotal = groupBuy.unitPrice * selectedQuantity;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `https://staple.ng/gb/${groupBuy.slug}`
  )}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Typography variant="body" weight="bold">
            ← Back
          </Typography>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setShowQrModal(true)} style={styles.iconBtn}>
            <Text style={{ fontSize: 16 }}>📱 QR</Text>
          </TouchableOpacity>
          <Badge status={groupBuy.status} />
        </View>
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

        {/* Viral Social Sharing Action Box */}
        <Card style={styles.shareCard}>
          <View style={styles.shareHeader}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>📣</Text>
            <View style={{ flex: 1 }}>
              <Typography variant="h3" color={theme.colors.primary[900]}>
                Invite Your Neighbors!
              </Typography>
              <Typography variant="caption" color={theme.colors.primary[800]}>
                More buyers = lower price for everyone in {groupBuy.areaName}
              </Typography>
            </View>
          </View>

          <View style={styles.shareBtnsRow}>
            <TouchableOpacity
              style={styles.whatsAppBtn}
              onPress={handleShareWhatsApp}
              activeOpacity={0.8}
            >
              <Text style={styles.whatsAppBtnText}>💬 Share on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.genericShareBtn}
              onPress={handleNativeShare}
              activeOpacity={0.8}
            >
              <Text style={styles.genericShareBtnText}>🔗 Copy Link</Text>
            </TouchableOpacity>
          </View>
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

      {/* QR Code Modal */}
      <Modal visible={showQrModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="h3" style={{ textAlign: 'center', marginBottom: 6 }}>
              Scan to Join Group Buy
            </Typography>
            <Typography variant="caption" color={theme.textSecondary} style={{ textAlign: 'center', marginBottom: 16 }}>
              Point phone camera to open deal link on staple.ng
            </Typography>

            <View style={styles.qrBox}>
              <Image
                source={{ uri: qrUrl }}
                style={{ width: 220, height: 220 }}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.qrSlug}>https://staple.ng/gb/{groupBuy.slug}</Text>

            <Button
              title="Close"
              variant="outline"
              size="md"
              onPress={() => setShowQrModal(false)}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
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
  iconBtn: {
    backgroundColor: theme.colors.surface.subtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
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
  cardHeader: {
    marginBottom: theme.spacing[2],
  },
  tierExplanation: {
    marginBottom: theme.spacing[3],
    lineHeight: theme.typography.lineHeight.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  savingsBadge: {
    backgroundColor: theme.colors.success.light,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  shareCard: {
    padding: 16,
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
    borderWidth: 1,
    marginBottom: theme.spacing[4],
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shareBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  whatsAppBtn: {
    flex: 2,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  genericShareBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.borderDefault,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  genericShareBtnText: {
    color: theme.textPrimary,
    fontWeight: '600',
    fontSize: 13,
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
    backgroundColor: theme.colors.surface.subtle,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  tierRowActive: {
    borderColor: theme.brandGreen,
    backgroundColor: theme.colors.primary[50],
  },
  collectionNote: {
    marginTop: theme.spacing[2],
    lineHeight: theme.typography.lineHeight.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    padding: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  quantityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.subtle,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[1],
  },
  qtyButton: {
    width: 40,
    height: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  qrBox: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginBottom: 12,
  },
  qrSlug: {
    fontSize: 11,
    color: theme.brandGreen,
    fontWeight: '600',
  },
});
