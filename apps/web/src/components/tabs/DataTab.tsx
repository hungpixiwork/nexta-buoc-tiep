import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { Database, Search, Filter, RefreshCw, Eye, Archive, Download, CheckCircle, AlertTriangle, FileCode, Shield, Server, Users } from 'lucide-react';
import { CaseRecord, ResourceRecord, ReferralRecord, VolunteerRecord, AuditTrailRecord } from '../../types';

interface DataTabProps {
  casesList: CaseRecord[];
  resourcesList: ResourceRecord[];
  referralsList: ReferralRecord[];
  volunteersList: VolunteerRecord[];
  auditTrailList: AuditTrailRecord[];
  onRefreshData?: () => void;
  onSeedData?: () => Promise<void>;
  onResetData?: () => Promise<void>;
  onArchiveRecord?: (type: 'case' | 'referral' | 'volunteer', id: string) => void;
}

type DatasetType = 'cases' | 'passports' | 'resources' | 'referrals' | 'volunteers' | 'audit';

export const DataTab: React.FC<DataTabProps> = ({
  casesList,
  resourcesList,
  referralsList,
  volunteersList,
  auditTrailList,
  onRefreshData,
  onSeedData,
  onResetData,
  onArchiveRecord,
}) => {
  const [activeDataset, setActiveDataset] = useState<DatasetType>('cases');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecordJson, setSelectedRecordJson] = useState<any | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter datasets
  const getFilteredData = () => {
    switch (activeDataset) {
      case 'cases':
        return casesList.filter((c) => {
          const matchQuery = !searchTerm || c.aliasName.toLowerCase().includes(searchTerm.toLowerCase()) || (c.fullName && c.fullName.toLowerCase().includes(searchTerm.toLowerCase())) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
          const matchStatus = statusFilter === 'all' || c.status === statusFilter;
          return matchQuery && matchStatus;
        });
      case 'resources':
        return resourcesList.filter((r) => {
          const matchQuery = !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.address.toLowerCase().includes(searchTerm.toLowerCase());
          const matchStatus = statusFilter === 'all' || r.category === statusFilter;
          return matchQuery && matchStatus;
        });
      case 'referrals':
        return referralsList.filter((ref) => {
          const matchQuery = !searchTerm || ref.id.toLowerCase().includes(searchTerm.toLowerCase()) || ref.caseId.toLowerCase().includes(searchTerm.toLowerCase());
          const matchStatus = statusFilter === 'all' || ref.status === statusFilter;
          return matchQuery && matchStatus;
        });
      case 'volunteers':
        return volunteersList.filter((v) => {
          const matchQuery = !searchTerm || v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || v.email.toLowerCase().includes(searchTerm.toLowerCase());
          const matchStatus = statusFilter === 'all' || v.status === statusFilter;
          return matchQuery && matchStatus;
        });
      case 'audit':
        return auditTrailList.filter((a) => {
          const matchQuery = !searchTerm || a.action.toLowerCase().includes(searchTerm.toLowerCase()) || a.actorName.toLowerCase().includes(searchTerm.toLowerCase()) || a.details.toLowerCase().includes(searchTerm.toLowerCase());
          const matchStatus = statusFilter === 'all' || a.riskLevel === statusFilter;
          return matchQuery && matchStatus;
        });
      case 'passports':
        return casesList.filter(c => !c.isMinor).map(c => ({
          passportId: `BT-${c.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-6)}`,
          caseId: c.id,
          aliasName: c.aliasName,
          skills: 'Lao động phổ thông, bốc xếp, may mặc căn bản',
          workPreference: 'Bán thời gian hoặc theo ca ngày',
          healthStatus: 'Đủ điều kiện lao động nhẹ',
          status: c.status === 'closed' ? 'GRADUATED' : 'ACTIVE',
          createdAt: c.createdAt,
          updatedAt: c.createdAt
        })).filter(p => !searchTerm || p.aliasName.toLowerCase().includes(searchTerm.toLowerCase()) || p.passportId.toLowerCase().includes(searchTerm.toLowerCase()));
      default:
        return [];
    }
  };

  const currentData = getFilteredData();

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `d1_export_${activeDataset}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSeed = async () => {
    if (!onSeedData) return;
    setIsProcessing(true);
    try {
      await onSeedData();
      setActionMessage({ type: 'success', text: '✅ Đã nạp thành công 10 bộ dữ liệu thử nghiệm Synthetic Pilot vào D1 Database.' });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `❌ Lỗi khi nạp dữ liệu thử nghiệm: ${e.message}` });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleReset = async () => {
    if (resetConfirmInput !== 'RESET PILOT DATA' || !onResetData) return;
    setIsProcessing(true);
    try {
      await onResetData();
      setShowConfirmReset(false);
      setResetConfirmInput('');
      setActionMessage({ type: 'success', text: '🔄 Đã làm mới toàn bộ bộ dữ liệu Pilot về trạng thái chuẩn ban đầu.' });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `❌ Lỗi khi thiết lập lại dữ liệu: ${e.message}` });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner: Pilot Data Console Header */}
      <div className="card-flat" style={{ padding: '20px 24px', backgroundColor: '#FFFFFF', border: `1px solid ${themeColors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                <Database size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '20px', fontWeight: '800' }}>
                  Pilot Data Console — Cloudflare D1 Native
                </h2>
                <div style={{ fontSize: '13px', color: themeColors.textBody, marginTop: '3px' }}>
                  Quản lý CSDL thực nghiệm, kiểm toán dữ liệu nguồn, trích xuất JSON và kiểm soát vòng đời bản ghi
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                className="btn-outline"
                style={{ padding: '7px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
              >
                <RefreshCw size={14} /> Làm mới
              </button>
            )}
            <button
              onClick={handleExportJson}
              className="btn-outline"
              style={{ padding: '7px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
            >
              <Download size={14} /> Xuất JSON
            </button>
            {onSeedData && (
              <button
                onClick={handleSeed}
                disabled={isProcessing}
                className="btn-navy"
                style={{ padding: '7px 14px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284C7', color: '#FFF' }}
              >
                <Server size={14} /> Nạp Dữ Liệu Thử Nghiệm
              </button>
            )}
            {onResetData && (
              <button
                onClick={() => setShowConfirmReset(true)}
                disabled={isProcessing}
                style={{ padding: '7px 14px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
              >
                <AlertTriangle size={14} /> Đặt lại Dataset
              </button>
            )}
          </div>
        </div>

        {actionMessage && (
          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              backgroundColor: actionMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2',
              color: actionMessage.type === 'success' ? '#15803D' : '#DC2626',
              border: `1px solid ${actionMessage.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            }}
          >
            {actionMessage.text}
          </div>
        )}
      </div>

      {/* Dataset Selector Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: `2px solid ${themeColors.border}`, flexWrap: 'wrap' }}>
        {[
          { id: 'cases', label: `Hồ sơ Ca (${casesList.length})`, icon: FileCode },
          { id: 'passports', label: `Hộ chiếu Sinh kế (${casesList.filter(c => !c.isMinor).length})`, icon: Shield },
          { id: 'resources', label: `Danh bạ Nguồn lực (${resourcesList.length})`, icon: Server },
          { id: 'referrals', label: `Phiếu Chuyển tuyến (${referralsList.length})`, icon: RefreshCw },
          { id: 'volunteers', label: `Tình nguyện viên (${volunteersList.length})`, icon: Users },
          { id: 'audit', label: `Nhật ký Kiểm toán (${auditTrailList.length})`, icon: Shield },
        ].map((tab) => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveDataset(tab.id as DatasetType);
                setStatusFilter('all');
              }}
              style={{
                padding: '9px 14px',
                fontWeight: activeDataset === tab.id ? '800' : '600',
                border: 'none',
                background: 'none',
                borderBottom: activeDataset === tab.id ? `3px solid ${themeColors.primaryNavy}` : 'none',
                color: activeDataset === tab.id ? themeColors.primaryNavy : themeColors.textBody,
                cursor: 'pointer',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <IconComp size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color={themeColors.textMuted} style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder={`Tìm kiếm trong bảng ${activeDataset}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: `1px solid ${themeColors.border}`,
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color={themeColors.textMuted} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${themeColors.border}`,
              fontSize: '13px',
              backgroundColor: '#FFFFFF',
              fontWeight: '600',
            }}
          >
            <option value="all">Tất cả trạng thái / Phân loại</option>
            {activeDataset === 'cases' && (
              <>
                <option value="open">Mới tiếp nhận (Open)</option>
                <option value="verified">Đã xác minh (Verified)</option>
                <option value="referred">Đã chuyển tuyến (Referred)</option>
                <option value="closed">Đã hoàn thành (Closed)</option>
              </>
            )}
            {activeDataset === 'resources' && (
              <>
                <option value="shelter">Nơi lưu trú (Shelter)</option>
                <option value="medical">Y tế (Medical)</option>
                <option value="food">Thực phẩm (Food)</option>
                <option value="legal">Pháp lý (Legal)</option>
                <option value="job">Việc làm (Job)</option>
              </>
            )}
            {activeDataset === 'referrals' && (
              <>
                <option value="draft">Bản nháp (Draft)</option>
                <option value="submitted">Đã gửi (Submitted)</option>
                <option value="sent">Đã chuyển tuyến (Sent)</option>
                <option value="accepted">Đối tác nhận (Accepted)</option>
                <option value="declined">Từ chối (Declined)</option>
                <option value="closed">Hoàn tất (Closed)</option>
              </>
            )}
            {activeDataset === 'volunteers' && (
              <>
                <option value="active">Đang hoạt động (Active)</option>
                <option value="busy">Bận điều phối (Busy)</option>
                <option value="inactive">Tạm nghỉ (Inactive)</option>
              </>
            )}
            {activeDataset === 'audit' && (
              <>
                <option value="normal">Bình thường (Normal)</option>
                <option value="high">Mức độ cao (High)</option>
                <option value="critical">Khẩn cấp (Critical)</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="card-flat" style={{ padding: '0', overflow: 'hidden', border: `1px solid ${themeColors.border}` }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: `1px solid ${themeColors.border}`, color: themeColors.primaryNavy, fontWeight: '700' }}>
                <th style={{ padding: '12px 16px' }}>Mã Định Danh</th>
                <th style={{ padding: '12px 16px' }}>Thông Tin Chính</th>
                <th style={{ padding: '12px 16px' }}>Phân Loại / Chi Tiết</th>
                <th style={{ padding: '12px 16px' }}>Trạng Thái</th>
                <th style={{ padding: '12px 16px' }}>Thời Gian</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: themeColors.textMuted }}>
                    Không có bản ghi nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                currentData.map((row: any, idx: number) => {
                  const id = row.id || row.passportId || `row-${idx}`;
                  const isMinor = Boolean(row.isMinor);

                  return (
                    <tr
                      key={id}
                      style={{
                        borderBottom: `1px solid ${themeColors.border}`,
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: '700', fontFamily: 'monospace', color: themeColors.primaryNavy }}>
                        {id}
                        {isMinor && (
                          <span className="badge-danger" style={{ marginLeft: '6px', fontSize: '10px' }}>
                            CHILD
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: themeColors.primaryNavy }}>
                          {row.aliasName || row.name || row.fullName || row.actorName || 'Bản ghi'}
                        </div>
                        <div style={{ fontSize: '12px', color: themeColors.textMuted, marginTop: '2px' }}>
                          {row.currentArea || row.address || row.approximateArea || row.email || row.details || 'Hóc Môn, TP.HCM'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '12.5px', color: themeColors.textBody }}>
                          {row.vulnerabilityGroup || row.category || row.role || row.action || row.skills || '-'}
                        </div>
                        {row.needCategories && (
                          <div style={{ fontSize: '11px', color: '#0284C7', marginTop: '2px' }}>
                            Nhu cầu: {row.needCategories.join(', ')}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor:
                              row.status === 'open' || row.status === 'active' || row.status === 'GRADUATED'
                                ? '#EFF6FF'
                                : row.status === 'verified' || row.status === 'accepted'
                                ? '#F0FDF4'
                                : row.status === 'declined' || row.riskLevel === 'critical'
                                ? '#FEF2F2'
                                : '#F8FAFC',
                            color:
                              row.status === 'open' || row.status === 'active' || row.status === 'GRADUATED'
                                ? '#2563EB'
                                : row.status === 'verified' || row.status === 'accepted'
                                ? '#16A34A'
                                : row.status === 'declined' || row.riskLevel === 'critical'
                                ? '#DC2626'
                                : '#475569',
                            border: '1px solid currentColor',
                          }}
                        >
                          {(row.status || row.riskLevel || 'ACTIVE').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: themeColors.textMuted }}>
                        {row.createdAt || row.timestamp ? new Date(row.createdAt || row.timestamp).toLocaleString('vi-VN') : 'Vừa xong'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedRecordJson(row)}
                            title="Xem chi tiết cấu trúc JSON D1"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: `1px solid ${themeColors.border}`,
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              color: themeColors.primaryNavy,
                            }}
                          >
                            <FileCode size={13} /> JSON
                          </button>
                          {onArchiveRecord && activeDataset === 'cases' && (
                            <button
                              onClick={() => onArchiveRecord('case', id)}
                              title="Lưu trữ bản ghi test"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#F8FAFC',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11.5px',
                                color: '#64748B',
                              }}
                            >
                              <Archive size={13} /> Lưu trữ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {selectedRecordJson && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '16px',
          }}
        >
          <div
            className="card-flat"
            style={{
              maxWidth: '750px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              maxHeight: 'calc(100% - 24px)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: `1px solid ${themeColors.border}`, paddingBottom: '12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode size={18} color={themeColors.primary} />
                <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '800', color: themeColors.primaryNavy }}>
                  D1 Raw Record Inspection — {selectedRecordJson.id || selectedRecordJson.passportId || 'Entity'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordJson(null)}
                style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: themeColors.textMuted }}
              >
                &times;
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0F172A', color: '#38BDF8', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5', minHeight: 0 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(selectedRecordJson, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedRecordJson, null, 2));
                  alert('Đã sao chép JSON vào bộ nhớ đệm');
                }}
                className="btn-outline"
                style={{ padding: '7px 14px', fontSize: '12.5px' }}
              >
                Sao chép JSON
              </button>
              <button
                onClick={() => setSelectedRecordJson(null)}
                className="btn-navy"
                style={{ padding: '7px 14px', fontSize: '12.5px' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Dataset Modal */}
      {showConfirmReset && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '16px',
          }}
        >
          <div
            className="card-flat"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              maxHeight: 'calc(100% - 24px)',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626', marginBottom: '14px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>
                Xác Nhận Đặt Lại Dữ Liệu Thử Nghiệm Pilot
              </h3>
            </div>

            <p style={{ fontSize: '13.5px', color: themeColors.textBody, lineHeight: '1.6', margin: '0 0 16px 0' }}>
              Hành động này sẽ thiết lập lại toàn bộ các bản ghi ca, phiếu chuyển tuyến và hồ sơ sinh kế mẫu về dataset chuẩn ban đầu. Dữ liệu thay đổi thử nghiệm sẽ được khôi phục.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '6px' }}>
                Nhập chính xác cụm từ <span style={{ color: '#DC2626' }}>RESET PILOT DATA</span> để xác nhận:
              </label>
              <input
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder="RESET PILOT DATA"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowConfirmReset(false);
                  setResetConfirmInput('');
                }}
                className="btn-outline"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReset}
                disabled={resetConfirmInput !== 'RESET PILOT DATA' || isProcessing}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  backgroundColor: resetConfirmInput === 'RESET PILOT DATA' ? '#DC2626' : '#94A3B8',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: resetConfirmInput === 'RESET PILOT DATA' ? 'pointer' : 'not-allowed',
                }}
              >
                {isProcessing ? 'Đang đặt lại...' : 'Xác nhận Đặt lại'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
