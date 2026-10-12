import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { showAlert } from '../lib/dialog';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { apiService } from '../services/api';
import { getOfflineDrafts, clearAllDrafts, syncOfflineDrafts, OfflineDraftRecord } from '../storage';
import { setAppLanguage, SupportedLanguage } from '../i18n';

export interface MoreScreenProps {
  onNavigateToImpact?: () => void;
  onNavigateToMil?: () => void;
  onNavigateToBeforeYouGo?: () => void;
  onNavigateToResources?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToSafeguarding?: () => void;
  onNavigateToVerifiedCard?: () => void;
  onLogout?: () => void;
  onAvatarPress?: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({
  onNavigateToImpact,
  onNavigateToMil,
  onNavigateToBeforeYouGo,
  onNavigateToResources,
  onNavigateToProfile,
  onNavigateToSafeguarding,
  onNavigateToVerifiedCard,
  onAvatarPress,
  onLogout,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language === 'vi' ? 'vi' : 'en') as SupportedLanguage;

  // Cài đặt phông chữ người lớn tuổi
  const [elderlyFontEnabled, setElderlyFontEnabled] = useState<boolean>(false);
  // Quyền riêng tư & Mã hóa giọng nói
  const [voiceEncryptionEnabled, setVoiceEncryptionEnabled] = useState<boolean>(true);
  // Modal Nhật ký đồng bộ Offline
  const [showSyncLogModal, setShowSyncLogModal] = useState<boolean>(false);
  // Modal Cảnh báo An toàn MIL & Phòng lừa đảo số
  const [showScamModal, setShowScamModal] = useState<boolean>(false);

  // Dữ liệu nhật ký đồng bộ offline từ storage
  const [offlineDrafts, setOfflineDrafts] = useState<OfflineDraftRecord[]>([]);
  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    if (lang !== currentLang) {
      await setAppLanguage(lang);
    }
  };

  const handleDownloadDocx = async (caseId: string = 'case-lan-01') => {
    const docxUrl = apiService.getDocxExportUrl(caseId);
    try {
      await Linking.openURL(docxUrl);
    } catch (err) {
      showAlert(
        t('more.alert.download_docx_title', '📄 Tải Mẫu 07 Word (.docx)'),
        t('more.alert.download_docx_msg', {
          url: docxUrl,
          defaultValue: `Đang mở liên kết tải Mẫu 07 trợ giúp xã hội:\n${docxUrl}`,
        })
      );
    }
  };

  const loadDraftQueue = async () => {
    try {
      const drafts = await getOfflineDrafts();
      setOfflineDrafts(drafts);
    } catch (e) {
      console.warn('[MoreScreen] Error loading offline queue:', e);
    }
  };

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState('');

