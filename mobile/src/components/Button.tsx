import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { theme } from '../theme/tokens.js';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  disabled = false,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles: StyleProp<ViewStyle> = [
    styles.base,
    styles[size],
    styles[variant],
    fullWidth ? styles.fullWidth : null,
    isDisabled ? styles.disabled : null,
    style as ViewStyle,
  ];

  const textStyles: StyleProp<TextStyle> = [
    styles.textBase,
    styles[`${size}Text` as keyof typeof styles] as TextStyle,
    styles[`${variant}Text` as keyof typeof styles] as TextStyle,
    isDisabled ? styles.disabledText : null,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.neutral[0] : theme.brandGreen}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  // Sizes
  sm: {
    height: theme.components.button.height.sm,
    paddingHorizontal: theme.components.button.paddingHorizontal.sm,
  },
  md: {
    height: theme.components.button.height.md,
    paddingHorizontal: theme.components.button.paddingHorizontal.md,
  },
  lg: {
    height: theme.components.button.height.lg,
    paddingHorizontal: theme.components.button.paddingHorizontal.lg,
  },
  // Variants
  primary: {
    backgroundColor: theme.brandGreen,
  },
  secondary: {
    backgroundColor: theme.colors.secondary[500],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.brandGreen,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: theme.colors.interactive.disabled,
    borderColor: theme.colors.interactive.disabled,
  },
  // Text
  textBase: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  smText: {
    fontSize: theme.typography.fontSize.xs,
  },
  mdText: {
    fontSize: theme.typography.fontSize.sm,
  },
  lgText: {
    fontSize: theme.typography.fontSize.base,
  },
  primaryText: {
    color: theme.colors.neutral[0],
  },
  secondaryText: {
    color: theme.colors.neutral[900],
  },
  outlineText: {
    color: theme.brandGreen,
  },
  ghostText: {
    color: theme.brandGreen,
  },
  disabledText: {
    color: theme.colors.interactive.disabledText,
  },
});
