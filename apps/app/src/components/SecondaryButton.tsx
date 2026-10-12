import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'outline' | 'ghost' | 'soft';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  icon,
  variant = 'outline',
  style,
  textStyle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === 'outline' && styles.outline,
        variant === 'soft' && styles.soft,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2F80ED',
  },
  soft: {
    backgroundColor: '#E8F4FC',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  text: {
    color: '#2F80ED',
    fontSize: 15.5,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
