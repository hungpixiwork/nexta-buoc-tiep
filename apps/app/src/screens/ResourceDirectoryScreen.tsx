import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { showAlert } from '../lib/dialog';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { ScreenState } from '../components/ScreenState';
import { apiService, isOfflineQueued, ApiError } from '../services/api';

type ResourceStatus = 'verified' | 'needs_recheck' | 'unverified';

export interface ResourceDirectoryItem {
  id: string;
  name: string;
  category: string;
  status: ResourceStatus;
  address: string;
  district: string;
  schedule?: string;
  phone?: string;
  acceptsReferral: boolean;
}

interface ResourceDirectoryScreenProps {
  /** Case to refer; without it the directory is read-only. */
  caseId?: string;
  onReferCase?: (resourceName: string) => void;
  onAvatarPress?: () => void;
  onBack?: () => void;
}

const CATEGORY_ALIASES: Record<string, string> = {
  health: 'medical',
  medical: 'medical',
  food: 'food',
  shelter: 'shelter',
  legal: 'legal',
  employment: 'employment',
  training: 'employment',
};

const CATEGORY_EMOJI: Record<string, string> = {
  medical: '🏥',
  food: '🍚',
  shelter: '🏠',
  legal: '📄',
  employment: '💼',
};

const toStatus = (item: any): ResourceStatus => {
  const verification = String(item.verificationStatus || '').toUpperCase();
  if (verification === 'VERIFIED') return 'verified';
  if (verification === 'NEEDS_RECHECK' || verification === 'STALE') return 'needs_recheck';
  if (!verification && item.isVerified === true) return 'verified';
  return 'unverified';
};

