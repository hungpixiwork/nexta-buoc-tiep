import React from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { UserCheck, CheckCircle2, ShieldAlert, Edit3, PhoneCall, HelpCircle, AlertTriangle } from 'lucide-react';

interface ReviewsTabProps {
  reviewsList: any[];
  handleApproveReview: (id: string) => void;
  handleOpenEditReview: (rev: any) => void;
  handleEscalateReview: (id: string) => void;
  handleRequestInfoReview: (id: string) => void;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({
  reviewsList,
  handleApproveReview,
  handleOpenEditReview,
  handleEscalateReview,
  handleRequestInfoReview
}) => {
  return (
    <div className="card-flat" style={{ padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#16375D', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} color="#2563EB" />
            <span>Hàng Đợi Kiểm Duyệt AI (Human-in-the-Loop)</span>
          </h3>
          <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: themeColors.textMuted }}>
            Các ca tiếp nhận qua Voice AI có độ tin cậy thấp, phát hiện cảnh báo bảo vệ (Safeguarding) cần cán bộ rà soát trước khi chuyển tuyến.
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${themeColors.border}`, color: '#16375D', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Mã ca / Alias</th>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Thời Gian Báo Ca</th>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Lý Do Cần Kiểm Duyệt</th>
              <th style={{ padding: '10px 12px', minWidth: '220px' }}>Bản Dịch Giọng Nói (STT thô)</th>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>AI Đề Xuất Trích Xuất</th>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Độ Tin Cậy AI</th>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {reviewsList.map(rev => (
              <tr key={rev.id} style={{ borderBottom: `1px solid ${themeColors.border}`, fontSize: '13px' }}>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: '800', color: '#16375D' }}>{rev.aliasName}</span>
                </td>
                <td style={{ padding: '10px 12px', color: themeColors.textMuted, fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(rev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(rev.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700',
                    backgroundColor: '#FFF5F5', color: '#DC2626', border: '1px solid #FEE2E2',
                    display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap'
                  }}>
                    <AlertTriangle size={11} style={{ flexShrink: 0 }} />
                    <span>{rev.reasonText}</span>
                  </span>
                </td>
                <td style={{ padding: '10px 12px', maxWidth: '260px', fontSize: '12.5px', fontStyle: 'italic', color: '#475569', lineHeight: 1.4 }}>
                  "{rev.transcript_clean}"
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11.5px' }}>
                    <div>Tuổi: <strong style={{ color: '#16375D' }}>{rev.age_claimed !== null ? `${rev.age_claimed} tuổi` : 'Chưa rõ'}</strong></div>
                    <div>Nhu cầu: {rev.needs.map((n: string) => (
                      <span key={n} style={{ margin: '0 2px', padding: '1px 5px', backgroundColor: '#EDF3FB', color: '#16375D', borderRadius: '4px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        {n === 'food' ? 'Nhu yếu phẩm' : n === 'medical' ? 'Y tế' : n === 'shelter_job' ? 'Sinh kế' : n === 'sos111' ? 'SOS 111' : n}
                      </span>
                    ))}</div>
                    <div>Ưu tiên: <span style={{ color: rev.urgency_candidate === 'HIGH' ? '#DC2626' : themeColors.textBody, fontWeight: '700' }}>{rev.urgency_candidate}</span></div>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <div style={{ width: '50px', backgroundColor: '#E2E8F0', height: '6px', borderRadius: '3px', overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ width: `${rev.confidence_score * 100}%`, height: '100%', backgroundColor: rev.confidence_score >= 0.8 ? '#0F766E' : rev.confidence_score >= 0.6 ? '#E2B93B' : '#DC2626' }}></div>
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '11.5px', color: rev.confidence_score >= 0.8 ? '#0F766E' : '#DC2626' }}>{(rev.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  {rev.status === 'PENDING' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '5px 8px', fontSize: '11.5px', backgroundColor: '#0F766E', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', flexShrink: 0 }}
                          onClick={() => handleApproveReview(rev.id)}
                        >
                          <CheckCircle2 size={11} style={{ flexShrink: 0 }} />
                          <span>Duyệt</span>
                        </button>
                        <button
                          className="btn-outline"
                          style={{ padding: '5px 8px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', flexShrink: 0 }}
                          onClick={() => handleOpenEditReview(rev)}
                        >
                          <Edit3 size={11} style={{ flexShrink: 0 }} />
                          <span>Sửa & Duyệt</span>
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                        <button
                          className="btn-outline"
                          style={{ padding: '5px 8px', fontSize: '11.5px', borderColor: '#DC2626', color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', flexShrink: 0 }}
                          onClick={() => handleEscalateReview(rev.id)}
                        >
                          <PhoneCall size={11} style={{ flexShrink: 0 }} />
                          <span>Báo 111</span>
                        </button>
                        <button
                          style={{ padding: '5px 8px', fontSize: '11.5px', backgroundColor: '#FFF', border: `1px solid ${themeColors.border}`, borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', flexShrink: 0 }}
                          onClick={() => handleRequestInfoReview(rev.id)}
                        >
                          <HelpCircle size={11} style={{ flexShrink: 0 }} />
                          <span>Thêm Info</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {rev.status === 'APPROVED' && (
                    <span className="badge-forest" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      <CheckCircle2 size={11} style={{ flexShrink: 0 }} />
                      <span>Đã Duyệt</span>
                    </span>
                  )}
                  {rev.status === 'ESCALATED' && (
                    <span className="badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      <ShieldAlert size={11} style={{ flexShrink: 0 }} />
                      <span>Đã Báo 111</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
