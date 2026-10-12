import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { SkyBackground } from '../components/SkyBackground';
import { ImageFadeMask } from '../components/ImageFadeMask';
import { apiService } from '../services/api';
import { getOfflineDrafts, OfflineDraftRecord } from '../storage';

interface HomeScreenProps {
  onStartJourney: () => void;
  onCheckIn: (personId?: string) => void;
  onListenNew: () => void;
  onAvatarPress: () => void;
  onOpenDrafts?: () => void;
}

interface JourneyState {
  title?: string;
  locationName?: string;
  scheduledDate?: string;
  participantsCount?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartJourney,
  onCheckIn,
  onListenNew,
  onAvatarPress,
  onOpenDrafts,
}) => {
  const { t } = useTranslation();
  const [userName, setUserName] = useState<string>('Hưng');
  const [journey, setJourney] = useState<JourneyState>({
    title: 'Chuyến đi chiều nay',
    locationName: 'Hóc Môn',
    scheduledDate: '14:00 · Chủ nhật 26/07',
    participantsCount: 8,
  });
  const [rememberPerson, setRememberPerson] = useState<any>({
    id: 'case-lan-01',
    name: 'Cô Lan',
    summary: 'Hôm trước cô đang chờ nơi khám phù hợp.',
  });
  const [isCasesLoading, setIsCasesLoading] = useState(false);
  const [pendingDraftsCount, setPendingDraftsCount] = useState<number>(0);
  const [pendingApprovalCases, setPendingApprovalCases] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    // Load user info for greeting
    apiService.getProfile().then((res: { success?: boolean; user?: any }) => {
      if (isMounted && res && res.success && res.user) {
        setUserName(res.user.name || res.user.full_name || 'Hưng');
      }
    }).catch(() => {});

    // Load offline pending drafts
    getOfflineDrafts().then((drafts) => {
      if (isMounted) {
        const pending = drafts.filter((d) => d.status === 'pending_sync' || d.status === 'syncing');
        setPendingDraftsCount(pending.length);
      }
    }).catch((err) => console.warn('[HomeScreen] Failed to load offline drafts:', err));

    // Fetch Today Journey
    apiService.getTodayJourney()
      .then((res) => {
        if (isMounted && res && res.success && res.data) {
          const rawLoc = res.data.locationName || 'Hóc Môn';
          const cleanLoc = rawLoc.includes('/') ? rawLoc.split('/')[0].trim() : rawLoc;
          setJourney({
            title: res.data.title || t('home.journey.defaultTitle'),
            locationName: cleanLoc.length > 24 ? cleanLoc.slice(0, 24) : cleanLoc,
            scheduledDate: res.data.scheduledDate ? t('home.journey.todayPrefix', { date: res.data.scheduledDate }) : '14:00 · Chủ nhật 26/07',
            participantsCount: res.data.participantsCount ?? 8,
          });
        }
      })
      .catch((err) => {
        console.warn('[HomeScreen] API getTodayJourney unreachable, using fallback:', err);
      });

    // Fetch Cases for Review & Remember
    apiService.getCases()
      .then((res) => {
        if (isMounted && res && res.data && res.data.length > 0) {
          const firstCase = res.data[0];
          setRememberPerson({
            id: firstCase.id,
            name: firstCase.aliasName || firstCase.name || 'Cô Lan',
            summary: firstCase.notes || firstCase.summary || 'Hôm trước cô đang chờ nơi khám phù hợp.',
          });

          const pending = res.data.filter(
            (c: any) => c.status === 'need_followup' || c.priority === 'urgent' || c.priority === 'critical'
          );
          setPendingApprovalCases(pending.slice(0, 2));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsCasesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  const displayJourneyTitle = journey.title || t('home.journey.defaultTitle');
  const displayLocationName = journey.locationName || t('home.journey.defaultLocation');
  const displayScheduledDate = journey.scheduledDate || t('home.journey.defaultSchedule');
  const displayParticipantsCount = journey.participantsCount ?? 8;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header onAvatarPress={onAvatarPress} />

        <Text style={styles.greeting}>{t('home.header.greeting', { name: userName })}</Text>
        <Text style={styles.mainTitle}>
          {t('home.header.mainTitle')}
        </Text>

        {/* Card Chuyến Đi với hình minh họa con đường Hóc Môn chuẩn mockup 01 */}
        <View style={styles.journeyCard}>
          <Image
            source={require('../../assets/mockup_assets/banner-hoc-mon.jpg')}
            style={styles.journeyBgImage}
            resizeMode="cover"
          />
          <ImageFadeMask id="homeJourneyFade" />
          <View style={styles.cardOverlay}>
            <Text style={styles.journeySub}>{displayJourneyTitle}</Text>
            <Text style={styles.journeyTitle} numberOfLines={2}>{displayLocationName}</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2} strokeLinecap="round">
                  <Circle cx={12} cy={12} r={8.5} />
                  <Path d="M12 7.5V12l3 2" />
                </Svg>
              </View>
              <Text style={styles.infoText}>{displayScheduledDate}</Text>
            </View>

            <View style={styles.infoRowPeople}>
              <View style={styles.iconCircle}>
                <Svg width={19} height={19} viewBox="0 0 24 24" fill="#2F80ED">
                  <Circle cx={8.5} cy={8.5} r={2.7} />
                  <Circle cx={16} cy={9.5} r={2.2} />
                  <Path d="M3 18c0-3 2.4-5.2 5.5-5.2S14 15 14 18z" />
                  <Path d="M14 18c0-2.3 1.4-4.1 3.6-4.7 2.3.5 3.9 2.4 3.9 4.7z" />
                </Svg>
              </View>
              <Text style={styles.infoText}>{t('home.journey.participantsCount', { count: displayParticipantsCount })}</Text>
            </View>

            <TouchableOpacity
              style={styles.btnStart}
              activeOpacity={0.8}
              onPress={onStartJourney}
              accessibilityRole="button"
              accessibilityLabel={t('home.journey.startBtn')}
            >
              <Text style={styles.btnStartText}>{t('home.journey.startBtn')}</Text>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 12h15M13 6l6 6-6 6" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Người cần nhớ tới */}
        <Text style={styles.sectionTitle}>{t('home.remember.sectionTitle')}</Text>
        {isCasesLoading ? (
          <ActivityIndicator size="small" color="#2F80ED" style={{ marginVertical: 20 }} />
        ) : rememberPerson ? (
          <View style={styles.personCard}>
            <View style={styles.personAvatarWrapper}>
              <Image
                source={require('../../assets/mockup_assets/avatar-co-lan.jpg')}
                style={styles.personAvatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{rememberPerson.name}</Text>
              <Text style={styles.personNote} numberOfLines={3}>{rememberPerson.summary}</Text>
              <TouchableOpacity
                style={styles.btnCheckInLink}
                activeOpacity={0.7}
                onPress={() => onCheckIn?.(rememberPerson.id)}
                accessibilityRole="button"
                accessibilityLabel={t('home.remember.checkInBtn')}
              >
                <Text style={styles.btnCheckInText}>{t('home.remember.checkInBtn')}</Text>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12h14M13 6l6 6-6 6" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={{ color: '#7A8B9A', marginBottom: 22 }}>{t('home.remember.emptyText')}</Text>
        )}

        {/* Button Gặp một người mới */}
        <View style={styles.listenNewContainer}>
          <TouchableOpacity
            style={styles.btnListenNew}
            activeOpacity={0.85}
            onPress={onListenNew}
            accessibilityRole="button"
            accessibilityLabel={t('home.intake.quickIntakeBtn')}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round">
              <Path d="M12 5v14M5 12h14" />
            </Svg>
            <Text style={styles.btnListenNewText}>{t('home.intake.quickIntakeBtn')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAFE',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 140,
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  offlineBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBannerText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#92400E',
  },
  offlineBannerBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: '#0F2C59',
    letterSpacing: -0.4,
    marginBottom: 20,
  },
  journeyCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
    minHeight: 250,
    backgroundColor: '#E0F2FE',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  journeyBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  journeySub: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 4,
  },
  journeyTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '800',
    color: '#0F2C59',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  infoRowPeople: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14.5,
    color: '#1E293B',
    fontWeight: '600',
  },
  btnStart: {
    backgroundColor: '#0085FF',
    borderRadius: 999,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    shadowColor: '#0085FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  btnStartText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F2C59',
    marginBottom: 12,
  },
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  personAvatarWrapper: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  personAvatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  personInfo: {
    flex: 1,
    minWidth: 0,
  },
  personName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F2C59',
    marginBottom: 2,
  },
  personNote: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  btnCheckInLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
    paddingVertical: 8,
    minHeight: 44,
  },
  btnCheckInText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0085FF',
  },
  listenNewContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  btnListenNew: {
    backgroundColor: '#0085FF',
    borderRadius: 999,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0085FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 5,
  },
  btnListenNewText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
