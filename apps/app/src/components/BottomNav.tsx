import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
// Theme-only subpath: the package root also re-exports docx/zod logic Metro would bundle.
import { themeColors } from '@buoc-tiep/shared/src/theme';

export interface BottomNavProps {
  activeTab: number;
  onTabChange: (index: number) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  const getTabColor = (index: number) => (activeTab === index ? themeColors.accentBlue : themeColors.textMuted);
  const getFontWeight = (index: number) => (activeTab === index ? '700' : '600');

  return (
    <View style={styles.container}>
      {/* 1. Hôm nay */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabChange(0)}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 0 }}
        accessibilityLabel={t('components.bottomNav.tabTodayA11y')}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill={getTabColor(0)}>
          <Path d="M12 3.2 3 11h2.2v9.2h4.5v-5.6h4.6v5.6h4.5V11H21z" />
        </Svg>
        <Text style={[styles.tabLabel, { color: getTabColor(0), fontWeight: getFontWeight(0) }]}>
          {t('components.bottomNav.tabToday')}
        </Text>
      </TouchableOpacity>

      {/* 2. Hành trình */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabChange(1)}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 1 }}
        accessibilityLabel={t('components.bottomNav.tabJourneyA11y')}
      >
        <Svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke={getTabColor(1)}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M8 4a3 3 0 0 1 3 3c0 2-3 5-3 5S5 9 5 7a3 3 0 0 1 3-3Z" />
          <Path d="M16 12a3 3 0 0 1 3 3c0 2-3 5-3 5s-3-3-3-5a3 3 0 0 1 3-3Z" />
          <Path d="M10.5 6.5H14a2.5 2.5 0 0 1 0 5h-1" strokeDasharray="1.5 2" />
        </Svg>
        <Text style={[styles.tabLabel, { color: getTabColor(1), fontWeight: getFontWeight(1) }]}>
          {t('components.bottomNav.tabJourney')}
        </Text>
      </TouchableOpacity>

      {/* 3. Đội */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabChange(2)}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 2 }}
        accessibilityLabel={t('components.bottomNav.tabTeamA11y')}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill={getTabColor(2)}>
          <Circle cx={8.5} cy={8} r={3} />
          <Circle cx={16} cy={9.2} r={2.4} />
          <Path d="M2.5 20c0-3.3 2.7-6 6-6s6 2.7 6 6z" />
          <Path d="M14.6 20c0-2.6 1.6-4.8 4-5.6 2.6.5 4.4 2.8 4.4 5.6z" />
        </Svg>
        <Text style={[styles.tabLabel, { color: getTabColor(2), fontWeight: getFontWeight(2) }]}>
          {t('components.bottomNav.tabTeam')}
        </Text>
      </TouchableOpacity>

      {/* 4. Thêm */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabChange(3)}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 3 }}
        accessibilityLabel={t('components.bottomNav.tabMoreA11y', 'Thêm')}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill={getTabColor(3)}>
          <Circle cx={5} cy={12} r={2} />
          <Circle cx={12} cy={12} r={2} />
          <Circle cx={19} cy={12} r={2} />
        </Svg>
        <Text style={[styles.tabLabel, { color: getTabColor(3), fontWeight: getFontWeight(3) }]}>
          {t('components.bottomNav.tabMore', 'Thêm')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 64,
    minHeight: 44,
  },
  tabLabel: {
    fontSize: 11.5,
    textAlign: 'center',
  },
});
