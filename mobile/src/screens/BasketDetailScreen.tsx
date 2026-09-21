/**
 * STAPLE LIMITED — BasketDetailScreen (Mobile)
 * Itemized breakdown of curated foodstuff baskets with MVFQ rules (Spec §10.3)
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { theme } from '../theme/tokens';
import {
  Typography,
  Button,
  Card,
  Badge,
  Header,
} from '../components/index';
import { formatNaira } from '@staple/shared';
import { SEED_BASKETS, BasketItemData } from './BasketListScreen';

export interface BasketDetailScreenProps {
  basketId: string;
  onBack: () => void;
  onStartBasketGroupBuy?: (basket: BasketItemData) => void;
}

export const BasketDetailScreen: React.FC<BasketDetailScreenProps> = ({
  basketId,
  onBack,
  onStartBasketGroupBuy,
}) => {
  const basket = SEED_BASKETS.find((b) => b.id === basketId) || SEED_BASKETS[0];

  return (
    <View style={styles.container}>
      <Header
        title={basket.name}
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Card */}
        <View style={styles.heroBox}>
          <Text style={styles.heroEmoji}>{basket.emoji}</Text>
        </View>

        <View style={styles.titleSection}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            <Badge label="Curated Basket" variant="info" />
            {basket.isFestive && (
              <Badge label="Festive / Owambe" variant="warning" />
            )}
          </View>
          <Typography variant="h2">{basket.name}</Typography>
          <Text style={styles.descText}>{basket.description}</Text>
        </View>

        {/* Price Card */}
        <Card style={styles.pricingCard}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Total Basket Price</Text>
              <Text style={styles.priceValue}>{formatNaira(basket.totalPrice)}</Text>
            </View>
            <Badge label="Bulk Group Savings" variant="success" />
          </View>
        </Card>

        {/* Itemized Contents */}
        <View style={styles.itemsSection}>
          <Typography variant="h3" style={{ marginBottom: 12 }}>
            What is in this basket? ({basket.items.length} items)
          </Typography>

          {basket.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemBullet}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                  {index + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <Badge label={item.qty} variant="neutral" />
            </View>
          ))}
        </View>

        {/* MVFQ Guarantee */}
        <Card style={styles.mvfqCard}>
          <View style={styles.mvfqHeader}>
            <Text style={styles.mvfqIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Typography variant="label" color={theme.colors.secondary[900]}>
                Minimum Viable Fulfilment Quantity: {basket.mvfq} baskets
              </Typography>
              <Typography variant="caption" color={theme.colors.secondary[700]}>
                Addendum A1 Requirement
              </Typography>
            </View>
          </View>

          <Text style={styles.mvfqText}>
            This curated basket requires a minimum of <Text style={{ fontWeight: 'bold' }}>{basket.mvfq} total orders</Text> across your neighborhood group to proceed to supplier fulfilment. If not reached before expiry, 100% of your funds will be refunded immediately to your wallet.
          </Text>
        </Card>

        {/* Action Button */}
        <Button
          title="⭐ Start Group Buy for this Basket"
          variant="primary"
          size="lg"
          onPress={() => {
            if (onStartBasketGroupBuy) {
              onStartBasketGroupBuy(basket);
            } else {
              Alert.alert(
                'Basket Group Buy',
                `Launch a collective Group Buy for the ${basket.name}. Invite your neighbors to buy together!`,
              );
            }
          }}
          style={{ marginBottom: 32 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
  },
  heroBox: {
    height: 140,
    backgroundColor: theme.colors.surface.subtle,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 64,
  },
  titleSection: {
    marginBottom: 16,
  },
  descText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 19,
    marginTop: 6,
  },
  pricingCard: {
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: theme.textMuted,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.brandGreen,
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  itemBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  mvfqCard: {
    padding: 16,
    backgroundColor: theme.colors.secondary[50],
    borderColor: theme.colors.secondary[200],
    borderWidth: 1,
    marginBottom: 24,
  },
  mvfqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mvfqIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  mvfqText: {
    fontSize: 12,
    color: theme.colors.secondary[900],
    lineHeight: 18,
  },
});
