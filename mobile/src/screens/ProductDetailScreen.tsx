/**
 * STAPLE LIMITED — ProductDetailScreen (Mobile)
 * Full product view with specifications, MVFQ explanation, and Group Buy entry points (Spec §10, Addendum A1)
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
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

export interface ProductDetailScreenProps {
  productId: string;
  onBack: () => void;
  onStartGroupBuy?: (product: ProductItem) => void;
  onViewLiveGroupBuys?: (productId: string) => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  productId,
  onBack,
  onStartGroupBuy,
  onViewLiveGroupBuys,
}) => {
  const product = SEED_PRODUCTS.find((p) => p.id === productId) || SEED_PRODUCTS[0];

  return (
    <View style={styles.container}>
      <Header
        title={product.name}
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Visual Card */}
        <View style={styles.heroBox}>
          <Text style={styles.heroEmoji}>{product.imageEmoji}</Text>
        </View>

        {/* Title & Category */}
        <View style={styles.titleSection}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            <Badge label={product.category} variant="neutral" />
            <Badge label={product.unit} variant="neutral" />
          </View>
          <Typography variant="h2">{product.name}</Typography>
        </View>

        {/* Pricing Card */}
        <Card style={styles.pricingCard}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Regular Base Price</Text>
              <Text style={styles.priceValue}>{formatNaira(product.basePrice)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Badge label="Save up to 10%" variant="success" />
              <Text style={styles.tierHint}>with Group Buy tiers</Text>
            </View>
          </View>

          <Text style={styles.pricingDisclaimer}>
            💡 Final price reduces for all buyers as more community members join and tiers are reached. Any difference is credited back to your wallet!
          </Text>
        </Card>

        {/* Minimum Viable Fulfilment Quantity (MVFQ) Explainer */}
        <Card style={styles.mvfqCard}>
          <View style={styles.mvfqHeader}>
            <Text style={styles.mvfqIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Typography variant="label" color={theme.colors.secondary[900]}>
                Minimum Viable Fulfilment Quantity: {product.mvfq} units
              </Typography>
              <Typography variant="caption" color={theme.colors.secondary[700]}>
                Supplier Break-even Guarantee (Spec Addendum A1)
              </Typography>
            </View>
          </View>

          <Text style={styles.mvfqText}>
            To unlock bulk farmgate pricing, at least <Text style={{ fontWeight: 'bold' }}>{product.mvfq} units</Text> must be ordered across all participants before the Group Buy expires. If not met, <Text style={{ fontWeight: 'bold' }}>100% of your funds are automatically refunded</Text> to your staple wallet immediately.
          </Text>
        </Card>

        {/* Specifications & Rules */}
        <View style={styles.specsSection}>
          <Typography variant="h3" style={{ marginBottom: 10 }}>
            Item Details & Rules
          </Typography>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Unit Size</Text>
            <Text style={styles.specValue}>{product.unit}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Target Order Window</Text>
            <Text style={styles.specValue}>{product.minTarget} – {product.maxTarget} units</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Max Limit Per Household</Text>
            <Text style={styles.specValue}>{BUSINESS_RULES.MAX_UNITS_PER_USER_PER_GROUP_BUY} units max</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Standard Lifespan</Text>
            <Text style={styles.specValue}>{BUSINESS_RULES.DEFAULT_GROUP_BUY_LIFESPAN_DAYS} calendar days</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Button
            title="⭐ Activate Group Buy as Champion"
            variant="primary"
            size="lg"
            onPress={() => {
              if (onStartGroupBuy) {
                onStartGroupBuy(product);
              } else {
                Alert.alert(
                  'Champion Activation',
                  `Start a community Group Buy for ${product.name}. Champions earn a ₦2,000 wallet milestone on target reached!`,
                );
              }
            }}
            style={{ marginBottom: 12 }}
          />

          <Button
            title="🔍 Find Live Deals for This Item"
            variant="outline"
            size="lg"
            onPress={() => {
              if (onViewLiveGroupBuys) {
                onViewLiveGroupBuys(product.id);
              } else {
                onBack();
              }
            }}
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
  content: {
    padding: 16,
  },
  heroBox: {
    height: 160,
    backgroundColor: theme.colors.surface.subtle,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 72,
  },
  titleSection: {
    marginBottom: 16,
  },
  pricingCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  tierHint: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 2,
  },
  pricingDisclaimer: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 17,
    marginTop: 4,
  },
  mvfqCard: {
    padding: 16,
    backgroundColor: theme.colors.secondary[50],
    borderColor: theme.colors.secondary[200],
    borderWidth: 1,
    marginBottom: 20,
  },
  mvfqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mvfqIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  mvfqText: {
    fontSize: 12,
    color: theme.colors.secondary[900],
    lineHeight: 18,
  },
  specsSection: {
    marginBottom: 24,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  specLabel: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  actionSection: {
    marginBottom: 32,
  },
});