  useEffect(() => {
    loadDraftQueue();

    let isMounted = true;
    apiService.getProfile()
      .then((res) => {
        if (isMounted) {
          if (res.user) {
            setProfileName(res.user.name || res.user.full_name || t('more.profile.default_name', 'Người dùng'));
            setProfileRole(
              res.user.role === 'leader'
                ? t('more.profile.leader_role', 'Đội trưởng Field Work')
                : t('more.profile.volunteer_role', 'Tình nguyện viên · CLB CTXH')
            );
          }
          setIsLoadingProfile(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('[MoreScreen] Get profile error:', err);
          setIsLoadingProfile(false);
        }
      });

    return () => { isMounted = false; };
  }, [showSyncLogModal, currentLang]);

  const handleSyncAllOfflineDrafts = async () => {
    const drafts = await getOfflineDrafts();
    const pendingDrafts = drafts.filter((d) => d.status !== 'synced');
    if (pendingDrafts.length === 0) {
      showAlert(
        t('more.alert.sync_no_drafts_title', 'ℹ️ Đồng bộ Offline'),
        t('more.alert.sync_no_drafts_msg', 'Không có bản ghi nháp nào cần đồng bộ.')
      );
      return;
    }

    setIsSyncingQueue(true);
    try {
      const result = await syncOfflineDrafts(apiService);
      await loadDraftQueue();

      showAlert(
        t('more.alert.sync_success_title', '🚀 Đồng bộ D1 thành công'),
        t('more.alert.sync_success_msg', {
          successCount: result.successCount,
          totalProcessed: result.totalProcessed,
          defaultValue: `Đã đẩy ${result.successCount}/${result.totalProcessed} bản ghi offline lên Cloudflare D1.`,
        })
      );
    } catch (err) {
      console.warn('[MoreScreen] Sync drafts error:', err);
      showAlert(
        t('more.alert.sync_error_title', '⚠️ Lỗi đồng bộ'),
        t('more.alert.sync_error_msg', 'Không thể kết nối đến máy chủ Cloudflare D1.')
      );
    } finally {
      setIsSyncingQueue(false);
    }
  };

  const handleLogout = () => {
    showAlert(
      t('more.alert.logout_title', '🚪 Đăng xuất tài khoản'),
      t('more.alert.logout_confirm', 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng BƯỚC TIẾP?'),
      [
        { text: t('common.cancel', 'Hủy'), style: 'cancel' },
        {
          text: t('more.menu.logout', 'Đăng xuất'),
          style: 'destructive',
          onPress: () => {
            if (onLogout) {
              onLogout();
            } else {
              showAlert(t('more.alert.logout_success', 'Đã đăng xuất thành công'));
            }
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    showAlert(
      t('more.alert.clear_cache_title', '🧹 Dọn dẹp Nhật ký Sync Offline'),
      t('more.alert.clear_cache_msg', 'Xóa lịch sử các bản nháp ĐÃ ĐỒNG BỘ thành công? Các bản nháp đang chờ đồng bộ (nếu có) sẽ được giữ lại an toàn.'),
      [
        { text: t('common.cancel', 'Hủy'), style: 'cancel' },
        {
          text: t('more.alert.clear_cache_btn', 'Xóa ngay'),
          style: 'destructive',
          onPress: async () => {
            await clearAllDrafts();
            await loadDraftQueue();
            showAlert(t('more.alert.clear_cache_success', '✅ Đã dọn dẹp bộ nhớ tạm offline!'));
          },
        },
      ]
    );
  };

  const fontScale = elderlyFontEnabled ? 1.15 : 1.0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header */}
        <Header onAvatarPress={onAvatarPress || onNavigateToProfile} />

        <Text style={[styles.title, { fontSize: 32 * fontScale }]}>
          {t('more.header.title', 'Thêm')}
        </Text>

        {/* Thẻ Hồ sơ Tình nguyện viên */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.85}
          onPress={onNavigateToProfile}
        >
          <View style={styles.avatarCircle}>
            <Svg width={46} height={46} viewBox="0 0 24 24" fill="#6d97bd">
              <Circle cx={12} cy={8.5} r={4} />
              <Path d="M3.5 22c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5z" />
            </Svg>
          </View>
          <View style={styles.profileInfo}>
            {isLoadingProfile ? (
              <Text style={{ color: '#64748B', fontSize: 14 }}>{t('more.profile.loading', t('common.loading', 'Đang tải...'))}</Text>
            ) : (
              <>
                <Text style={[styles.profileName, { fontSize: 20 * fontScale }]}>{profileName || t('more.profile.not_updated', 'Chưa cập nhật')}</Text>
                <Text style={styles.profileRole}>{profileRole || t('more.profile.member_role', 'Thành viên')}</Text>
              </>
            )}
          </View>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#b3c4d3" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 5l7 7-7 7" />
          </Svg>
        </TouchableOpacity>

        {/* Nhóm Ngôn ngữ / Language Switcher */}
        <View style={styles.cardGroup}>
          <View style={styles.languageRow}>
            <View style={[styles.menuIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx={12} cy={12} r={10} />
                <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </Svg>
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuTitle, { fontSize: 15 * fontScale }]}>
                {t('more.language.title', 'Ngôn ngữ / Language')}
              </Text>
              <Text style={styles.menuSubtitle}>
                {t('more.language.subtitle', 'Chọn ngôn ngữ hiển thị ứng dụng')}
              </Text>
            </View>
          </View>
          <View style={styles.langToggleContainer}>
            <TouchableOpacity
              style={[
                styles.langBtn,
                currentLang === 'vi' && styles.langBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => handleLanguageChange('vi')}
            >
              <Text style={[styles.langBtnText, currentLang === 'vi' && styles.langBtnTextActive]}>
                🇻🇳 Tiếng Việt
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.langBtn,
                currentLang === 'en' && styles.langBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={[styles.langBtnText, currentLang === 'en' && styles.langBtnTextActive]}>
                🇬🇧 English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nhóm 1: Tác động Xã hội & Điều hướng cốt lõi */}
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={onNavigateToImpact}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#dcebfb' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
              </Svg>
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuTitle, { fontSize: 16 * fontScale }]}>
                {t('more.menu.impact_title', 'Tác động xã hội')}
              </Text>
              <Text style={styles.menuSubtitle}>
                {t('more.menu.impact_sub', 'Bầu trời tháng này · 32 bước hoàn thành')}
              </Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#b3c4d3" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 5l7 7-7 7" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={onNavigateToBeforeYouGo}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#dcefd9' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="#4ea36b">
                <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
              </Svg>
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuTitle, { fontSize: 16 * fontScale }]}>
                {t('more.menu.ethics_title', 'Nguyên tắc đồng hành')}
              </Text>
              <Text style={styles.menuSubtitle}>
                {t('more.menu.ethics_sub', '4 chuẩn mực UNESCO cho tình nguyện viên')}
              </Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#b3c4d3" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 5l7 7-7 7" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={onNavigateToResources}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#fdecca' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#e8952f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M6 3h12v18l-6-4-6 4z" />
              </Svg>
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuTitle, { fontSize: 16 * fontScale }]}>
                {t('more.menu.saved_resources_title', 'Nơi hỗ trợ đã lưu')}
              </Text>
              <Text style={styles.menuSubtitle}>
                {t('more.menu.saved_resources_sub', 'Danh bạ phòng khám, nhà thương, mái ấm')}
              </Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#b3c4d3" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 5l7 7-7 7" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={onNavigateToVerifiedCard}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#d1fae5' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <Path d="M22 4L12 14.01l-3-3" />
              </Svg>
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuTitle, { fontSize: 16 * fontScale }]}>
                {t('more.menu.mil_card_title', 'Thẻ kiểm định (8 Trường MIL)')}
              </Text>
              <Text style={styles.menuSubtitle}>
                {t('more.menu.mil_card_sub', 'Thẻ thông tin an sinh đã xác minh chính chủ')}
              </Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#b3c4d3" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 5l7 7-7 7" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => handleDownloadDocx('case-lan-01')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <Path d="M14 2v6h6" />
                <Path d="M16 13H8" />
                <Path d="M16 17H8" />
                <Path d="M10 9H8" />
              </Svg>
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuTitle, { fontSize: 16 * fontScale }]}>
                {t('more.menu.download_form07_title', '📄 Tải Mẫu 07 Word (.docx)')}
              </Text>
              <Text style={styles.menuSubtitle}>
                {t('more.menu.download_form07_sub', 'Đơn đề nghị trợ giúp xã hội chuẩn Bộ LĐTBXH')}
              </Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#b3c4d3" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 5l7 7-7 7" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={onNavigateToSafeguarding}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FFF1F2' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </Svg>
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuTitle, { fontSize: 16 * fontScale }]}>
                {t('more.menu.safeguarding_title', '⚠️ Duyệt rủi ro (Safeguarding)')}
              </Text>
              <Text style={styles.menuSubtitle}>
                {t('more.menu.safeguarding_sub', 'CHILD_GUARD: Chỉ dành cho Quản lý')}
              </Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#b3c4d3" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 5l7 7-7 7" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Nhóm 2: An toàn MIL & Phòng lừa đảo số */}
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={onNavigateToMil || (() => setShowScamModal(true))}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#fef2f2' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </Svg>
            </View>
            <View style={styles.menuTextGroup}>
              <View style={styles.titleBadgeRow}>
                <Text style={[styles.menuTitle, { fontSize: 14.5 * fontScale, letterSpacing: -0.2 }]}>
                  {t('more.menu.scam_prevention_title', 'An toàn MIL & Phòng lừa đảo')}
                </Text>
                <View style={styles.badgeDanger}>
                  <Text style={styles.badgeDangerText}>{t('common.newBadge', 'Mới')}</Text>
                </View>
              </View>
              <Text style={styles.menuSubtitle}>
                {t('more.menu.scam_prevention_sub', 'Bẫy Zalo CCCD, Cọc tiền việc làm & Tổng đài 111')}
              </Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#b3c4d3" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 5l7 7-7 7" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Nhóm 3: Cài đặt Phông chữ, Bảo mật & Sync Offline */}
        <View style={styles.cardGroup}>
          <View style={styles.settingSwitchRow}>
            <View style={[styles.menuIconBox, { backgroundColor: '#eef2f7' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#16375d" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 7V4h16v3M9 20h6M12 4v16" />
              </Svg>
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuTitle, { fontSize: 14.5 * fontScale, letterSpacing: -0.2 }]}>
                {t('more.settings.elderly_font_title', 'Cài đặt phông chữ lớn người cao tuổi')}
              </Text>
              <Text style={styles.menuSubtitle}>
                {elderlyFontEnabled
                  ? t('more.settings.elderly_font_on', 'Đã bật phông chữ lớn (115%)')
                  : t('more.settings.elderly_font_off', 'Phông chữ tiêu chuẩn')}
              </Text>
            </View>
            <Switch
              value={elderlyFontEnabled}
              onValueChange={setElderlyFontEnabled}
              trackColor={{ false: '#cbd5e1', true: '#2f80ed' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingSwitchRow}>
            <View style={[styles.menuIconBox, { backgroundColor: '#dcebfb' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
              </Svg>
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuTitle, { fontSize: 14 * fontScale, letterSpacing: -0.3 }]}>
                {t('more.settings.voice_encryption_title', 'Quyền riêng tư & Mã hóa giọng nói')}
              </Text>
              <Text style={styles.menuSubtitle}>
                {t('more.settings.voice_encryption_sub', 'Edge Encryption: Không lưu file ghi âm thô')}
              </Text>
            </View>
            <Switch
              value={voiceEncryptionEnabled}
              onValueChange={setVoiceEncryptionEnabled}
              trackColor={{ false: '#cbd5e1', true: '#2f80ed' }}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => setShowSyncLogModal(true)}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#e2f1e6' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M21.5 2v6h-6M2.5 22v-6h6" />
                <Path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M2.5 16l1 1A10 10 0 0 0 22 12.5" />
              </Svg>
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuTitle, { fontSize: 16 * fontScale }]}>
                {t('more.menu.offline_sync_title', 'Nhật ký đồng bộ offline')}
              </Text>
              <Text style={styles.menuSubtitle}>
                {offlineDrafts.length > 0
                  ? t('more.menu.offline_sync_sub_pending', { count: offlineDrafts.length, defaultValue: `${offlineDrafts.length} bản ghi chờ đẩy D1` })
                  : t('more.menu.offline_sync_sub_synced', 'Đã đồng bộ 100% Cloudflare D1')}
              </Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#b3c4d3" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 5l7 7-7 7" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Nhóm 4: Hỗ trợ & Đăng xuất */}
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() =>
              showAlert(
                t('more.alert.help_title', 'ℹ️ Trợ giúp & phản hồi'),
                t('more.alert.help_msg', 'Liên hệ hotline BƯỚC TIẾP: 090 123 4567 hoặc qua email support@buoctiep.org')
              )
            }
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#eef2f7' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#7d94a8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx={12} cy={12} r={9} />
                <Path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7M12 17h.01" />
              </Svg>
            </View>
            <Text style={[styles.menuTitleSingle, { fontSize: 16 * fontScale }]}>
              {t('more.menu.help_support', 'Trợ giúp & phản hồi')}
            </Text>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#b3c4d3" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 5l7 7-7 7" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#fbe4e0' }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#d15b47" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <Path d="M16 17l5-5-5-5M21 12H9" />
              </Svg>
            </View>
            <Text style={[styles.menuTitleLogout, { fontSize: 16 * fontScale }]}>
              {t('more.menu.logout', 'Đăng xuất')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Thông tin phiên bản */}
        <View style={styles.footer}>
          <Text style={styles.footerApp}>
            {t('more.footer.app_name', 'BƯỚC TIẾP Mobile · UNESCO Youth Hackathon 2026')}
          </Text>
          <Text style={styles.footerVer}>
            {t('more.footer.version', 'Phiên bản 1.0.0 (Offline-First Architecture)')}
          </Text>
        </View>
      </ScrollView>

      {/* Modal 1: Nhật ký Đồng bộ Offline */}
      <Modal visible={showSyncLogModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {t('more.modal_sync.title', '📡 Nhật ký đồng bộ Offline')}
            </Text>
            <Text style={styles.modalSub}>
              {t('more.modal_sync.description', 'Tự động sao lưu dữ liệu hiện trường khi mất sóng và đồng bộ lại khi có kết nối')}
            </Text>

            <View style={styles.logList}>
              {offlineDrafts.length === 0 ? (
                <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', paddingVertical: 12 }}>
                  {t('more.modal_sync.empty_text', '✅ Không có dữ liệu nháp nào chờ đồng bộ. Tất cả đã lên D1!')}
                </Text>
              ) : (
                offlineDrafts.map((item) => (
                  <View key={item.id} style={styles.logItem}>
                    <View style={[styles.logDot, { backgroundColor: item.status === 'synced' ? '#22c55e' : '#f59e0b' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logName}>{item.type.toUpperCase()}: {item.id}</Text>
                      <Text style={styles.logTime}>{new Date(item.createdAt).toLocaleTimeString('vi-VN')}</Text>
                    </View>
                    <Text style={styles.logStatus}>
                      {item.status === 'pending_sync'
                        ? t('more.modal_sync.status_pending', 'Chờ Sync D1')
                        : t('more.modal_sync.status_synced', 'Đã Sync')}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity
              style={[styles.modalBtnPrimary, { backgroundColor: '#2e7d32', marginBottom: 10 }]}
              onPress={handleSyncAllOfflineDrafts}
              disabled={isSyncingQueue}
              activeOpacity={0.85}
            >
              {isSyncingQueue ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalBtnPrimaryText}>
                  {t('more.modal_sync.btn_trigger_sync', '⚡ Kích hoạt Đồng bộ Offline ➔ D1')}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={handleClearCache}
              >
                <Text style={styles.modalBtnSecondaryText}>
                  {t('more.modal_sync.btn_clear_cache', 'Dọn cache')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() => setShowSyncLogModal(false)}
              >
                <Text style={styles.modalBtnPrimaryText}>
                  {t('more.modal_sync.btn_close', t('common.close', 'Đóng'))}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Tóm tắt An toàn MIL & Phòng lừa đảo số */}
      <Modal visible={showScamModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.scamBadge}>
              {t('more.modal_mil.badge', '🚨 AN TOÀN MIL & PHÒNG LỪA ĐẢO SỐ')}
            </Text>
            <Text style={styles.modalTitle}>
              {t('more.modal_mil.title', 'Cảnh báo bẫy lừa đảo phổ biến')}
            </Text>
            
            <View style={styles.scamBoxDanger}>
              <Text style={styles.scamBoxTitle}>
                {t('more.modal_mil.scam1_title', '❌ KHÔNG gửi ảnh CCCD qua Zalo')}
              </Text>
              <Text style={styles.scamBoxDesc}>
                {t('more.modal_mil.scam1_desc', 'Tránh bị mạo danh làm hợp đồng tín dụng đen hoặc đăng ký SIM rác.')}
              </Text>
            </View>

            <View style={styles.scamBoxDanger}>
              <Text style={styles.scamBoxTitle}>
                {t('more.modal_mil.scam2_title', '❌ KHÔNG đặt cọc tiền giữ chỗ việc làm')}
              </Text>
              <Text style={styles.scamBoxDesc}>
                {t('more.modal_mil.scam2_desc', 'Các bài đăng "làm việc tại nhà lương cao" đòi cọc 200k - 500k tiền đồng phục 100% là lừa đảo.')}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.fullMilBtn}
              onPress={() => {
                setShowScamModal(false);
                if (onNavigateToMil) onNavigateToMil();
              }}
            >
              <Text style={styles.fullMilBtnText}>
                {t('more.modal_mil.btn_open_toolkit', 'Mở Bộ công cụ MIL Toolkit ➔')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowScamModal(false)}
            >
              <Text style={styles.closeBtnText}>
                {t('more.modal_mil.btn_close', t('common.close', 'Đóng'))}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fafe',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 140,
  },
  title: {
    lineHeight: 38,
    fontWeight: '800',
    color: '#16375d',
    letterSpacing: -0.6,
    marginTop: 8,
    marginBottom: 18,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eef2f7',
    shadowColor: '#1f508c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 3,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#bfe0f7',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: '700',
    color: '#16375d',
  },
  profileRole: {
    fontSize: 13.5,
    color: '#8395a4',
    marginTop: 2,
  },
  cardGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eef2f7',
    shadowColor: '#1f508c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 15,
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  langToggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 10,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langBtnActive: {
    backgroundColor: '#2F80ED',
    borderColor: '#2F80ED',
  },
  langBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 15,
  },
  settingSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 15,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextGroup: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: '600',
    color: '#16375d',
    flexShrink: 1,
  },
  menuTitleSingle: {
    flex: 1,
    fontWeight: '600',
    color: '#16375d',
  },
  menuTitleLogout: {
    flex: 1,
    fontWeight: '600',
    color: '#d15b47',
  },
  menuSubtitle: {
    fontSize: 12.5,
    color: '#7a8b9a',
    marginTop: 2,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 6,
  },
  badgeDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
  },
  badgeDangerText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#dc2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f4f8',
  },
  footer: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  footerApp: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
  },
  footerVer: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#16375d',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  logList: {
    gap: 12,
    marginBottom: 20,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  logName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16375d',
  },
  logTime: {
    fontSize: 12,
    color: '#64748b',
  },
  logStatus: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2563eb',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    color: '#475569',
    fontWeight: '600',
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: '#2f80ed',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scamBadge: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#dc2626',
    marginBottom: 4,
  },
  scamBoxDanger: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  scamBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 2,
  },
  scamBoxDesc: {
    fontSize: 12.5,
    color: '#7f1d1d',
    lineHeight: 17,
  },
  fullMilBtn: {
    backgroundColor: '#2f80ed',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  fullMilBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  closeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#64748b',
    fontWeight: '600',
  },
});