export const ResourceDirectoryScreen: React.FC<ResourceDirectoryScreenProps> = ({
  caseId,
  onReferCase,
  onAvatarPress,
  onBack,
}) => {
  const { t } = useTranslation();
  const [resources, setResources] = useState<ResourceDirectoryItem[]>([]);
  const [caseName, setCaseName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [referringId, setReferringId] = useState<string | null>(null);

  const getCategoryLabel = (category: string) =>
    ['medical', 'food', 'shelter', 'legal', 'employment'].includes(category)
      ? t(`resources.categories.${category}`)
      : category;

  const load = useCallback(() => {
    let isMounted = true;
    setStatus('loading');
    Promise.all([apiService.getResources(), caseId ? apiService.getCases() : Promise.resolve(null)])
      .then(([resourcesRes, casesRes]) => {
        if (!isMounted) return;
        setResources(
          (resourcesRes.data ?? []).map((item: any) => {
            const rawCategory = String(item.category || 'general').toLowerCase();
            return {
              id: item.id,
              name: item.name,
              category: CATEGORY_ALIASES[rawCategory] ?? rawCategory,
              status: toStatus(item),
              address: item.address || '',
              district: item.district || '',
              schedule: item.is24Hours ? t('resources.card.open_24h') : item.operatingHours || undefined,
              phone: item.phone || item.hotline || undefined,
              acceptsReferral: item.acceptsReferral !== false,
            };
          })
        );
        const found = casesRes?.data?.find((item: any) => item.id === caseId);
        setCaseName(found ? found.aliasName || found.fullName || null : null);
        setStatus('ready');
      })
      .catch((err) => {
        console.warn('[ResourceDirectory] Load failed:', err);
        if (isMounted) setStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, [caseId, t]);

  useEffect(() => load(), [load]);

  const categoryTabs = ['all', 'medical', 'food', 'shelter', 'legal', 'employment'].map((key) => ({
    key,
    label: key === 'all' ? t('resources.categories.all') : getCategoryLabel(key),
  }));

  const query = searchQuery.trim().toLowerCase();
  const filteredResources = resources.filter((item) => {
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.address.toLowerCase().includes(query) ||
      item.district.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const showDetails = (item: ResourceDirectoryItem) => {
    const lines = [
      [item.address, item.district].filter(Boolean).join(', '),
      item.schedule ? `🕒 ${item.schedule}` : null,
      item.phone ? `📞 ${item.phone}` : null,
    ].filter(Boolean);
    showAlert(item.name, lines.join('\n'));
  };

  const refer = async (item: ResourceDirectoryItem) => {
    if (!caseId) return;
    setReferringId(item.id);
    try {
      const response = await apiService.createReferral({
        caseId,
        resourceId: item.id,
        notes: t('resources.referral.notes', { name: item.name, category: getCategoryLabel(item.category) }),
      });
      if (isOfflineQueued(response)) {
        showAlert(t('resources.alert.offline_referral_title'), t('resources.alert.offline_referral_msg', { name: item.name }));
      } else {
        onReferCase?.(item.name);
      }
    } catch (err) {
      console.warn('[ResourceDirectory] Referral failed:', err);
      showAlert(t('common.error'), err instanceof ApiError ? err.message : t('resources.alert.referral_error_msg'));
    } finally {
      setReferringId(null);
    }
  };

  const confirmRefer = (item: ResourceDirectoryItem) =>
    showAlert(t('resources.referral.confirm_title'), t('resources.referral.confirm_msg', { name: item.name, person: caseName ?? '' }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('resources.card.btn_refer'), onPress: () => refer(item) },
    ]);

  const renderStatusBadge = (item: ResourceDirectoryItem) => {
    switch (item.status) {
      case 'verified':
        return (
          <View style={styles.statusRowVerified}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#3d9e63" strokeWidth={2.4}>
              <Circle cx={12} cy={12} r={9} />
              <Path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.statusTextVerified}>{t('resources.status.verified')}</Text>
          </View>
        );
      case 'needs_recheck':
        return (
          <View style={styles.statusRowWarning}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#e8952f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 3 2 20h20z" />
              <Path d="M12 10v4M12 17h.01" />
            </Svg>
            <Text style={styles.statusTextWarning}>{t('resources.status.needs_recheck')}</Text>
          </View>
        );
      default:
        return (
          <View style={styles.statusRowUnverified}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2}>
              <Circle cx={12} cy={12} r={9} />
              <Path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.statusTextUnverified}>{t('resources.status.unverified')}</Text>
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Header onAvatarPress={onAvatarPress} onBack={onBack} showBack={!!onBack} />

      <Text style={styles.tagline}>{t('resources.header.tagline')}</Text>
      <Text style={styles.mainTitle}>
        {caseName ? t('resources.header.title_case', { name: caseName }) : t('resources.header.title_directory')}
      </Text>
      <Text style={styles.subtitle}>{t('resources.header.subtitle')}</Text>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('resources.search.placeholder')}
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel={t('resources.search.placeholder')}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityRole="button" accessibilityLabel={t('common.close')}>
            <Text style={styles.clearIcon}>❌</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {categoryTabs.map((tab) => {
            const isSelected = selectedCategory === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                onPress={() => setSelectedCategory(tab.key)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {status !== 'ready' ? (
        <ScreenState kind={status} onRetry={load} />
      ) : filteredResources.length === 0 ? (
        <ScreenState kind="empty" message={t('resources.state.empty_sub')} />
      ) : (
        filteredResources.map((item) => {
          const canRefer = !!caseId && item.status === 'verified' && item.acceptsReferral;
          return (
            <View key={item.id} style={styles.cardCompact}>
              <View style={styles.cardBodyRow}>
                <View style={styles.categoryTile}>
                  <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[item.category] ?? '📍'}</Text>
                </View>
                <View style={styles.cardContentCompact}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.compactServices}>{[item.address, item.district].filter(Boolean).join(', ')}</Text>
                  {renderStatusBadge(item)}
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.btnView} activeOpacity={0.8} onPress={() => showDetails(item)} accessibilityRole="button">
                  <Text style={styles.btnViewText}>{t('resources.card.btn_view')}</Text>
                </TouchableOpacity>
                {canRefer && (
                  <TouchableOpacity
                    style={[styles.btnView, styles.btnRefer]}
                    activeOpacity={0.8}
                    onPress={() => confirmRefer(item)}
                    disabled={referringId === item.id}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.btnViewText, styles.btnReferText]}>{t('resources.card.btn_refer')}</Text>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M5 12h14M13 6l6 6-6 6" />
                    </Svg>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}

      <View style={styles.legendBox}>
        <View style={styles.legendItem}>
          <View style={styles.legendTitleRow}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#3d9e63" strokeWidth={2.4}>
              <Circle cx={12} cy={12} r={9} />
              <Path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.legendTitleVerified}>{t('resources.status.verified')}</Text>
          </View>
          <Text style={styles.legendSub}>{t('resources.status.verified_desc')}</Text>
        </View>

        <View style={styles.legendDivider} />

        <View style={styles.legendItem}>
          <View style={styles.legendTitleRow}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#e8952f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 3 2 20h20z" />
              <Path d="M12 10v4M12 17h.01" />
            </Svg>
            <Text style={styles.legendTitleWarning}>{t('resources.status.needs_recheck')}</Text>
          </View>
          <Text style={styles.legendSub}>{t('resources.status.needs_recheck_desc')}</Text>
        </View>

        <View style={styles.legendDivider} />

        <View style={styles.legendItem}>
          <View style={styles.legendTitleRow}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2}>
              <Circle cx={12} cy={12} r={9} />
              <Path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.legendTitleUnverified}>{t('resources.status.unverified')}</Text>
          </View>
          <Text style={styles.legendSub}>{t('resources.status.unverified_desc')}</Text>
        </View>
      </View>

      <View style={styles.milWarningCard}>
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#e8952f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={styles.milIconLeft}>
          <Path d="M12 3 2 20h20z" />
          <Path d="M12 10v4M12 17h.01" />
        </Svg>
        <View style={styles.milTextContainer}>
          <Text style={styles.milTitle}>{t('resources.mil_warning.title')}</Text>
          <Text style={styles.milSubtitle}>{t('resources.mil_warning.subtitle')}</Text>
        </View>
        <Svg width={30} height={34} viewBox="0 0 24 28" fill="#8bb7e8" style={styles.milIconRight}>
          <Path d="M12 1l9 4v7c0 6-4 11-9 14C7 23 3 18 3 12V5z" />
          <Path d="M12 9a2.5 2.5 0 0 1 2.5 2.5c0 1.2-1 2-1.5 2.8h-2c-.5-.8-1.5-1.6-1.5-2.8A2.5 2.5 0 0 1 12 9Z" fill="#ffffff" />
        </Svg>
      </View>
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
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
    marginTop: 4,
  },
  mainTitle: {
    fontSize: 33,
    lineHeight: 38,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.6,
    marginTop: 6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 18,
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#16375D',
  },
  clearIcon: {
    fontSize: 12,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterPillSelected: {
    backgroundColor: '#2F80ED',
    borderColor: '#2F80ED',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardBodyRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#16375D',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  cardCompact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  cardContentCompact: {
    flex: 1,
    minWidth: 0,
  },
  compactServices: {
    fontSize: 14,
    color: '#334155',
    marginVertical: 5,
    lineHeight: 20,
  },
  btnView: {
    flexShrink: 0,
    backgroundColor: '#EAF3FF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnViewText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '700',
  },
  statusRowVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusTextVerified: {
    fontSize: 13.5,
    color: '#15803D',
    fontWeight: '700',
  },
  statusRowWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusTextWarning: {
    fontSize: 13.5,
    color: '#B45309',
    fontWeight: '700',
  },
  statusRowUnverified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusTextUnverified: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  legendBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAF0F6',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 14,
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  legendTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  legendTitleVerified: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  legendTitleWarning: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  legendTitleUnverified: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  legendSub: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
  },
  legendDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#EAF0F6',
  },
  milWarningCard: {
    backgroundColor: '#FEF8EE',
    borderWidth: 1,
    borderColor: '#F5E6C8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milIconLeft: {
    flexShrink: 0,
  },
  milTextContainer: {
    flex: 1,
  },
  milTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16375D',
  },
  milSubtitle: {
    fontSize: 14,
    color: '#334155',
  },
  milIconRight: {
    flexShrink: 0,
  },
  categoryTile: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryEmoji: {
    fontSize: 30,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  btnRefer: {
    backgroundColor: '#2F80ED',
  },
  btnReferText: {
    color: '#FFFFFF',
  },
});
