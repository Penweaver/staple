import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/tokens.js';
import { Button } from './Button.js';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          fullWidth={false}
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[8],
    marginVertical: theme.spacing[6],
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.textPrimary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.sm,
    marginBottom: theme.spacing[4],
  },
  actionButton: {
    minWidth: 140,
  },
});
