import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { X, AlertOctagon, Send, Users, ShieldAlert, MapPin, AlertTriangle, Ban } from 'lucide-react';
import { ReferralRecord, DeclineReasonEnum, CaseRecord, ResourceRecord } from '../../types';
import { useTranslation } from '../../i18n';

interface DeclineReferralModalProps {
  referral: ReferralRecord;
  caseRecord?: CaseRecord;
  resourceRecord?: ResourceRecord;
  onClose: () => void;
  onConfirmDecline: (referralId: string, reason: DeclineReasonEnum, note: string) => void;
}

export const DeclineReferralModal: React.FC<DeclineReferralModalProps> = ({
  referral,
  caseRecord,
  resourceRecord,
  onClose,
  onConfirmDecline
}) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState<DeclineReasonEnum>('CAPACITY_FULL');
  const [declineNote, setDeclineNote] = useState<string>('');

  const declineReasonLabels: Record<DeclineReasonEnum, { title: string; desc: string; icon: any }> = {
    CAPACITY_FULL: {
      title: t('declineReferralModal.reasons.capacityFull'),
      desc: 'Cơ sở/Mái ấm đã hết giường trống hoặc quá tải nhân lực chăm sóc.',
      icon: Users
    },
    OUT_OF_SCOPE: {
      title: t('declineReferralModal.reasons.outOfScope'),
      desc: 'Yêu cầu không nằm trong chuyên môn dịch vụ.',
      icon: Ban
    },
    GEOGRAPHY_MISMATCH: {
      title: t('declineReferralModal.reasons.locationMismatch'),
      desc: 'Vị trí đối tượng nằm ngoài quận/huyện phân công hoạt động.',
      icon: MapPin
    },
    ELIGIBILITY_UNMET: {
      title: t('declineReferralModal.reasons.beneficiaryRefused'),
      desc: 'Đối tượng không đáp ứng tiêu chuẩn độ tuổi, hồ sơ hoặc chính sách tiếp nhận.',
      icon: AlertTriangle
    },
    DUPLICATE_OR_INVALID: {
      title: t('declineReferralModal.reasons.other'),
      desc: 'Hồ sơ bị gửi trùng lặp hoặc thông tin có sai lệch cần đối chiếu lại.',
      icon: ShieldAlert
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmDecline(referral.id, selectedReason, declineNote);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px'
      }}
    >
      <div
        className="card-flat"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: `2px solid ${themeColors.danger}`,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Fixed Header */}
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${themeColors.border}`, flexShrink: 0, backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertOctagon color={themeColors.danger} size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '17px', fontWeight: '800' }}>
                {t('declineReferralModal.title')}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: themeColors.textMuted }}>
                {t('referralsTab.tableHeaders.code')}: <strong>{referral.id}</strong> | {t('referralsTab.tableHeaders.destination')}: <strong>{resourceRecord?.name || 'Nơi hỗ trợ'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: '#F1F5F9', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: themeColors.textMuted, padding: 0, lineHeight: 1, flexShrink: 0 }}
            aria-label={t('common.actions.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Decline Form Wrapper */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Scrollable Body */}
          <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {/* Target Info */}
            <div style={{ backgroundColor: '#F8FAFC', border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '12.5px' }}>
              <div style={{ fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px' }}>
                {t('cases.table.alias')}: {caseRecord ? (caseRecord.isMinor ? `${caseRecord.aliasName} (${t('cases.filterMinor')})` : caseRecord.fullName) : 'Ca chưa xác định'}
              </div>
              <div style={{ color: themeColors.textBody, fontSize: '12px' }}>
                {t('cases.table.area')}: <strong>{caseRecord?.currentArea || 'N/A'}</strong> | {t('surveysTab.tableHeaders.needs')}: <strong>{caseRecord?.needCategories?.join(', ') || 'N/A'}</strong>
              </div>
            </div>

            <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: themeColors.primaryNavy, marginBottom: '10px' }}>
              {t('declineReferralModal.reasonLabel')}:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {(Object.keys(declineReasonLabels) as DeclineReasonEnum[]).map((key) => {
                const item = declineReasonLabels[key];
                const isSelected = selectedReason === key;
                const IconComponent = item.icon;

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedReason(key)}
                    style={{
                      border: isSelected ? `2px solid ${themeColors.danger}` : `1px solid ${themeColors.border}`,
                      backgroundColor: isSelected ? '#FEF2F2' : '#FFFFFF',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="declineReason"
                        value={key}
                        checked={isSelected}
                        onChange={() => setSelectedReason(key)}
                        style={{ cursor: 'pointer', accentColor: themeColors.danger }}
                      />
                      <IconComponent size={15} color={isSelected ? themeColors.danger : '#64748B'} style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: '700', fontSize: '13px', color: isSelected ? themeColors.danger : themeColors.primaryNavy }}>
                        {item.title}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0 24px', fontSize: '11.5px', color: themeColors.textBody }}>
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Note Input */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '12.5px', color: themeColors.primaryNavy, marginBottom: '6px' }}>
                {t('declineReferralModal.notesLabel')}:
              </label>
              <textarea
                required
                rows={3}
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                placeholder={t('declineReferralModal.notesPlaceholder')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeColors.borderDark}`,
                  fontSize: '12.5px',
                  color: themeColors.primaryNavy,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Fixed Footer */}
          <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${themeColors.border}`, backgroundColor: '#F8FAFC', flexShrink: 0 }}>
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              style={{ padding: '7px 14px', fontSize: '12.5px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {t('common.actions.cancel')}
            </button>
            <button
              type="submit"
              className="btn-navy"
              style={{
                padding: '7px 16px',
                fontSize: '12.5px',
                fontWeight: '700',
                backgroundColor: themeColors.danger,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Send size={13} style={{ flexShrink: 0 }} />
              <span>{t('declineReferralModal.submitBtn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

