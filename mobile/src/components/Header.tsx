import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme/tokens.js';

export interface HeaderProps {
  locationName?: string;
  onLocationPress?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  locationName = 'Lekki Phase 1, Lagos',
  onLocationPress,
  title = 'staple',
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.brandTitle}>{title}</Text>
      </View>

      <TouchableOpacity
        style={styles.locationBadge}
        onPress={onLocationPress}
        activeOpacity={0.7}
      >
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText} numberOfLines={1}>
          {locationName}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: theme.components.navigation.headerHeight,
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.surface.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.heavy,
    color: theme.brandGreen,
    letterSpacing: -0.5,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    maxWidth: 200,
  },
  locationIcon: {
    fontSize: theme.typography.fontSize.xs,
    marginRight: theme.spacing[1],
  },
  locationText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.textPrimary,
    flexShrink: 1,
  },
  chevron: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.textSecondary,
    marginLeft: theme.spacing[1],
  },
});
