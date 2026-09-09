import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { theme } from '../theme/tokens.js';

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption' | 'label';
  color?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export const Typography: React.FC<TextProps> = ({
  variant = 'body',
  color = theme.textPrimary,
  weight,
  align = 'left',
  style,
  children,
  ...rest
}) => {
  const variantStyle = styles[variant];
  const weightStyle = weight ? { fontWeight: theme.typography.fontWeight[weight] } : null;

  return (
    <RNText
      style={[
        variantStyle,
        { color, textAlign: align },
        weightStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

export const Price: React.FC<{
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  unit?: string;
}> = ({ amount, size = 'md', color = theme.textPrimary, unit }) => {
  const formatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);

  const fontSizes = {
    sm: theme.typography.fontSize.sm,
    md: theme.typography.fontSize.base,
    lg: theme.typography.fontSize.xl,
    xl: theme.typography.fontSize['2xl'],
  };

  return (
    <RNText style={[styles.price, { fontSize: fontSizes[size], color }]}>
      {formatted}
      {unit ? <RNText style={styles.unitText}> / {unit}</RNText> : null}
    </RNText>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: theme.typography.fontSize['3xl'],
    lineHeight: theme.typography.lineHeight['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
  },
  h2: {
    fontSize: theme.typography.fontSize['2xl'],
    lineHeight: theme.typography.lineHeight['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
  },
  h3: {
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  body: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.base,
    fontWeight: theme.typography.fontWeight.regular,
  },
  bodySm: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.regular,
  },
  caption: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  price: {
    fontWeight: theme.typography.fontWeight.bold,
  },
  unitText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.textSecondary,
  },
});
