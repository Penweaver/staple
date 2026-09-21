/**
 * STAPLE LIMITED — BasketListScreen (Mobile)
 * Curated foodstuff basket bundles for students, families, and festive seasons (Spec §10.3, §38)
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
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

export interface BasketItemData {
  id: string;
  name: string;
  slug: string;
  description: string;
  totalPrice: number;
  maxUnitsPerUser: number;
  mvfq: number;
  isFestive: boolean;
  itemCount: number;
  emoji: string;
  items: Array<{ name: string; qty: string }>;
}

export const SEED_BASKETS: BasketItemData[] = [
  {
    id: '00000000-0000-0000-0008-000000000001',
    name: 'Student Essentials Basket',
    slug: 'student-essentials-basket',
    description: 'Perfect for students & singles. Includes parboiled rice, honey beans, pure vegetable oil, and Ijebu garri.',
    totalPrice: 38000,
    maxUnitsPerUser: 5,
    mvfq: 10,
    isFestive: false,
    itemCount: 4,
    emoji: '🎒',
    items: [
      { name: 'Mama Gold Parboiled Rice', qty: '10kg' },
      { name: 'Oloyin Honey Beans', qty: '5kg' },
      { name: 'Kings Pure Vegetable Cooking Oil', qty: '5 Litres' },
      { name: 'White Garri Ijebu', qty: '10kg' },
    ],
  },
  {
    id: '00000000-0000-0000-0008-000000000002',
    name: 'Family Monthly Basket',
    slug: 'family-monthly-basket',
    description: 'Feeds a household of 4–6 for a full month. Complete with rice, beans, 25L oil, garri, and seasoning cartons.',
    totalPrice: 165000,
    maxUnitsPerUser: 5,
    mvfq: 8,
    isFestive: false,
    itemCount: 5,
    emoji: '👨‍👩‍👧‍👦',
    items: [
      { name: 'Mama Gold Premium Rice (50kg)', qty: '1 bag' },
      { name: 'Oloyin Honey Beans (25kg)', qty: '1 bag' },
      { name: 'Kings Vegetable Oil (25L)', qty: '1 keg' },
      { name: 'White Garri Ijebu (25kg)', qty: '1 bag' },
      { name: 'Knorr Seasoning Cubes Carton', qty: '2 cartons' },
    ],
  },
  {
    id: '00000000-0000-0000-0008-000000000003',
    name: 'Owambe Party Bulk Bundle',
    slug: 'owambe-party-bundle',
    description: 'Bulk caterer & party bundle. 3 bags rice, 2 bags beans, 2 kegs oil, and tomato paste cartons.',
    totalPrice: 395000,
    maxUnitsPerUser: 3,
    mvfq: 5,
    isFestive: true,
    itemCount: 4,
    emoji: '🎉',
    items: [
      { name: 'Mama Gold Premium Rice (50kg)', qty: '3 bags' },
      { name: 'Oloyin Honey Beans (50kg)', qty: '2 bags' },
      { name: 'Kings Cooking Oil (25L)', qty: '2 kegs' },
      { name: 'Gino Tomato Paste 70g (Carton)', qty: '3 cartons' },
    ],
  },
];

export interface BasketListScreenProps {
  onSelectBasket: (basketId: string) => void;
  onBack: () => void;
}

export const BasketListScreen: React.FC<BasketListScreenProps> = ({
  onSelectBasket,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <Header
        title="Curated Food Baskets"
        showBack
        onBack={onBack}
      />

      <FlatList
        data={SEED_BASKETS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: 16 }}>
            Save even more by ordering bundled food packages curated for households, students, and events.
          </Typography>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <TouchableOpacity
              onPress={() => onSelectBasket(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.emojiBox}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                    <Badge
                      label={`${item.itemCount} Items Included`}
                      variant="info"
                    />
                    {item.isFestive && (
                      <Badge label="Festive Plan" variant="warning" />
                    )}
                  </View>

                  <Typography variant="h3">{item.name}</Typography>
                </View>
              </View>

              <Text style={styles.desc}>{item.description}</Text>

              {/* Items summary */}
              <View style={styles.itemsBox}>
                {item.items.slice(0, 3).map((it, idx) => (
                  <Text key={idx} style={styles.itemLine}>
                    • {it.qty} {it.name}
                  </Text>
                ))}
                {item.items.length > 3 && (
                  <Text style={styles.moreItems}>
                    + {item.items.length - 3} more items
                  </Text>
                )}
              </View>

              {/* Price & MVFQ */}
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>Bundle Price</Text>
                  <Text style={styles.priceValue}>{formatNaira(item.totalPrice)}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.priceLabel}>Group Target MOQ (MVFQ)</Text>
                  <Text style={styles.mvfqValue}>{item.mvfq} baskets</Text>
                </View>
              </View>

              <Button
                title="View Basket Contents"
                variant="primary"
                size="md"
                onPress={() => onSelectBasket(item.id)}
                style={{ marginTop: 12 }}
              />
            </TouchableOpacity>
          </Card>
        )}
      />
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
  card: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 28,
  },
  desc: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  itemsBox: {
    backgroundColor: theme.colors.surface.subtle,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemLine: {
    fontSize: 12,
    color: theme.textPrimary,
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 11,
    color: theme.brandGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    paddingTop: 10,
  },
  priceLabel: {
    fontSize: 11,
    color: theme.textMuted,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.brandGreen,
  },
  mvfqValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.secondary[800],
  },
});
