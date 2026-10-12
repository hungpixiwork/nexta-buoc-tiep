import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { showAlert } from '../lib/dialog';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';

export interface VerifiedInfoCardScreenProps {
  onBack?: () => void;
  onAvatarPress?: () => void;
  initialCardData?: {
    title?: string;
    category?: string;
    verifiedBy?: string;
    lastVerifiedDate?: string;
    address?: string;
    eligibilityCost?: string;
    phone?: string;
  };
}

export const VerifiedInfoCardScreen: React.FC<VerifiedInfoCardScreenProps> = ({
  onBack,
  onAvatarPress,
  initialCardData,
}) => {
  const { t } = useTranslation();

  // 8 Fields Verified Info Card State
  const [cardTitle, setCardTitle] = useState(
    initialCardData?.title || t('verifiedCard.defaultTitle')
  );
  const [category, setCategory] = useState(
    initialCardData?.category || t('verifiedCard.defaultCategory')
  );
  const [verificationCode] = useState('VERIFIED-2026-HC09-8F3A');
  const [verifiedBy, setVerifiedBy] = useState(
    initialCardData?.verifiedBy || t('verifiedCard.defaultVerifiedBy')
  );
  const [lastVerifiedDate] = useState('2026-07-25');
  const [address, setAddress] = useState(
    initialCardData?.address || t('verifiedCard.defaultAddress')
  );
  const [eligibilityCost, setEligibilityCost] = useState(
    initialCardData?.eligibilityCost || t('verifiedCard.defaultEligibilityCost')
  );
  const [phone, setPhone] = useState(initialCardData?.phone || '028.3892.xxxx');

  const handleShareCard = async () => {
    try {
      const shareContent = `
${t('verifiedCard.shareHeader')}
${t('verifiedCard.shareVerificationCode')} ${verificationCode}
${t('verifiedCard.shareTitle')} ${cardTitle}
${t('verifiedCard.shareCategory')} ${category}
${t('verifiedCard.shareVerifiedBy')} ${verifiedBy}
${t('verifiedCard.shareVerifiedDate')} ${lastVerifiedDate}
${t('verifiedCard.shareAddress')} ${address}
${t('verifiedCard.shareEligibilityCost')} ${eligibilityCost}
${t('verifiedCard.sharePhone')} ${phone}
${t('verifiedCard.shareMilRule')}
${t('verifiedCard.shareOfficialLink')}
      `.trim();

      await Share.share({
        message: shareContent,
        title: t('verifiedCard.shareDialogTitle', { cardTitle }),
      });
    } catch (error) {
      console.warn('[VerifiedInfoCard] Share error:', error);
    }
  };

  const handleReportIssue = () => {
    showAlert(
      t('verifiedCard.reportIssueTitle'),
      t('verifiedCard.reportIssueBody'),
      [{ text: t('common.understood') }]
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <Header showBack={!!onBack} onBack={onBack} onAvatarPress={onAvatarPress} />

        {/* Screen Header Group */}
        <View style={styles.headerGroup}>
          <Text style={styles.eyebrowText}>{t('verifiedCard.eyebrow')}</Text>
          <Text style={styles.title}>{t('verifiedCard.title')}</Text>
          <Text style={styles.subtitle}>
            {t('verifiedCard.subtitle')}
          </Text>
        </View>

        {/* VERIFIED INFO CARD (8 FIELDS STANDARDS) */}
        <View style={styles.cardWrapper}>
          {/* Card Header & Badge */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTop}>
              <View style={styles.verifiedBadge}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.5}>
                  <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.verifiedBadgeText}>{t('verifiedCard.verifiedBadgeText')}</Text>
              </View>
              <Text style={styles.verifiedCodeText}>{verificationCode}</Text>
            </View>

            {/* Field 1: Tiêu đề nguồn lực */}
            <Text style={styles.cardTitle}>{cardTitle}</Text>

            {/* Field 2: Danh mục an sinh */}
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>🏷️ {category}</Text>
            </View>
          </View>

          {/* Card Body - 6 Remaining Fields */}
          <View style={styles.cardBody}>
            {/* Field 3 & 4: Cơ quan & Ngày xác minh */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconCircle}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2}>
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </Svg>
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t('verifiedCard.labelVerifiedBy')}</Text>
                <Text style={styles.fieldValueBold}>{verifiedBy}</Text>
                <Text style={styles.fieldSubValue}>{t('verifiedCard.labelLastVerifiedDate', { date: lastVerifiedDate })}</Text>
              </View>
            </View>

            {/* Field 5: Địa chỉ & Vị trí thực địa */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconCircle}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2}>
                  <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <Circle cx="12" cy="10" r="3" />
                </Svg>
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t('verifiedCard.labelAddress')}</Text>
                <Text style={styles.fieldValue}>{address}</Text>
              </View>
            </View>

            {/* Field 6: Điều kiện tiếp nhận & Chi phí */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconCircle}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2}>
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M12 6v6l4 2" />
                </Svg>
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t('verifiedCard.labelEligibilityCost')}</Text>
                <Text style={styles.fieldValueHighlight}>{eligibilityCost}</Text>
              </View>
            </View>

            {/* Field 7: Điện thoại liên hệ */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconCircle}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2F80ED" strokeWidth={2}>
                  <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </Svg>
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t('verifiedCard.labelPhone')}</Text>
                <Text style={styles.fieldValueBold}>{phone}</Text>
              </View>
            </View>

            {/* Field 8: MIL Verification Checklist (Check It Yourself) */}
            <View style={styles.milChecklistCard}>
              <Text style={styles.milChecklistTitle}>{t('verifiedCard.checklistTitle')}</Text>
              <View style={styles.checkStepRow}>
                <Text style={styles.checkStepNumber}>1</Text>
                <Text style={styles.checkStepText}>{t('verifiedCard.step1')}</Text>
              </View>
              <View style={styles.checkStepRow}>
                <Text style={styles.checkStepNumber}>2</Text>
                <Text style={styles.checkStepText}>{t('verifiedCard.step2')}</Text>
              </View>
              <View style={styles.checkStepRow}>
                <Text style={styles.checkStepNumber}>3</Text>
                <Text style={styles.checkStepText}>{t('verifiedCard.step3')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.btnShare}
          onPress={handleShareCard}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('verifiedCard.shareA11y')}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4}>
            <Circle cx="18" cy="5" r="3" />
            <Circle cx="6" cy="12" r="3" />
            <Circle cx="18" cy="19" r="3" />
            <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
          </Svg>
          <Text style={styles.btnShareText}>{t('verifiedCard.shareBtn')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnReport}
          onPress={handleReportIssue}
          activeOpacity={0.8}
        >
          <Text style={styles.btnReportText}>{t('verifiedCard.reportBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F6FAFE',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140,
  },
  headerGroup: {
    marginTop: 4,
    marginBottom: 18,
  },
  eyebrowText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2F80ED',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#D1E3F8',
    marginBottom: 20,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#EFF6FF',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  cardHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  verifiedCodeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    lineHeight: 28,
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  cardBody: {
    padding: 18,
    gap: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  fieldIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14.5,
    color: '#1E293B',
    fontWeight: '500',
    lineHeight: 20,
  },
  fieldValueBold: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
    lineHeight: 21,
  },
  fieldValueHighlight: {
    fontSize: 14.5,
    color: '#047857',
    fontWeight: '700',
    lineHeight: 20,
  },
  fieldSubValue: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 2,
  },
  milChecklistCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
  },
  milChecklistTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 10,
  },
  checkStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  checkStepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D97706',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },
  checkStepText: {
    fontSize: 13,
    color: '#78350F',
    fontWeight: '600',
    flex: 1,
  },
  btnShare: {
    backgroundColor: '#2F80ED',
    borderRadius: 16,
    minHeight: 54,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
  },
  btnShareText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '700',
  },
  btnReport: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  btnReportText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#DC2626',
  },
});
