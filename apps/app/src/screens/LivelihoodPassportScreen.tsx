import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Linking, Image } from 'react-native';
import { callHotline111 } from '../lib/hotline';
import { showAlert } from '../lib/dialog';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { ImageFadeMask } from '../components/ImageFadeMask';
import { apiService } from '../services/api';
import { speakHermesResponse, stopHermesSpeech } from '../services/hermesVoiceService';

interface LivelihoodPassportScreenProps {
  onBack?: () => void;
  onConnectJob?: () => void;
  onAvatarPress?: () => void;
  caseId?: string;
  isMinor?: boolean;
}

interface SkillItem {
  id?: string;
  title: string;
  sub: string;
  category?: string;
  bg?: string;
  stroke?: string;
}

interface StageItem {
  id: number;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  date?: string;
  note?: string;
}

interface PassportData {
  id: string;
  aliasName: string;
  fullName?: string;
  age: number;
  ageGroup?: string;
  location: string;
  qrCode: string;
  tagline: string;
  skills: SkillItem[];
  wishText: string;
  stages: StageItem[];
}

const INITIAL_PASSPORT_DATA: PassportData = {
  id: 'passport-lan-01',
  aliasName: 'Cô Lan (50 tuổi)',
  fullName: 'Nguyễn Thị Lan',
  age: 50,
  ageGroup: '50-60',
  location: 'Hóc Môn, TP.HCM',
  qrCode: 'BUOCTIEP-PASSPORT-LAN-01',
  tagline: 'Ưu tiên việc làm ban ngày gần nhà (≤5km)',
  skills: [
    { id: '1', title: '12 năm bán hàng & phục vụ', sub: 'Hiểu tâm lý khách hàng & buôn bán tháo vát', bg: '#DCEBFB', stroke: '#2F80ED' },
    { id: '2', title: 'Tự quản lý tiền mặt mỗi ngày', sub: 'Tính toán nhanh, cẩn thận và trung thực', bg: '#DCEBFB', stroke: '#2F80ED' },
    { id: '3', title: 'Quen thuộc địa bàn Hóc Môn', sub: 'Nắm rõ khu vực dân cư & chợ truyền thống', bg: '#DCEFD9', stroke: '#4EA36B' },
  ],
  wishText: 'Mong muốn tìm việc làm ban ngày gần nhà (≤5km), không làm ca đêm, có thu nhập trang trải sinh hoạt hàng ngày.',
  stages: [
    { id: 1, title: '1. Tiếp xúc & Lắng nghe', status: 'completed', date: 'Hôm nay', note: 'Ghi âm & bóc băng thoại thực địa' },
    { id: 2, title: '2. Xác minh & Đồng ý', status: 'completed', date: 'Hôm nay', note: 'Cô Lan xác nhận đồng ý tạo Hộ chiếu' },
    { id: 3, title: '3. Trích xuất Năng lực', status: 'completed', date: 'Hôm nay', note: 'AI phân tích 4 nhóm năng lực cốt lõi' },
    { id: 4, title: '4. Kết nối Đối tác An sinh', status: 'in_progress', date: 'Đang xử lý', note: 'Liên hệ điểm bán hàng/tạp vụ tại Hóc Môn' },
    { id: 5, title: '5. Sinh kế Phù hợp & Đồng hành', status: 'pending', date: 'Dự kiến tuần tới', note: 'Theo dõi 30 ngày đảm bảo bền vững' },
  ],
};

