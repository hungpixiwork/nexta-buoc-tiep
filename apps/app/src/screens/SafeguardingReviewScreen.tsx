import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { callHotline111 } from '../lib/hotline';
import { showAlert } from '../lib/dialog';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { apiService } from '../services/api';
import { ScreenState } from '../components/ScreenState';

interface SafeguardingReviewScreenProps {
  onBack?: () => void;
  onAvatarPress?: () => void;
}

export const SafeguardingReviewScreen: React.FC<SafeguardingReviewScreenProps> = ({ onBack, onAvatarPress }) => {
  const { t, i18n } = useTranslation();
  const [flags, setFlags] = useState<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFlags = useCallback(() => {
    let isMounted = true;
    setStatus('loading');
    apiService
      .getPendingSafeguardingFlags()
      .then((res) => {
        if (!isMounted) return;
        setFlags(res.data ?? []);
        setStatus('ready');
      })
      .catch((err) => {
        console.warn('[SafeguardingReview] Failed to fetch flags:', err);
        if (isMounted) setStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => loadFlags(), [loadFlags]);

  // 111 must stay one tap: dial immediately, no confirmation dialog.
  const handleCall111 = callHotline111;

  const handleReview = async (flagId: string, caseId: string, action: 'confirm' | 'reject') => {
    setIsSubmitting(true);
    try {
      await apiService.reviewSafeguardingFlag(caseId, flagId, action, t('safeguarding.managerReviewNote'));
      
      showAlert(
        t('safeguarding.auditLogAlertTitle'),
        action === 'confirm' ? t('safeguarding.auditLogConfirmMsg') : t('safeguarding.auditLogRejectMsg')
      );
      
      setFlags((current) => current.filter((flag) => flag.id !== flagId));
    } catch (error) {
      console.warn('API error:', error);
      showAlert(t('common.error'), t('safeguarding.serverErrorMsg'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header onBack={onBack} showBack={true} onAvatarPress={onAvatarPress} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Banner Gọi Khẩn cấp 111 — Crimson Red #D32F2F & 150px Call Button */}
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyTitleRow}>
            <View style={styles.emergencyIconCircle}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth={2.4}>
                <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyBannerTitle}>{t('safeguarding.emergencyBannerTitle')}</Text>
              <Text style={styles.emergencyBannerSub}>{t('safeguarding.emergencyBannerSub')}</Text>
            </View>
          </View>
          <Text style={styles.emergencyDesc}>
            {t('safeguarding.emergencyBannerDesc')}
          </Text>
          <TouchableOpacity
            style={styles.emergencyCallBtn}
            onPress={handleCall111}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('safeguarding.emergencyCallA11y')}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5}>
              <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </Svg>
            <Text style={styles.emergencyCallBtnText}>{t('safeguarding.emergencyCallBtn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Hướng dẫn Nguyên tắc Human-in-the-loop */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{t('safeguarding.humanInTheLoopTitle')}</Text>
          <Text style={styles.bannerDesc}>
            {t('safeguarding.humanInTheLoopDesc')}
          </Text>
        </View>

        {/* Safeguarding Golden Boundaries Badge */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesCardTitle}>{t('safeguarding.goldenBoundariesTitle')}</Text>
          <Text style={styles.rulesText}>{t('safeguarding.boundary1')}</Text>
          <Text style={styles.rulesText}>{t('safeguarding.boundary2')}</Text>
          <Text style={styles.rulesText}>{t('safeguarding.boundary3')}</Text>
          <Text style={styles.rulesText}>{t('safeguarding.boundary4')}</Text>
          <Text style={styles.rulesText}>{t('safeguarding.boundary5')}</Text>
          <Text style={styles.rulesText}>{t('safeguarding.boundary6')}</Text>
        </View>

        <Text style={styles.sectionHeaderTitle}>
          {status === 'ready' ? t('safeguarding.pendingListTitle', { count: flags.length }) : t('safeguarding.pendingListHeading')}
        </Text>

        {status !== 'ready' ? (
          <ScreenState kind={status} onRetry={loadFlags} />
        ) : flags.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t('safeguarding.emptyList')}</Text>
          </View>
        ) : (
          flags.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.aliasBadge}>
                  <Text style={styles.aliasBadgeText}>{item.name}</Text>
                </View>
                <Text style={styles.cardDate}>
                  {item.date ? new Date(item.date).toLocaleString(i18n.language === 'en' ? 'en-US' : 'vi-VN') : t('safeguarding.justNow')}
                </Text>
              </View>
              
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>{t('safeguarding.riskAlertLabel')}</Text>
                <Text style={styles.cardReason}>{item.reason || t('safeguarding.noReason')}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnReject]}
                  onPress={() => handleReview(item.id, item.caseId, 'reject')}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnRejectText}>{t('safeguarding.btnReject')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnConfirm]}
                  onPress={() => handleReview(item.id, item.caseId, 'confirm')}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnConfirmText}>{t('safeguarding.btnConfirm')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF3FB',
  },
  scroll: {
    padding: 16,
    paddingBottom: 140,
  },
  emergencyBanner: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    marginBottom: 16,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  emergencyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D32F2F',
    letterSpacing: -0.2,
  },
  emergencyBannerSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#991B1B',
  },
  emergencyDesc: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 14,
  },
  emergencyCallBtn: {
    backgroundColor: '#D32F2F',
    borderRadius: 14,
    height: 56,
    minHeight: 56,
    minWidth: 150,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  emergencyCallBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  banner: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  bannerDesc: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20,
  },
  rulesCard: {
    backgroundColor: '#F0F9FF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 20,
  },
  rulesCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: 6,
  },
  rulesText: {
    fontSize: 12.5,
    color: '#0284C7',
    lineHeight: 18,
    fontWeight: '600',
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  aliasBadge: {
    flexShrink: 1,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  aliasBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D32F2F',
  },
  cardDate: {
    flexShrink: 0,
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  reasonBox: {
    backgroundColor: '#FFF1F2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BE123C',
    marginBottom: 2,
  },
  cardReason: {
    fontSize: 14,
    color: '#9F1239',
    fontWeight: '600',
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnReject: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  btnRejectText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13.5,
    textAlign: 'center',
  },
  btnConfirm: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  btnConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
    textAlign: 'center',
  },
});

