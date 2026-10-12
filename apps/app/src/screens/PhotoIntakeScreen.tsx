import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { callHotline111 } from '../lib/hotline';
import { showAlert } from '../lib/dialog';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { apiService, isOfflineQueued } from '../services/api';
import { generateIdempotencyKey } from '../storage';

export interface PhotoIntakeScreenProps {
  /** Called with the new case id, or undefined when the case was queued offline. */
  onApproved: (caseId?: string) => void;
  onBack?: () => void;
  onAvatarPress?: () => void;
}

export type NeedCategory = 'food_water' | 'medical' | 'housing_job' | 'emergency_111';

export interface NeedOption {
  id: NeedCategory;
  emoji: string;
  titleKey: string;
  subtitleKey: string;
  badgeBg: string;
  borderColor: string;
  activeBorder: string;
}

const NEED_OPTIONS: NeedOption[] = [
  {
    id: 'food_water',
    emoji: '🍚',
    titleKey: 'photo.needs.foodWater.title',
    subtitleKey: 'photo.needs.foodWater.subtitle',
    badgeBg: '#FFFBEB',
    borderColor: '#FDE68A',
    activeBorder: '#D97706',
  },
  {
    id: 'medical',
    emoji: '🏥',
    titleKey: 'photo.needs.medical.title',
    subtitleKey: 'photo.needs.medical.subtitle',
    badgeBg: '#EFF6FF',
    borderColor: '#BFDBFE',
    activeBorder: '#2563EB',
  },
  {
    id: 'housing_job',
    emoji: '🏠',
    titleKey: 'photo.needs.housingJob.title',
    subtitleKey: 'photo.needs.housingJob.subtitle',
    badgeBg: '#F0FDF4',
    borderColor: '#BBF7D0',
    activeBorder: '#16A34A',
  },
  {
    id: 'emergency_111',
    emoji: '🆘',
    titleKey: 'photo.needs.emergency111.title',
    subtitleKey: 'photo.needs.emergency111.subtitle',
    badgeBg: '#FEF2F2',
    borderColor: '#FECACA',
    activeBorder: '#DC2626',
  },
];

type GpsState = { status: 'locating' } | { status: 'ok'; lat: number; lng: number } | { status: 'unavailable' };

/**
 * Pixelates the upper-centre region of the photo on the device (where a face usually is)
 * before anything leaves the phone.
 */
const blurFaceRegion = (imageSourceUrl: string): Promise<string> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(imageSourceUrl);
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSourceUrl);
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const faceX = Math.round(canvas.width * 0.25);
      const faceY = Math.round(canvas.height * 0.1);
      const faceW = Math.round(canvas.width * 0.5);
      const faceH = Math.round(canvas.height * 0.45);
      try {
        const faceImgData = ctx.getImageData(faceX, faceY, faceW, faceH);
        const pixelSize = Math.max(14, Math.floor(faceW / 12));
        for (let y = 0; y < faceH; y += pixelSize) {
          for (let x = 0; x < faceW; x += pixelSize) {
            const base = (y * faceW + x) * 4;
            for (let py = 0; py < pixelSize && y + py < faceH; py++) {
              for (let px = 0; px < pixelSize && x + px < faceW; px++) {
                const target = ((y + py) * faceW + (x + px)) * 4;
                for (let channel = 0; channel < 4; channel++) {
                  faceImgData.data[target + channel] = faceImgData.data[base + channel];
                }
              }
            }
          }
        }
        ctx.putImageData(faceImgData, faceX, faceY);
      } catch (canvasErr) {
        console.warn('[PhotoIntake] Canvas pixelation failed:', canvasErr);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(imageSourceUrl);
    img.src = imageSourceUrl;
  });