// Component QRCode Vector sắc nét
const QRCodeView: React.FC<{ size?: number; codeValue?: string }> = ({ size = 72, codeValue = 'BUOCTIEP-LAN-01' }) => {
  return (
    <View style={[styles.qrContainer, { width: size, height: size }]}>
      <Svg width={size - 8} height={size - 8} viewBox="0 0 29 29" fill="none">
        <Rect width="29" height="29" fill="#FFFFFF" />
        {/* Finder Pattern top-left */}
        <Rect x="1" y="1" width="7" height="7" fill="#16375D" />
        <Rect x="2" y="2" width="5" height="5" fill="#FFFFFF" />
        <Rect x="3" y="3" width="3" height="3" fill="#16375D" />

        {/* Finder Pattern top-right */}
        <Rect x="21" y="1" width="7" height="7" fill="#16375D" />
        <Rect x="22" y="2" width="5" height="5" fill="#FFFFFF" />
        <Rect x="23" y="3" width="3" height="3" fill="#16375D" />

        {/* Finder Pattern bottom-left */}
        <Rect x="1" y="21" width="7" height="7" fill="#16375D" />
        <Rect x="2" y="22" width="5" height="5" fill="#FFFFFF" />
        <Rect x="3" y="23" width="3" height="3" fill="#16375D" />

        {/* Timing Pattern & Data Modules */}
        <Rect x="9" y="3" width="2" height="2" fill="#16375D" />
        <Rect x="13" y="3" width="3" height="2" fill="#16375D" />
        <Rect x="17" y="3" width="2" height="2" fill="#16375D" />

        <Rect x="3" y="9" width="2" height="3" fill="#16375D" />
        <Rect x="3" y="14" width="2" height="2" fill="#16375D" />
        <Rect x="3" y="17" width="3" height="2" fill="#16375D" />

        <Rect x="10" y="7" width="9" height="2" fill="#16375D" />
        <Rect x="7" y="10" width="2" height="9" fill="#16375D" />
        <Rect x="10" y="10" width="3" height="3" fill="#2F7CF0" />
        <Rect x="15" y="10" width="4" height="2" fill="#16375D" />

        <Rect x="10" y="14" width="2" height="4" fill="#16375D" />
        <Rect x="13" y="15" width="4" height="3" fill="#16375D" />
        <Rect x="18" y="13" width="2" height="4" fill="#2F7CF0" />

        <Rect x="21" y="9" width="3" height="2" fill="#16375D" />
        <Rect x="24" y="12" width="2" height="4" fill="#16375D" />
        <Rect x="21" y="17" width="5" height="2" fill="#16375D" />

        <Rect x="9" y="21" width="3" height="3" fill="#16375D" />
        <Rect x="14" y="21" width="4" height="2" fill="#16375D" />
        <Rect x="19" y="21" width="3" height="5" fill="#16375D" />

        <Rect x="10" y="25" width="2" height="2" fill="#16375D" />
        <Rect x="13" y="24" width="4" height="3" fill="#2F7CF0" />

        {/* Small Center Brand Dot */}
        <Circle cx="14.5" cy="14.5" r="1.5" fill="#16375D" />
      </Svg>
    </View>
  );
};

