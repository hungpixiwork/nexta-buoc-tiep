import React from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { ShieldAlert, ArrowRight, FileText, CheckCircle, Building, Activity, MapPin, Phone, Calendar, PlusCircle } from 'lucide-react';
import { CaseRecord, ResourceRecord, ReferralRecord, Form07Data } from '../../types';
import { handleExportDocx, buildForm07DataFromCase } from '../../utils/docxExport';
import { useTranslation } from '../../i18n';

interface ReferralsTabProps {
  resourcesList: ResourceRecord[];
  referralsList: ReferralRecord[];
  casesList: CaseRecord[];
  setShowReferralModal: (show: boolean) => void;
  setForm07Data: (data: Form07Data | null) => void;
  setShowForm07Modal: (show: boolean) => void;
  onUpdateReferralStatus?: (referralId: string, newStatus: ReferralRecord['status']) => void;
  onOpenDeclineModal?: (referral: ReferralRecord) => void;
}

export const ReferralsTab: React.FC<ReferralsTabProps> = ({
  resourcesList,
  referralsList,
  casesList,
  setShowReferralModal,
  setForm07Data,
  setShowForm07Modal,
  onUpdateReferralStatus,
  onOpenDeclineModal
}) => {
  const { t } = useTranslation();

  const getReferralStatusBadge = (status: string, declineReason?: string) => {
    const s = status.toLowerCase();
    if (s === 'draft') return <span className="badge-draft">1. {t('referralsTab.status.draft')}</span>;
    if (s === 'submitted' || s === 'pending' || s === 'created' || s === 'proposed') return <span className="badge-submitted">2. {t('referralsTab.status.proposed')}</span>;
    if (s === 'verified') return <span className="badge-verified">3. ĐÃ XÁC MINH</span>;
    if (s === 'referred' || s === 'sent') return <span className="badge-referred">4. {t('referralsTab.status.sent')}</span>;
    if (s === 'accepted' || s === 'service_reached') return <span className="badge-accepted">5. {t('referralsTab.status.accepted')}</span>;
    if (s === 'completed' || s === 'approved' || s === 'closed') return <span className="badge-completed">6. {t('referralsTab.status.completed')}</span>;
    if (s === 'declined' || s === 'cancelled') return (
      <span className="badge-danger" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
        {t('referralsTab.status.declined')} ({declineReason || 'Hết chỗ'})
      </span>
    );
    return <span className="badge-navy">{status.toUpperCase()}</span>;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
      {/* Left: Resource Directory */}
      <div className="card-flat" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={20} color={themeColors.primaryNavy} style={{ flexShrink: 0 }} />
            <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '17px', fontWeight: '800' }}>
              {t('resourcesTab.title')}
            </h3>
          </div>
          <button
            type="button"
            className="btn-navy"
            style={{ padding: '7px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowReferralModal(true)}
          >
            <PlusCircle size={14} />
            <span>{t('referralsTab.createReferralBtn')}</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {resourcesList.map(r => (
            <div key={r.id} style={{ border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: themeColors.primaryNavy, fontSize: '14px' }}>{r.name}</span>
                <span style={{ fontSize: '11px', fontWeight: '700' }} className={
                  r.category === 'medical' ? 'badge-danger' :
                    r.category === 'shelter' ? 'badge-navy' :
                      r.category === 'food' ? 'badge-forest' : 'badge-saffron'
                }>
                  {r.category.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: themeColors.textBody, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="#DC2626" style={{ flexShrink: 0 }} />
                <span>{r.address}</span>
              </div>
              <div style={{ fontSize: '12px', color: themeColors.textMuted, marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={13} color={themeColors.primaryNavy} style={{ flexShrink: 0 }} />
                  <span>{r.phone || 'Không có sđt'} | Giờ mở: {r.operatingHours || '24/7'}</span>
                </div>
                <span className="badge-forest" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <CheckCircle size={10} /> ĐÃ KIỂM TRA
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Referral Tickets History */}
      <div className="card-flat" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Activity size={20} color={themeColors.primaryNavy} style={{ flexShrink: 0 }} />
          <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '17px', fontWeight: '800' }}>
            {t('referralsTab.statusSummary')}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {referralsList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: themeColors.textMuted }}>{t('referralsTab.emptyText')}</div>
          ) : (
            referralsList.map(ref => {
              const caseId = ref.caseId || (ref as any).case_id;
              const resourceId = ref.resourceId || (ref as any).resource_id;
              const matchedCase = casesList.find(c => c.id === caseId || c.beneficiaryId === caseId);
              const matchedResource = resourcesList.find(r => r.id === resourceId);
              const isMinorCase = Boolean(matchedCase?.isMinor);
              const isUrgent = matchedCase?.priority === 'urgent' || matchedCase?.needCategories?.includes('medical');

              return (
                <div key={ref.id} style={{ border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '800', color: themeColors.primaryNavy, fontSize: '15px' }}>
                        {matchedCase ? (matchedCase.isMinor ? matchedCase.aliasName : (matchedCase.fullName || matchedCase.aliasName)) : ((ref as any).caseName || (ref as any).beneficiaryName || 'Ca hỗ trợ')}
                      </span>
                      {isMinorCase && (
                        <span className="badge-danger" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <ShieldAlert size={10} /> {t('cases.filterMinor')}
                        </span>
                      )}
                      {isUrgent && (
                        <span className="badge-danger" style={{ fontSize: '10px' }}>{t('cases.priorityUrgent')}</span>
                      )}
                    </div>
                    <div>
                      {getReferralStatusBadge(ref.status, ref.declineReason)}
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: themeColors.textBody, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRight size={14} color={themeColors.warning} style={{ flexShrink: 0 }} />
                    <span>{t('referralsTab.tableHeaders.destination')}: <strong style={{ color: themeColors.primaryNavy }}>{matchedResource?.name || 'Điểm hỗ trợ'}</strong></span>
                  </div>

                  {ref.notes && (
                    <div style={{ fontSize: '12.5px', color: themeColors.textBody, marginTop: '6px', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.border}` }}>
                      "{ref.notes}"
                    </div>
                  )}

                  {ref.declineReason && (
                    <div style={{ fontSize: '12px', color: themeColors.danger, marginTop: '6px', backgroundColor: '#FEF2F2', padding: '6px 10px', borderRadius: '6px', border: `1px solid #FCA5A5` }}>
                      <strong>{t('declineReferralModal.reasonLabel')} ({ref.declineReason}):</strong> {ref.declineNote || 'Tổ chức quá tải hoặc không đúng địa bàn.'}
                    </div>
                  )}

                  <div style={{ fontSize: '11.5px', color: themeColors.textMuted, marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: `1px solid ${themeColors.border}`, paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} style={{ flexShrink: 0 }} />
                      <span>{t('referralsTab.tableHeaders.created')}: {new Date(ref.createdAt).toLocaleString('vi-VN')}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Status quick switcher */}
                      {onUpdateReferralStatus && (
                        <select
                          value={ref.status}
                          onChange={(e) => {
                            const newSt = e.target.value as ReferralRecord['status'];
                            if (newSt === 'declined' && onOpenDeclineModal) {
                              onOpenDeclineModal(ref);
                            } else {
                              onUpdateReferralStatus(ref.id, newSt);
                            }
                          }}
                          style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: `1px solid ${themeColors.borderDark}`, fontWeight: '700', backgroundColor: '#F8FAFC' }}
                          title="Cập nhật trạng thái"
                        >
                          <option value="draft">1. {t('referralsTab.status.draft')}</option>
                          <option value="proposed">2. {t('referralsTab.status.proposed')}</option>
                          <option value="sent">3-4. {t('referralsTab.status.sent')}</option>
                          <option value="accepted">5. {t('referralsTab.status.accepted')}</option>
                          <option value="service_reached">5. Đã tới dịch vụ</option>
                          <option value="closed">6. {t('referralsTab.status.completed')}</option>
                          <option value="declined">{t('referralsTab.status.declined')}</option>
                        </select>
                      )}

                      {ref.status !== 'declined' && onOpenDeclineModal && (
                        <button
                          type="button"
                          onClick={() => onOpenDeclineModal(ref)}
                          style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#FEF2F2', color: themeColors.danger, border: `1px solid ${themeColors.danger}`, borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          {t('referralsTab.status.declined')}
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-navy"
                        style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#0284C7', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          const form07 = buildForm07DataFromCase(matchedCase || { id: ref.caseId, aliasName: ref.caseId, currentArea: 'TP. Hồ Chí Minh' }, {
                            referralId: ref.id,
                            notes: ref.notes || undefined,
                            resourceName: matchedResource?.name,
                            address: matchedResource?.address,
                            isApproved: ref.status === 'approved' || ref.status === 'sent' || ref.status === 'service_reached' || ref.status === 'closed'
                          });
                          handleExportDocx(form07);
                        }}
                        title="Tải trực tiếp file Word (.docx) Mẫu số 07"
                      >
                        <FileText size={12} />
                        <span>{t('form07Modal.title')} (.docx)</span>
                      </button>

                      <button
                        type="button"
                        className="btn-outline"
                        style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          const calcAge = matchedCase?.birthYear ? (2026 - matchedCase.birthYear) : undefined;
                          const docNo = `${ref.id.toUpperCase().replace('REF-', '')}/PCT-BT`;

                          setForm07Data({
                            referralId: ref.id,
                            officialDocNo: docNo,
                            caseName: matchedCase?.fullName || matchedCase?.aliasName || 'Đối tượng hỗ trợ',
                            aliasName: matchedCase?.aliasName || matchedCase?.id || 'BT-CASE',
                            fullName: matchedCase?.fullName || matchedCase?.aliasName || '—',
                            passportId: matchedCase?.beneficiaryId ? `BT-${matchedCase.beneficiaryId.toUpperCase()}` : `BT-${ref.caseId.toUpperCase()}`,
                            age: calcAge || 0,
                            gender: (matchedCase as any)?.gender || (isMinorCase ? 'Nam' : 'Nam/Nữ'),
                            currentArea: matchedCase?.currentArea || '—',
                            vulnerabilityGroup: matchedCase?.vulnerabilityGroup === 'youth'
                              ? 'Trẻ em lang thang / Nguy cơ tổn thương'
                              : matchedCase?.vulnerabilityGroup === 'elderly'
                              ? 'Người già neo đơn / Kiệt sức'
                              : matchedCase?.vulnerabilityGroup === 'street_worker'
                              ? 'Lao động tự do đường phố'
                              : 'Đối tượng an sinh xã hội',
                            emergencyReason: matchedCase?.note || 'Người gặp hoàn cảnh đặc biệt khó khăn, kiệt sức, cần hỗ trợ y tế & chỗ ở khẩn cấp.',
                            proposedMeasures: matchedCase?.needCategories && matchedCase.needCategories.length > 0
                              ? matchedCase.needCategories.map(cat => {
                                  if (cat === 'food') return 'Nhu yếu phẩm khẩn cấp & Suất ăn dinh dưỡng';
                                  if (cat === 'medical') return 'Trợ giúp Y tế, khám chữa bệnh & Cấp thuốc khẩn cấp';
                                  if (cat === 'shelter_job') return 'Tạm trú khẩn cấp & Đào tạo việc làm thử việc (3-7 ngày)';
                                  if (cat === 'sos111') return 'Bảo vệ trẻ em khẩn cấp (Tổng đài 111 & Tổ CTXH)';
                                  return cat;
                                })
                              : [
                                  'Tạm trú khẩn cấp tại Cơ sở Bảo trợ',
                                  'Trợ giúp Y tế & Chăm sóc sức khỏe',
                                  'Đào tạo an toàn số MIL (Media & Info Literacy)',
                                  'Tạo việc làm thử việc 3-7 ngày'
                                ],
                            resourceName: matchedResource?.name || 'Phòng Lao động - Thương binh & Xã hội',
                            address: matchedResource?.address || 'TP. Hồ Chí Minh',
                            isApproved: ref.status === 'approved' || ref.status === 'sent' || ref.status === 'service_reached' || ref.status === 'closed',
                            isMinor: isMinorCase,
                            createdAt: ref.createdAt,
                            notes: ref.notes || 'Đề nghị tiếp nhận hỗ trợ trợ giúp xã hội theo Mẫu số 07 Nghị định 20/2021/NĐ-CP.',
                            issuingOfficer: matchedCase?.assignedTo || 'Cán bộ CTXH Thực địa',
                            issuingDept: 'Ban Điều hành BƯỚC TIẾP — UNESCO Youth Hackathon 2026',
                            redactPII: isMinorCase
                          });
                          setShowForm07Modal(true);
                        }}
                      >
                        <FileText size={12} />
                        <span>Xem {t('form07Modal.title')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

