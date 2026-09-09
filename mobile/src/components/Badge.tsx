import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/tokens.js';
import { GroupBuyStatus, OrderStatus } from '@staple/shared';

export interface BadgeProps {
  label?: string;
  status?: GroupBuyStatus | OrderStatus | string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ label, status, variant }) => {
  // Infer variant and label from canonical status if not provided directly
  let computedVariant = variant || 'neutral';
  let computedLabel = label || status || '';

  if (status) {
    switch (status) {
      case GroupBuyStatus.LIVE:
        computedVariant = 'success';
        computedLabel = 'LIVE';
        break;
      case GroupBuyStatus.PENDING_ACTIVATION:
        computedVariant = 'warning';
        computedLabel = 'Pending Activation';
        break;
      case GroupBuyStatus.TARGET_REACHED:
        computedVariant = 'info';
        computedLabel = 'Target Reached';
        break;
      case GroupBuyStatus.DELIVERY_FULFILMENT:
        computedVariant = 'info';
        computedLabel = 'In Fulfilment';
        break;
      case GroupBuyStatus.COMPLETED:
        computedVariant = 'success';
        computedLabel = 'Completed';
        break;
      case GroupBuyStatus.CLOSED:
        computedVariant = 'neutral';
        computedLabel = 'Closed';
        break;
      case OrderStatus.PAID:
        computedVariant = 'success';
        computedLabel = 'Paid';
        break;
      case OrderStatus.PENDING:
        computedVariant = 'warning';
        computedLabel = 'Pending';
        break;
      case OrderStatus.REFUNDED:
        computedVariant = 'error';
        computedLabel = 'Refunded';
        break;
    }
  }

  const bgStyle = styles[`${computedVariant}Bg` as keyof typeof styles];
  const textStyle = styles[`${computedVariant}Text` as keyof typeof styles];

  return (
    <View style={[styles.badge, bgStyle]}>
      <Text style={[styles.label, textStyle]}>{computedLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: theme.components.badge.paddingVertical,
    paddingHorizontal: theme.components.badge.paddingHorizontal,
    borderRadius: theme.components.badge.borderRadius,
  },
  label: {
    fontSize: theme.components.badge.fontSize,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  successBg: {
    backgroundColor: theme.colors.success.light,
  },
  successText: {
    color: theme.colors.success.dark,
  },
  warningBg: {
    backgroundColor: theme.colors.warning.light,
  },
  warningText: {
    color: theme.colors.warning.dark,
  },
  errorBg: {
    backgroundColor: theme.colors.error.light,
  },
  errorText: {
    color: theme.colors.error.dark,
  },
  infoBg: {
    backgroundColor: theme.colors.info.light,
  },
  infoText: {
    color: theme.colors.info.dark,
  },
  neutralBg: {
    backgroundColor: theme.colors.neutral[100],
  },
  neutralText: {
    color: theme.colors.neutral[700],
  },
});
