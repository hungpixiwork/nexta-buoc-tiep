import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import {
  ShieldAlert,
  Globe,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  MapPin,
  Clock,
  User,
  Share2,
  Phone,
  Lock,
  ChevronRight,
  UserCheck,
  Building2,
  QrCode
} from 'lucide-react';
import { CaseRecord, ResourceRecord } from '../../types';
import { NextaQRCode, generateSafeShareToken } from '../qr';
import { PeopleCombobox } from '../combobox/PeopleCombobox';

interface CaseDetailModalProps {
  selectedCase: CaseRecord | null;
  passportData: any | null;
  loadingPassport: boolean;
  showHandoffForm: boolean;
  setShowHandoffForm: (show: boolean) => void;
  handoffForm: any;
  setHandoffForm: React.Dispatch<React.SetStateAction<any>>;
  scamChecklist: any;
  scamRisk: string;
  actionLoading: boolean;
  setSelectedCase: (c: CaseRecord | null) => void;
  isStale: (createdAt: string) => boolean;
  getRecoveryCode: (c: CaseRecord) => string;
  handleHandoffSubmit: (e: React.FormEvent) => void;
  handleScamCheckChange: (key: any) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  selectedCase,
  passportData,
  loadingPassport,
  showHandoffForm,
  setShowHandoffForm,
  handoffForm,
  setHandoffForm,
  scamChecklist,
  scamRisk,
  actionLoading,
  setSelectedCase,
  isStale,
  getRecoveryCode,
  handleHandoffSubmit,
  handleScamCheckChange
}) => {
  if (!selectedCase) return null;

  const isMinor = Boolean(selectedCase.isMinor);
  const [activeTab, setActiveTab] = useState<'overview' | 'strengths' | 'options' | 'journey' | 'handover'>('overview');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareScope, setShareScope] = useState<'skills_only' | 'verified_experience' | 'full_continuity'>('skills_only');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22, 55, 93, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px', boxSizing: 'border-box' }}>
      <div
        className="card-flat"
        style={{
          maxWidth: '960px',
          width: '100%',
          maxHeight: 'calc(100% - 24px)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: `2px solid ${isMinor ? themeColors.danger : themeColors.primaryNavy}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* ============================================================ */}
        {/* 1. FIXED MODAL HEADER                                        */}
        {/* ============================================================ */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${themeColors.border}`,
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              {isMinor ? (
                <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', border: '1px solid #FECACA', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <ShieldAlert size={13} style={{ flexShrink: 0 }} /> KHÓA CỨNG BẢO VỆ TRẺ EM (P0 SAFEGUARDING)
                </span>
              ) : (
                <span style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', border: '1px solid #BFDBFE', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Globe size={13} style={{ flexShrink: 0 }} /> HỘ CHIẾU SINH KẾ — CONTINUITY RECORD
                </span>
              )}
              <span style={{ fontSize: '11.5px', color: themeColors.textMuted, fontWeight: '700', whiteSpace: 'nowrap' }}>
                Mã định danh: <strong style={{ color: themeColors.primaryNavy }}>BT-{selectedCase.beneficiaryId?.toUpperCase() || selectedCase.id.toUpperCase()}</strong>
              </span>
            </div>
            <h3 style={{ margin: 0, color: isMinor ? themeColors.danger : themeColors.primaryNavy, fontSize: '19px', fontWeight: '800', lineHeight: 1.3 }}>
              {isMinor ? 'Kế hoạch Bảo vệ Trẻ em & Trợ giúp An sinh' : `Hộ chiếu Sinh kế — ${selectedCase.fullName || selectedCase.aliasName}`}
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: themeColors.textBody, lineHeight: 1.4 }}>
              {isMinor
                ? 'Hồ sơ bảo trợ khẩn cấp, chăm sóc toàn diện và kết nối mái ấm/giáo dục theo Luật Trẻ em 2016.'
                : 'Bản ghi có cấu trúc ghi nhận điểm mạnh, kinh nghiệm đã xác minh và các bước sinh kế an toàn.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {!isMinor && (
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}
                onClick={() => setShowShareModal(true)}
                title="Tạo liên kết chia sẻ bảo mật có giới hạn thời gian"
              >
                <Share2 size={13} style={{ flexShrink: 0 }} />
                <span>Chia sẻ bảo mật</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedCase(null);
                setShowHandoffForm(false);
              }}
              aria-label="Đóng cửa sổ"
              style={{
                border: 'none',
                background: '#F1F5F9',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '700',
                cursor: 'pointer',
                color: themeColors.primaryNavy,
                padding: 0,
                lineHeight: 1,
                flexShrink: 0
              }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. SCROLLABLE MODAL BODY                                     */}
        {/* ============================================================ */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, minHeight: 0, boxSizing: 'border-box' }}>

        {/* ============================================================ */}
        {/* CASE A: CHILD SAFEGUARDING PATHWAY (100% BLOCKED FROM WORK) */}
        {/* ============================================================ */}
        {isMinor ? (
          <div>
            {/* Hard Invariant Banner */}
            <div style={{ border: `2px solid ${themeColors.danger}`, borderRadius: '12px', padding: '20px', backgroundColor: '#FFF5F5', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldAlert size={26} color="#FFFFFF" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: themeColors.danger }}>
                    NGUYÊN TẮC BẢO VỆ TRẺ EM — BẮT BUỘC TUÂN THỦ 100% (INVARIANT P0)
                  </h4>
                  <div style={{ fontSize: '13px', color: '#7F1D1D', marginTop: '2px' }}>
                    Mã hồ sơ bảo mật: <strong>{selectedCase.aliasName}</strong> &bull; Độ tuổi: <strong>Dưới 18 tuổi (Trẻ vị thành niên)</strong>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: `1px solid ${themeColors.dangerBorder}`, borderRadius: '8px', padding: '16px', marginBottom: '16px', fontSize: '13px', lineHeight: '1.6', color: themeColors.textBody }}>
                <strong style={{ color: themeColors.danger }}>⚠️ QUY ĐỊNH AN SINH BẮT BUỘC ĐỐI VỚI TRẺ EM:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li><strong>100% CẤM Khai thác lao động:</strong> Tuyệt đối không lập hồ sơ tìm việc làm, không giới thiệu tuyển dụng, không đánh giá năng lực lao động đối với người dưới 18 tuổi.</li>
                  <li><strong>Bảo mật danh tính tuyệt đối:</strong> Ẩn họ tên thật, CCCD, số điện thoại và làm mờ tọa độ GPS (~1km) trên mọi giao diện công cộng.</li>
                  <li><strong>Ưu tiên can thiệp an toàn:</strong> Tập trung vào nơi ở an toàn (Mái ấm), y tế, dinh dưỡng, tái hòa nhập gia đình hoặc bảo trợ học tập.</li>
                </ul>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <a
                  href="tel:111"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 16px',
                    backgroundColor: themeColors.danger,
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '14px',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <Phone size={16} style={{ flexShrink: 0 }} />
                  <span>Gọi Tổng đài Quốc gia 111 (Bảo vệ Trẻ em)</span>
                </a>

                <button
                  type="button"
                  className="btn-navy"
                  style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={() => {
                    alert(`Đã kích hoạt quy trình Chuyển tuyến Bảo trợ Trẻ em cho ca ${selectedCase.aliasName}. Thông báo khẩn đã gửi tới Cán bộ Giám sát Safeguarding.`);
                  }}
                >
                  <Building2 size={16} style={{ flexShrink: 0 }} />
                  <span>Chuyển tuyến Mái ấm / Bảo trợ Học tập</span>
                </button>
              </div>
            </div>

            {/* Child Safeguarding Journey Timeline */}
            <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '18px', backgroundColor: '#F8FAFC', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '14.5px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                <span>Tiến trình Bảo trợ & Kế hoạch An toàn Trẻ em</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { step: '1. Tiếp xúc thực địa & Mã hóa định danh', status: 'Đã hoàn tất', note: 'Mã hóa bí danh an toàn, làm mờ tọa độ GPS bảo vệ nơi ở.' },
                  { step: '2. Đánh giá nhu cầu khẩn cấp & Sơ cứu tâm lý', status: 'Đang thực hiện', note: 'Xác minh tình trạng dinh dưỡng, nơi ở tạm lánh và an toàn thể chất.' },
                  { step: '3. Phối hợp Tổng đài Quốc gia 111 & Tổ chức Bảo trợ', status: 'Chờ kết nối', note: 'Lập biên bản chuyển tuyến an sinh bảo trợ vị thành niên theo Mẫu số 07.' },
                  { step: '4. Bàn giao an toàn & Theo dõi bảo trợ dài hạn', status: 'Dự kiến', note: 'Đồng hành tối thiểu 60 ngày tại môi trường học tập / mái ấm bảo trợ.' }
                ].map((st, idx) => (
                  <div key={idx} style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '800', color: themeColors.primaryNavy, fontSize: '13px' }}>{st.step}</div>
                      <div style={{ color: themeColors.textMuted, fontSize: '12px', marginTop: '2px' }}>{st.note}</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: idx === 0 ? '#DCFCE7' : idx === 1 ? '#FEF3C7' : '#F1F5F9', color: idx === 0 ? '#15803D' : idx === 1 ? '#B45309' : '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {st.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Handover Section */}
            {!showHandoffForm ? (
              <button
                type="button"
                className="btn-outline"
                style={{ width: '100%', padding: '12px', fontSize: '13.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}
                onClick={() => setShowHandoffForm(true)}
              >
                <UserCheck size={16} style={{ flexShrink: 0 }} />
                <span>Bàn giao Ca Bảo trợ cho Cán bộ / Nhân viên CTXH Mới</span>
              </button>
            ) : (
              <div style={{ border: `1px solid ${themeColors.warning}`, borderRadius: '12px', padding: '18px', backgroundColor: '#FFFBEB' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={15} style={{ flexShrink: 0 }} />
                  <span>Bàn giao Ca Bảo vệ Trẻ em cho Cán bộ Phụ trách Mới</span>
                </h4>
                <form onSubmit={handleHandoffSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Cán bộ / Nhân viên Nhận bàn giao</label>
                      <input
                        type="text"
                        required
                        value={handoffForm.assignedTo}
                        onChange={e => setHandoffForm({ ...handoffForm, assignedTo: e.target.value })}
                        placeholder="VD: Cán bộ CTXH Trần Thị Mai"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13.5px', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Ghi chú bàn giao bảo mật</label>
                        <input
                          type="text"
                          required
                          value={handoffForm.notes}
                          onChange={e => setHandoffForm({ ...handoffForm, notes: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13.5px', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Hạn theo dõi tiếp theo</label>
                        <input
                          type="date"
                          required
                          value={handoffForm.nextFollowUpAt}
                          onChange={e => setHandoffForm({ ...handoffForm, nextFollowUpAt: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13.5px', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button type="button" className="btn-outline" onClick={() => setShowHandoffForm(false)}>Hủy</button>
                      <button type="submit" className="btn-navy" disabled={actionLoading} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {actionLoading ? 'Đang bàn giao...' : 'Xác nhận Bàn giao Ca'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* CASE B: REBUILT ADULT LIVELIHOOD PASSPORT (HUMAN DIGNITY) */
          /* ============================================================ */
          <div>
            {/* 1. CURRENT SAFE NEXT STEP (CENTERPIECE CARD) */}
            <div style={{ border: `2px solid #2563EB`, borderRadius: '12px', padding: '18px', backgroundColor: '#F0F7FF', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1D4ED8', backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Bước Tiếp An Toàn Hiện Tại (Safe Next Step)
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#15803D', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <CheckCircle2 size={14} style={{ flexShrink: 0 }} /> ĐÃ XÁC NHẬN BỞI CÁN BỘ
                </span>
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '16.5px', fontWeight: '800', color: themeColors.primaryNavy }}>
                Đến Trung tâm Dạy nghề Huyện Hóc Môn gặp Cán bộ tư vấn việc làm an sinh
              </h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: themeColors.textBody, lineHeight: '1.5' }}>
                <strong>Mục đích:</strong> Xác nhận điều kiện nhận hỗ trợ khóa học nghề may/chế biến thực phẩm miễn phí và giới thiệu điểm bán hàng gần nhà (&le;5km).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px', backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span><strong>Cán bộ đồng hành:</strong> {selectedCase.assignedTo ? (selectedCase.assignedTo.startsWith('usr-') ? 'Cán bộ CTXH (BƯỚC TIẾP)' : selectedCase.assignedTo) : 'TNV Nguyễn Văn Hùng'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span><strong>Thời gian dự kiến:</strong> Thứ Ba, 09:00 (18/08/2026)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span><strong>Địa điểm:</strong> 12 Lý Thường Kiệt, TT. Hóc Môn</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} color="#059669" style={{ flexShrink: 0 }} />
                  <span><strong>Hạn theo dõi:</strong> 15 ngày tới</span>
                </div>
              </div>
            </div>

            {/* 2. WHAT MATTERS NOW & STATUS METADATA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', marginBottom: '18px' }}>
              <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '16px', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: themeColors.primaryNavy, textTransform: 'uppercase' }}>
                    Điều Quan Trọng Nhất Lúc Này
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#15803D', whiteSpace: 'nowrap' }}>
                    Người hưởng lợi chia sẻ
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#334155', fontStyle: 'italic', lineHeight: '1.6' }}>
                  "{selectedCase.note || 'Tôi mong muốn tìm việc làm bán thời gian hoặc phụ bán quán ban ngày gần nhà (bán kính dưới 5km), có thể tự sắp xếp thời gian chăm sóc gia đình, không phải làm ca đêm và không phải đóng bất kỳ khoản tiền cọc nào.'}"
                </p>
              </div>

              <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '16px', backgroundColor: '#FFFFFF' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: themeColors.primaryNavy, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Thông Tin Quản Trị Ca
                </span>
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', color: themeColors.textBody }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} color="#15803D" style={{ flexShrink: 0 }} />
                    <span>Đồng thuận dữ liệu: <strong style={{ color: '#15803D' }}>Đã ký đồng thuận chia sẻ</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} color="#DC2626" style={{ flexShrink: 0 }} />
                    <span>Địa bàn tiếp cận: <strong>{selectedCase.currentArea?.replace(/\(GPS Blurred\)/gi, '')}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} color="#64748B" style={{ flexShrink: 0 }} />
                    <span>Lần xác minh gần nhất: <strong>14/08/2026</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={13} color="#2563EB" style={{ flexShrink: 0 }} />
                    <span>Trạng thái: <strong>{selectedCase.status === 'closed' ? 'Tự chủ sinh kế' : 'Đang đồng hành'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. STRENGTHS & CAPABILITIES (STRENGTH-BASED RECORD) */}
            <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '18px', backgroundColor: '#FFFFFF', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: themeColors.primaryNavy }}>
                    Điểm Mạnh & Năng Lực Sẵn Có
                  </h4>
                  <span style={{ fontSize: '12px', color: themeColors.textMuted }}>
                    Ghi nhận năng lực thực tế có bằng chứng — Không chấm điểm giá trị con người
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {[
                  {
                    title: '12 năm buôn bán & phục vụ quán ăn',
                    desc: 'Tháo vát, giao tiếp tốt với khách hàng, trung thực trong thu chi.',
                    badge: 'Đã xác minh qua thực tế',
                    badgeColor: '#DCFCE7',
                    badgeText: '#15803D'
                  },
                  {
                    title: 'Tự quản lý tiền mặt mỗi ngày',
                    desc: 'Tính toán nhanh, cẩn thận, quản lý chi tiêu cá nhân chặt chẽ.',
                    badge: 'Người hưởng lợi chia sẻ',
                    badgeColor: '#FEF3C7',
                    badgeText: '#B45309'
                  },
                  {
                    title: 'Thông thạo địa bàn dân cư Hóc Môn',
                    desc: 'Nắm rõ hệ thống chợ truyền thống, tuyến đường và các cơ sở an sinh lân cận.',
                    badge: 'Đã xác minh',
                    badgeColor: '#DCFCE7',
                    badgeText: '#15803D'
                  },
                  {
                    title: 'Có CCCD gắn chip & Giấy tạm trú',
                    desc: 'Đầy đủ giấy tờ pháp lý cơ bản để đăng ký chương trình an sinh và việc làm.',
                    badge: 'Tài liệu đối chiếu',
                    badgeColor: '#EFF6FF',
                    badgeText: '#1E40AF'
                  }
                ].map((st, idx) => (
                  <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${themeColors.border}`, backgroundColor: '#F8FAFC' }}>
                    <div style={{ fontWeight: '800', color: themeColors.primaryNavy, fontSize: '13px', marginBottom: '4px' }}>{st.title}</div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: themeColors.textBody, lineHeight: '1.4' }}>{st.desc}</p>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', backgroundColor: st.badgeColor, color: st.badgeText, display: 'inline-block', whiteSpace: 'nowrap' }}>
                      {st.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. SAFE VERIFIED OPPORTUNITIES & CONTEXTUAL RISK CHECK */}
            <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '18px', backgroundColor: '#FFFFFF', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: themeColors.primaryNavy }}>
                    Lựa Chọn Sinh Kế An Toàn Đã Xác Minh
                  </h4>
                  <span style={{ fontSize: '12px', color: themeColors.textMuted }}>
                    Các cơ hội đào tạo và việc làm an sinh được rà soát trực tiếp — Không phải sàn tuyển dụng mở
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Option 1 */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', backgroundColor: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: themeColors.primaryNavy }}>
                        Khóa đào tạo Chế biến Thực phẩm & Vệ sinh An toàn (Miễn phí)
                      </div>
                      <div style={{ fontSize: '12px', color: themeColors.textMuted, marginTop: '2px' }}>
                        Đơn vị: <strong>Trung tâm Dạy nghề Huyện Hóc Môn</strong> &bull; Khoảng cách: <strong>1.8 km</strong>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#15803D', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      ĐÃ XÁC MINH (15/08/2026)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', margin: '10px 0', fontSize: '12px', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div><strong>Chi phí:</strong> 100% Miễn phí</div>
                    <div><strong>Cam kết:</strong> Có chứng chỉ nghề cơ bản</div>
                    <div><strong>Rủi ro:</strong> Không thu tiền cọc</div>
                  </div>

                  {/* Contextual Risk Check for Option 1 */}
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ color: '#15803D', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                      <span>Chưa phát hiện dấu hiệu cảnh báo trong kiểm tra này</span>
                    </div>
                    <span style={{ fontSize: '11px', color: themeColors.textMuted, fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                      Cán bộ rà soát: TNV Nguyễn Văn Hùng
                    </span>
                  </div>
                </div>

                {/* Option 2 */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', backgroundColor: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: themeColors.primaryNavy }}>
                        Điểm bán hàng may gia công & tạp hóa ban ngày (Bán kính 2.5km)
                      </div>
                      <div style={{ fontSize: '12px', color: themeColors.textMuted, marginTop: '2px' }}>
                        Đơn vị liên kết: <strong>Cơ sở An sinh Phụ nữ Hóc Môn</strong> &bull; Khoảng cách: <strong>2.4 km</strong>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#B45309', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      ĐANG XÁC MINH LỊCH LÀM VIỆC
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', margin: '10px 0', fontSize: '12px', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div><strong>Khung giờ:</strong> 08:00 - 16:00 (Không ca đêm)</div>
                    <div><strong>Hợp đồng:</strong> Thỏa thuận văn bản rõ ràng</div>
                    <div><strong>Pháp lý:</strong> Không giữ bản gốc CCCD</div>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <div style={{ color: '#475569', fontSize: '11px' }}>
                      <em>Ghi chú: Việc rà soát dấu hiệu rủi ro không thay thế việc cán bộ trực tiếp kiểm tra cơ sở trước khi kết nối.</em>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. CONTINUITY SUPPORT JOURNEY */}
            <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '18px', backgroundColor: '#F8FAFC', marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14.5px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} color="#2563EB" style={{ flexShrink: 0 }} />
                <span>Hành trình Đồng hành Sinh kế</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { step: '1. Tiếp xúc & Lắng nghe nguyện vọng', date: '20/07/2026', status: 'Hoàn thành', note: 'Ghi nhận nguyện vọng làm việc ban ngày gần nhà, không đóng cọc.' },
                  { step: '2. Xác minh & Lập Hộ chiếu Sinh kế', date: '21/07/2026', status: 'Hoàn thành', note: 'Người thụ hưởng đồng ý ký xác nhận điểm mạnh và mục tiêu.' },
                  { step: '3. Xác minh lựa chọn sinh kế an toàn', date: '25/07/2026', status: 'Hoàn thành', note: 'Rà soát TT Dạy nghề Hóc Môn đạt chuẩn an toàn an sinh.' },
                  { step: '4. Kết nối Chuyển tuyến (Safe Next Step)', date: '14/08/2026', status: 'Đang thực hiện', note: 'Cán bộ đưa đến TT Dạy nghề tư vấn lớp học miễn phí.' },
                  { step: '5. Theo dõi & Đánh giá Tự chủ Sinh kế', date: 'Dự kiến 30/08/2026', status: 'Chờ theo dõi', note: 'Theo dõi 30 ngày đảm bảo thu nhập ổn định và không phát sinh rủi ro.' }
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '800', color: themeColors.primaryNavy, fontSize: '13px' }}>{item.step}</div>
                      <div style={{ color: themeColors.textMuted, fontSize: '12px', marginTop: '2px' }}>{item.note}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: idx < 3 ? '#DCFCE7' : idx === 3 ? '#FEF3C7' : '#F1F5F9', color: idx < 3 ? '#15803D' : idx === 3 ? '#B45309' : '#64748B', whiteSpace: 'nowrap' }}>
                        {item.status}
                      </span>
                      <div style={{ fontSize: '11px', color: themeColors.textMuted, marginTop: '2px', whiteSpace: 'nowrap' }}>{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. CASE HANDOVER SECTION */}
            {!showHandoffForm ? (
              <button
                type="button"
                className="btn-outline"
                style={{ width: '100%', padding: '12px', fontSize: '13.5px', fontWeight: '800', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}
                onClick={() => setShowHandoffForm(true)}
              >
                <UserCheck size={16} style={{ flexShrink: 0 }} />
                <span>Bàn giao Ca Hỗ trợ cho Cán bộ / TNV Tiếp nhận Mới</span>
              </button>
            ) : (
              <div style={{ border: `1px solid ${themeColors.warning}`, borderRadius: '12px', padding: '18px', backgroundColor: '#FFFBEB', marginBottom: '10px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={15} style={{ flexShrink: 0 }} />
                  <span>Bàn giao Ca cho Cán bộ / TNV Phụ trách Mới</span>
                </h4>
                <form onSubmit={handleHandoffSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <PeopleCombobox
                      value={handoffForm.assignedToId || ''}
                      onChange={(personId, person) => {
                        setHandoffForm({
                          ...handoffForm,
                          assignedToId: personId,
                          assignedTo: person ? person.fullName : ''
                        });
                      }}
                      filterArea={selectedCase.currentArea}
                      label="Cán bộ / Tình nguyện viên Nhận bàn giao (SSOT Member Directory)"
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Ghi chú bàn giao</label>
                        <input
                          type="text"
                          required
                          value={handoffForm.notes}
                          onChange={e => setHandoffForm({ ...handoffForm, notes: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13.5px', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Hạn theo dõi tiếp theo</label>
                        <input
                          type="date"
                          required
                          value={handoffForm.nextFollowUpAt}
                          onChange={e => setHandoffForm({ ...handoffForm, nextFollowUpAt: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13.5px', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button type="button" className="btn-outline" onClick={() => setShowHandoffForm(false)}>Hủy bàn giao</button>
                      <button type="submit" className="btn-navy" disabled={actionLoading} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {actionLoading ? 'Đang chuyển giao...' : 'Xác nhận Bàn giao'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
        </div>

        {/* ============================================================ */}
        {/* 3. FIXED MODAL FOOTER                                        */}
        {/* ============================================================ */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: `1px solid ${themeColors.border}`,
            backgroundColor: '#F8FAFC',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <button
            type="button"
            className="btn-navy"
            style={{ padding: '8px 20px', fontSize: '13.5px', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={() => {
              setSelectedCase(null);
              setShowHandoffForm(false);
            }}
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {/* Tokenized Privacy Sharing Modal */}
      {showShareModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div className="card-flat" style={{ maxWidth: '480px', width: '100%', padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={16} color="#2563EB" style={{ flexShrink: 0 }} />
              <span>Chia sẻ Hộ chiếu Sinh kế Bảo mật (Privacy-First Share)</span>
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: themeColors.textBody }}>
              Chọn phạm vi thông tin muốn chia sẻ cho đơn vị hỗ trợ. Liên kết có hiệu lực 24 giờ và có thể thu hồi bất kỳ lúc nào.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[
                { key: 'skills_only', label: 'Chỉ chia sẻ Điểm mạnh & Năng lực (Khuyến nghị)', desc: 'Không hiện địa chỉ cụ thể và lịch sử cá nhân' },
                { key: 'verified_experience', label: 'Chia sẻ Kỹ năng & Kinh nghiệm đã xác minh', desc: 'Dành cho đơn vị đào tạo hoặc chủ cơ sở an sinh' },
                { key: 'full_continuity', label: 'Chia sẻ Toàn bộ Tiến trình Đồng hành', desc: 'Dành cho cán bộ xã hội hoặc cơ quan chức năng' }
              ].map(opt => (
                <label key={opt.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', borderRadius: '8px', border: `1px solid ${shareScope === opt.key ? '#2563EB' : themeColors.border}`, backgroundColor: shareScope === opt.key ? '#EFF6FF' : '#FFFFFF', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="shareScope"
                    checked={shareScope === opt.key}
                    onChange={() => setShareScope(opt.key as any)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: themeColors.primaryNavy }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', color: themeColors.textMuted }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {(() => {
              const mappedScope = shareScope === 'full_continuity'
                ? 'full_casework'
                : shareScope === 'skills_only'
                ? 'livelihood_support'
                : 'basic_status';

              const safeToken = generateSafeShareToken(
                selectedCase.id,
                selectedCase.aliasName,
                Boolean(selectedCase.isMinor),
                mappedScope
              );

              return (
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '8px' }}>
                    {selectedCase.isMinor ? 'MÃ TIẾP CẬN BẢO VỆ TRẺ EM AN TOÀN (111)' : 'MÃ QUÉT CHIA SẺ AN TOÀN (HẾT HẠN TRONG 24H)'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <NextaQRCode
                      value={safeToken.payloadUrl}
                      size={150}
                      variant={selectedCase.isMinor ? 'safeguarding' : 'default'}
                      renderMode="svg"
                      showLogo={true}
                      testId={`qr-share-${selectedCase.id}`}
                      ariaLabel={`Mã QR chia sẻ an toàn cho hồ sơ ${selectedCase.aliasName}`}
                      shortCode={selectedCase.isMinor ? selectedCase.aliasName : `BT-${selectedCase.id.slice(-4).toUpperCase()}`}
                      caption="Quét để xem thông tin an sinh được cấp phép chia sẻ"
                    />
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-outline" onClick={() => setShowShareModal(false)}>Đóng</button>
              <button
                type="button"
                className="btn-navy"
                onClick={() => {
                  alert(`Đã sao chép liên kết chia sẻ bảo mật (Phạm vi: ${shareScope}). Liên kết có hiệu lực 24 giờ.`);
                  setShowShareModal(false);
                }}
              >
                Sao chép liên kết chia sẻ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ReferralModalProps {
  show: boolean;
  casesList: CaseRecord[];
  resourcesList: ResourceRecord[];
  referralForm: any;
  setReferralForm: React.Dispatch<React.SetStateAction<any>>;
  actionLoading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  show,
  casesList,
  resourcesList,
  referralForm,
  setReferralForm,
  actionLoading,
  onClose,
  onSubmit
}) => {
  if (!show) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22, 55, 93, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="card-flat" style={{ maxWidth: '520px', width: '100%', padding: '28px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={18} color="#2563EB" style={{ flexShrink: 0 }} />
            <span>Tạo phiếu kết nối Chuyển tuyến</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: themeColors.textBody }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: themeColors.primaryNavy }}>Chọn Ca đồng hành cần chuyển tuyến</label>
              <select
                required
                value={referralForm.caseId}
                onChange={e => setReferralForm({ ...referralForm, caseId: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '14px', marginTop: '6px' }}
              >
                <option value="">-- Chọn ca đồng hành --</option>
                {casesList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.isMinor ? c.aliasName : c.fullName} ({c.aliasName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: themeColors.primaryNavy }}>Chọn Nguồn lực tiếp nhận hỗ trợ</label>
              <select
                required
                value={referralForm.resourceId}
                onChange={e => setReferralForm({ ...referralForm, resourceId: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '14px', marginTop: '6px' }}
              >
                <option value="">-- Chọn địa điểm hỗ trợ --</option>
                {resourcesList.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.district})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: themeColors.primaryNavy }}>Nội dung kết nối chuyển tuyến</label>
              <textarea
                required
                rows={3}
                value={referralForm.notes}
                onChange={e => setReferralForm({ ...referralForm, notes: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '14px', marginTop: '6px', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-navy"
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang kết nối D1...' : 'Gửi phiếu kết nối'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
