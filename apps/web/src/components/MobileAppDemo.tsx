import React, { useState } from 'react';
import {
  Phone, ShieldAlert, Mic, QrCode, Briefcase, Award,
  FileText, Clock, ArrowRight, Search, Activity, MapPin, TrendingUp,
  UserCheck, RefreshCw, AlertTriangle, AlertCircle, Info, Check, CheckCircle2,
  Home, Menu, Users, Smartphone, Maximize2, Minimize2, ChevronRight,
  Calendar, Shield, HeartHandshake, BookOpen, User, Sparkles, Sliders, LogOut,
  Play, Square, HelpCircle, FileCheck, Layers, Eye, ChevronLeft, Navigation
} from 'lucide-react';
import { themeColors } from '@buoc-tiep/shared';
import { useTranslation } from '../i18n';

interface MobileAppDemoProps {
  onSwitchToAdmin?: () => void;
}

export const MobileAppDemo: React.FC<MobileAppDemoProps> = ({ onSwitchToAdmin }) => {
  const { t, locale } = useTranslation();
  const isVi = locale === 'vi';

  // Navigation & Screen selection
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [elderMode, setElderMode] = useState<boolean>(false);

  // Voice Intake Simulator State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  // Elder mode font scale
  const fontSizeMultiplier = elderMode ? 1.15 : 1.0;

  // Voice Simulation preset scenarios
  const runVoiceScenario = (scenario: 'xe_om' | 've_so') => {
    setIsRecording(true);
    setTranscript('');
    setAiResult(null);

    const script = scenario === 'xe_om'
      ? (isVi ? 'Nó biểu tui đóng năm xị rồi tuần sau đi bằng...' : 'They told me to pay 500k deposit and take driving test next week...')
      : (isVi ? 'Tui bán vé số ở ngã tư Hóc Môn, chân yếu quá mần không nổi nữa, cần chỗ học nghề nhẹ hơn...' : 'I sell lottery tickets in Hoc Mon, my legs are weak, looking for lighter daytime job training...');

    let i = 0;
    const interval = setInterval(() => {
      setTranscript(script.substring(0, i + 1));
      i++;
      if (i >= script.length) {
        clearInterval(interval);
        setIsRecording(false);
        setAiAnalyzing(true);

        setTimeout(() => {
          setAiAnalyzing(false);
          if (scenario === 'xe_om') {
            setAiResult({
              standardizedText: isVi
                ? 'Người đó bảo tôi nộp 500.000 VNĐ rồi tuần sau đi thi lấy bằng lái xe'
                : 'Individual requested 500,000 VND deposit for expedited driver license exam',
              entities: {
                action: isVi ? 'Đóng tiền đặt cọc hồ sơ' : 'Deposit required',
                amount: '500.000 VNĐ',
                target: isVi ? 'Lấy bằng lái xe' : 'Driver license exam',
              },
              scamRisk: 'HIGH',
              scamReason: isVi
                ? 'Có dấu hiệu lừa đảo đóng tiền đặt cọc bao đậu bằng lái xe.'
                : 'High probability of fraudulent upfront fee exploitation.',
              recommendation: isVi
                ? 'Không chuyển tiền! Hướng dẫn người dân đến Trung tâm Dịch vụ Việc làm chính thức.'
                : 'Do not transfer funds! Refer directly to certified public employment center.',
            });
          } else {
            setAiResult({
              standardizedText: isVi
                ? 'Tôi bán vé số ở khu vực Hóc Môn, sức khỏe chân yếu, cần chuyển sang nghề nhẹ hơn.'
                : 'Selling lottery tickets in Hoc Mon, limited mobility, seeking lighter daytime vocational support.',
              entities: {
                location: 'Hóc Môn',
                currentJob: isVi ? 'Bán vé số' : 'Lottery vendor',
                skillsNeeded: isVi ? 'May mặc / Sơ chế nhẹ' : 'Light tailoring / Assembly',
              },
              scamRisk: 'NONE',
              scamReason: isVi ? 'Nhu cầu an sinh xã hội thực tế.' : 'Legitimate welfare and livelihood request.',
              recommendation: isVi
                ? 'Lập Hộ chiếu Sinh kế & Kết nối Trung tâm Hỗ trợ Việc làm Lao động Yếu thế.'
                : 'Create Livelihood Passport and route to verified local vocational center.',
            });
          }
        }, 800);
      }
    }, 35);
  };

  const screensList = [
    { id: 'home', label: isVi ? '1. Trang chủ' : '1. Home' },
    { id: 'voice', label: isVi ? '2. Voice Intake AI' : '2. Voice Intake' },
    { id: 'passport', label: isVi ? '3. Hộ chiếu Sinh kế' : '3. Livelihood Passport' },
    { id: 'resources', label: isVi ? '4. Danh bạ Nguồn lực' : '4. Welfare Directory' },
    { id: 'priority', label: isVi ? '5. Mức Ưu tiên & Risk' : '5. Priority & Triage' },
    { id: 'task', label: isVi ? '6. Phân công Nhiệm vụ' : '6. Tasks' },
    { id: 'team', label: isVi ? '7. Đội ngũ Địa bàn' : '7. Field Team' },
    { id: 'checkin', label: isVi ? '8. Check-in GPS' : '8. GPS Check-in' },
    { id: 'before_go', label: isVi ? '9. An toàn Safeguarding' : '9. Safeguarding' },
    { id: 'impact', label: isVi ? '10. Báo cáo Tác động' : '10. Impact Report' },
    { id: 'mil', label: isVi ? '11. Chống Lừa Đảo MIL' : '11. Scam Shield' },
    { id: 'profile', label: isVi ? '12. Cá nhân & Đọc tiếng' : '12. Profile' },
    { id: 'more', label: isVi ? '13. Mở rộng & CS Bảo vệ' : '13. Safeguard Policy' },
    { id: 'login', label: isVi ? '14. Đăng nhập / Đổi Vai trò' : '14. Switch Role' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: '50px' }}>
      {/* Simulator Control Header */}
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: `1.5px solid ${themeColors.border}`,
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Smartphone size={13} color="#2563EB" />
            <span>EXPO REACT NATIVE MOBILE APP PREVIEW</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: themeColors.primaryNavy, margin: '2px 0 0 0' }}>
            {isVi ? 'Trình Giả Lập Ứng Dụng Tình Nguyện Viên (14 Màn Hình)' : 'Youth Navigator Mobile Simulator (14 Screens)'}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Elder Mode Button */}
          <button
            onClick={() => setElderMode(!elderMode)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${elderMode ? '#F59E0B' : themeColors.border}`,
              backgroundColor: elderMode ? '#FEF3C7' : '#F8FAFC',
              color: elderMode ? '#92400E' : themeColors.primaryNavy,
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Eye size={14} />
            <span>{isVi ? `Chữ lớn: ${elderMode ? 'BẬT' : 'TẮT'}` : `Large Text: ${elderMode ? 'ON' : 'OFF'}`}</span>
          </button>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${themeColors.border}`,
              backgroundColor: '#F8FAFC',
              color: themeColors.primaryNavy,
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullScreen ? (isVi ? 'Thu nhỏ' : 'Compact') : (isVi ? 'Mở rộng' : 'Expand')}</span>
          </button>

          {onSwitchToAdmin && (
            <button
              onClick={onSwitchToAdmin}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: themeColors.primaryNavy,
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {isVi ? '← Về Cổng Công Cộng' : '← Back to Public'}
            </button>
          )}
        </div>
      </div>

      {/* Screen Selector Pills */}
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
        {screensList.map((sc) => {
          const isActive = currentScreen === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => setCurrentScreen(sc.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: `1.5px solid ${isActive ? themeColors.primary : themeColors.border}`,
                backgroundColor: isActive ? '#EFF6FF' : '#FFFFFF',
                color: isActive ? themeColors.primary : themeColors.textPrimary,
                fontSize: '12px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {sc.label}
            </button>
          );
        })}
      </div>

      {/* Mobile Device Frame Container */}
      <div
        style={{
          width: isFullScreen ? '100%' : '390px',
          maxWidth: isFullScreen ? '500px' : '390px',
          height: '760px',
          backgroundColor: '#FFFFFF',
          borderRadius: '40px',
          border: '10px solid #1E293B',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Status Bar */}
        <div style={{ backgroundColor: '#1E293B', color: '#FFFFFF', padding: '10px 20px 6px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: '800' }}>
          <span>09:41</span>
          <div style={{ width: '90px', height: '14px', backgroundColor: '#0F172A', borderRadius: '10px' }} />
          <span>100% 5G</span>
        </div>

        {/* Dynamic App Content */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8FAFC', padding: '16px', fontSize: `${fontSizeMultiplier}rem` }}>
          {/* Screen 1: Home */}
          {currentScreen === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase' }}>
                    {isVi ? 'TÌNH NGUYỆN VIÊN ĐỊA BÀN' : 'FIELD NAVIGATOR'}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: themeColors.primaryNavy }}>
                    {isVi ? 'Chào buổi sáng, Hưng!' : 'Good morning, Hung!'}
                  </div>
                  <div style={{ fontSize: '12px', color: themeColors.textMuted }}>
                    {isVi ? 'Huyện Hóc Môn • 12 ca đang đồng hành' : 'Hoc Mon District • 12 active journeys'}
                  </div>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: themeColors.primary, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>
                  H
                </div>
              </div>

              {/* 111 Hotline Banner */}
              <div style={{ backgroundColor: '#FEF2F2', padding: '12px 14px', borderRadius: '12px', border: '1px solid #FECACA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#991B1B' }}>
                    {isVi ? 'Tổng đài Quốc gia 111' : 'National Child Hotline 111'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7F1D1D' }}>
                    {isVi ? 'Bảo vệ trẻ em khẩn cấp 24/7' : 'Emergency Child Protection 24/7'}
                  </div>
                </div>
                <a href="tel:111" style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} />
                  <span>{isVi ? 'Gọi 111' : 'Call 111'}</span>
                </a>
              </div>

              {/* Big Voice Button */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1.5px solid ${themeColors.primary}`, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase', marginBottom: '10px' }}>
                  {isVi ? 'Thu Âm Lắng Nghe Thực Địa' : 'Voice Intake & Active Listening'}
                </span>
                <button
                  onClick={() => setCurrentScreen('voice')}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    backgroundColor: themeColors.primary,
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <Mic size={32} />
                  <span style={{ fontSize: '10px', fontWeight: '800', marginTop: '2px' }}>{isVi ? 'CHẠM ĐỂ NÓI' : 'TAP TO TALK'}</span>
                </button>
                <p style={{ fontSize: '11.5px', color: themeColors.textMuted, marginTop: '10px', margin: '10px 0 0 0' }}>
                  {isVi ? 'Hỗ trợ giọng nói tiếng lóng, phương ngữ Nam Bộ' : 'Supports regional dialects, colloquial speech & slang'}
                </p>
              </div>

              {/* Quick Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div onClick={() => setCurrentScreen('passport')} style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: `1px solid ${themeColors.border}`, cursor: 'pointer' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: themeColors.textMuted }}>{isVi ? 'HỘ CHIẾU SINH KẾ' : 'PASSPORTS'}</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: themeColors.primaryNavy, marginTop: '2px' }}>48</div>
                  <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: '700' }}>{isVi ? 'Đã tạo an toàn' : 'Active Passports'}</div>
                </div>

                <div onClick={() => setCurrentScreen('resources')} style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: `1px solid ${themeColors.border}`, cursor: 'pointer' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: themeColors.textMuted }}>{isVi ? 'NGUỒN LỰC HÓC MÔN' : 'RESOURCES'}</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: themeColors.primaryNavy, marginTop: '2px' }}>15+</div>
                  <div style={{ fontSize: '11px', color: themeColors.primary, fontWeight: '700' }}>{isVi ? 'Đã thẩm định 30d' : 'Verified Partners'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Screen 2: Voice Intake */}
          {currentScreen === 'voice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => setCurrentScreen('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: themeColors.primary }}>
                  ← {t('common.actions.back')}
                </button>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
                  {isVi ? 'Kịch bản thu âm giọng nói đường phố:' : 'Street speech simulation presets:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => runVoiceScenario('xe_om')}
                    disabled={isRecording || aiAnalyzing}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${themeColors.border}`, backgroundColor: '#F8FAFC', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: themeColors.primaryNavy }}>
                      🛵 {isVi ? 'Bác xe ôm (Cảnh báo lừa đảo)' : 'Motorbike Driver (Scam Alert)'}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.textMuted }}>
                      "{isVi ? 'Nó biểu đóng năm xị tuần sau đi bằng' : 'Pay 500k deposit for exam'}"
                    </div>
                  </button>

                  <button
                    onClick={() => runVoiceScenario('ve_so')}
                    disabled={isRecording || aiAnalyzing}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${themeColors.border}`, backgroundColor: '#F8FAFC', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: themeColors.primaryNavy }}>
                      🎫 {isVi ? 'Cô bán vé số (Hỗ trợ học nghề)' : 'Lottery Vendor (Vocational Help)'}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.textMuted }}>
                      "{isVi ? 'Chân yếu quá mần không nổi nữa' : 'Legs weak, looking for training'}"
                    </div>
                  </button>
                </div>
              </div>

              {/* Transcript box */}
              {transcript && (
                <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase', marginBottom: '4px' }}>
                    {isVi ? 'LỜI THOẠI THỰC ĐỊA' : 'FIELD TRANSCRIPT'}
                  </div>
                  <p style={{ fontSize: '13.5px', fontStyle: 'italic', margin: 0, color: '#334155' }}>
                    "{transcript}"
                  </p>
                </div>
              )}

              {/* AI Analysis Result */}
              {aiResult && (
                <div style={{ backgroundColor: aiResult.scamRisk === 'HIGH' ? '#FEF2F2' : '#F0FDF4', padding: '14px', borderRadius: '12px', border: `1px solid ${aiResult.scamRisk === 'HIGH' ? '#FECACA' : '#BBF7D0'}` }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: aiResult.scamRisk === 'HIGH' ? '#991B1B' : '#166534', marginBottom: '4px' }}>
                    {aiResult.scamRisk === 'HIGH' ? '🚨 CẢNH BÁO RỦI RO LỪA ĐẢO (MIL SHIELD)' : '✓ NHU CẦU AN SINH HỢP LỆ'}
                  </div>
                  <div style={{ fontSize: '12px', color: themeColors.textBody, marginBottom: '6px' }}>
                    <strong>{isVi ? 'Đề xuất:' : 'Action:'}</strong> {aiResult.recommendation}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Screen 3: Livelihood Passport */}
          {currentScreen === 'passport' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => setCurrentScreen('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: themeColors.primary, alignSelf: 'flex-start' }}>
                ← {t('common.actions.back')}
              </button>
              <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '14px', border: `1.5px solid ${themeColors.primaryNavy}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase' }}>HỘ CHIẾU SINH KẾ SỐ</span>
                  <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '4px' }}>BT-7K2M-9Q4X</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: themeColors.primaryNavy }}>Cô Lan (50 tuổi)</div>
                <div style={{ fontSize: '12px', color: themeColors.textMuted, marginBottom: '10px' }}>Địa bàn: Ấp 2, Xã Xuân Thới Thượng, Hóc Môn</div>
                <div style={{ borderTop: `1px solid ${themeColors.border}`, paddingTop: '8px', fontSize: '12px', color: themeColors.textBody }}>
                  <div><strong>Mục tiêu ưu tiên:</strong> Tìm việc ban ngày, bán kính ≤5km</div>
                  <div style={{ marginTop: '2px' }}><strong>Điểm mạnh:</strong> Có CCCD, có điện thoại, từng bán hàng</div>
                  <div style={{ marginTop: '2px' }}><strong>Bước an toàn:</strong> Sáng mai 09:00 gặp Cán bộ tư vấn Bàn số 3</div>
                </div>
              </div>
            </div>
          )}

          {/* Other screens fallback */}
          {!['home', 'voice', 'passport'].includes(currentScreen) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button onClick={() => setCurrentScreen('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: themeColors.primary, alignSelf: 'flex-start' }}>
                ← {t('common.actions.back')}
              </button>
              <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
                  {screensList.find(s => s.id === currentScreen)?.label}
                </div>
                <p style={{ fontSize: '13px', color: themeColors.textBody, margin: 0, lineHeight: '1.5' }}>
                  {isVi
                    ? 'Màn hình này đã được tích hợp đầy đủ trong Expo Mobile App (`apps/app`) với chuẩn Light Mode và WCAG AAA.'
                    : 'This screen is fully implemented in the native Expo Mobile App (`apps/app`) following Light Mode and WCAG AAA standards.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div style={{ backgroundColor: '#FFFFFF', borderTop: `1px solid ${themeColors.border}`, padding: '8px 16px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <button onClick={() => setCurrentScreen('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: currentScreen === 'home' ? themeColors.primary : themeColors.textMuted }}>
            <Home size={18} />
            <span style={{ fontSize: '10px', fontWeight: '700', marginTop: '2px' }}>Home</span>
          </button>
          <button onClick={() => setCurrentScreen('voice')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: currentScreen === 'voice' ? themeColors.primary : themeColors.textMuted }}>
            <Mic size={18} />
            <span style={{ fontSize: '10px', fontWeight: '700', marginTop: '2px' }}>Voice</span>
          </button>
          <button onClick={() => setCurrentScreen('passport')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: currentScreen === 'passport' ? themeColors.primary : themeColors.textMuted }}>
            <QrCode size={18} />
            <span style={{ fontSize: '10px', fontWeight: '700', marginTop: '2px' }}>Passport</span>
          </button>
          <button onClick={() => setCurrentScreen('resources')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: currentScreen === 'resources' ? themeColors.primary : themeColors.textMuted }}>
            <MapPin size={18} />
            <span style={{ fontSize: '10px', fontWeight: '700', marginTop: '2px' }}>Directory</span>
          </button>
        </div>
      </div>
    </div>
  );
};