export const LivelihoodPassportScreen: React.FC<LivelihoodPassportScreenProps> = ({
  onBack,
  onConnectJob,
  onAvatarPress,
  caseId,
  isMinor,
}) => {
  const { t } = useTranslation();
  const [passport, setPassport] = useState<PassportData>(INITIAL_PASSPORT_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [isSeniorMode, setIsSeniorMode] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Helper tính cỡ chữ động hỗ trợ Chế độ Chữ Lớn 130% (Elderly Senior Mode)
  const fontScale = isSeniorMode ? 1.3 : 1.0;
  const getFontSize = (baseSize: number) => Math.round(baseSize * fontScale);

  useEffect(() => {
    let isMounted = true;
    const fetchPassport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiService.getPassport('passport-lan-01');
        if (isMounted && res.success && res.data) {
          const rawSkills = Array.isArray(res.data.skills) ? res.data.skills : ['Bán hàng / Tạp vụ', 'Giao tiếp tốt', 'May mặc cơ bản'];
          const normalizedSkills: SkillItem[] = rawSkills.map((s: any, idx: number) => {
            if (typeof s === 'string') {
              return {
                id: `skill-${idx}`,
                title: s,
                sub: idx === 0 ? 'Kinh nghiệm bán hàng & phục vụ' : idx === 1 ? 'Khả năng giao tiếp & kết nối cộng đồng' : 'Kỹ năng thủ công cơ bản',
              };
            }
            return {
              id: s.id || `skill-${idx}`,
              title: s.title || s.name || 'Kỹ năng thực tế',
              sub: s.sub || s.description || 'Đã xác minh năng lực thực địa',
            };
          });

          const defaultStages: StageItem[] = [
            { id: 1, title: 'Tiếp nhận & Lắng nghe nguyện vọng', status: 'completed', date: 'Hôm nay', note: 'Đã xác lập hồ sơ an toàn và nguyện vọng sinh kế' },
            { id: 2, title: 'Khảo sát năng lực & Xác minh thực địa', status: 'completed', date: 'Hôm nay', note: 'Đã đối chiếu CCCD và năng lực việc làm ban ngày' },
            { id: 3, title: 'Tạo Hộ chiếu Sinh kế & Mã QR', status: 'in_progress', date: 'Đang xử lý', note: 'Sẵn sàng kết nối đơn vị tuyển dụng phù hợp' },
            { id: 4, title: 'Chuyển tuyến sang Đơn vị Tuyển dụng', status: 'pending', date: 'Dự kiến ngày mai', note: 'Giới thiệu việc làm gần nhà (≤5km)' },
            { id: 5, title: 'Theo dõi đồng hành 30 ngày', status: 'pending', date: 'Sau khi nhận việc', note: 'Đảm bảo môi trường làm việc an toàn, bền vững' },
          ];

          const normalizedStages: StageItem[] = Array.isArray(res.data.stages) && res.data.stages.length > 0
            ? res.data.stages
            : defaultStages;

          setPassport({
            ...INITIAL_PASSPORT_DATA,
            ...res.data,
            aliasName: res.data.aliasName || 'Cô Lan (50 tuổi)',
            age: res.data.age || 50,
            location: res.data.location || res.data.currentArea || 'Hóc Môn, TP.HCM',
            tagline: res.data.tagline || res.data.workPreference || 'Ưu tiên việc làm ban ngày gần nhà (≤5km)',
            wishText: res.data.wishText || res.data.workPreference || res.data.safeNextStep || 'Mong muốn tìm việc làm ban ngày ổn định gần nhà (≤5km), không làm ca đêm, có thu nhập trang trải sinh hoạt hàng ngày.',
            skills: normalizedSkills,
            stages: normalizedStages,
          });
        }
      } catch (err) {
        console.log('[PassportScreen] Error fetching passport', err);
        if (isMounted) setError(t('passport.errors.offlineFallback'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPassport();
    return () => {
      isMounted = false;
      stopHermesSpeech();
    };
  }, [t]);

  const handleUpdateStage = async (stageId: number) => {
    try {
      const updatedStages = passport.stages.map((s) => {
        if (s.id === stageId) {
          let newStatus = s.status;
          if (s.status === 'pending') newStatus = 'in_progress';
          else if (s.status === 'in_progress') newStatus = 'completed';
          else newStatus = 'pending';
          return { ...s, status: newStatus as any };
        }
        return s;
      });

      const newPassport = { ...passport, stages: updatedStages };
      setPassport(newPassport);

      // Call API to sync state
      await apiService.updatePassport(passport.id || 'passport-lan-01', { stages: updatedStages });
    } catch (e) {
      console.warn('[PassportScreen] Error updating stage', e);
      showAlert(t('common.error'), t('passport.errors.updateStageFailed'));
    }
  };

  // Xử lý bật/tắt đọc bằng giọng nói (TTS Audio Reader)
  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopHermesSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const skillsText = passport.skills.map((s) => s.title).join(', ');
      const textToSpeak = t('passport.tts.audioScript', {
        name: passport.aliasName,
        age: passport.age,
        location: passport.location,
        tagline: passport.tagline,
        skills: skillsText,
        wish: passport.wishText,
      });
      speakHermesResponse(textToSpeak, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Xử lý mở Modal QR & lưu vết vị trí quét QR vào D1 API Backend
  const handleOpenQRModal = async () => {
    setShowQRModal(true);
    try {
      await apiService.recordQrScan('case-lan-01', {
        locationText: t('passport.qrScan.locationText', { location: passport.location }),
        notes: t('passport.qrScan.notes', { name: passport.aliasName, age: passport.age }),
      });
    } catch (e) {
      console.log('[PassportScreen] Recorded QR scan offline fallback');
    }
  };

  // Xử lý tải Mẫu 07 Word (.docx) trực tiếp từ API Backend D1
  const handleDownloadDocx = async () => {
    const caseId = passport.id || 'case-lan-01';
    const docxUrl = apiService.getDocxExportUrl(caseId);
    try {
      await Linking.openURL(docxUrl);
    } catch (err) {
      showAlert(
        t('passport.docx.dialogTitle'),
        t('passport.docx.dialogMessage', { name: passport.aliasName, url: docxUrl })
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header với nút Back, Logo và Avatar */}
        <Header showBack={true} onBack={onBack} onAvatarPress={onAvatarPress} />

        {/* Thanh Công cụ Hỗ trợ Tiếp cận Nhân văn (Elderly Senior Mode & TTS Audio Reader) */}
        <View style={styles.accessibilityBar}>
          <TouchableOpacity
            style={[styles.accessibilityBtn, isSeniorMode && styles.accessibilityBtnActive]}
            activeOpacity={0.8}
            onPress={() => setIsSeniorMode(!isSeniorMode)}
          >
            <Text style={styles.accessibilityIcon}>{isSeniorMode ? '🔍' : '👓'}</Text>
            <Text style={[styles.accessibilityBtnText, isSeniorMode && styles.accessibilityBtnTextActive]}>
              {isSeniorMode ? t('passport.accessibility.seniorModeActive') : t('passport.accessibility.seniorMode')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.accessibilityBtn, isSpeaking && styles.accessibilityBtnSpeaking]}
            activeOpacity={0.8}
            onPress={handleToggleSpeech}
          >
            <Text style={styles.accessibilityIcon}>{isSpeaking ? '⏹' : '🔊'}</Text>
            <Text style={[styles.accessibilityBtnText, isSpeaking && styles.accessibilityBtnTextSpeaking]}>
              {isSpeaking ? t('passport.accessibility.stopTts') : t('passport.accessibility.startTts')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tiêu đề & Phụ đề */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { fontSize: getFontSize(32), lineHeight: getFontSize(38) }]}>
            {t('passport.header.title')}
          </Text>
          {loading && <ActivityIndicator size="small" color="#2F7CF0" style={styles.loader} />}
        </View>
        
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <Text style={[styles.subtitle, { fontSize: getFontSize(15), lineHeight: getFontSize(22) }]}>
          {t('passport.header.subtitle')}
        </Text>

        {/* Thẻ Hồ sơ Dân sinh chuẩn Mockup 06 với nền tranh hoàng hôn */}
        <View style={styles.profileCard}>
          <Image
            source={require('../../assets/mockup_assets/card-bg-co-lan.jpg')}
            style={styles.profileBgImage}
            resizeMode="cover"
          />
          <ImageFadeMask id="passportProfileFade" color="#FBF6EA" solidUntil={0.9} fadeUntil={1} />
          <View style={styles.profileCardContent}>
            <View style={styles.avatarWrap}>
              <Image
                source={require('../../assets/mockup_assets/avatar-co-lan.jpg')}
                style={styles.avatarCoLanImg}
                resizeMode="cover"
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { fontSize: getFontSize(24) }]}>Cô Lan</Text>
              <View style={styles.taglineRow}>
                <Text style={styles.blueHeart}>💙</Text>
                <Text style={[styles.taglineText, { fontSize: getFontSize(13.5) }]}>Nhiệt tình, chăm chỉ, đáng tin cậy</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Danh sách Thẻ Năng Lực Đã Có */}
        <Text style={[styles.sectionTitle, { fontSize: getFontSize(18) }]}>
          Cô Lan đã có
        </Text>
        <View style={styles.cardList}>
          {passport.skills.map((skill, index) => {
            const bg = skill.bg || (index % 2 === 0 ? '#DCEBFB' : '#DCEFD9');
            const stroke = skill.stroke || (index % 2 === 0 ? '#2F80ED' : '#4EA36B');
            return (
              <View key={skill.id || index} style={styles.capabilityCard}>
                <View style={[styles.iconBox, { backgroundColor: bg }]}>
                  {index === 0 && (
                    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M6 8h12l-1 12H7z" />
                      <Path d="M9 8V6a3 3 0 0 1 6 0v2" />
                    </Svg>
                  )}
                  {index === 1 && (
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <Rect x="5" y="3" width="14" height="18" rx="2" />
                      <Path d="M8 7h8" />
                      <Path d="M8 11h2M8 14h2M8 17h2M14 11h2v6h-2z" />
                    </Svg>
                  )}
                  {index === 2 && (
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M12 21s-6-5-6-10a6 6 0 0 1 12 0c0 5-6 10-6 10Z" />
                      <Circle cx={12} cy={11} r={2.3} />
                    </Svg>
                  )}
                  {index >= 3 && (
                    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M4 11h16a8 8 0 0 1-16 0Z" />
                      <Path d="M11 4c0 1.5-1 2 0 3.5" />
                      <Path d="M14 4c0 1.5-1 2 0 3.5" />
                      <Path d="M4 20h16" />
                    </Svg>
                  )}
                </View>
                <View style={styles.cardTextGroup}>
                  <Text style={[styles.cardTitle, { fontSize: getFontSize(16.5) }]}>{skill.title}</Text>
                  <Text style={[styles.cardSub, { fontSize: getFontSize(13.5) }]}>{skill.sub}</Text>
                </View>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#B3C4D3" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 5l7 7-7 7" />
                </Svg>
              </View>
            );
          })}
        </View>

        {/* Thẻ Nguyện vọng Sinh kế */}
        <Text style={[styles.sectionTitle, { fontSize: getFontSize(18) }]}>
          {t('passport.wish.sectionTitle', { name: passport.aliasName })}
        </Text>
        <View style={styles.wishCard}>
          <View style={styles.wishDecor} />
          <View style={styles.wishContent}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="#2F6DBF" style={styles.quoteIcon}>
              <Path d="M10 7H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h3v1a3 3 0 0 1-3 3v2c3.3 0 5-2.4 5-5V7Zm11 0h-5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h3v1a3 3 0 0 1-3 3v2c3.3 0 5-2.4 5-5V7Z" />
            </Svg>
            <Text style={[styles.wishText, { fontSize: getFontSize(16), lineHeight: getFontSize(23) }]}>{passport.wishText}</Text>
          </View>
        </View>

        {/* Tiến trình Sinh kế (5 Giai đoạn Đồng hành) */}
        <View style={styles.stageSectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: getFontSize(18) }]}>{t('passport.stages.sectionTitle')}</Text>
          <View style={styles.stageBadgeCompleted}>
            <Text style={[styles.stageBadgeCompletedText, { fontSize: getFontSize(12) }]}>{t('passport.stages.statusSupporting')}</Text>
          </View>
        </View>

        <View style={styles.stagesContainer}>
          {passport.stages.length === 0 && !loading && (
            <Text style={styles.emptyText}>{t('passport.stages.emptyList')}</Text>
          )}
          {passport.stages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';
            const isLast = idx === passport.stages.length - 1;

            return (
              <TouchableOpacity key={stage.id} style={styles.stageItemRow} activeOpacity={0.7} onPress={() => handleUpdateStage(stage.id)}>
                {/* Cột mốc thời gian & Đường nối */}
                <View style={styles.timelineCol}>
                  <View
                    style={[
                      styles.stageNodeCircle,
                      isCompleted && styles.nodeCompleted,
                      isInProgress && styles.nodeInProgress,
                      !isCompleted && !isInProgress && styles.nodePending,
                    ]}
                  >
                    {isCompleted && (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}>
                        <Path d="M20 6L9 17l-5-5" />
                      </Svg>
                    )}
                    {isInProgress && (
                      <View style={styles.activeDotInner} />
                    )}
                    {!isCompleted && !isInProgress && (
                      <Text style={[styles.nodeNumberText, { fontSize: getFontSize(12) }]}>{stage.id}</Text>
                    )}
                  </View>

                  {!isLast && (
                    <View
                      style={[
                        styles.timelineLine,
                        isCompleted ? styles.lineCompleted : styles.linePending,
                      ]}
                    />
                  )}
                </View>

                {/* Nội dung Giai đoạn */}
                <View
                  style={[
                    styles.stageContentCard,
                    isCompleted && styles.stageCardCompleted,
                    isInProgress && styles.stageCardInProgress,
                    !isCompleted && !isInProgress && styles.stageCardPending,
                  ]}
                >
                  <View style={styles.stageHeaderRow}>
                    <Text
                      style={[
                        styles.stageTitleText,
                        { fontSize: getFontSize(15) },
                        isCompleted && styles.textCompleted,
                        isInProgress && styles.textInProgress,
                        !isCompleted && !isInProgress && styles.textPending,
                      ]}
                    >
                      {stage.title}
                    </Text>

                    <View
                      style={[
                        styles.statusPill,
                        isCompleted && styles.statusPillCompleted,
                        isInProgress && styles.statusPillInProgress,
                        !isCompleted && !isInProgress && styles.statusPillPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { fontSize: getFontSize(11) },
                          isCompleted && styles.pillTextCompleted,
                          isInProgress && styles.pillTextInProgress,
                          !isCompleted && !isInProgress && styles.pillTextPending,
                        ]}
                      >
                        {isCompleted
                          ? t('passport.stagePill.completed')
                          : isInProgress
                          ? t('passport.stagePill.inProgress')
                          : t('passport.stagePill.pending')}
                      </Text>
                    </View>
                  </View>

                  {stage.note && (
                    <Text style={[styles.stageNoteText, { fontSize: getFontSize(13.5), lineHeight: getFontSize(19) }]}>{stage.note}</Text>
                  )}

                  {stage.date && (
                    <Text style={[styles.stageDateText, { fontSize: getFontSize(12) }]}>⏱ {stage.date}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Nút Hành động: Safeguarding 111 (Trẻ em) HOẶC Kết nối Việc làm (Người trưởng thành) */}
        {isMinor || (passport.age && passport.age < 18) ? (
          <View style={{ marginBottom: 12 }}>
            <View style={{ backgroundColor: '#FFF5F5', borderLeftWidth: 4, borderLeftColor: '#E53E3E', padding: 12, borderRadius: 8, marginBottom: 10 }}>
              <Text style={{ fontWeight: '800', color: '#E53E3E', fontSize: getFontSize(13), marginBottom: 4 }}>
                🔒 BẢO VỆ TRẺ EM — BẢO TRỢ TOÀN DIỆN (P0)
              </Text>
              <Text style={{ fontSize: getFontSize(12), color: '#4A5568', lineHeight: getFontSize(17) }}>
                Người dưới 18 tuổi được bảo vệ an sinh tối đa: Không tạo hồ sơ lao động việc làm. Ưu tiên trợ giúp y tế, mái ấm bảo trợ và giáo dục.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#E53E3E' }]}
              activeOpacity={0.85}
              onPress={callHotline111}
            >
              <Text style={[styles.actionBtnText, { fontSize: getFontSize(16) }]}>🚨 1-Tap Gọi Tổng đài 111 Bảo vệ Trẻ em</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.85}
            onPress={onConnectJob}
          >
            <Text style={[styles.actionBtnText, { fontSize: getFontSize(16) }]}>{t('passport.action.connectJob')}</Text>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 12h15M13 6l6 6-6 6" />
            </Svg>
          </TouchableOpacity>
        )}

        {/* Nút Tải Mẫu 07 Word (.docx) */}
        <TouchableOpacity
          style={styles.docxBtn}
          activeOpacity={0.85}
          onPress={handleDownloadDocx}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2F7CF0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <Path d="M14 2v6h6" />
            <Path d="M16 13H8" />
            <Path d="M16 17H8" />
            <Path d="M10 9H8" />
          </Svg>
          <Text style={[styles.docxBtnText, { fontSize: getFontSize(15) }]}>{t('passport.action.downloadDocx')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Phóng to QR Code */}
      <Modal visible={showQRModal} transparent animationType="fade" onRequestClose={() => setShowQRModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowQRModal(false)}>
          <View style={styles.modalBox}>
            <Text style={[styles.modalTitle, { fontSize: getFontSize(20) }]}>{t('passport.modal.title')}</Text>
            <Text style={[styles.modalSub, { fontSize: getFontSize(14) }]}>
              {t('passport.modal.subtitle', { name: passport.aliasName, age: passport.age, location: passport.location })}
            </Text>
            <View style={styles.qrLargeWrap}>
              <QRCodeView size={190} codeValue={passport.qrCode || 'EMPTY'} />
            </View>
            <Text style={[styles.qrCodeString, { fontSize: getFontSize(13) }]}>{passport.qrCode}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowQRModal(false)}>
              <Text style={[styles.modalCloseText, { fontSize: getFontSize(15) }]}>{t('passport.modal.closeBtn')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAFE',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140,
  },
  accessibilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 12,
  },
  accessibilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CCE0F5',
    gap: 6,
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  accessibilityBtnActive: {
    backgroundColor: '#16375D',
    borderColor: '#16375D',
  },
  accessibilityBtnSpeaking: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  accessibilityIcon: {
    fontSize: 16,
  },
  accessibilityBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16375D',
  },
  accessibilityBtnTextActive: {
    color: '#FFFFFF',
  },
  accessibilityBtnTextSpeaking: {
    color: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.5,
  },
  loader: {
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#4A6076',
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 18,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#7C93A7',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  profileCard: {
    backgroundColor: '#E5EFE1',
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 24,
    minHeight: 136,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D2E3CA',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  profileBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    zIndex: 1,
  },
  avatarWrap: {
    flexShrink: 0,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EADFCE',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCoLanImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  blueHeart: {
    fontSize: 14,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16375D',
    letterSpacing: -0.4,
  },
  ageBadge: {
    backgroundColor: '#16375D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ageBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 13.5,
    color: '#16375D',
    fontWeight: '600',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  taglineText: {
    flex: 1,
    fontSize: 13.5,
    color: '#4A6076',
    fontWeight: '600',
  },
  qrTouchBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCE0F5',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrSubText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16375D',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16375D',
    marginBottom: 12,
  },
  cardList: {
    gap: 11,
    marginBottom: 24,
  },
  capabilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2ECF5',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextGroup: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#16375D',
  },
  cardSub: {
    fontSize: 13.5,
    color: '#4A6076',
    marginTop: 2,
  },
  wishCard: {
    backgroundColor: '#E9F2FB',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBDDF2',
    marginBottom: 26,
  },
  wishDecor: {
    position: 'absolute',
    right: '-5%',
    bottom: 0,
    width: '50%',
    height: '80%',
    backgroundColor: '#CFE6B8',
    opacity: 0.6,
    borderTopLeftRadius: 60,
  },
  wishContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    zIndex: 1,
  },
  quoteIcon: {
    marginTop: 2,
  },
  wishText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#16375D',
    lineHeight: 23,
  },
  stageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stageBadgeCompleted: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  stageBadgeCompletedText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  stagesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2ECF5',
    marginBottom: 24,
  },
  stageItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  stageNodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  nodeCompleted: {
    backgroundColor: '#2F80ED',
  },
  nodeInProgress: {
    backgroundColor: '#D97706',
  },
  nodePending: {
    backgroundColor: '#E2ECF5',
    borderWidth: 1,
    borderColor: '#B3C4D3',
  },
  activeDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  nodeNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16375D',
  },
  timelineLine: {
    width: 3,
    flex: 1,
    minHeight: 28,
    marginTop: 4,
    borderRadius: 2,
  },
  lineCompleted: {
    backgroundColor: '#2F80ED',
  },
  linePending: {
    backgroundColor: '#E2ECF5',
  },
  stageContentCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  stageCardCompleted: {
    backgroundColor: '#F0F7FF',
    borderColor: '#CCE0F5',
  },
  stageCardInProgress: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  stageCardPending: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  stageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stageTitleText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  textCompleted: {
    color: '#16375D',
  },
  textInProgress: {
    color: '#92400E',
  },
  textPending: {
    color: '#475569',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPillCompleted: {
    backgroundColor: '#2F80ED',
  },
  statusPillInProgress: {
    backgroundColor: '#D97706',
  },
  statusPillPending: {
    backgroundColor: '#CBD5E1',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextCompleted: {
    color: '#FFFFFF',
  },
  pillTextInProgress: {
    color: '#FFFFFF',
  },
  pillTextPending: {
    color: '#1E293B',
  },
  stageNoteText: {
    fontSize: 13.5,
    color: '#16375D',
    lineHeight: 19,
    marginTop: 2,
  },
  stageDateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  actionBtn: {
    backgroundColor: '#2F7CF0',
    borderRadius: 999,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    shadowColor: '#2F7CF0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  docxBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#2F7CF0',
    shadowColor: '#1F508C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  docxBtnText: {
    color: '#16375D',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22, 55, 93, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16375D',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 14,
    color: '#4A6076',
    marginBottom: 20,
  },
  qrLargeWrap: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2ECF5',
    marginBottom: 16,
  },
  qrCodeString: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2F7CF0',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  modalCloseBtn: {
    backgroundColor: '#16375D',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
