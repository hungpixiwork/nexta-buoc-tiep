import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

export type StatusType = 'in_progress' | 'upcoming' | 'completed' | 'verified' | 'warning';

interface StatusBadgeProps {
  label: string;
  type?: StatusType;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  type = 'in_progress',
  style,
}) => {
  const getBadgeStyle = () => {
    switch (type) {
      case 'in_progress':
        return { bg: '#DCEBFB', text: '#2F80ED' };
      case 'upcoming':
        return { bg: '#FDECCA', text: '#E8952F' };
      case 'completed':
        return { bg: '#D9ECD2', text: '#3D9E63' };
      case 'verified':
        return { bg: '#EEF7E6', text: '#4EA36B' };
      case 'warning':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#DCEBFB', text: '#2F80ED' };
    }
  };

  const colors = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
