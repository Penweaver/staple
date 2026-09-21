/**
 * STAPLE LIMITED — ProductListScreen (Mobile)
 * Catalogue browsing with category filtering, search, and MVFQ visibility (Spec §10, §46, Addendum A1)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { theme } from '../theme/tokens';
import {
  Typography,
  Button,
  Card,
  Badge,
  Input,
  Header,
} from '../components/index';
import { formatNaira } from '@staple/shared';
import { useLocation } from '../services/location';

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  unit: string;
  basePrice: number;
  minTarget: number;
  maxTarget: number;
  mvfq: number;
  imageEmoji: string;
  description: string;
}

export const SEED_PRODUCTS: ProductItem[] = [
  {
    id: '00000000-0000-0000-0007-000000000001',
    name: 'Mama Gold Premium Parboiled Rice (50kg)',
    category: 'Grains & Flours',
    categoryId: 'grains-flours',
    unit: '50kg bag',
    basePrice: 85000,
    minTarget: 20,
    maxTarget: 200,
    mvfq: 20,
    imageEmoji: '🌾',
    description: 'Stone-free, high-grade long grain parboiled Nigerian rice in 50kg bag.',
  },
  {
    id: '00000000-0000-0000-0007-000000000002',
    name: 'Oloyin Honey Beans (50kg)',
    category: 'Grains & Flours',
    categoryId: 'grains-flours',
    unit: '50kg bag',
    basePrice: 75000,
    minTarget: 15,
    maxTarget: 150,
    mvfq: 15,
    imageEmoji: '🫘',
    description: 'Clean, sweet honey beans bag, freshly bagged from farmgate.',
  },
  {
    id: '00000000-0000-0000-0007-000000000003',
    name: 'Kings Pure Vegetable Cooking Oil (25L)',
    category: 'Oils & Condiments',
    categoryId: 'oils-condiments',
    unit: '25L keg',
    basePrice: 48000,
    minTarget: 20,
    maxTarget: 200,
    mvfq: 15,
    imageEmoji: '🛢️',
    description: 'Cholesterol-free, fortified vegetable oil keg.',
  },
  {
    id: '00000000-0000-0000-0007-000000000004',
    name: 'White Garri Ijebu (50kg Bag)',
    category: 'Grains & Flours',
    categoryId: 'grains-flours',
    unit: '50kg bag',
    basePrice: 32000,
    minTarget: 15,
    maxTarget: 100,
    mvfq: 10,
    imageEmoji: '🥣',
    description: 'Crisp, well-fermented, sand-free Ijebu garri bag.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'grains-flours', label: '🌾 Grains & Flours' },
  { id: 'oils-condiments', label: '🛢️ Oils & Condiments' },
];

export interface ProductListScreenProps {
  onSelectProduct: (productId: string) => void;
  onOpenLocationSelect?: () => void;
  onOpenBaskets?: () => void;
}

export const ProductListScreen: React.FC<ProductListScreenProps> = ({
  onSelectProduct,
  onOpenLocationSelect,
  onOpenBaskets,
}) => {
  const { shortLabel } = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = SEED_PRODUCTS.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Top Location Bar */}
      <TouchableOpacity
        style={styles.locationBar}
        onPress={onOpenLocationSelect}
        activeOpacity={0.8}
      >
        <Text style={styles.locationPin}>📍</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.locationPrompt}>Delivering to</Text>
          <Text style={styles.locationName} numberOfLines={1}>
            {shortLabel} ▾
          </Text>
        </View>
        <Badge label="Change" variant="neutral" />
      </TouchableOpacity>

      <Header title="Catalogue & Essentials" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search rice, beans, garri, oils..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Pills & Curated Baskets Shortcut */}
      <View style={styles.categoryRowWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {onOpenBaskets && (
            <TouchableOpacity
              onPress={onOpenBaskets}
              style={[styles.categoryPill, styles.basketShortcutPill]}
            >
              <Text style={styles.basketShortcutText}>🧺 Curated Baskets ➔</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.productCard}>
            <TouchableOpacity
              onPress={() => onSelectProduct(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.imageBox}>
                  <Text style={styles.imageEmoji}>{item.imageEmoji}</Text>
                </View>

                <View style={styles.cardInfo}>
                  <Badge label={item.category} variant="neutral" />
                  <Typography variant="h3" style={{ marginTop: 4 }}>
                    {item.name}
                  </Typography>
                  <Text style={styles.unitText}>{item.unit}</Text>
                </View>
              </View>

              <Text style={styles.descText} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>Base Single Price</Text>
                  <Text style={styles.priceAmount}>{formatNaira(item.basePrice)}</Text>
                </View>

                <View style={styles.mvfqTag}>
                  <Text style={styles.mvfqLabel}>Min Bulk MOQ (MVFQ)</Text>
                  <Text style={styles.mvfqValue}>{item.mvfq} units</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <Button
                  title="View Details"
                  variant="outline"
                  size="sm"
                  onPress={() => onSelectProduct(item.id)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Start Group Buy"
                  variant="primary"
                  size="sm"
                  onPress={() => onSelectProduct(item.id)}
                  style={{ flex: 1 }}
                />
              </View>
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
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  locationPin: {
    fontSize: 20,
    marginRight: 10,
  },
  locationPrompt: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  locationName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.brandGreen,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryRowWrapper: {
    marginBottom: 12,
  },
  categoryRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.borderDefault,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: theme.brandGreen,
    borderColor: theme.brandGreen,
  },
  categoryText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  basketShortcutPill: {
    backgroundColor: theme.colors.secondary[50],
    borderColor: theme.colors.secondary[400],
  },
  basketShortcutText: {
    fontSize: 13,
    color: theme.colors.secondary[900],
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  productCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  imageBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  imageEmoji: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
  },
  unitText: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  descText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.subtle,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 11,
    color: theme.textMuted,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.brandGreen,
  },
  mvfqTag: {
    alignItems: 'flex-end',
  },
  mvfqLabel: {
    fontSize: 10,
    color: theme.textMuted,
  },
  mvfqValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.secondary[700],
  },
  cardActions: {
    flexDirection: 'row',
  },
});
