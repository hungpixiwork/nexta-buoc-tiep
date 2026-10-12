import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import type { PriorityNeedKey } from '@buoc-tiep/shared';
import { Header } from '../components/Header';
import { apiService } from '../services/api';

interface PriorityOption {
  key: PriorityNeedKey;
  labelKey: string;
  renderIcon: (color: string) => React.ReactNode;
}

const PRIORITIES: PriorityOption[] = [
  {
    key: 'health',
    labelKey: 'priority.options.health',
    renderIcon: (color) => (
      <Svg width={27} height={27} viewBox="0 0 24 24">
        <Path
          d="M12 20.5S4 15 4 9.5A4 4 0 0 1 12 7a4 4 0 0 1 8 2.5c0 5.5-8 11-8 11Z"
          fill="#c5ddf7"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <Path
          d="M6.5 11.5h2.6l1.4-2.8 2 4.8 1.3-2.2h3.4"
          fill="none"
          stroke={color}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    key: 'papers',
    labelKey: 'priority.options.papers',
    renderIcon: (color) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M7 3h7l4 4v14H7z" />
        <Path d="M14 3v4h4" />
        <Path d="M9.5 12h5M9.5 15.5h5" />
      </Svg>
    ),
  },
  {
    key: 'safe',
    labelKey: 'priority.options.safe',
    renderIcon: (color) => (
      <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 11l8-6.5 8 6.5" />
        <Path d="M6 10v9h12v-9" />
      </Svg>
    ),
  },
  {
    key: 'edu',
    labelKey: 'priority.options.edu',
    renderIcon: (color) => (
      <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 6.5C10.5 5 8 4.5 4 5v13c4-.5 6.5 0 8 1.5 1.5-1.5 4-2 8-1.5V5c-4-.5-6.5 0-8 1.5Z" />
        <Path d="M12 6.5v13" />
      </Svg>
    ),
  },
  {
    key: 'protect',
    labelKey: 'priority.options.protect',
    renderIcon: (color) => (
      <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
        <Circle cx={12} cy={10.5} r={2.2} />
        <Path d="M8.5 16c.5-2 2-3 3.5-3s3 1 3.5 3" />
      </Svg>
    ),
  },
  {
    key: 'job',
    labelKey: 'priority.options.job',
    renderIcon: (color) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <Rect x={3} y={7.5} width={18} height={12} rx={2} />
        <Path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
        <Path d="M3 12.5h18" />
      </Svg>
    ),
  },
];

interface PrioritySelectionScreenProps {
  selectedPriority?: PriorityNeedKey;
  onSelectPriority?: (key: PriorityNeedKey | 'expert') => void;
  onConfirm?: () => void;
  onBack?: () => void;
  onAvatarPress?: () => void;
}

