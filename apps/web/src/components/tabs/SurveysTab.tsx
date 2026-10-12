import React from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { ClipboardList, ExternalLink, ArrowRight, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SurveysTabProps {
  setActiveTab: (tab: any) => void;
  setShowVoiceModal: (show: boolean) => void;
}

export const SurveysTab: React.FC<SurveysTabProps> = ({
  setActiveTab,
  setShowVoiceModal
}) => {
  return (
    <div className="card-flat" style={{ padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} color="#2563EB" />
            <span>Khảo Sát Thực Địa & Lead Tiếp Nhận Từ TNV</span>
          </h3>
          <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: themeColors.textMuted }}>
            Dữ liệu đồng bộ từ Form Khảo sát thực địa (Hệ thống Cloudflare D1 + Thông báo Telegram)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a
            href="https://survey-buoctiep-unesco2026.pages.dev"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ textDecoration: 'none', padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ExternalLink size={14} /> Mở Form Khảo Sát Live
          </a>
        </div>
      </div>

      {/* Field Submissions Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${themeColors.border}`, backgroundColor: '#F8FAFC' }}>
              <th style={{ padding: '10px 14px', color: themeColors.primaryNavy }}>Mã Phiếu / Đối tượng</th>
              <th style={{ padding: '10px 14px', color: themeColors.primaryNavy }}>Nguồn Tiếp nhận</th>
              <th style={{ padding: '10px 14px', color: themeColors.primaryNavy }}>Nhu cầu Ưu tiên</th>
              <th style={{ padding: '10px 14px', color: themeColors.primaryNavy }}>Độ khẩn cấp</th>
              <th style={{ padding: '10px 14px', color: themeColors.primaryNavy }}>Thời gian Gửi</th>
              <th style={{ padding: '10px 14px', color: themeColors.primaryNavy }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {[
              { id: 'SRV-8021', name: 'Nguyễn Thị Lan (62t)', source: 'TNV Điểm Hóc Môn', need: 'Sinh kế nhẹ ca sáng', urgency: 'Cao', time: '10 phút trước' },
              { id: 'SRV-8022', name: 'Hoàng (15t - Ẩn danh)', source: 'Tổng đài 111', need: 'Mái ấm tạm lánh & Học nghề', urgency: 'Khẩn cấp', time: '1 giờ trước' },
              { id: 'SRV-8023', name: 'Trần Văn Bình (45t)', source: 'Quán ăn từ thiện Q12', need: 'Làm lại CCCD & Khám mắt', urgency: 'Bình thường', time: '3 giờ trước' },
              { id: 'SRV-8024', name: 'Lê Thị Mỹ (70t)', source: 'TNV Bếp ăn Hóc Môn', need: 'Trợ cấp xã hội & BHYT', urgency: 'Cao', time: 'Hôm qua' },
            ].map(s => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: '700', color: themeColors.primaryNavy }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: themeColors.textMuted, fontFamily: 'monospace' }}>Mã phiếu: {s.id}</div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="badge-navy" style={{ fontSize: '11px' }}>{s.source}</span>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: '600', color: themeColors.primaryNavy }}>
                  {s.need}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {s.urgency === 'Khẩn cấp' ? (
                    <span className="badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                      <ShieldAlert size={11} /> Khẩn cấp
                    </span>
                  ) : s.urgency === 'Cao' ? (
                    <span className="badge-saffron" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                      <AlertCircle size={11} /> Cao
                    </span>
                  ) : (
                    <span className="badge-forest" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                      <CheckCircle2 size={11} /> Bình thường
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: themeColors.textMuted }}>
                  {s.time}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button
                    className="btn-navy"
                    style={{ padding: '5px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => {
                      setActiveTab('cases');
                      setShowVoiceModal(true);
                    }}
                  >
                    <span>Duyệt thành Ca</span>
                    <ArrowRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
