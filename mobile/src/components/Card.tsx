import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../theme/tokens.js';

export interface CardProps extends ViewProps {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  elevated = false,
  style,
  children,
  ...rest
}) => {
  return (
    <View
      style={[
        styles.card,
        elevated ? styles.elevated : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.cardBg,
    borderRadius: theme.components.card.borderRadius,
    padding: theme.components.card.padding,
    borderWidth: 1,
    borderColor: theme.components.card.borderColor,
  },
  elevated: {
    ...theme.shadows.sm,
  },
});
