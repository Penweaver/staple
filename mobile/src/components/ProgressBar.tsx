import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/tokens';

export interface ProgressBarProps {
  paidQuantity: number;
  targetQuantity: number;
  minFulfilmentQuantity?: number; // MVFQ (Addendum A1)
  unit?: string;
  showLabels?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  paidQuantity,
  targetQuantity,
  minFulfilmentQuantity,
  unit = 'units',
  showLabels = true,
}) => {
  const percentage = Math.min(100, Math.round((paidQuantity / targetQuantity) * 100));
  const mvfqPercentage = minFulfilmentQuantity
    ? Math.min(100, Math.round((minFulfilmentQuantity / targetQuantity) * 100))
    : null;

  const isTargetReached = paidQuantity >= targetQuantity;
  const isMvfqReached = minFulfilmentQuantity ? paidQuantity >= minFulfilmentQuantity : false;

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.labelRow}>
          <Text style={styles.countText}>
            <Text style={styles.bold}>{paidQuantity}</Text> / {targetQuantity} {unit}
          </Text>
          <Text style={[styles.percentText, isTargetReached && styles.percentReached]}>
            {percentage}%
          </Text>
        </View>
      )}

      <View style={styles.track}>
        {/* Progress fill */}
        <View
          style={[
            styles.fill,
            { width: `${percentage}%` },
            isTargetReached ? styles.fillComplete : null,
          ]}
        />

        {/* MVFQ threshold indicator line if applicable */}
        {mvfqPercentage !== null && (
          <View
            style={[
              styles.mvfqMarker,
              { left: `${mvfqPercentage}%` },
              isMvfqReached ? styles.mvfqMarkerMet : null,
            ]}
          />
        )}
      </View>

      {minFulfilmentQuantity && showLabels && (
        <View style={styles.mvfqLabelRow}>
          <Text style={styles.mvfqNote}>
            Min. required to ship: {minFulfilmentQuantity} {unit}
            {isMvfqReached ? ' ✓' : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: theme.spacing[2],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  countText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.textSecondary,
  },
  bold: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.textPrimary,
  },
  percentText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.brandGreen,
  },
  percentReached: {
    color: theme.colors.success.main,
  },
  track: {
    height: 10,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.brandGreen,
    borderRadius: theme.borderRadius.full,
  },
  fillComplete: {
    backgroundColor: theme.colors.success.main,
  },
  mvfqMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: theme.colors.warning.main,
  },
  mvfqMarkerMet: {
    backgroundColor: theme.colors.success.dark,
  },
  mvfqLabelRow: {
    marginTop: theme.spacing[1],
  },
  mvfqNote: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.textMuted,
  },
});
