/**
 * STAPLE LIMITED — MVP Design Tokens (Spec §59)
 * Centralized, replaceable, mobile-first design token system.
 * Consumer brand: 'staple' (lowercase, clean, essential, accessible)
 */
export const colors = {
    // Brand Primary & Secondary
    primary: {
        50: '#F0FDF4',
        100: '#DCFCE7',
        200: '#BBF7D0',
        300: '#86EFAC',
        400: '#4ADE80',
        500: '#22C55E', // Brand Green (Growth, Agriculture, Prosperity)
        600: '#16A34A', // Primary button / interactive
        700: '#15803D', // Pressed state
        800: '#166534',
        900: '#14532D',
    },
    secondary: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        200: '#FDE68A',
        300: '#FCD34D',
        400: '#FBBF24',
        500: '#F59E0B', // Warm Amber (Harvest, Community, Festivity)
        600: '#D97706',
        700: '#B45309',
        800: '#92400E',
        900: '#78350F',
    },
    accent: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        500: '#3B82F6', // Trust Blue (Payments, Verification, Security)
        600: '#2563EB',
        700: '#1D4ED8',
    },
    // Neutral / Greyscale (Text, Backgrounds, Borders)
    neutral: {
        0: '#FFFFFF',
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
        950: '#030712',
    },
    // Semantic Feedback States
    success: {
        light: '#DEF7EC',
        main: '#0E9F6E',
        dark: '#03543F',
        contrastText: '#FFFFFF',
    },
    warning: {
        light: '#FDF6B2',
        main: '#C27803',
        dark: '#723B0A',
        contrastText: '#FFFFFF',
    },
    error: {
        light: '#FDE8E8',
        main: '#E02424',
        dark: '#9B1C1C',
        contrastText: '#FFFFFF',
    },
    info: {
        light: '#E1EFFE',
        main: '#1A56DB',
        dark: '#1E429F',
        contrastText: '#FFFFFF',
    },
    // Surfaces & Backgrounds
    surface: {
        background: '#F9FAFB',
        card: '#FFFFFF',
        modal: '#FFFFFF',
        elevated: '#FFFFFF',
        subtle: '#F3F4F6',
    },
    // Borders
    border: {
        subtle: '#E5E7EB',
        default: '#D1D5DB',
        focus: '#16A34A',
        error: '#E02424',
    },
    // Interactive
    interactive: {
        disabled: '#E5E7EB',
        disabledText: '#9CA3AF',
        hover: 'rgba(22, 163, 74, 0.08)',
        active: 'rgba(22, 163, 74, 0.16)',
    },
};
export const typography = {
    fontFamily: {
        sans: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },
    fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        heavy: '800',
    },
    lineHeight: {
        xs: 16,
        sm: 20,
        base: 24,
        lg: 28,
        xl: 28,
        '2xl': 32,
        '3xl': 36,
        '4xl': 40,
    },
};
export const spacing = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
};
export const borderRadius = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
};
export const shadows = {
    sm: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
};
// Predefined Component Tokens (Spec §59)
export const components = {
    button: {
        height: {
            sm: 36,
            md: 44,
            lg: 52,
        },
        paddingHorizontal: {
            sm: 12,
            md: 16,
            lg: 24,
        },
        borderRadius: borderRadius.lg,
    },
    input: {
        height: 48,
        paddingHorizontal: 16,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        fontSize: typography.fontSize.base,
    },
    card: {
        padding: spacing[4],
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface.card,
        borderColor: colors.border.subtle,
        borderWidth: 1,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: borderRadius.full,
        fontSize: typography.fontSize.xs,
    },
    navigation: {
        tabBarHeight: 64,
        headerHeight: 56,
    },
};
export const designTokens = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    components,
};
export default designTokens;
//# sourceMappingURL=designTokens.js.map