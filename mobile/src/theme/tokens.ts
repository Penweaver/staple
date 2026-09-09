/**
 * STAPLE LIMITED — Mobile Theme Adapter (Spec §59)
 * Maps centralized design tokens into React Native StyleSheet primitives.
 */

import { designTokens, colors, typography, spacing, borderRadius, shadows, components } from '@staple/shared';

export { colors, typography, spacing, borderRadius, shadows, components };

export const theme = {
  ...designTokens,
  // High-frequency color shortcuts
  bg: colors.surface.background,
  cardBg: colors.surface.card,
  textPrimary: colors.neutral[900],
  textSecondary: colors.neutral[600],
  textMuted: colors.neutral[400],
  brandGreen: colors.primary[600],
  brandGreenDark: colors.primary[700],
  borderDefault: colors.border.default,
  borderSubtle: colors.border.subtle,
};

export default theme;
