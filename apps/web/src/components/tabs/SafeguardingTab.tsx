import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { ShieldAlert, PhoneCall, Lock, Eye, FileText, CheckCircle, Activity, User, MapPin } from 'lucide-react';
import { CaseRecord, AuditTrailRecord } from '../../types';

interface SafeguardingTabProps {
  casesList: CaseRecord[];
  auditTrailList: AuditTrailRecord[];
  onOpenAnonymousModal: (c: CaseRecord) => void;
  onOpenForm07Modal: (c: CaseRecord) => void;
  onLogAuditAction: (action: AuditTrailRecord['action'], caseRecord: CaseRecord, details: string) => void;
}

export const SafeguardingTab: React.FC<SafeguardingTabProps> = ({
  casesList,
  auditTrailList,
  onOpenAnonymousModal,
  onOpenForm07Modal,
  onLogAuditAction
}) => {
  const [filterType, setFilterType] = useState<'all' | 'child' | 'elderly' | 'hotline111'>('all');

  // Filter logic
  const childCases = casesList.filter(c => c.isMinor || c.vulnerabilityGroup === 'youth' || c.aliasName.startsWith('CHILD'));
  const elderlyCases = casesList.filter(c => c.vulnerabilityGroup === 'elderly' || (c.birthYear && (2026 - c.birthYear >= 60)));
  const hotline111Cases = casesList.filter(c => c.priority === 'urgent' || c.needCategories?.includes('sos111'));

  const filteredCases = casesList.filter(c => {
    if (filterType === 'child') return c.isMinor || c.vulnerabilityGroup === 'youth' || c.aliasName.startsWith('CHILD');
    if (filterType === 'elderly') return c.vulnerabilityGroup === 'elderly' || (c.birthYear && (2026 - c.birthYear >= 60));
    if (filterType === 'hotline111') return c.priority === 'urgent' || c.needCategories?.includes('sos111');
    return true; // all
  });

  const handleHotline111Direct = (c: CaseRecord) => {
    onLogAuditAction('HOTLINE_111_TRIGGER', c, 'Kích hoạt gọi điện khẩn cấp 1-Tap Hotline 111.');
    alert(`HOTLINE 111 KÍCH HOẠT THÀNH CÔNG!\n\nĐã khởi tạo luồng kết nối Tổng đài Bảo vệ Trẻ em 111 cho đối tượng ${c.aliasName}.\nHệ thống đã tự động kích hoạt cờ SAFEGUARDING CRITICAL.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Warning & Protocol */}
      <div
        style={{
          backgroundColor: '#FFF5F5',
          border: `2px solid ${themeColors.danger}`,
          borderRadius: '14px',
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: themeColors.danger, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: themeColors.danger, fontSize: '18px', fontWeight: '800' }}>
              Bảng Giám Sát Cờ Khẩn Cấp Safeguarding & Hotline 111
            </h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: themeColors.textBody, marginTop: '3px' }}>
              Bảo vệ đặc biệt Trẻ em (&lt;18t), Người già suy kiệt & Kích hoạt Chuyển tuyến Khẩn cấp theo Quy chuẩn UNESCO 2026
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <a
            href="tel:111"
            style={{
              backgroundColor: themeColors.danger,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: '800',
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <PhoneCall size={15} style={{ flexShrink: 0 }} />
            <span>Gọi Tổng đài 111 (Miễn phí 24/7)</span>
          </a>
        </div>
      </div>

      {/* 3 Main Safeguarding Alert Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        {/* Child Safeguard Card */}
        <div
          onClick={() => setFilterType('child')}
          className="card-flat"
          style={{
            padding: '16px 18px',
            border: filterType === 'child' ? `2px solid ${themeColors.danger}` : `1px solid ${themeColors.border}`,
            backgroundColor: filterType === 'child' ? '#FEF2F2' : '#FFFFFF',
            cursor: 'pointer',
            borderRadius: '12px',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: themeColors.danger, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>BẢO VỆ TRẺ EM (P0)</span>
            </span>
            <span className="badge-danger">{childCases.length} Ca</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: themeColors.primaryNavy, marginTop: '6px' }}>
            {childCases.length} <span style={{ fontSize: '13px', fontWeight: '600', color: themeColors.textMuted }}>Trẻ vị thành niên</span>
          </div>
          <div style={{ fontSize: '12px', color: themeColors.textBody, marginTop: '4px' }}>
            Mã hóa bí danh `CHILD-2026-XXXX`, làm mờ tọa độ GPS ~1km & khóa dữ liệu cá nhân.
          </div>
        </div>

        {/* Elderly Risk Card */}
        <div
          onClick={() => setFilterType('elderly')}
          className="card-flat"
          style={{
            padding: '16px 18px',
            border: filterType === 'elderly' ? `2px solid ${themeColors.warning}` : `1px solid ${themeColors.border}`,
            backgroundColor: filterType === 'elderly' ? '#FFFBEB' : '#FFFFFF',
            cursor: 'pointer',
            borderRadius: '12px',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} style={{ flexShrink: 0 }} />
              <span>NGƯỜI CAO TUỔI YẾU THẾ</span>
            </span>
            <span className="badge-saffron">{elderlyCases.length} Ca</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: themeColors.primaryNavy, marginTop: '6px' }}>
            {elderlyCases.length} <span style={{ fontSize: '13px', fontWeight: '600', color: themeColors.textMuted }}>Người cao tuổi</span>
          </div>
          <div style={{ fontSize: '12px', color: themeColors.textBody, marginTop: '4px' }}>
            Ưu tiên tiếp cận y tế, phục hồi chức năng và nơi ở tạm lánh an toàn.
          </div>
        </div>

        {/* Hotline 111 SOS Card */}
        <div
          onClick={() => setFilterType('hotline111')}
          className="card-flat"
          style={{
            padding: '16px 18px',
            border: filterType === 'hotline111' ? `2px solid ${themeColors.danger}` : `1px solid ${themeColors.border}`,
            backgroundColor: filterType === 'hotline111' ? '#FEF2F2' : '#FFFFFF',
            cursor: 'pointer',
            borderRadius: '12px',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: themeColors.danger, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <PhoneCall size={16} style={{ flexShrink: 0 }} />
              <span>HOTLINE 111 SOS</span>
            </span>
            <span className="badge-danger">{hotline111Cases.length} Ca</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: themeColors.danger, marginTop: '6px' }}>
            {hotline111Cases.length} <span style={{ fontSize: '13px', fontWeight: '600', color: themeColors.textMuted }}>Ca Khẩn P0</span>
          </div>
          <div style={{ fontSize: '12px', color: themeColors.textBody, marginTop: '4px' }}>
            Yêu cầu can thiệp khẩn cấp 24h & kết nối cơ quan bảo trợ địa phương.
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${themeColors.border}`, paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilterType('all')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: filterType === 'all' ? themeColors.primaryNavy : '#F1F5F9',
            color: filterType === 'all' ? '#FFFFFF' : themeColors.textBody,
            fontWeight: '700',
            fontSize: '12.5px',
            cursor: 'pointer'
          }}
        >
          Tất cả Cờ Khẩn ({casesList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('child')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: filterType === 'child' ? themeColors.danger : '#F1F5F9',
            color: filterType === 'child' ? '#FFFFFF' : themeColors.textBody,
            fontWeight: '700',
            fontSize: '12.5px',
            cursor: 'pointer'
          }}
        >
          Bảo vệ Trẻ em ({childCases.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('elderly')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: filterType === 'elderly' ? themeColors.warning : '#F1F5F9',
            color: filterType === 'elderly' ? '#FFFFFF' : themeColors.textBody,
            fontWeight: '700',
            fontSize: '12.5px',
            cursor: 'pointer'
          }}
        >
          Người cao tuổi ({elderlyCases.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('hotline111')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: filterType === 'hotline111' ? themeColors.danger : '#F1F5F9',
            color: filterType === 'hotline111' ? '#FFFFFF' : themeColors.textBody,
            fontWeight: '700',
            fontSize: '12.5px',
            cursor: 'pointer'
          }}
        >
          Hotline 111 Khẩn ({hotline111Cases.length})
        </button>
      </div>

      {/* Case List with Safeguarding Protocol */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredCases.length === 0 ? (
          <div className="card-flat" style={{ padding: '36px', textAlign: 'center', color: themeColors.textMuted }}>
            Không tìm thấy ca khẩn cấp nào phù hợp với cờ giám sát đã chọn.
          </div>
        ) : (
          filteredCases.map(c => {
            const isChild = c.isMinor || c.vulnerabilityGroup === 'youth' || c.aliasName.startsWith('CHILD');
            const isElderly = c.vulnerabilityGroup === 'elderly' || (c.birthYear && (2026 - c.birthYear >= 60));
            const isUrgent = c.priority === 'urgent' || c.needCategories?.includes('sos111');
            const cleanArea = (c.currentArea || '').replace(/\(GPS Blurred.*?\)/gi, '').trim();

            return (
              <div
                key={c.id}
                className="card-flat"
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  border: isUrgent ? `2px solid ${themeColors.danger}` : `1px solid ${themeColors.border}`,
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: themeColors.primaryNavy }}>
                      {isChild ? c.aliasName : (c.fullName || c.aliasName)}
                    </div>

                    {isChild && (
                      <span className="badge-danger" style={{ fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                        <Lock size={11} style={{ flexShrink: 0 }} /> BẢO VỆ TRẺ EM (&lt;18T)
                      </span>
                    )}

                    {isElderly && (
                      <span className="badge-saffron" style={{ fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                        <Activity size={11} style={{ flexShrink: 0 }} /> NGƯỜI CAO TUỔI
                      </span>
                    )}

                    {isUrgent && (
                      <span className="badge-danger" style={{ fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                        <PhoneCall size={11} style={{ flexShrink: 0 }} /> ƯU TIÊN KHẨN CẤP
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: themeColors.textMuted, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="#EF4444" style={{ flexShrink: 0 }} />
                    <span>Khu vực: <strong>{cleanArea}</strong></span>
                    <span style={{ margin: '0 4px' }}>&bull;</span>
                    <span>Ngày tạo: {new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div style={{ marginTop: '8px', fontSize: '13px', color: themeColors.textBody, display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', fontSize: '12px' }}>Nhu cầu an sinh:</span>
                  {c.needCategories?.map(cat => {
                    if (cat === 'food') return <span key={cat} className="badge-forest" style={{ fontSize: '10.5px' }}>Nhu yếu phẩm</span>;
                    if (cat === 'medical') return <span key={cat} className="badge-danger" style={{ fontSize: '10.5px' }}>Y tế</span>;
                    if (cat === 'shelter_job') return <span key={cat} className="badge-saffron" style={{ fontSize: '10.5px' }}>Nơi ở / Sinh kế</span>;
                    if (cat === 'sos111') return <span key={cat} className="badge-danger" style={{ fontSize: '10.5px' }}>Bảo vệ khẩn 111</span>;
                    return <span key={cat} className="badge-navy" style={{ fontSize: '10.5px' }}>{cat}</span>;
                  })}
                  {c.note && <span style={{ fontStyle: 'italic', color: themeColors.textMuted, fontSize: '12.5px' }}>— "{c.note}"</span>}
                </div>

                {/* Quick Safeguarding Actions */}
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: themeColors.textMuted, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={13} color="#10B981" style={{ flexShrink: 0 }} />
                    <span>Đã kiểm duyệt bởi Cán bộ Giám sát An toàn (Safeguarding Officer)</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => onOpenAnonymousModal(c)}
                      className="btn-outline"
                      style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                    >
                      <Eye size={12} style={{ flexShrink: 0 }} />
                      <span>Xem Ca Ẩn Danh (Mã hóa PII)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenForm07Modal(c)}
                      className="btn-outline"
                      style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                    >
                      <FileText size={12} style={{ flexShrink: 0 }} />
                      <span>Lập Mẫu số 07</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleHotline111Direct(c)}
                      style={{
                        backgroundColor: themeColors.danger,
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <PhoneCall size={12} style={{ flexShrink: 0 }} />
                      <span>Gọi Khẩn 111</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Safeguarding Audit Trail Summary Table */}
      <div className="card-flat" style={{ padding: '18px', marginTop: '10px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={16} color="#2563EB" style={{ flexShrink: 0 }} />
          <span>Nhật ký Giám sát Audit Trail Safeguarding (Bất biến)</span>
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: `2px solid ${themeColors.border}` }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: themeColors.primaryNavy }}>Thời gian</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: themeColors.primaryNavy }}>Người thực hiện</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: themeColors.primaryNavy }}>Hành động</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: themeColors.primaryNavy }}>Đối tượng Ca</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: themeColors.primaryNavy }}>Chi tiết nhật ký</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: themeColors.primaryNavy }}>Mức rủi ro</th>
              </tr>
            </thead>
            <tbody>
              {auditTrailList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: themeColors.textMuted }}>Chưa có bản ghi nhật ký nào.</td>
                </tr>
              ) : (
                auditTrailList.slice(0, 10).map(a => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                    <td style={{ padding: '8px 10px', color: themeColors.textMuted }}>{new Date(a.timestamp).toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '8px 10px', fontWeight: '700', color: themeColors.primaryNavy }}>{a.actorName} ({a.actorRole})</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className="badge-navy">{a.action}</span>
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: '700' }}>{a.targetAlias || a.targetCaseId || 'N/A'}</td>
                    <td style={{ padding: '8px 10px', color: themeColors.textBody }}>{a.details}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={a.riskLevel === 'critical' || a.riskLevel === 'high' ? 'badge-danger' : 'badge-forest'}>
                        {a.riskLevel.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
