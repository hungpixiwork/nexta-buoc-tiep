import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  totalSegments: number;
  activeSegments: number;
  activeColor?: string;
  inactiveColor?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalSegments,
  activeSegments,
  activeColor = '#2F80ED',
  inactiveColor = '#DBE6EF',
  height = 6,
}) => {
  const segments = Array.from({ length: totalSegments }, (_, i) => i < activeSegments);

  return (
    <View style={[styles.container, { height }]}>
      {segments.map((isActive, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            {
              backgroundColor: isActive ? activeColor : inactiveColor,
              borderRadius: height / 2,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
  },
  segment: {
    flex: 1,
  },
});
