import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/Logo';
import { Avatar } from '../components/Avatar';
import { SkyBackground } from '../components/SkyBackground';
import { apiService } from '../services/api';
import { getOfflineDrafts } from '../storage';

interface BeforeYouGoScreenProps {
  onReady: () => void;
  onBack?: () => void;
  onAvatarPress?: () => void;
}

export const BeforeYouGoScreen: React.FC<BeforeYouGoScreenProps> = ({
  onReady,
  onBack,
  onAvatarPress,
}) => {
  const { t } = useTranslation();
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);

  React.useEffect(() => {
    const checkDrafts = async () => {
      try {
        const drafts = await getOfflineDrafts();
        const pending = drafts.filter(d => d.status === 'pending_sync' || d.status === 'syncing');
        setOfflineQueueCount(pending.length);
      } catch (err) {
        console.warn('Failed to load offline drafts:', err);
      }
    };
    checkDrafts();
  }, []);

  /** Sends queued offline drafts first (best effort), then starts the field visit. */
  const handleReadySubmit = async () => {
    if (offlineQueueCount > 0) {
      setIsSyncing(true);
      setSyncFailed(false);
      try {
        const result = await apiService.syncOfflineDrafts();
        setOfflineQueueCount(result.failCount);
        if (result.failCount > 0) {
          setSyncFailed(true);
          return;
        }
      } catch (err) {
        console.warn('[BeforeYouGo] Sync failed:', err);
        setSyncFailed(true);
        return;
      } finally {
        setIsSyncing(false);
      }
    }
    onReady();
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Bar Navigation */}
      <View style={styles.topNav}>
        <View style={styles.topLeft}>
          {onBack ? (
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={onBack} 
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#16375D" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 5l-7 7 7 7" />
              </Svg>
            </TouchableOpacity>
          ) : null}
          <Logo />
        </View>
        <Avatar onPress={onAvatarPress} />
      </View>

      {/* Header */}
      <Text style={styles.badge}>{t('beforeYouGo.badge')}</Text>
      <Text style={styles.title}>{t('beforeYouGo.title')}</Text>
      <Text style={styles.subtitle}>{t('beforeYouGo.subtitle')}</Text>

      {/* 4 Thẻ Nhắc Nhở */}
      <View style={styles.list}>
        {/* Thẻ 1: Một chút thời gian */}
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#DCEBFB' }]}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2} strokeLinecap="round">
              <Circle cx={12} cy={12} r={8.5} />
              <Path d="M12 7v5l3.5 2" />
            </Svg>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.cardTitle}>{t('beforeYouGo.cards.time.title')}</Text>
            <Text style={styles.cardDesc}>{t('beforeYouGo.cards.time.desc')}</Text>
          </View>
        </View>

        {/* Thẻ 2: Một đôi tai */}
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#DCEBFB' }]}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2} strokeLinecap="round">
              <Path d="M7 11a5 5 0 1 1 10 0c0 3-2.5 3.5-3.5 5s-.5 3-2.5 3a2.5 2.5 0 0 1-2.5-2.5" />
              <Path d="M9.5 10.5a2.5 2.5 0 0 1 4 0" />
            </Svg>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.cardTitle}>{t('beforeYouGo.cards.listening.title')}</Text>
            <Text style={styles.cardDesc}>
              {t('beforeYouGo.cards.listening.desc')}
            </Text>
          </View>
        </View>

        {/* Thẻ 3: Sự tôn trọng */}
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#FDECCA' }]}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#E8952F" strokeWidth={2} strokeLinecap="round">
              <Path d="M3 8h3l1.5-2h5L14 8h4a2 2 0 0 1 2 2v7" />
              <Circle cx={12} cy={13} r={3.2} />
              <Path d="M3 3l18 18" />
            </Svg>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.cardTitle}>{t('beforeYouGo.cards.respect.title')}</Text>
            <Text style={styles.cardDesc}>
              {t('beforeYouGo.cards.respect.desc')}
            </Text>
          </View>
        </View>

        {/* Thẻ 4: Sự khiêm tốn */}
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#DCEFD9' }]}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#4EA36B" strokeWidth={2} strokeLinecap="round">
              <Path d="M12 21v-8" />
              <Path d="M12 13c0-3 2-5 5-5.5C17 11 15 13 12 13Z" />
              <Path d="M12 13c0-2.6-1.7-4.4-4.3-5C7.7 11.3 9.4 13 12 13Z" />
            </Svg>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.cardTitle}>{t('beforeYouGo.cards.humility.title')}</Text>
            <Text style={styles.cardDesc}>
              {t('beforeYouGo.cards.humility.desc')}
            </Text>
          </View>
        </View>
      </View>

      {/* Thẻ thông điệp trách nhiệm */}
      <View style={styles.quoteCardWrap}>
        <SkyBackground height={110} borderRadius={18}>
          <View style={styles.quoteCardInner}>
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="#8BB7E8" style={styles.quoteIcon}>
              <Path d="M10 7H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h3v1a3 3 0 0 1-3 3v2c3.3 0 5-2.4 5-5V7Zm11 0h-5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h3v1a3 3 0 0 1-3 3v2c3.3 0 5-2.4 5-5V7Z" />
            </Svg>
            <Text style={styles.quoteText}>
              {t('beforeYouGo.quote.text')}
            </Text>
          </View>
        </SkyBackground>
      </View>

      {/* Offline Sync Progress Section */}
      {offlineQueueCount > 0 && (
        <View style={styles.syncCard}>
          <View style={styles.syncCardHeader}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#E8952F" strokeWidth={2}>
              <Path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8" />
              <Path d="M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
            </Svg>
            <Text style={styles.syncCardTitle}>
              {t('beforeYouGo.sync.pendingTitle', { count: offlineQueueCount })}
            </Text>
          </View>
          {isSyncing && <Text style={styles.syncStatusText}>{t('beforeYouGo.sync.inProgress')}</Text>}
          {syncFailed && !isSyncing && (
            <>
              <Text style={styles.syncStatusText}>{t('beforeYouGo.sync.failed', { count: offlineQueueCount })}</Text>
              <TouchableOpacity style={styles.skipSyncBtn} onPress={onReady} accessibilityRole="button">
                <Text style={styles.skipSyncText}>{t('beforeYouGo.sync.continueAnyway')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Nút "Mình sẵn sàng" */}
      <TouchableOpacity 
        style={[styles.readyBtn, isSyncing && styles.readyBtnDisabled]} 
        onPress={handleReadySubmit} 
        disabled={isSyncing} 
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('beforeYouGo.action.readyBtn')}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.readyBtnText}>{t('beforeYouGo.action.readyBtn')}</Text>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 12h15M13 6l6 6-6 6" />
            </Svg>
          </>
        )}
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
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#2F6DBF',
    marginTop: 6,
  },
  title: {
    fontSize: 37,
    lineHeight: 41,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.8,
    marginTop: 6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15.5,
    color: '#7A8B9A',
    lineHeight: 23,
    marginBottom: 20,
  },
  list: {
    gap: 12,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#16375D',
  },
  cardDesc: {
    fontSize: 14.5,
    color: '#8395A4',
    lineHeight: 20,
    marginTop: 2,
    flexShrink: 1,
  },
  quoteCardWrap: {
    marginBottom: 22,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  quoteCardInner: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  quoteIcon: {
    marginTop: 2,
  },
  quoteText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#16375D',
    lineHeight: 24,
  },
  readyBtn: {
    backgroundColor: '#2F7CF0',
    borderRadius: 999,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    shadowColor: '#2F7CF0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.36,
    shadowRadius: 26,
    elevation: 6,
  },
  readyBtnDisabled: {
    opacity: 0.7,
  },
  readyBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  syncCard: {
    backgroundColor: '#FFF8F1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDECCA',
  },
  syncCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  syncCardTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#D27B1E',
  },
  syncStatusText: {
    fontSize: 12,
    color: '#D27B1E',
    marginTop: 8,
    textAlign: 'center',
  },
  skipSyncBtn: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 4,
  },
  skipSyncText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
