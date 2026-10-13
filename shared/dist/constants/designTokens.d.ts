/**
 * STAPLE LIMITED — MVP Design Tokens (Spec §59)
 * Centralized, replaceable, mobile-first design token system.
 * Consumer brand: 'staple' (lowercase, clean, essential, accessible)
 */
export declare const colors: {
    readonly primary: {
        readonly 50: "#F0FDF4";
        readonly 100: "#DCFCE7";
        readonly 200: "#BBF7D0";
        readonly 300: "#86EFAC";
        readonly 400: "#4ADE80";
        readonly 500: "#22C55E";
        readonly 600: "#16A34A";
        readonly 700: "#15803D";
        readonly 800: "#166534";
        readonly 900: "#14532D";
    };
    readonly secondary: {
        readonly 50: "#FFFBEB";
        readonly 100: "#FEF3C7";
        readonly 200: "#FDE68A";
        readonly 300: "#FCD34D";
        readonly 400: "#FBBF24";
        readonly 500: "#F59E0B";
        readonly 600: "#D97706";
        readonly 700: "#B45309";
        readonly 800: "#92400E";
        readonly 900: "#78350F";
    };
    readonly accent: {
        readonly 50: "#EFF6FF";
        readonly 100: "#DBEAFE";
        readonly 500: "#3B82F6";
        readonly 600: "#2563EB";
        readonly 700: "#1D4ED8";
    };
    readonly neutral: {
        readonly 0: "#FFFFFF";
        readonly 50: "#F9FAFB";
        readonly 100: "#F3F4F6";
        readonly 200: "#E5E7EB";
        readonly 300: "#D1D5DB";
        readonly 400: "#9CA3AF";
        readonly 500: "#6B7280";
        readonly 600: "#4B5563";
        readonly 700: "#374151";
        readonly 800: "#1F2937";
        readonly 900: "#111827";
        readonly 950: "#030712";
    };
    readonly success: {
        readonly light: "#DEF7EC";
        readonly main: "#0E9F6E";
        readonly dark: "#03543F";
        readonly contrastText: "#FFFFFF";
    };
    readonly warning: {
        readonly light: "#FDF6B2";
        readonly main: "#C27803";
        readonly dark: "#723B0A";
        readonly contrastText: "#FFFFFF";
    };
    readonly error: {
        readonly light: "#FDE8E8";
        readonly main: "#E02424";
        readonly dark: "#9B1C1C";
        readonly contrastText: "#FFFFFF";
    };
    readonly info: {
        readonly light: "#E1EFFE";
        readonly main: "#1A56DB";
        readonly dark: "#1E429F";
        readonly contrastText: "#FFFFFF";
    };
    readonly surface: {
        readonly background: "#F9FAFB";
        readonly card: "#FFFFFF";
        readonly modal: "#FFFFFF";
        readonly elevated: "#FFFFFF";
        readonly subtle: "#F3F4F6";
    };
    readonly border: {
        readonly subtle: "#E5E7EB";
        readonly default: "#D1D5DB";
        readonly focus: "#16A34A";
        readonly error: "#E02424";
    };
    readonly interactive: {
        readonly disabled: "#E5E7EB";
        readonly disabledText: "#9CA3AF";
        readonly hover: "rgba(22, 163, 74, 0.08)";
        readonly active: "rgba(22, 163, 74, 0.16)";
    };
};
export declare const typography: {
    readonly fontFamily: {
        readonly sans: "System, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif";
        readonly mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    };
    readonly fontSize: {
        readonly xs: 12;
        readonly sm: 14;
        readonly base: 16;
        readonly lg: 18;
        readonly xl: 20;
        readonly '2xl': 24;
        readonly '3xl': 30;
        readonly '4xl': 36;
    };
    readonly fontWeight: {
        readonly regular: "400";
        readonly medium: "500";
        readonly semibold: "600";
        readonly bold: "700";
        readonly heavy: "800";
    };
    readonly lineHeight: {
        readonly xs: 16;
        readonly sm: 20;
        readonly base: 24;
        readonly lg: 28;
        readonly xl: 28;
        readonly '2xl': 32;
        readonly '3xl': 36;
        readonly '4xl': 40;
    };
};
export declare const spacing: {
    readonly 0: 0;
    readonly 1: 4;
    readonly 2: 8;
    readonly 3: 12;
    readonly 4: 16;
    readonly 5: 20;
    readonly 6: 24;
    readonly 8: 32;
    readonly 10: 40;
    readonly 12: 48;
    readonly 16: 64;
};
export declare const borderRadius: {
    readonly none: 0;
    readonly sm: 4;
    readonly md: 8;
    readonly lg: 12;
    readonly xl: 16;
    readonly '2xl': 24;
    readonly full: 9999;
};
export declare const shadows: {
    readonly sm: {
        readonly shadowColor: "#000000";
        readonly shadowOffset: {
            readonly width: 0;
            readonly height: 1;
        };
        readonly shadowOpacity: 0.05;
        readonly shadowRadius: 2;
        readonly elevation: 1;
    };
    readonly md: {
        readonly shadowColor: "#000000";
        readonly shadowOffset: {
            readonly width: 0;
            readonly height: 2;
        };
        readonly shadowOpacity: 0.08;
        readonly shadowRadius: 4;
        readonly elevation: 2;
    };
    readonly lg: {
        readonly shadowColor: "#000000";
        readonly shadowOffset: {
            readonly width: 0;
            readonly height: 4;
        };
        readonly shadowOpacity: 0.12;
        readonly shadowRadius: 8;
        readonly elevation: 4;
    };
};
export declare const components: {
    readonly button: {
        readonly height: {
            readonly sm: 36;
            readonly md: 44;
            readonly lg: 52;
        };
        readonly paddingHorizontal: {
            readonly sm: 12;
            readonly md: 16;
            readonly lg: 24;
        };
        readonly borderRadius: 12;
    };
    readonly input: {
        readonly height: 48;
        readonly paddingHorizontal: 16;
        readonly borderRadius: 8;
        readonly borderWidth: 1;
        readonly fontSize: 16;
    };
    readonly card: {
        readonly padding: 16;
        readonly borderRadius: 16;
        readonly backgroundColor: "#FFFFFF";
        readonly borderColor: "#E5E7EB";
        readonly borderWidth: 1;
    };
    readonly badge: {
        readonly paddingVertical: 4;
        readonly paddingHorizontal: 8;
        readonly borderRadius: 9999;
        readonly fontSize: 12;
    };
    readonly navigation: {
        readonly tabBarHeight: 64;
        readonly headerHeight: 56;
    };
};
export declare const designTokens: {
    readonly colors: {
        readonly primary: {
            readonly 50: "#F0FDF4";
            readonly 100: "#DCFCE7";
            readonly 200: "#BBF7D0";
            readonly 300: "#86EFAC";
            readonly 400: "#4ADE80";
            readonly 500: "#22C55E";
            readonly 600: "#16A34A";
            readonly 700: "#15803D";
            readonly 800: "#166534";
            readonly 900: "#14532D";
        };
        readonly secondary: {
            readonly 50: "#FFFBEB";
            readonly 100: "#FEF3C7";
            readonly 200: "#FDE68A";
            readonly 300: "#FCD34D";
            readonly 400: "#FBBF24";
            readonly 500: "#F59E0B";
            readonly 600: "#D97706";
            readonly 700: "#B45309";
            readonly 800: "#92400E";
            readonly 900: "#78350F";
        };
        readonly accent: {
            readonly 50: "#EFF6FF";
            readonly 100: "#DBEAFE";
            readonly 500: "#3B82F6";
            readonly 600: "#2563EB";
            readonly 700: "#1D4ED8";
        };
        readonly neutral: {
            readonly 0: "#FFFFFF";
            readonly 50: "#F9FAFB";
            readonly 100: "#F3F4F6";
            readonly 200: "#E5E7EB";
            readonly 300: "#D1D5DB";
            readonly 400: "#9CA3AF";
            readonly 500: "#6B7280";
            readonly 600: "#4B5563";
            readonly 700: "#374151";
            readonly 800: "#1F2937";
            readonly 900: "#111827";
            readonly 950: "#030712";
        };
        readonly success: {
            readonly light: "#DEF7EC";
            readonly main: "#0E9F6E";
            readonly dark: "#03543F";
            readonly contrastText: "#FFFFFF";
        };
        readonly warning: {
            readonly light: "#FDF6B2";
            readonly main: "#C27803";
            readonly dark: "#723B0A";
            readonly contrastText: "#FFFFFF";
        };
        readonly error: {
            readonly light: "#FDE8E8";
            readonly main: "#E02424";
            readonly dark: "#9B1C1C";
            readonly contrastText: "#FFFFFF";
        };
        readonly info: {
            readonly light: "#E1EFFE";
            readonly main: "#1A56DB";
            readonly dark: "#1E429F";
            readonly contrastText: "#FFFFFF";
        };
        readonly surface: {
            readonly background: "#F9FAFB";
            readonly card: "#FFFFFF";
            readonly modal: "#FFFFFF";
            readonly elevated: "#FFFFFF";
            readonly subtle: "#F3F4F6";
        };
        readonly border: {
            readonly subtle: "#E5E7EB";
            readonly default: "#D1D5DB";
            readonly focus: "#16A34A";
            readonly error: "#E02424";
        };
        readonly interactive: {
            readonly disabled: "#E5E7EB";
            readonly disabledText: "#9CA3AF";
            readonly hover: "rgba(22, 163, 74, 0.08)";
            readonly active: "rgba(22, 163, 74, 0.16)";
        };
    };
    readonly typography: {
        readonly fontFamily: {
            readonly sans: "System, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif";
            readonly mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        };
        readonly fontSize: {
            readonly xs: 12;
            readonly sm: 14;
            readonly base: 16;
            readonly lg: 18;
            readonly xl: 20;
            readonly '2xl': 24;
            readonly '3xl': 30;
            readonly '4xl': 36;
        };
        readonly fontWeight: {
            readonly regular: "400";
            readonly medium: "500";
            readonly semibold: "600";
            readonly bold: "700";
            readonly heavy: "800";
        };
        readonly lineHeight: {
            readonly xs: 16;
            readonly sm: 20;
            readonly base: 24;
            readonly lg: 28;
            readonly xl: 28;
            readonly '2xl': 32;
            readonly '3xl': 36;
            readonly '4xl': 40;
        };
    };
    readonly spacing: {
        readonly 0: 0;
        readonly 1: 4;
        readonly 2: 8;
        readonly 3: 12;
        readonly 4: 16;
        readonly 5: 20;
        readonly 6: 24;
        readonly 8: 32;
        readonly 10: 40;
        readonly 12: 48;
        readonly 16: 64;
    };
    readonly borderRadius: {
        readonly none: 0;
        readonly sm: 4;
        readonly md: 8;
        readonly lg: 12;
        readonly xl: 16;
        readonly '2xl': 24;
        readonly full: 9999;
    };
    readonly shadows: {
        readonly sm: {
            readonly shadowColor: "#000000";
            readonly shadowOffset: {
                readonly width: 0;
                readonly height: 1;
            };
            readonly shadowOpacity: 0.05;
            readonly shadowRadius: 2;
            readonly elevation: 1;
        };
        readonly md: {
            readonly shadowColor: "#000000";
            readonly shadowOffset: {
                readonly width: 0;
                readonly height: 2;
            };
            readonly shadowOpacity: 0.08;
            readonly shadowRadius: 4;
            readonly elevation: 2;
        };
        readonly lg: {
            readonly shadowColor: "#000000";
            readonly shadowOffset: {
                readonly width: 0;
                readonly height: 4;
            };
            readonly shadowOpacity: 0.12;
            readonly shadowRadius: 8;
            readonly elevation: 4;
        };
    };
    readonly components: {
        readonly button: {
            readonly height: {
                readonly sm: 36;
                readonly md: 44;
                readonly lg: 52;
            };
            readonly paddingHorizontal: {
                readonly sm: 12;
                readonly md: 16;
                readonly lg: 24;
            };
            readonly borderRadius: 12;
        };
        readonly input: {
            readonly height: 48;
            readonly paddingHorizontal: 16;
            readonly borderRadius: 8;
            readonly borderWidth: 1;
            readonly fontSize: 16;
        };
        readonly card: {
            readonly padding: 16;
            readonly borderRadius: 16;
            readonly backgroundColor: "#FFFFFF";
            readonly borderColor: "#E5E7EB";
            readonly borderWidth: 1;
        };
        readonly badge: {
            readonly paddingVertical: 4;
            readonly paddingHorizontal: 8;
            readonly borderRadius: 9999;
            readonly fontSize: 12;
        };
        readonly navigation: {
            readonly tabBarHeight: 64;
            readonly headerHeight: 56;
        };
    };
};
export default designTokens;
//# sourceMappingURL=designTokens.d.ts.map