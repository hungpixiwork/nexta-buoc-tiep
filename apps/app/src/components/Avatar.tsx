import React from 'react';
import { TouchableOpacity, StyleSheet, Image, View } from 'react-native';

interface AvatarProps {
  onPress?: () => void;
  imageSource?: any;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ onPress, imageSource, size = 44 }) => {
  const source = imageSource || require('../../assets/mockup_assets/avatar-hung.jpg');

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#cde4f7',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#1f508c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
});

