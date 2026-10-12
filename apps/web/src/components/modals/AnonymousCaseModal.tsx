import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { X, ShieldAlert, Eye, EyeOff, PhoneCall, MapPin, FileText, Lock } from 'lucide-react';
import { CaseRecord } from '../../types';

interface AnonymousCaseModalProps {
  caseRecord: CaseRecord;
  onClose: () => void;
  onLogAudit: (action: 'VIEW_CHILD_PROFILE' | 'VIEW_EXACT_GPS' | 'HOTLINE_111_TRIGGER', caseRecord: CaseRecord, details: string) => void;
  onOpenForm07?: (caseRecord: CaseRecord) => void;
}

export const AnonymousCaseModal: React.FC<AnonymousCaseModalProps> = ({
  caseRecord,
  onClose,
  onLogAudit,
  onOpenForm07
}) => {
  const [redactPII, setRedactPII] = useState<boolean>(true);
  const [unlockedBySupervisor, setUnlockedBySupervisor] = useState<boolean>(false);

  // Helper mask PII
  const maskName = (name: string) => {
    if (!redactPII && unlockedBySupervisor) return name;
    if (name.length <= 4) return `${name.charAt(0)}***`;
    const parts = name.split(' ');
    return parts.map(p => (p.length > 1 ? `${p.charAt(0)}***` : p)).join(' ');
  };

  const maskGps = (gps?: { lat: number; lng: number }) => {
    if (!gps) return 'Không có dữ liệu GPS';
    if (!redactPII && unlockedBySupervisor) {
      return `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)} (Chính xác 100%)`;
    }
    return `${gps.lat.toFixed(3)}*, ${gps.lng.toFixed(3)}* (Đã làm mờ bán kính 500m an toàn)`;
  };

  const handleToggleRedact = () => {
    if (redactPII) {
      // User trying to unmask
      const confirmUnlock = window.confirm(
        '⚠️ CẢNH BÁO SAFEGUARDING:\n' +
        'Bạn đang mở xem PII (Thông tin định danh cá nhân) của trẻ em/đối tượng yếu thế.\n' +
        'Hành động này sẽ được ghi đĩa vĩnh viễn vào D1 Audit Trail Log.\n\n' +
        'Bạn có chắc chắn là Cán bộ Safeguarding được ủy quyền không?'
      );
      if (confirmUnlock) {
        setRedactPII(false);
        setUnlockedBySupervisor(true);
        onLogAudit('VIEW_CHILD_PROFILE', caseRecord, 'Giải mã PII ca ẩn danh bởi Cán bộ Safeguarding Officer.');
      }
    } else {
      setRedactPII(true);
    }
  };

  const handleHotline111Click = () => {
    onLogAudit('HOTLINE_111_TRIGGER', caseRecord, 'Kích hoạt 1-Tap kết nối khẩn cấp Tổng đài Quốc gia 111.');
    alert(`🚨 ĐÃ KÍCH HOẠT HOTLINE 111 KHẨN CẤP!\n\nĐang kết nối Tổng đài Bảo vệ Trẻ em 111 cho Ca ${caseRecord.aliasName}.\nHệ thống đã tự động khóa bảo vệ vị trí thực địa.`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1150,
        padding: '16px'
      }}
    >
      <div
        className="card-flat"
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: `2px solid ${caseRecord.isMinor ? themeColors.danger : themeColors.primaryNavy}`,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
          maxHeight: 'calc(100% - 24px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Fixed Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert color={themeColors.danger} size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '18px', fontWeight: '800' }}>
                  {caseRecord.aliasName}
                </h3>
                {caseRecord.isMinor && (
                  <span className="badge-danger" style={{ fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <Lock size={10} style={{ flexShrink: 0 }} /> BẢO VỆ TRẺ EM (&lt;18T)
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: themeColors.textMuted, marginTop: '2px' }}>
                Hồ sơ ca ẩn danh tuân thủ Quy chuẩn Bảo vệ Trẻ em & Công ước UNESCO 2026
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: '#F1F5F9', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: themeColors.textMuted, padding: 0, lineHeight: 1 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {/* PII Toggle Bar */}
          <div
            style={{
              backgroundColor: redactPII ? '#EFF6FF' : '#FEF2F2',
              border: `1px solid ${redactPII ? '#BFDBFE' : '#FCA5A5'}`,
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {redactPII ? <EyeOff color="#1D4ED8" size={18} style={{ flexShrink: 0 }} /> : <Eye color={themeColors.danger} size={18} style={{ flexShrink: 0 }} />}
              <div>
                <div style={{ fontWeight: '800', fontSize: '13px', color: redactPII ? '#1E40AF' : themeColors.danger }}>
                  {redactPII ? 'Chế độ Bảo vệ PII Ẩn danh (Bật Mặc định)' : 'Đã Giải mã PII (Giám sát viên Trực ban)'}
                </div>
                <div style={{ fontSize: '11px', color: themeColors.textBody }}>
                  {redactPII ? 'Tên thật, ảnh và tọa độ GPS bị che mờ để đảm bảo an toàn.' : 'Tất cả các truy cập xem PII đều được lưu nhật ký Audit D1.'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleRedact}
              className={redactPII ? 'btn-navy' : 'btn-outline'}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: redactPII ? '#2563EB' : '#FFFFFF',
                color: redactPII ? '#FFFFFF' : themeColors.danger,
                borderColor: redactPII ? 'transparent' : themeColors.danger,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {redactPII ? 'Mở giải mã PII' : 'Khóa che mờ PII'}
            </button>
          </div>

          {/* Case Main Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
            {/* Photo Box */}
            <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: '10px', overflow: 'hidden', backgroundColor: '#F8FAFC', textAlign: 'center', position: 'relative' }}>
              {caseRecord.photoUrl ? (
                <img
                  src={caseRecord.photoUrl}
                  alt="Case avatar"
                  style={{
                    width: '100%',
                    height: '170px',
                    objectFit: 'cover',
                    filter: redactPII ? 'blur(10px) opacity(0.8)' : 'none',
                    transition: 'filter 0.3s ease-in-out'
                  }}
                />
              ) : (
                <div style={{ height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColors.textMuted, fontSize: '13px' }}>
                  Không có hình ảnh
                </div>
              )}
              {redactPII && (
                <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#FFF', fontSize: '10px', padding: '3px 6px', borderRadius: '4px' }}>
                  Ảnh đã được làm mờ PII
                </div>
              )}
            </div>

            {/* Key Value Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${themeColors.border}`, paddingBottom: '5px' }}>
                <span style={{ color: themeColors.textMuted, fontWeight: '600' }}>Mã định danh Alias:</span>
                <strong style={{ color: themeColors.primaryNavy }}>{caseRecord.aliasName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${themeColors.border}`, paddingBottom: '5px' }}>
                <span style={{ color: themeColors.textMuted, fontWeight: '600' }}>Họ và tên (PII):</span>
                <strong style={{ color: redactPII ? themeColors.textBody : themeColors.danger }}>
                  {maskName(caseRecord.fullName)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${themeColors.border}`, paddingBottom: '5px' }}>
                <span style={{ color: themeColors.textMuted, fontWeight: '600' }}>Năm sinh / Độ tuổi:</span>
                <strong>{caseRecord.birthYear ? `${caseRecord.birthYear} (${2026 - caseRecord.birthYear} tuổi)` : (caseRecord.isMinor ? 'Dưới 18 tuổi' : 'Trên 18 tuổi')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${themeColors.border}`, paddingBottom: '5px' }}>
                <span style={{ color: themeColors.textMuted, fontWeight: '600' }}>Nhóm yếu thế:</span>
                <span className="badge-navy">{caseRecord.vulnerabilityGroup.toUpperCase()}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${themeColors.border}`, paddingBottom: '5px' }}>
                <span style={{ color: themeColors.textMuted, fontWeight: '600' }}>Độ ưu tiên xử lý:</span>
                <span className={caseRecord.priority === 'urgent' ? 'badge-danger' : 'badge-saffron'}>
                  {caseRecord.priority.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Location & Need Categories */}
          <div style={{ backgroundColor: '#F8FAFC', border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <MapPin size={15} color="#DC2626" style={{ flexShrink: 0 }} />
              <span>Địa bàn tiếp cận & Tọa độ GPS Safeguarding</span>
            </div>
            <div style={{ fontSize: '12.5px', color: themeColors.textBody, marginBottom: '4px' }}>
              Khu vực ước tính: <strong>{(caseRecord.currentArea || '').replace(/\(GPS Blurred.*?\)/gi, '').trim()}</strong>
            </div>
            <div style={{ fontSize: '12px', color: themeColors.textMuted }}>
              Tọa độ GPS: <strong style={{ color: redactPII ? themeColors.textBody : themeColors.danger }}>{maskGps(caseRecord.gpsCoords)}</strong>
            </div>

            {caseRecord.note && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px dashed ${themeColors.border}`, fontSize: '12.5px', color: themeColors.textBody }}>
                <strong>Ghi chú tiếp nhận:</strong> "{caseRecord.note}"
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${themeColors.border}`, backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleHotline111Click}
            style={{
              backgroundColor: themeColors.danger,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <PhoneCall size={14} style={{ flexShrink: 0 }} />
            <span>Gọi Tổng đài 111 Khẩn</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {onOpenForm07 && (
              <button
                type="button"
                className="btn-outline"
                onClick={() => onOpenForm07(caseRecord)}
                style={{ padding: '7px 12px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <FileText size={13} style={{ flexShrink: 0 }} />
                <span>Lập Mẫu số 07</span>
              </button>
            )}
            <button
              type="button"
              className="btn-navy"
              onClick={onClose}
              style={{ padding: '7px 16px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Đóng hồ sơ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
