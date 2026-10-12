import React from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { MapPin, Radio, CheckCircle2, XCircle, UserCheck, ShieldAlert, Send } from 'lucide-react';

interface SignalsTabProps {
  signalsList: any[];
  setSelectedSignalForAssign: (sig: any) => void;
  setShowAssignSignalModal: (show: boolean) => void;
  handleDismissSignal: (id: string) => void;
  handleVerifySignal: (id: string) => void;
}

export const SignalsTab: React.FC<SignalsTabProps> = ({
  signalsList,
  setSelectedSignalForAssign,
  setShowAssignSignalModal,
  handleDismissSignal,
  handleVerifySignal
}) => {
  return (
    <div className="card-flat" style={{ padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#16375D', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={20} color="#2563EB" />
            <span>Danh Sách Tín Hiệu Spotter (Quan Sát Thực Địa)</span>
          </h3>
          <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: themeColors.textMuted }}>
            Tín hiệu thô do TNV hoặc Người qua đường gửi từ hiện trường. Cần xác minh trước khi tạo hồ sơ chính thức.
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${themeColors.border}`, color: '#16375D', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Mã Tín Hiệu</th>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Thời Gian</th>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Khu Vực / Địa Bàn</th>
              <th style={{ padding: '10px 12px', minWidth: '220px' }}>Quan Sát Thực Tế</th>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Nguy Cơ Cảnh Báo</th>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Người Báo Cáo</th>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Người Xác Minh</th>
              <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {signalsList.map(sig => (
              <tr key={sig.id} style={{ borderBottom: `1px solid ${themeColors.border}`, fontSize: '13px' }}>
                <td style={{ padding: '10px 12px', fontWeight: '700', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{sig.id}</td>
                <td style={{ padding: '10px 12px', color: themeColors.textMuted, fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(sig.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(sig.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="#0F766E" style={{ flexShrink: 0 }} />
                    <span>{sig.approximateArea}</span>
                  </span>
                </td>
                <td style={{ padding: '10px 12px', maxWidth: '280px', wordBreak: 'break-word', lineHeight: 1.4 }}>{sig.observation}</td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700',
                    backgroundColor: sig.riskHint.toLowerCase().includes('cao') || sig.riskHint.toLowerCase().includes('trẻ') ? '#FEF2F2' : '#F1F5F9',
                    color: sig.riskHint.toLowerCase().includes('cao') || sig.riskHint.toLowerCase().includes('trẻ') ? '#DC2626' : themeColors.textBody,
                    display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap'
                  }}>
                    {(sig.riskHint.toLowerCase().includes('cao') || sig.riskHint.toLowerCase().includes('trẻ')) && <ShieldAlert size={11} style={{ flexShrink: 0 }} />}
                    <span>{sig.riskHint}</span>
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: themeColors.textMuted, whiteSpace: 'nowrap' }}>{sig.reporterName}</td>
                <td style={{ padding: '10px 12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {sig.assignedTo ? (
                    <span className="badge-navy" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                      <UserCheck size={11} style={{ flexShrink: 0 }} />
                      <span>{sig.assignedTo}</span>
                    </span>
                  ) : (
                    <span style={{ color: themeColors.textMuted, fontStyle: 'italic', fontSize: '12px' }}>Chưa giao đội</span>
                  )}
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  {sig.verificationStatus === 'UNVERIFIED' && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#16375D', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={() => {
                          setSelectedSignalForAssign(sig);
                          setShowAssignSignalModal(true);
                        }}
                      >
                        <Send size={12} style={{ flexShrink: 0 }} />
                        <span>Giao Đội</span>
                      </button>
                      <button
                        className="btn-outline"
                        style={{ padding: '5px 10px', fontSize: '12px', borderColor: '#DC2626', color: '#DC2626', whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={() => handleDismissSignal(sig.id)}
                      >
                        Bác Bỏ
                      </button>
                    </div>
                  )}
                  {sig.verificationStatus === 'ASSIGNED' && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#0F766E', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={() => handleVerifySignal(sig.id)}
                      >
                        <CheckCircle2 size={12} style={{ flexShrink: 0 }} />
                        <span>Xác Minh & Tạo Ca</span>
                      </button>
                      <button
                        className="btn-outline"
                        style={{ padding: '5px 10px', fontSize: '12px', borderColor: '#DC2626', color: '#DC2626', whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={() => handleDismissSignal(sig.id)}
                      >
                        Bác Bỏ
                      </button>
                    </div>
                  )}
                  {sig.verificationStatus === 'VERIFIED' && (
                    <span className="badge-forest" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      <CheckCircle2 size={11} style={{ flexShrink: 0 }} />
                      <span>Đã Xác Minh</span>
                    </span>
                  )}
                  {sig.verificationStatus === 'DISMISSED' && (
                    <span style={{ color: themeColors.textMuted, fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                      <XCircle size={11} color="#94A3B8" style={{ flexShrink: 0 }} />
                      <span>Đã Bác Bỏ</span>
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