export const PrioritySelectionScreen: React.FC<PrioritySelectionScreenProps> = ({
  selectedPriority: initialPriority = 'health',
  onSelectPriority,
  onConfirm,
  onBack,
  onAvatarPress,
}) => {
  const { t } = useTranslation();
  const [internalSelected, setInternalSelected] = useState<PriorityNeedKey | 'expert'>(initialPriority);
  const [casesCount, setCasesCount] = useState<number>(0);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(false);

  const currentSelected = internalSelected;

  useEffect(() => {
    let active = true;
    setIsLoadingCases(true);
    apiService.getCases(currentSelected)
      .then((res) => {
        if (active && res.success && Array.isArray(res.data)) {
          setCasesCount(res.data.length);
        }
      })
      .catch((err) => {
        console.warn('[PrioritySelectionScreen] Fetch D1 cases failed:', err);
      })
      .finally(() => {
        if (active) setIsLoadingCases(false);
      });
    return () => { active = false; };
  }, [currentSelected]);

  const handleSelect = (key: PriorityNeedKey | 'expert') => {
    setInternalSelected(key);
    if (onSelectPriority) {
      onSelectPriority(key);
    }
  };

  const getSelectedLabel = () => {
    if (currentSelected === 'expert') return t('priority.options.expert');
    const found = PRIORITIES.find((p) => p.key === currentSelected);
    return found ? t(found.labelKey) : t('priority.options.health');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header Bar */}
      <Header showBack={!!onBack} onBack={onBack} onAvatarPress={onAvatarPress} />

      {/* Screen Subtitle & Title */}
      <View style={styles.headerTitleGroup}>
        <Text style={styles.badgeText}>
          {t('priority.header.badge')} <Text style={styles.badgeSub}>{t('priority.header.badgeSub')}</Text>
        </Text>
        <Text style={styles.title}>
          {t('priority.header.title')}
        </Text>
      </View>

      {/* 3-Column Priority Grid */}
      <View style={styles.grid}>
        {PRIORITIES.map((item) => {
          const isSelected = currentSelected === item.key;
          const itemLabel = t(item.labelKey);
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.gridItem,
                isSelected && styles.gridItemSelected,
              ]}
              onPress={() => handleSelect(item.key)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('priority.accessibility.itemLabel', { label: itemLabel })}
            >
              {/* Tint Overlay Background */}
              {isSelected && <View style={styles.selectedTint} />}

              {/* Tick Mark Badge Top-Right */}
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M5 13l4 4 10-11" />
                  </Svg>
                </View>
              )}

              {/* Icon Circle */}
              <View style={styles.itemIconCircle}>
                {item.renderIcon('#2F80ED')}
              </View>

              {/* Label */}
              <Text style={styles.itemLabel}>
                {itemLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Special Option: Có người chuyên môn hỗ trợ */}
      <TouchableOpacity
        style={[
          styles.expertItem,
          currentSelected === 'expert' && styles.expertItemSelected,
        ]}
        onPress={() => handleSelect('expert')}
        activeOpacity={0.75}
      >
        {currentSelected === 'expert' && <View style={styles.selectedTint} />}
        <View style={styles.expertIconCircle}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 13v-1a7 7 0 0 1 14 0v1" />
            <Rect x={3.5} y={13} width={3.5} height={6} rx={1.5} />
            <Rect x={17} y={13} width={3.5} height={6} rx={1.5} />
            <Path d="M18.5 19c0 2-2 3-4.5 3" />
          </Svg>
        </View>
        <Text style={styles.expertText}>
          {t('priority.options.expert')}
        </Text>
      </TouchableOpacity>

      {/* Selected Summary Card */}
      <View style={styles.summaryCard}>
        {/* Decorative background accent shape matching HTML */}
        <View style={styles.summaryBgAccent} />
        <View style={styles.summaryInner}>
          <View style={styles.avatarMiniWrapper}>
            <Image
              source={require('../../assets/mockup_assets/avatar-co-lan.jpg')}
              style={styles.avatarMiniImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summarySubtitle}>{t('priority.summary.subtitle')}</Text>
            <Text style={styles.summaryTitle}>{getSelectedLabel()}</Text>
            <Text style={styles.summaryNote}>
              {t('priority.summary.note')}
            </Text>
            {isLoadingCases ? (
              <ActivityIndicator size="small" color="#2F80ED" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#2F80ED', marginTop: 4 }}>
                {t('priority.summary.realtimeCount', { count: casesCount })}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Humanitarian Footer Message */}
      <View style={styles.humanitarianFooter}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#4EA36B" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 21v-7" />
          <Path d="M12 14c0-3 2-5 5-5.5C17 11.5 15 14 12 14Z" />
          <Path d="M12 14c0-2.4-1.6-4-4-4.5C8 12 9.6 14 12 14Z" />
        </Svg>
        <Text style={styles.humanitarianText}>
          {t('priority.footer.humanitarianQuote')}
        </Text>
      </View>

      {/* Primary Action Button */}
      <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
        <Text style={styles.confirmBtnText}>{t('priority.action.confirmBtn')}</Text>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 12h15M13 6l6 6-6 6" />
        </Svg>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F6FAFE',
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 140,
  },
  headerTitleGroup: {
    marginTop: 4,
    marginBottom: 18,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16375D',
    letterSpacing: 0.5,
  },
  badgeSub: {
    color: '#2F80ED',
    fontWeight: '500',
  },
  title: {
    fontSize: 29,
    lineHeight: 35.4,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  gridItem: {
    width: '31%',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EEF2F7',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
    overflow: 'hidden',
  },
  gridItemSelected: {
    borderColor: '#2F80ED',
  },
  selectedTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E9F3FF',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  itemIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DCEBFB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  itemLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#3A5F87',
    textAlign: 'center',
    lineHeight: 17,
    zIndex: 1,
  },
  expertItem: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EEF2F7',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
    overflow: 'hidden',
    marginBottom: 18,
  },
  expertItemSelected: {
    borderColor: '#2F80ED',
  },
  expertIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCEBFB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  expertText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A5F87',
    zIndex: 1,
  },
  summaryCard: {
    position: 'relative',
    backgroundColor: '#EEF7E6',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
    overflow: 'hidden',
  },
  summaryBgAccent: {
    position: 'absolute',
    right: -15,
    bottom: 0,
    width: '52%',
    height: '75%',
    backgroundColor: '#CFE6B8',
    borderTopLeftRadius: 100,
    opacity: 0.75,
  },
  summaryInner: {
    position: 'relative',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 1,
  },
  avatarMiniWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  avatarMiniImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  summaryContent: {
    flex: 1,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#5F7284',
    fontWeight: '500',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F6DBF',
    marginVertical: 1,
  },
  summaryNote: {
    fontSize: 14,
    color: '#5F7284',
    lineHeight: 19,
  },
  humanitarianFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  humanitarianText: {
    fontSize: 14.5,
    color: '#7A8B9A',
    fontWeight: '500',
  },
  confirmBtn: {
    backgroundColor: '#2F80ED',
    borderRadius: 999,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    shadowColor: '#2F7CF0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.36,
    shadowRadius: 13,
    elevation: 5,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
