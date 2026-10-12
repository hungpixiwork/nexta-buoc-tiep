import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';

interface InfoCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  borderRadius?: number;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  children,
  style,
  onPress,
  borderRadius = 18,
}) => {
  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.card, { borderRadius }, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, { borderRadius }, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
});
