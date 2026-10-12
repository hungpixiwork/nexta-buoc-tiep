import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Logo } from './Logo';
import { Avatar } from './Avatar';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  onAvatarPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  onBack,
  onAvatarPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#16375d" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </TouchableOpacity>
        )}
        <Logo />
      </View>
      <Avatar onPress={onAvatarPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    shadowColor: '#1f508c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
