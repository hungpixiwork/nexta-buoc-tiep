import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import {
  RotateCcw, ShieldCheck, ShieldAlert, RefreshCw, CheckCircle2,
  PhoneCall, Check, Briefcase, Heart,
  WifiOff, UserX, ArrowRight, Clock, AlertCircle, Sparkles, ExternalLink
} from 'lucide-react';
import { useTranslation } from '../../i18n';

interface InteractiveDemoPortalProps {
  onBackToPublic?: () => void;
}

export const InteractiveDemoPortal: React.FC<InteractiveDemoPortalProps> = ({ onBackToPublic }) => {
  const { t, locale } = useTranslation();
  const [activeScenario, setActiveScenario] = useState<'journey1' | 'journey2' | 'journey3' | 'journey4' | 'journey5' | 'journey6' | 'journey7'>('journey1');
  const [stepIndex, setStepIndex] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isVi = locale === 'vi';

  // Scenario 1 State
  const [j1State, setJ1State] = useState({
    observation: isVi
      ? 'Chị nghỉ bán gần một tháng, muốn tìm việc gần nhà.'
      : 'Has been out of work for nearly a month, looking for local daytime work.',
    beneficiaryPriority: isVi
      ? 'Tìm một công việc ổn định (Ban ngày, gần nhà)'
      : 'Find stable daytime employment near home',
    strengths: isVi
      ? ['Có CCCD bản gốc', 'Có điện thoại liên lạc', 'Kinh nghiệm bán hàng', 'Bán kính đi lại ≤5km', 'Chỉ làm ban ngày']
      : ['Valid ID card', 'Active phone', 'Sales experience', 'Travel radius ≤5km', 'Daytime only'],
    verifiedFacts: { workType: true, locationRange: true, availableHours: true, trainingEligible: false },
    selectedResource: {
      id: 'res-job-hcm-01',
      name: isVi ? 'Trung tâm Dịch vụ Việc làm Hóc Môn (Cơ sở 2)' : 'Hoc Mon Employment Center (Branch 2)',
      service: isVi ? 'Tư vấn việc làm & Giới thiệu doanh nghiệp an toàn' : 'Job counseling & Verified enterprise matching',
      distance: '2.3 km',
      eligibility: isVi ? 'Phù hợp độ tuổi & khung giờ ban ngày' : 'Matches age profile & daytime hours',
      lastVerified: isVi ? 'Hôm nay (5 giờ trước)' : 'Today (5 hours ago)',
      capacity: isVi ? 'Còn 4 chỉ tiêu tiếp nhận' : '4 intake slots available',
    },
    safeNextStep: {
      time: isVi ? 'Ngày mai, 09:00–11:00' : 'Tomorrow, 09:00–11:00',
      destination: isVi ? 'Trung tâm Dịch vụ Việc làm Hóc Môn' : 'Hoc Mon Employment Service Center',
      purpose: isVi ? 'Gặp Cán bộ tư vấn việc làm tại Bàn số 3' : 'Meet Job Counselor at Desk #3',
      bring: isVi ? 'Bản gốc CCCD' : 'Original ID Card',
      navigator: isVi ? 'TNV Nguyễn Văn Hưng' : 'Navigator Nguyen Van Hung',
      followUpTime: isVi ? 'Ngày mai, 16:00' : 'Tomorrow, 16:00',
      confirmed: false,
    },
    referral: { id: 'REF-2026-88192', status: 'pending' as 'pending' | 'accepted' | 'declined' },
    followUp: {
      status: 'Better' as 'Better' | 'Same' | 'Harder',
      outcomeDetails: isVi
        ? ['Đã đến đúng giờ', 'Đã được tư vấn công việc tạp vụ trường học', 'Đã hẹn phỏng vấn thứ 3 tuần tới']
        : ['Arrived on time', 'Counselled for school sanitation role', 'Interview scheduled for next Tuesday'],
      completed: false,
    },
  });

  // Scenario 2 State
  const [j2Confirmed, setJ2Confirmed] = useState(false);

  // Scenario 3 State
  const [j3Escalated, setJ3Escalated] = useState(false);
  const [j3HotlineCalled, setJ3HotlineCalled] = useState(false);

  // Scenario 4 State
  const [j4CardIssued, setJ4CardIssued] = useState(false);

  // Scenario 5 State
  const [j5AlternativeAssigned, setJ5AlternativeAssigned] = useState(false);

  // Scenario 6 State
  const [j6ActionTaken, setJ6ActionTaken] = useState<'none' | 'alternative' | 'reverify'>('none');

  // Scenario 7 State
  const [j7SyncStatus, setJ7SyncStatus] = useState<'QUEUED' | 'SYNCED'>('QUEUED');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetAll = () => {
    setStepIndex(1);
    setJ2Confirmed(false);
    setJ3Escalated(false);
    setJ3HotlineCalled(false);
    setJ4CardIssued(false);
    setJ5AlternativeAssigned(false);
    setJ6ActionTaken('none');
    setJ7SyncStatus('QUEUED');
    showToast(isVi ? 'Đã thiết lập lại toàn bộ kịch bản!' : 'All demo simulation states reset!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#1E293B',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 99999,
            fontSize: '13.5px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Scenario Control Header */}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: `1.5px solid ${themeColors.border}`,
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.5px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                }}
              >
                {t('demo.badge')}
              </span>
              {onBackToPublic && (
                <button
                  onClick={onBackToPublic}
                  style={{ background: 'none', border: 'none', color: themeColors.primary, cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                >
                  ← {t('common.actions.back')}
                </button>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: themeColors.primaryNavy }}>
              {t('demo.title')}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: themeColors.textBody }}>
              {t('demo.subtitle')}
            </p>
          </div>

          <button
            onClick={handleResetAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1.5px solid ${themeColors.danger}`,
              backgroundColor: '#FFFFFF',
              color: themeColors.danger,
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} />
            <span>{t('demo.resetButton')}</span>
          </button>
        </div>

        {/* 7 Scenario Selector Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'journey1', label: t('demo.scenarios.s1.title'), icon: <Briefcase size={15} /> },
            { id: 'journey2', label: t('demo.scenarios.s2.title'), icon: <Heart size={15} /> },
            { id: 'journey3', label: t('demo.scenarios.s3.title'), icon: <ShieldAlert size={15} /> },
            { id: 'journey4', label: t('demo.scenarios.s4.title'), icon: <ShieldCheck size={15} /> },
            { id: 'journey5', label: t('demo.scenarios.s5.title'), icon: <UserX size={15} /> },
            { id: 'journey6', label: t('demo.scenarios.s6.title'), icon: <RefreshCw size={15} /> },
            { id: 'journey7', label: t('demo.scenarios.s7.title'), icon: <WifiOff size={15} /> },
          ].map((sc) => {
            const isActive = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  setActiveScenario(sc.id as any);
                  setStepIndex(1);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1.5px solid ${isActive ? themeColors.primary : themeColors.border}`,
                  backgroundColor: isActive ? '#EFF6FF' : '#FFFFFF',
                  color: isActive ? themeColors.primary : themeColors.textPrimary,
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {sc.icon}
                <span>{sc.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Scenario 1 Content */}
      {activeScenario === 'journey1' && (
        <section
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: `1.5px solid ${themeColors.border}`,
            padding: '28px',
          }}
        >
          {/* Progress Header */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy }}>
                {t('demo.stepCount', { current: stepIndex, total: 11 })} — {
                  stepIndex === 1 ? (isVi ? '1. Quan Sát Thực Địa (Listen & Observe)' : '1. Field Observation (Listen & Observe)')
                  : stepIndex === 2 ? (isVi ? '2. Hỏi, Không Tự Suy Diễn (Ask, Don\'t Assume)' : '2. Stated Priority (Ask, Don\'t Assume)')
                  : stepIndex === 3 ? (isVi ? '3. Điểm Mạnh Trước (Strengths First)' : '3. Existing Strengths (Strengths First)')
                  : stepIndex === 4 ? (isVi ? '4. Kiểm Tra An Toàn (Safety Check)' : '4. Safety Screening (Safety Check)')
                  : stepIndex === 5 ? (isVi ? '5. Thấu Hiểu Bối Cảnh (Context Structuring)' : '5. Context Understanding (AI Structuring)')
                  : stepIndex === 6 ? (isVi ? '6. Thẩm Định Thông Tin (Fact Verification)' : '6. Fact Verification (Verify Before Match)')
                  : stepIndex === 7 ? (isVi ? '7. Khớp Nguồn Lực Đã Thẩm Định (Verified Match)' : '7. Resource Matching (Verified Match)')
                  : stepIndex === 8 ? (isVi ? '8. Thiết Lập Bước An Toàn (Safe Next Step)' : '8. Safe Next Step Definition')
                  : stepIndex === 9 ? (isVi ? '9. Bàn Giao Chuyển Tuyến (Form 07 Handoff)' : '9. Referral Handoff (Form 07 Package)')
                  : stepIndex === 10 ? (isVi ? '10. Phản Hồi Đối Tác (Partner Acceptance)' : '10. Partner Confirmation (Referral Continuity)')
                  : (isVi ? '11. Tái Thẩm Định 48h (Follow-up Outcome)' : '11. 48h Follow-up Outcome (Better)')
                }
              </span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: themeColors.primary }}>
                {Math.round((stepIndex / 11) * 100)}%
              </span>
            </div>
            <div style={{ backgroundColor: '#F1F5F9', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(stepIndex / 11) * 100}%`, height: '100%', backgroundColor: themeColors.primary, transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Step Detail Content */}
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '20px', border: `1px solid ${themeColors.border}`, marginBottom: '24px' }}>
            {stepIndex === 1 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase', marginBottom: '6px' }}>
                  {isVi ? 'BƯỚC 1: LẮNG NGHE BAN ĐẦU' : 'STEP 1: INITIAL OBSERVATION'}
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: themeColors.primaryNavy }}>
                  {isVi ? 'Ghi nhận thực tế từ hiện trường của Tình nguyện viên' : 'Initial Field Observation Logged by Youth Navigator'}
                </h3>
                <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: `1px solid ${themeColors.border}` }}>
                  <p style={{ fontSize: '15px', fontStyle: 'italic', color: '#334155', margin: '0 0 10px 0' }}>
                    "{j1State.observation}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge-navy" style={{ fontSize: '11px' }}>TAG: NAVIGATOR_OBSERVED</span>
                    <span style={{ fontSize: '12px', color: themeColors.textMuted }}>
                      {isVi ? '(Ghi nhận khách quan, chưa tự ý gán nhãn hành chính)' : '(Objective observation, not assumed as hard fact)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {stepIndex === 2 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase', marginBottom: '6px' }}>
                  {isVi ? 'BƯỚC 2: HỎI, KHÔNG TỰ SUY DIỄN' : 'STEP 2: ASK, DON\'T ASSUME'}
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: themeColors.primaryNavy }}>
                  {isVi ? 'Người thụ hưởng tự chọn ưu tiên thực tế của họ' : 'Beneficiary-Stated Primary Priority'}
                </h3>
                <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: `1.5px solid ${themeColors.primary}` }}>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="#10B981" />
                    <span>{j1State.beneficiaryPriority}</span>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge-forest" style={{ fontSize: '11px' }}>TAG: BENEFICIARY_STATED</span>
                    <span style={{ fontSize: '12px', color: themeColors.textBody }}>
                      {isVi ? 'Ưu tiên số 1 do chính người dân xác nhận' : 'Primary self-determined goal'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {stepIndex === 3 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase', marginBottom: '6px' }}>
                  {isVi ? 'BƯỚC 3: ĐIỂM MẠNH TRƯỚC' : 'STEP 3: STRENGTHS FIRST'}
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: themeColors.primaryNavy }}>
                  {isVi ? 'Những nguồn lực sẵn có (Không chỉ tập trung vào thiếu thốn)' : 'Existing Assets & Capabilities'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {j1State.strengths.map((st, i) => (
                    <div key={i} style={{ backgroundColor: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${themeColors.border}`, fontSize: '13px', fontWeight: '700', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stepIndex === 4 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase', marginBottom: '6px' }}>
                  {isVi ? 'BƯỚC 4: KIỂM TRA AN TOÀN' : 'STEP 4: SAFETY SCREENING'}
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: themeColors.primaryNavy }}>
                  {isVi ? '5 Câu hỏi loại trừ nguy cơ khẩn cấp' : '5-Point Emergency Triage Evaluation'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    isVi ? 'Nguy hiểm tính mạng tức thì? — KHÔNG' : 'Immediate life-threatening danger? — NO',
                    isVi ? 'Cấp cứu y tế khẩn cấp? — KHÔNG' : 'Medical emergency required? — NO',
                    isVi ? 'Có liên quan trẻ vị thành niên (<18t)? — KHÔNG (Người lớn 50 tuổi)' : 'Child involved (<18)? — NO (Adult 50y)',
                    isVi ? 'Nguy cơ bạo lực hoặc bóc lột? — KHÔNG' : 'Violence or exploitation risk? — NO',
                    isVi ? 'Dấu hiệu bẫy lừa đảo việc làm? — KHÔNG' : 'Impersonation scam indicators? — NO',
                  ].map((q, i) => (
                    <div key={i} style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${themeColors.border}`, fontSize: '13px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={16} color="#16A34A" />
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stepIndex >= 5 && stepIndex <= 11 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase', marginBottom: '6px' }}>
                  {isVi ? `BƯỚC ${stepIndex}: TIẾN TRÌNH CHUYỂN TUYẾN AN TOÀN` : `STEP ${stepIndex}: SAFE REFERRAL PROGRESSION`}
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: themeColors.primaryNavy }}>
                  {stepIndex === 5 && (isVi ? 'Cấu trúc thông tin hỗ trợ quyết định' : 'AI Context Structuring')}
                  {stepIndex === 6 && (isVi ? 'Xác minh ràng buộc trước khi khớp nối' : 'Verification Before Matching')}
                  {stepIndex === 7 && (isVi ? 'Khớp nối tổ chức đối tác có chỉ tiêu thực tế' : 'Verified Resource Matching')}
                  {stepIndex === 8 && (isVi ? 'Kế hoạch hành động Bước An Toàn' : 'Actionable Safe Next Step Plan')}
                  {stepIndex === 9 && (isVi ? 'Hồ sơ chuyển tuyến Chuẩn Mẫu 07 TT 01/2017' : 'Decree 01/2017 Form 07 Referral Package')}
                  {stepIndex === 10 && (isVi ? 'Đối tác tiếp nhận xác nhận lịch hẹn' : 'Partner Acceptance & Continuity')}
                  {stepIndex === 11 && (isVi ? 'Đánh giá kết quả thực tế sau 48 giờ' : '48-Hour Verified Follow-up Outcome')}
                </h3>
                <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: `1px solid ${themeColors.border}` }}>
                  <div style={{ fontSize: '14px', lineHeight: '1.6', color: themeColors.textBody }}>
                    {stepIndex === 5 && (isVi ? 'Hệ thống chuẩn hóa yêu cầu: Tìm việc ban ngày, bán kính ≤5km, có phương tiện liên lạc, không làm ca đêm.' : 'System structures profile: Daytime work, travel radius ≤5km, active phone, no night shifts.')}
                    {stepIndex === 6 && (isVi ? 'Tình nguyện viên đối chiếu CCCD và xác nhận thời gian rảnh buổi sáng.' : 'Navigator validates physical ID card and confirms morning availability.')}
                    {stepIndex === 7 && (isVi ? 'Khớp nối: Trung tâm Dịch vụ Việc làm Hóc Môn (Cơ sở 2) — Đã thẩm định hôm nay, còn 4 chỉ tiêu.' : 'Matched: Hoc Mon Employment Center (Branch 2) — Verified today, 4 slots open.')}
                    {stepIndex === 8 && (isVi ? 'Bước An Toàn: Sáng mai lúc 09:00, mang CCCD gặp Cán bộ tư vấn tại Bàn số 3.' : 'Safe Next Step: Tomorrow 09:00 AM, bring ID card to meet Counselor at Desk #3.')}
                    {stepIndex === 9 && (isVi ? 'Đã tạo và gửi trích xuất Mẫu 07 .docx chính thức đến Trung tâm Việc làm Hóc Môn.' : 'Official Form 07 .docx generated and dispatched to receiving partner.')}
                    {stepIndex === 10 && (isVi ? 'Trung tâm Việc làm Hóc Môn xác nhận tiếp nhận hồ sơ trong 15 phút.' : 'Hoc Mon Employment Center confirmed acceptance within 15 minutes.')}
                    {stepIndex === 11 && (isVi ? 'Kết quả 48h: Cô Lan đã đến đúng giờ, được giới thiệu việc làm tạp vụ trường học, lịch phỏng vấn thứ 3 tuần tới (Đạt BETTER).' : '48h Result: Arrived on time, interviewed for school sanitation role, outcome rating: BETTER.')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setStepIndex((prev) => Math.max(1, prev - 1))}
              disabled={stepIndex === 1}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: `1px solid ${themeColors.border}`,
                backgroundColor: '#FFFFFF',
                color: stepIndex === 1 ? themeColors.textMuted : themeColors.primaryNavy,
                fontWeight: '700',
                cursor: stepIndex === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ← {t('common.actions.back')}
            </button>

            <button
              onClick={() => {
                if (stepIndex < 11) {
                  setStepIndex((prev) => prev + 1);
                } else {
                  showToast(isVi ? 'Đã hoàn thành xuất sắc hành trình mẫu 11 bước!' : 'Successfully completed 11-step Golden Journey!');
                }
              }}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: themeColors.primary,
                color: '#FFFFFF',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{stepIndex === 11 ? (isVi ? 'Hoàn thành' : 'Complete') : `${t('common.actions.continue')} →`}</span>
            </button>
          </div>
        </section>
      )}

      {/* Scenario 2: Older Adult Health */}
      {activeScenario === 'journey2' && (
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1.5px solid ${themeColors.border}`, padding: '28px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: themeColors.primaryNavy }}>
            {t('demo.scenarios.s2.title')}
          </h3>
          <p style={{ fontSize: '14px', color: themeColors.textBody, margin: '0 0 20px 0' }}>
            {t('demo.scenarios.s2.desc')}
          </p>

          <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '10px', border: `1px solid ${themeColors.border}`, marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase', marginBottom: '4px' }}>
              {isVi ? 'ĐỊNH TUYẾN LUỒNG Y TẾ & AN SINH' : 'HEALTH & SOCIAL ASSISTANCE PATHWAY'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '8px' }}>
              {isVi ? 'Bác Tư (68 tuổi) — Gia hạn BHYT & Trợ cấp Người cao tuổi' : 'Elderly Citizen (68y) — Health Insurance Renewal & Pension'}
            </div>
            <p style={{ fontSize: '14px', color: themeColors.textBody, lineHeight: '1.5', margin: 0 }}>
              {isVi
                ? 'Hệ thống tự động phát hiện đối tượng cao tuổi và chuyển sang luồng Trợ giúp Y tế / Xã hội, hoàn toàn KHÔNG ép buộc tham gia thị trường việc làm.'
                : 'System detects older adult profile and routes directly to Health & Pension pathway without forced job matching.'}
            </p>
          </div>

          <button
            onClick={() => {
              setJ2Confirmed(true);
              showToast(isVi ? 'Đã kích hoạt chuyển tuyến Y tế Bác Tư!' : 'Health referral dispatched!');
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: j2Confirmed ? '#10B981' : themeColors.primaryNavy,
              color: '#FFFFFF',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {j2Confirmed ? <CheckCircle2 size={16} /> : <Heart size={16} />}
            <span>{j2Confirmed ? (isVi ? 'Đã Chuyển Tuyến Y Tế' : 'Health Pathway Dispatched') : (isVi ? 'Xác Nhận Bước An Toàn Y Tế' : 'Confirm Health Next Step')}</span>
          </button>
        </section>
      )}

      {/* Scenario 3: Child Safeguarding */}
      {activeScenario === 'journey3' && (
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1.5px solid ${themeColors.danger}`, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: themeColors.danger, marginBottom: '6px' }}>
            <ShieldAlert size={20} />
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
              {t('demo.scenarios.s3.title')}
            </h3>
          </div>
          <p style={{ fontSize: '14px', color: themeColors.textBody, margin: '0 0 20px 0' }}>
            {t('demo.scenarios.s3.desc')}
          </p>

          <div style={{ backgroundColor: '#FEF2F2', padding: '20px', borderRadius: '10px', border: '1px solid #FECACA', marginBottom: '20px' }}>
            <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#991B1B', marginBottom: '6px' }}>
              🚨 {isVi ? 'KÍCH HOẠT QUY TRÌNH BẢO VỆ TRẺ EM BẮT BUỘC (RULE 0)' : 'RULE 0 CHILD SAFEGUARDING ACTIVE'}
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: '#7F1D1D', lineHeight: '1.6' }}>
              <li>{isVi ? 'Mã hóa danh tính an toàn: CHILD-2026-0922' : 'Identity anonymized: CHILD-2026-0922'}</li>
              <li>{isVi ? 'Ẩn số điện thoại, làm mờ tọa độ GPS trên bản đồ công cộng' : 'Masked phone number and blurred public GPS coordinates'}</li>
              <li>{isVi ? 'Khóa cứng 100% luồng việc làm (HTTP 403 Forbidden)' : 'Employment pathways hard blocked (HTTP 403)'}</li>
              <li>{isVi ? 'Gắn kết nối 1-Tap Hotline Quốc gia 111' : 'Direct 1-Tap connection to National Hotline 111'}</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setJ3Escalated(true);
                showToast(isVi ? 'Đã gửi báo cáo khẩn cấp Cán bộ Bảo vệ Trẻ em!' : 'Emergency safeguarding report dispatched!');
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: j3Escalated ? '#10B981' : themeColors.danger,
                color: '#FFFFFF',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              {j3Escalated ? (isVi ? '✓ Đã Báo Cáo Khẩn Cấp' : '✓ Escalated to Safeguarding Officer') : (isVi ? 'Gửi Báo Cáo Bắt Buộc' : 'Trigger Mandatory Escalation')}
            </button>

            <a
              href="tel:111"
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: '800',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
              }}
            >
              <PhoneCall size={15} />
              <span>{isVi ? 'Gọi Hotline 111 (1-Tap)' : 'Call Hotline 111 (1-Tap)'}</span>
            </a>
          </div>
        </section>
      )}

      {/* Scenario 4, 5, 6, 7 Panels */}
      {activeScenario === 'journey4' && (
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1.5px solid ${themeColors.border}`, padding: '28px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: themeColors.primaryNavy }}>
            {t('demo.scenarios.s4.title')}
          </h3>
          <p style={{ fontSize: '14px', color: themeColors.textBody, margin: '0 0 20px 0' }}>
            {t('demo.scenarios.s4.desc')}
          </p>
          <div style={{ backgroundColor: '#FFFBEB', padding: '20px', borderRadius: '10px', border: '1px solid #FDE68A', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#92400E', marginBottom: '6px' }}>
              🛡️ {isVi ? 'CẢNH BÁO MẠO DANH BỆNH VIỆN TỐNG TIỀN' : 'HOSPITAL IMPERSONATION FRAUD ALERT'}
            </div>
            <p style={{ fontSize: '13.5px', color: '#78350F', margin: 0 }}>
              {isVi
                ? 'Hệ thống nhận diện dấu hiệu áp lực tài chính khẩn cấp và cung cấp hướng dẫn xác minh số điện thoại chính thức của Bệnh viện Chợ Rẫy trước khi chuyển tiền.'
                : 'System detects high-pressure transfer demands and issues verification protocol before money is moved.'}
            </p>
          </div>
          <button
            onClick={() => {
              setJ4CardIssued(true);
              showToast(isVi ? 'Đã phát hành Thẻ Thông Tin Thẩm Định!' : 'Verified Emergency Card issued!');
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: j4CardIssued ? '#10B981' : themeColors.primaryNavy,
              color: '#FFFFFF',
              fontWeight: '800',
              cursor: 'pointer',
            }}
          >
            {j4CardIssued ? (isVi ? '✓ Đã Phát Hành Thẻ Thẩm Định' : '✓ Verified Card Issued') : (isVi ? 'Phát Hành Thẻ Thông Tin Thẩm Định' : 'Issue Verified Information Card')}
          </button>
        </section>
      )}

      {activeScenario === 'journey5' && (
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1.5px solid ${themeColors.border}`, padding: '28px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: themeColors.primaryNavy }}>
            {t('demo.scenarios.s5.title')}
          </h3>
          <p style={{ fontSize: '14px', color: themeColors.textBody, margin: '0 0 20px 0' }}>
            {t('demo.scenarios.s5.desc')}
          </p>
          <div style={{ backgroundColor: '#FFF7ED', padding: '20px', borderRadius: '10px', border: '1px solid #FFEDD5', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#C2410C', marginBottom: '6px' }}>
              🔄 {isVi ? 'ĐỐI TÁC QUÁ TẢI — KHÔNG ĐỂ ĐỨT GÃY CHUYỂN TUYẾN' : 'PARTNER FULL — ZERO DROPPED CASES'}
            </div>
            <p style={{ fontSize: '13.5px', color: '#9A3412', margin: 0 }}>
              {isVi
                ? 'Đối tác ban đầu báo hết chỉ tiêu tiếp nhận. Hệ thống tự động tìm và đề xuất Tổ chức thay thế đã thẩm định (Trường Nghề Củ Chi - Còn 8 chỉ tiêu).'
                : 'Primary partner reached maximum capacity. System automatically reroutes to verified fallback organization.'}
            </p>
          </div>
          <button
            onClick={() => {
              setJ5AlternativeAssigned(true);
              showToast(isVi ? 'Đã chuyển tuyến sang đối tác thay thế!' : 'Rerouted to alternative partner successfully!');
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: j5AlternativeAssigned ? '#10B981' : themeColors.primaryNavy,
              color: '#FFFFFF',
              fontWeight: '800',
              cursor: 'pointer',
            }}
          >
            {j5AlternativeAssigned ? (isVi ? '✓ Đã Kết Nối Đối Tác Thay Thế' : '✓ Alternative Partner Connected') : (isVi ? 'Tự Động Kết Nối Nguồn Lực Thay Thế' : 'Connect Verified Alternative Partner')}
          </button>
        </section>
      )}

      {activeScenario === 'journey6' && (
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1.5px solid ${themeColors.border}`, padding: '28px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: themeColors.primaryNavy }}>
            {t('demo.scenarios.s6.title')}
          </h3>
          <p style={{ fontSize: '14px', color: themeColors.textBody, margin: '0 0 20px 0' }}>
            {t('demo.scenarios.s6.desc')}
          </p>
          <div style={{ backgroundColor: '#F5F3FF', padding: '20px', borderRadius: '10px', border: '1px solid #DDD6FE', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#6D28D9', marginBottom: '6px' }}>
              ⏰ {isVi ? 'NGUỒN LỰC QUÁ HẠN 42 NGÀY (CỜ STALE)' : 'RESOURCE UNVERIFIED FOR 42 DAYS (STALE FLAG)'}
            </div>
            <p style={{ fontSize: '13.5px', color: '#5B21B6', margin: 0 }}>
              {isVi
                ? 'Hệ thống tự động khóa chuyển tuyến đối với nguồn lực quá hạn 30 ngày để bảo vệ người dân không bị đưa đến nơi đã đóng cửa.'
                : 'System temporarily disables direct handoffs to stale resources (>30 days) until re-audited.'}
            </p>
          </div>
          <button
            onClick={() => {
              setJ6ActionTaken('reverify');
              showToast(isVi ? 'Đã tạo nhiệm vụ tái thẩm định thực địa!' : 'Re-verification audit task created!');
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: j6ActionTaken === 'reverify' ? '#10B981' : themeColors.primaryNavy,
              color: '#FFFFFF',
              fontWeight: '800',
              cursor: 'pointer',
            }}
          >
            {j6ActionTaken === 'reverify' ? (isVi ? '✓ Đã Tạo Task Kiểm Tra Thực Địa' : '✓ Audit Task Created') : (isVi ? 'Tạo Nhiệm Vụ Tái Thẩm Định' : 'Create Re-verification Task')}
          </button>
        </section>
      )}

      {activeScenario === 'journey7' && (
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1.5px solid ${themeColors.border}`, padding: '28px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: themeColors.primaryNavy }}>
            {t('demo.scenarios.s7.title')}
          </h3>
          <p style={{ fontSize: '14px', color: themeColors.textBody, margin: '0 0 20px 0' }}>
            {t('demo.scenarios.s7.desc')}
          </p>
          <div style={{ backgroundColor: '#F0F9FF', padding: '20px', borderRadius: '10px', border: '1px solid #BAE6FD', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#0369A1', marginBottom: '6px' }}>
              📶 {isVi ? 'GHI NHẬN NGOẠI TUYẾN & ĐỒNG BỘ IDEMPOTENT' : 'OFFLINE CAPTURE & IDEMPOTENT RECONCILIATION'}
            </div>
            <p style={{ fontSize: '13.5px', color: '#075985', margin: 0 }}>
              {isVi
                ? 'Thu thập dữ liệu tại vùng mất sóng, lưu trữ mã hóa AES-256 cục bộ và đồng bộ an toàn qua X-Idempotency-Key khi có mạng trở lại.'
                : 'Intake captured with zero cellular signal, locally AES-256 encrypted, and safely synced via X-Idempotency-Key.'}
            </p>
          </div>
          <button
            onClick={() => {
              setJ7SyncStatus('SYNCED');
              showToast(isVi ? 'Đồng bộ D1 thành công 100%!' : 'Synced to D1 with zero duplicate records!');
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: j7SyncStatus === 'SYNCED' ? '#10B981' : themeColors.primaryNavy,
              color: '#FFFFFF',
              fontWeight: '800',
              cursor: 'pointer',
            }}
          >
            {j7SyncStatus === 'SYNCED' ? (isVi ? '✓ Đã Đồng Bộ D1 Serverless' : '✓ Synced to D1 Database') : (isVi ? 'Mô Phỏng Có Sóng & Đồng Bộ' : 'Simulate Network Reconnect & Sync')}
          </button>
        </section>
      )}
    </div>
  );
};