export const PhotoIntakeScreen: React.FC<PhotoIntakeScreenProps> = ({ onApproved, onBack }) => {
  const { t } = useTranslation();

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [gps, setGps] = useState<GpsState>({ status: 'locating' });
  const [selectedNeeds, setSelectedNeeds] = useState<NeedCategory[]>([]);
  const [notes, setNotes] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchGpsLocation = () => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
      setGps({ status: 'unavailable' });
      return;
    }
    setGps({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setGps({
          status: 'ok',
          lat: Number(position.coords.latitude.toFixed(4)),
          lng: Number(position.coords.longitude.toFixed(4)),
        }),
      (error) => {
        console.warn('[PhotoIntake] GPS unavailable:', error);
        setGps({ status: 'unavailable' });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    fetchGpsLocation();
  }, []);

  const handleFileChange = (event: any) => {
    const file: File | undefined = event.target?.files?.[0];
    if (!file) return;
    setStatusMessage(t('photo.status.processing'));

    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawUrl = e.target?.result as string | undefined;
      if (!rawUrl) return;
      setCapturedImage(await blurFaceRegion(rawUrl));
      setStatusMessage(t('photo.status.photoCaptured'));
      fetchGpsLocation();
    };
    reader.onerror = () => setStatusMessage(t('photo.status.readFailed'));
    reader.readAsDataURL(file);
  };

  const handleTapPhoto = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      setStatusMessage(t('photo.camera.webOnly'));
    }
  };

  const toggleNeed = (needId: NeedCategory) => {
    setSelectedNeeds((current) =>
      current.includes(needId) ? current.filter((id) => id !== needId) : [...current, needId]
    );
  };

  const handleSubmitFastCase = async () => {
    if (isSubmitting) return;
    if (selectedNeeds.length === 0) {
      setStatusMessage(t('photo.status.needRequired'));
      return;
    }
    setIsSubmitting(true);
    setStatusMessage(t('photo.status.submitting'));

    const needLabels = selectedNeeds
      .map((id) => t(NEED_OPTIONS.find((need) => need.id === id)?.titleKey || ''))
      .join(', ');

    try {
      const result = await apiService.createCase({
        clientGeneratedId: generateIdempotencyKey('case'),
        intakeType: 'photo',
        category: selectedNeeds[0],
        photoUrl: capturedImage || undefined,
        latitude: gps.status === 'ok' ? gps.lat : undefined,
        longitude: gps.status === 'ok' ? gps.lng : undefined,
        isMinor,
        notes: notes.trim() || t('photo.payload.needsSummary', { needs: needLabels }),
      });
      if (isOfflineQueued(result)) {
        showAlert(t('common.savedOfflineTitle'), t('common.savedOfflineMsg'));
        onApproved(undefined);
      } else {
        setStatusMessage(t('photo.status.submitSuccess'));
        onApproved(result.id);
      }
    } catch (error) {
      console.warn('[PhotoIntake] Submit failed:', error);
      setStatusMessage(t('photo.status.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {Platform.OS === 'web' && typeof document !== 'undefined' && (
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}

      <View style={styles.topNav}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('common.back')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#16375D" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}

        <Text style={styles.headerTitle}>
          {t('photo.header.title')} <Text style={styles.headerSubtitle}>{t('photo.header.subtitle')}</Text>
        </Text>

        <View style={styles.securityBadge}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
          </Svg>
          <Text style={styles.securityBadgeText}>{t('photo.header.securityBadge')}</Text>
        </View>
      </View>

      <Text style={styles.title}>{t('photo.hero.photoTitle')}</Text>

      {statusMessage && (
        <View style={styles.statusBanner} accessibilityLiveRegion="polite">
          <Text style={styles.statusBannerText}>{statusMessage}</Text>
        </View>
      )}

      <View style={styles.cameraSection}>
        <View style={styles.cameraOuterRing}>
          <TouchableOpacity
            style={[styles.cameraBtn, !!capturedImage && styles.cameraBtnCaptured]}
            onPress={handleTapPhoto}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <Circle cx="12" cy="13" r="4" />
            </Svg>
            <Text style={styles.cameraBtnText}>
              {capturedImage ? t('photo.camera.retakeBtn') : t('photo.camera.takeBtn')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {capturedImage && (
        <View style={styles.photoPreviewCard}>
          <View style={styles.photoPreviewHeader}>
            <Text style={styles.photoPreviewTitle}>{t('photo.preview.title')}</Text>
          </View>
          <View style={styles.photoPlaceholder}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} resizeMode="cover" />
            <Text style={styles.photoPlaceholderText}>{t('photo.preview.disclaimer')}</Text>
          </View>
        </View>
      )}

      <View style={styles.gpsCard}>
        <View style={styles.gpsIconCircle}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <Circle cx="12" cy="10" r="3" />
          </Svg>
        </View>
        <View style={styles.gpsInfoContent}>
          <View style={styles.gpsHeaderRow}>
            <Text style={styles.gpsTitle}>{t('photo.gps.title')}</Text>
            {gps.status === 'locating' && <ActivityIndicator size="small" color="#2F80ED" />}
          </View>
          {gps.status === 'ok' && (
            <Text style={styles.gpsCoords}>{t('photo.gps.coords', { lat: gps.lat.toFixed(4), lng: gps.lng.toFixed(4) })}</Text>
          )}
          {gps.status === 'unavailable' && <Text style={styles.gpsAddress}>{t('photo.gps.unavailable')}</Text>}
          {gps.status === 'locating' && <Text style={styles.gpsAddress}>{t('photo.gps.locating')}</Text>}
        </View>
        <TouchableOpacity style={styles.gpsRefreshBtn} onPress={fetchGpsLocation} accessibilityRole="button" accessibilityLabel={t('photo.gps.refresh')}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2.4}>
            <Path d="M23 4v6h-6M1 20v-6h6" />
            <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </Svg>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeaderTitle}>{t('photo.needs.sectionTitle')}</Text>
      <View style={styles.needsGrid}>
        {NEED_OPTIONS.map((item) => {
          const isSelected = selectedNeeds.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.needCard,
                { backgroundColor: item.badgeBg, borderColor: isSelected ? item.activeBorder : item.borderColor },
                isSelected && styles.needCardSelected,
              ]}
              onPress={() => toggleNeed(item.id)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <View style={styles.needCardTop}>
                <Text style={styles.needEmoji}>{item.emoji}</Text>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: item.activeBorder }]}>
                    <Text style={styles.checkBadgeText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.needTitle}>{t(item.titleKey)}</Text>
              <Text style={styles.needSubtitle}>{t(item.subtitleKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedNeeds.includes('emergency_111') && (
        <View style={styles.emergency111Banner}>
          <View style={styles.emergency111Header}>
            <Text style={styles.emergency111Title}>{t('photo.hotline.title')}</Text>
            <Text style={styles.emergency111Sub}>{t('photo.hotline.freeBadge')}</Text>
          </View>
          <Text style={styles.emergency111Desc}>{t('photo.hotline.desc')}</Text>
          <TouchableOpacity style={styles.btnCall111} onPress={callHotline111} activeOpacity={0.85} accessibilityRole="button">
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
              <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </Svg>
            <Text style={styles.btnCall111Text}>{t('photo.hotline.callBtn')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.minorToggleCard}>
        <View style={styles.minorToggleInfo}>
          <Text style={styles.minorToggleTitle}>{t('photo.childGuard.title')}</Text>
          <Text style={styles.minorToggleDesc}>{t('photo.childGuard.desc')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.minorToggleBtn, isMinor && styles.minorToggleBtnActive]}
          onPress={() => setIsMinor(!isMinor)}
          activeOpacity={0.8}
          accessibilityRole="switch"
          accessibilityState={{ checked: isMinor }}
          accessibilityLabel={t('photo.childGuard.title')}
        >
          <View style={[styles.minorToggleKnob, isMinor && styles.minorToggleKnobActive]} />
        </TouchableOpacity>
      </View>

      <View style={styles.notesContainer}>
        <Text style={styles.notesLabel}>{t('photo.notes.label')}</Text>
        <TextInput
          style={styles.notesInput}
          placeholder={t('photo.notes.placeholder')}
          placeholderTextColor="#64748B"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.btnSubmitFast, isSubmitting && styles.btnSubmitDisabled]}
        onPress={handleSubmitFastCase}
        disabled={isSubmitting}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.btnSubmitFastText}>{t('photo.submit.btn')}</Text>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12h14M12 5l7 7-7 7" />
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16375D',
  },
  headerSubtitle: {
    color: '#7A8B9A',
    fontWeight: '500',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securityBadgeText: {
    color: '#2F80ED',
    fontSize: 13.5,
    fontWeight: '600',
  },
  minorToggleCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  minorToggleInfo: {
    flex: 1,
    paddingRight: 16,
  },
  minorToggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9F1239',
    marginBottom: 4,
  },
  minorToggleDesc: {
    fontSize: 13,
    color: '#BE123C',
    lineHeight: 18,
  },
  minorToggleBtn: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    padding: 2,
  },
  minorToggleBtnActive: {
    backgroundColor: '#E11D48',
  },
  minorToggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  minorToggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  statusBanner: {
    backgroundColor: '#E8F4FC',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  statusBannerText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
    textAlign: 'center',
  },
  cameraSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  cameraOuterRing: {
    width: 174,
    height: 174,
    borderRadius: 87,
    backgroundColor: '#E8F4FC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  cameraBtn: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#2F7CF0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2F7CF0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  cameraBtnCaptured: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  cameraBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  photoPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoPreviewTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#16375D',
  },
  photoPlaceholder: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  gpsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E3EDF6',
  },
  gpsIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsInfoContent: {
    flex: 1,
  },
  gpsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16375D',
  },
  gpsCoords: {
    fontSize: 13.5,
    color: '#2F80ED',
    fontWeight: '600',
    marginTop: 2,
  },
  gpsAddress: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  gpsRefreshBtn: {
    padding: 8,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16375D',
    marginBottom: 12,
  },
  needsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  needCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  needCardSelected: {
    borderWidth: 2.5,
  },
  needCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  needEmoji: {
    fontSize: 28,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  needTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
  },
  needSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emergency111Banner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  emergency111Header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  emergency111Title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
  },
  emergency111Sub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emergency111Desc: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 12,
  },
  btnCall111: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnCall111Text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16375D',
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    fontSize: 14.5,
    color: '#16375D',
    minHeight: 70,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnSubmitFast: {
    backgroundColor: '#2F7CF0',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#2F7CF0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  btnSubmitDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnSubmitFastText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },
});
