import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { apiService, isOfflineQueued } from '../services/api';
import { ScreenState } from '../components/ScreenState';
import { showAlert } from '../lib/dialog';

interface CheckInScreenProps {
  personId?: string;
  onComplete: () => void;
  onBack?: () => void;
  onAvatarPress?: () => void;
}

export const CheckInScreen: React.FC<CheckInScreenProps> = ({
  personId,
  onComplete,
  onBack,
  onAvatarPress,
}) => {
  const { t } = useTranslation();
  const [person, setPerson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedMood, setSelectedMood] = useState<'sunny' | 'cloudy' | 'rain'>('sunny');
  const [selectedHelp, setSelectedHelp] = useState<'yes' | 'no' | 'pend'>('yes');
  const [selectedNextAct, setSelectedNextAct] = useState<'continue' | 'change' | 'pause'>('continue');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadFailed(false);
    if (!personId) {
      setIsLoading(false);
      return;
    }
    apiService.getCases()
      .then(res => {
        if (isMounted && res?.success && res.data) {
          const found = res.data.find((c: any) => c.id === personId);
          if (found) {
            setPerson({
              ...found,
              name: found.aliasName || found.name || t('home.case.defaultPersonName'),
              alertTitle: found.alertTitle || t('checkin.banner.alert_title_default'),
              alertSub: found.alertSub || t('checkin.banner.alert_sub_default'),
              genderTitle: found.genderTitle || t('checkin.person.default_gender_title'),
              thankYouText: found.thankYouText || t('checkin.footer.thank_you_default'),
            });
          }
        }
      })
      .catch(err => {
        console.warn('[CheckInScreen] API error:', err);
        if (isMounted) setLoadFailed(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
      return () => { isMounted = false };
  }, [personId, t, reloadKey]);

  if (isLoading) {
    return (
      <View style={styles.screenWrapper}>
        <View style={styles.headerPadding}>
          <Header showBack={true} onBack={onBack || onComplete} onAvatarPress={onAvatarPress} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2F80ED" />
        </View>
      </View>
    );
  }

  if (loadFailed) {
    return (
      <View style={styles.screenWrapper}>
        <View style={styles.headerPadding}>
          <Header showBack={true} onBack={onBack || onComplete} onAvatarPress={onAvatarPress} />
        </View>
        <View style={styles.headerPadding}>
          <ScreenState kind="error" onRetry={() => setReloadKey((key) => key + 1)} />
        </View>
      </View>
    );
  }

  // Neu ID duoc truyen khong ton tai trong he thong
  if (!person) {
    return (
      <View style={styles.screenWrapper}>
        <View style={styles.headerPadding}>
          <Header showBack={true} onBack={onBack || onComplete} onAvatarPress={onAvatarPress} />
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>{t('checkin.not_found.title')}</Text>
          <Text style={styles.notFoundSub}>{t('checkin.not_found.description', { personId })}</Text>
          <TouchableOpacity style={styles.notFoundBtn} onPress={onBack || onComplete}>
            <Text style={styles.notFoundBtnText}>{t('checkin.not_found.btn_back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSaveUpdate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const followupPayload = {
      caseId: person.id,
      notes: t('checkin.log.notes_format', {
        name: person.name,
        mood: t(`checkin.mood.${selectedMood}`),
        help: t(selectedHelp === 'yes' ? 'common.options.yes' : selectedHelp === 'no' ? 'common.options.no' : 'common.options.pending'),
        nextAct: t(selectedNextAct === 'continue' ? 'checkin.action.continue' : selectedNextAct === 'change' ? 'checkin.action.change_direction' : 'checkin.action.pause'),
      }),
      actionType: 'visit' as const,
      status: selectedHelp === 'yes' ? ('completed' as const) : ('in_progress' as const),
    };

    setSubmitError(null);
    try {
      const result = await apiService.createCheckIn(followupPayload);
      if (isOfflineQueued(result)) {
        showAlert(t('common.savedOfflineTitle'), t('common.savedOfflineMsg'));
      }
      onComplete();
    } catch (e) {
      console.warn('[CheckInScreen] Save check-in failed:', e);
      setSubmitError(t('checkin.error.save_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleGenderText = person.genderTitle || t('checkin.person.default_gender_title');
  const questionTitle = t('checkin.action.next_action_heading', { genderTitle: titleGenderText });

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.headerPadding}>
        <Header
          showBack={true}
          onBack={onBack || onComplete}
          onAvatarPress={onAvatarPress}
        />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Banner thông báo 7 ngày */}
        <View style={styles.alertBanner}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={styles.flexNone}>
            <Path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
            <Path d="M10 20a2 2 0 0 0 4 0" />
          </Svg>
          <View style={styles.alertTextGroup}>
            <Text style={styles.alertTitle}>{person.alertTitle}</Text>
            <Text style={styles.alertSub}>{person.alertSub}</Text>
          </View>
          <Svg width={30} height={18} viewBox="0 0 40 24" fill="none" stroke="#8BB7E8" strokeWidth={2} strokeLinecap="round" style={styles.flexNone}>
            <Path d="M4 16q8-8 16 0t16 0" />
          </Svg>
        </View>

        {/* Tiêu đề Chào & Hỏi thăm */}
        <Text style={styles.greeting}>{t('checkin.greeting', { name: person.volunteerName || 'Hưng' })}</Text>
        <Text style={styles.title}>{t('checkin.title', { name: person.name, genderTitle: titleGenderText })}</Text>

        {/* Nhóm 1: 3 Nút Thời Tiết SVG */}
        <View style={styles.gridThreeWeather}>
          {/* Sunny / Tốt hơn */}
          <TouchableOpacity
            style={[styles.weatherCard, selectedMood === 'sunny' && styles.cardSelected]}
            onPress={() => setSelectedMood('sunny')}
            activeOpacity={0.75}
          >
            {selectedMood === 'sunny' && <View style={styles.selectedTint} />}
            <Svg width={54} height={48} viewBox="0 0 64 58" style={styles.cardSvg}>
              <G stroke="#F6A623" strokeWidth={4} strokeLinecap="round">
                <Line x1={32} y1={4} x2={32} y2={12} />
                <Line x1={11} y1={12} x2={16} y2={17} />
                <Line x1={4} y1={30} x2={12} y2={30} />
                <Line x1={53} y1={12} x2={48} y2={17} />
                <Line x1={60} y1={30} x2={52} y2={30} />
              </G>
              <Circle cx={32} cy={30} r={13} fill="#F9B233" />
            </Svg>
            <Text style={styles.weatherLabel}>{t('checkin.mood.sunny')}</Text>
          </TouchableOpacity>

          {/* Cloudy / Như trước */}
          <TouchableOpacity
            style={[styles.weatherCard, selectedMood === 'cloudy' && styles.cardSelected]}
            onPress={() => setSelectedMood('cloudy')}
            activeOpacity={0.75}
          >
            {selectedMood === 'cloudy' && <View style={styles.selectedTint} />}
            <Svg width={62} height={48} viewBox="0 0 80 58" style={styles.cardSvg}>
              <Circle cx={30} cy={22} r={12} fill="#F9B233" />
              <G stroke="#F6A623" strokeWidth={3.4} strokeLinecap="round">
                <Line x1={30} y1={3} x2={30} y2={8} />
                <Line x1={13} y1={10} x2={16} y2={14} />
              </G>
              <Path
                d="M26 46a10 10 0 0 1 3-19c1.7-6 7-10 13-10 7 0 12.5 5.2 13.3 11.8C60 30 63 33 63 37s-3 9-9 9H26z"
                fill="#EEF4F9"
                stroke="#C3D6E6"
                strokeWidth={2}
              />
            </Svg>
            <Text style={styles.weatherLabel}>{t('checkin.mood.cloudy')}</Text>
          </TouchableOpacity>

          {/* Rain / Khó khăn hơn */}
          <TouchableOpacity
            style={[styles.weatherCard, selectedMood === 'rain' && styles.cardSelected]}
            onPress={() => setSelectedMood('rain')}
            activeOpacity={0.75}
          >
            {selectedMood === 'rain' && <View style={styles.selectedTint} />}
            <Svg width={60} height={48} viewBox="0 0 80 62" style={styles.cardSvg}>
              <Path
                d="M24 40a11 11 0 0 1 2-21.7C27.6 11 34 6 41 6c8 0 14 6 14.6 13.4C61 20 64 23.4 64 28s-3.6 12-11 12H24z"
                fill="#9DB8D4"
                stroke="#7C9CC0"
                strokeWidth={2}
              />
              <G stroke="#6FA8E0" strokeWidth={4} strokeLinecap="round">
                <Line x1={30} y1={46} x2={27} y2={55} />
                <Line x1={42} y1={46} x2={39} y2={56} />
                <Line x1={54} y1={46} x2={51} y2={55} />
              </G>
            </Svg>
            <Text style={styles.weatherLabel}>{t('checkin.mood.rain')}</Text>
          </TouchableOpacity>
        </View>

        {/* Nhóm 2: Bước trước có giúp ích không? */}
        <Text style={styles.sectionHeading}>{t('checkin.feedback.previous_step_heading')}</Text>
        <View style={styles.gridThreeHelp}>
          {/* Có */}
          <TouchableOpacity
            style={[styles.optionCard, selectedHelp === 'yes' && styles.cardSelected]}
            onPress={() => setSelectedHelp('yes')}
            activeOpacity={0.75}
          >
            {selectedHelp === 'yes' && <View style={styles.selectedTint} />}
            <View style={styles.iconCircleBlue}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 13l4 4 10-11" />
              </Svg>
            </View>
            <Text style={styles.optionLabel14}>{t('common.options.yes')}</Text>
          </TouchableOpacity>

          {/* Không */}
          <TouchableOpacity
            style={[styles.optionCard, selectedHelp === 'no' && styles.cardSelected]}
            onPress={() => setSelectedHelp('no')}
            activeOpacity={0.75}
          >
            {selectedHelp === 'no' && <View style={styles.selectedTint} />}
            <View style={styles.iconCircleGray}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#7D94A8" strokeWidth={2.6} strokeLinecap="round">
                <Path d="M6 6l12 12M18 6L6 18" />
              </Svg>
            </View>
            <Text style={styles.optionLabel14}>{t('common.options.no')}</Text>
          </TouchableOpacity>

          {/* Chưa xong */}
          <TouchableOpacity
            style={[styles.optionCard, selectedHelp === 'pend' && styles.cardSelected]}
            onPress={() => setSelectedHelp('pend')}
            activeOpacity={0.75}
          >
            {selectedHelp === 'pend' && <View style={styles.selectedTint} />}
            <View style={styles.iconCircleBlue}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2} strokeLinecap="round">
                <Circle cx={12} cy={12} r={8.5} />
                <Path d="M12 7.5V12l3 2" />
              </Svg>
            </View>
            <Text style={styles.optionLabel13Center}>{t('common.options.pending')}</Text>
          </TouchableOpacity>
        </View>

        {/* Nhóm 3: Cô/Chú/Em muốn làm gì tiếp? */}
        <Text style={styles.sectionHeading}>{questionTitle}</Text>
        <View style={styles.gridThreeNext}>
          {/* Tiếp tục */}
          <TouchableOpacity
            style={[styles.optionCard, selectedNextAct === 'continue' && styles.cardSelected]}
            onPress={() => setSelectedNextAct('continue')}
            activeOpacity={0.75}
          >
            {selectedNextAct === 'continue' && <View style={styles.selectedTint} />}
            <View style={styles.iconCircleBlue}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 17l3-2 2 3 3-9 2 5h6" />
                <Circle cx={7} cy={6} r={1.6} />
              </Svg>
            </View>
            <Text style={styles.optionLabel13Center}>{t('checkin.action.continue')}</Text>
          </TouchableOpacity>

          {/* Đổi hướng */}
          <TouchableOpacity
            style={[styles.optionCard, selectedNextAct === 'change' && styles.cardSelected]}
            onPress={() => setSelectedNextAct('change')}
            activeOpacity={0.75}
          >
            {selectedNextAct === 'change' && <View style={styles.selectedTint} />}
            <View style={styles.iconCircleBlue}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 4v16" />
                <Path d="M12 6h6l-1.5 2L18 10h-6" />
                <Path d="M12 12H6l1.5 2L6 16h6" opacity={0.5} />
              </Svg>
            </View>
            <Text style={styles.optionLabel13}>{t('checkin.action.change_direction')}</Text>
          </TouchableOpacity>

          {/* Tạm dừng */}
          <TouchableOpacity
            style={[styles.optionCard, selectedNextAct === 'pause' && styles.cardSelected]}
            onPress={() => setSelectedNextAct('pause')}
            activeOpacity={0.75}
          >
            {selectedNextAct === 'pause' && <View style={styles.selectedTint} />}
            <View style={styles.iconCircleBlue}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="#2F80ED">
                <Rect x={6} y={5} width={4} height={14} rx={1.5} />
                <Rect x={14} y={5} width={4} height={14} rx={1.5} />
              </Svg>
            </View>
            <Text style={styles.optionLabel13}>{t('checkin.action.pause')}</Text>
          </TouchableOpacity>
        </View>

        {submitError && (
          <Text style={styles.submitErrorText} accessibilityRole="alert">
            {submitError}
          </Text>
        )}

        {/* Nút "Lưu cập nhật" */}
        <TouchableOpacity
          style={[styles.saveBtn, isSubmitting && { opacity: 0.8 }]}
          onPress={handleSaveUpdate}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 13l4 4 10-11" />
            </Svg>
          )}
          <Text style={styles.saveBtnText}>{isSubmitting ? t('checkin.btn.saving') : t('checkin.btn.save')}</Text>
        </TouchableOpacity>

        {/* Câu cảm ơn phía dưới */}
        <View style={styles.thankYouRow}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E0A0A0" strokeWidth={1.8}>
            <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" fill="#F3D0D0" />
          </Svg>
          <Text style={styles.thankYouText}>{person.thankYouText || t('checkin.footer.thank_you_default')}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerPadding: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 140,
  },
  flexNone: {
    flexShrink: 0,
  },
  alertBanner: {
    backgroundColor: '#E5F0FB',
    borderWidth: 1,
    borderColor: '#E0EBF6',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gpsGeofenceBadge: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  gpsGeofenceText: {
    fontSize: 12.5,
    color: '#0369A1',
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  alertTextGroup: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2B4763',
  },
  alertSub: {
    fontSize: 14,
    color: '#334155',
  },
  greeting: {
    fontSize: 18,
    color: '#334155',
    fontWeight: '600',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.6,
    marginTop: 4,
    marginBottom: 18,
  },
  gridThreeWeather: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  gridThreeHelp: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  gridThreeNext: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  weatherCard: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EEF2F7',
    borderRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 6,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
    overflow: 'hidden',
  },
  weatherLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16375D',
    textAlign: 'center',
    lineHeight: 17.5,
    zIndex: 1,
  },
  cardSvg: {
    zIndex: 1,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16375D',
    marginBottom: 10,
  },
  optionCard: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EEF2F7',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  cardSelected: {
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
  iconCircleBlue: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCEBFB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconCircleGray: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBE6EF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  optionLabel14: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    zIndex: 1,
  },
  optionLabel13: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    zIndex: 1,
  },
  optionLabel13Center: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    zIndex: 1,
  },
  saveBtn: {
    backgroundColor: '#2F80ED',
    borderRadius: 999,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#2F7CF0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.36,
    shadowRadius: 26,
    elevation: 5,
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  thankYouRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  thankYouText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16375D',
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundSub: {
    fontSize: 14,
    color: '#7A8B9A',
    textAlign: 'center',
    marginBottom: 20,
  },
  notFoundBtn: {
    backgroundColor: '#2F80ED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  notFoundBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  submitErrorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
});
