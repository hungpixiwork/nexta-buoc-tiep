import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

export interface SafetyPrincipleItem {
  id: string;
  level: 'danger' | 'warning' | 'safe';
  titleKey: string;
  descKey: string;
}

const PRINCIPLE_CONFIG: SafetyPrincipleItem[] = [
  {
    id: 'principle-1',
    level: 'danger',
    titleKey: 'components.safetyChecklist.p1Title',
    descKey: 'components.safetyChecklist.p1Desc',
  },
  {
    id: 'principle-2',
    level: 'warning',
    titleKey: 'components.safetyChecklist.p2Title',
    descKey: 'components.safetyChecklist.p2Desc',
  },
  {
    id: 'principle-3',
    level: 'safe',
    titleKey: 'components.safetyChecklist.p3Title',
    descKey: 'components.safetyChecklist.p3Desc',
  },
];

export const SafetyChecklist: React.FC = () => {
  const { t } = useTranslation();

  const getBadgeStyle = (level: SafetyPrincipleItem['level']) => {
    switch (level) {
      case 'danger':
        return {
          cardBg: '#FEF2F2',
          borderColor: '#FECACA',
          iconBg: '#FEE2E2',
          iconColor: '#DC2626',
          titleColor: '#991B1B',
        };
      case 'warning':
        return {
          cardBg: '#FEFCE8',
          borderColor: '#FEF08A',
          iconBg: '#FEF9C3',
          iconColor: '#D97706',
          titleColor: '#854D0E',
        };
      case 'safe':
        return {
          cardBg: '#F0FDF4',
          borderColor: '#BBF7D0',
          iconBg: '#DCFCE7',
          iconColor: '#16A34A',
          titleColor: '#166534',
        };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('components.safetyChecklist.sectionTitle')}</Text>
      <View style={styles.listGroup}>
        {PRINCIPLE_CONFIG.map((item) => {
          const theme = getBadgeStyle(item.level);
          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: theme.iconBg }]}>
                {item.level === 'danger' && (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.iconColor} strokeWidth={2.4}>
                    <Path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx={12} cy={12} r={9} />
                  </Svg>
                )}
                {item.level === 'warning' && (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.iconColor} strokeWidth={2.4}>
                    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
                {item.level === 'safe' && (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.iconColor} strokeWidth={2.4}>
                    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </View>

              <View style={styles.textGroup}>
                <Text style={[styles.itemTitle, { color: theme.titleColor }]}>
                  {t(item.titleKey)}
                </Text>
                <Text style={styles.itemDesc}>{t(item.descKey)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  listGroup: {
    gap: 12,
  },
  itemCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textGroup: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
});
