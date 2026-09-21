import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { theme } from '../theme/tokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused ? styles.focused : null,
          error ? styles.errorBorder : null,
          style,
        ]}
        placeholderTextColor={theme.colors.neutral[400]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...rest}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.spacing[4],
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.textPrimary,
    marginBottom: theme.spacing[1],
  },
  input: {
    height: theme.components.input.height,
    paddingHorizontal: theme.components.input.paddingHorizontal,
    borderRadius: theme.components.input.borderRadius,
    borderWidth: theme.components.input.borderWidth,
    borderColor: theme.borderDefault,
    backgroundColor: theme.colors.surface.card,
    fontSize: theme.components.input.fontSize,
    color: theme.textPrimary,
  },
  focused: {
    borderColor: theme.brandGreen,
    borderWidth: 1.5,
  },
  errorBorder: {
    borderColor: theme.colors.error.main,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error.main,
    marginTop: theme.spacing[1],
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.textMuted,
    marginTop: theme.spacing[1],
  },
});
