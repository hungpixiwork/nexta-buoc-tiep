import React from 'react';
import { themeColors } from '@buoc-tiep/shared';
import {
  X,
  UserCheck,
  HeartHandshake,
  Sparkles
} from 'lucide-react';
import { CaseRecord } from '../../types';
import { CaseTimeline, TimelineEventItem } from '../timeline/CaseTimeline';
import { useTranslation } from '../../i18n';

export interface CaseOrchestrationDrawerProps {
  show: boolean;
  onClose: () => void;
  caseRecord: CaseRecord | null;
  onOpenReferralModal?: (c: CaseRecord) => void;
  onOpenFollowUpModal?: (c: CaseRecord) => void;
  onOpenHandoverModal?: (c: CaseRecord) => void;
}

export const CaseOrchestrationDrawer: React.FC<CaseOrchestrationDrawerProps> = ({
  show,
  onClose,
  caseRecord,
  onOpenReferralModal: _onOpenReferralModal,
  onOpenFollowUpModal,
  onOpenHandoverModal
}) => {
  const { t } = useTranslation();
  if (!show || !caseRecord) return null;

  const isMinor = Boolean(caseRecord.isMinor);

  const stages = [
    { key: 'intake', label: t('caseOrchestration.stages.intake') },
    { key: 'consent', label: t('caseOrchestration.stages.consent') },
    { key: 'verification', label: t('caseOrchestration.stages.verification') },
    { key: 'safeStep', label: t('caseOrchestration.stages.safeStep') },
    { key: 'referral', label: t('caseOrchestration.stages.referral') },
    { key: 'followUp', label: t('caseOrchestration.stages.followUp') }
  ];

  // Derive active stage index based on case status
  let currentStageIndex = 2; // Default to Verification/Step
  const statusStr = String(caseRecord.status || '');
  if (statusStr === 'open' || statusStr === 'INTAKE_CAPTURED') currentStageIndex = 0;
  else if (statusStr === 'CONSENT_CONFIRMED') currentStageIndex = 1;
  else if (statusStr === 'SAFETY_CLEARED' || statusStr === 'VERIFIED') currentStageIndex = 2;
  else if (statusStr === 'SNS_CONFIRMED' || statusStr === 'SNS_PROPOSED') currentStageIndex = 3;
  else if (statusStr === 'referred' || statusStr === 'in_progress' || statusStr === 'REFERRAL_ACTIVE') currentStageIndex = 4;
  else if (statusStr === 'closed' || statusStr === 'OUTCOME_RECORDED') currentStageIndex = 5;

  const mockTimelineEvents: TimelineEventItem[] = [
    {
      id: 'tle-1',
      eventType: 'FOLLOW_UP_COMPLETED',
      title: t('followUpModal.title'),
      description: 'Người được hỗ trợ cho biết tình trạng đau chân đã giảm, có thể đi lại buôn bán bình thường.',
      actorName: 'TNV Nguyễn Văn Hùng',
      actorRole: t('common.metrics.activeVolunteers'),
      eventDate: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: 'tle-2',
      eventType: 'SERVICE_ATTENDED',
      title: 'Đã đến khám tại TTYT Huyện Hóc Môn',
      description: 'Bác sĩ trực đã kê đơn và cấp phát thuốc theo diện hỗ trợ an sinh xã hội.',
      actorName: 'TTYT Huyện Hóc Môn',
      actorRole: 'Cơ sở Y tế Đối tác',
      eventDate: new Date(Date.now() - 24 * 3600000).toISOString()
    },
    {
      id: 'tle-3',
      eventType: 'TASK_ACCEPTED',
      title: 'TNV Nguyễn Văn Hùng tiếp nhận nhiệm vụ',
      description: 'Xác nhận hỗ trợ dẫn đường và kết nối thủ tục ban đầu tại trạm.',
      actorName: 'TNV Nguyễn Văn Hùng',
      actorRole: t('common.metrics.activeVolunteers'),
      eventDate: new Date(Date.now() - 48 * 3600000).toISOString()
    },
    {
      id: 'tle-4',
      eventType: 'REFERRAL_CREATED',
      title: t('referralsTab.createReferralBtn'),
      description: 'Điều phối viên phê duyệt chuyển tuyến đến Trung tâm Y tế Huyện Hóc Môn.',
      actorName: 'ĐPV Phạm Thu Trang',
      actorRole: t('header.adminConsole'),
      eventDate: new Date(Date.now() - 50 * 3600000).toISOString()
    },
    {
      id: 'tle-5',
      eventType: 'OBSERVATION_CAPTURED',
      title: t('signalsTab.title'),
      description: 'Ghi nhận người phụ nữ buôn bán rong bị đau chân đi lại khó khăn tại khu vực thị trấn.',
      actorName: 'TNV Nguyễn Văn Hưng',
      actorRole: t('common.metrics.activeVolunteers'),
      eventDate: new Date(Date.now() - 72 * 3600000).toISOString()
    }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 1250
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          height: '100%',
          backgroundColor: '#FFFFFF',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: isMinor ? '#FEF2F2' : '#F8FAFC',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: isMinor ? '#DC2626' : themeColors.primaryNavy }}>
                {caseRecord.aliasName}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: isMinor ? '#FEE2E2' : '#E0F2FE',
                  color: isMinor ? '#DC2626' : '#0369A1'
                }}
              >
                {isMinor ? t('common.safeguarding.hotline111') : `${t('cases.table.code')}: ${caseRecord.id}`}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
              {t('cases.table.area')}: <strong>{caseRecord.currentArea || 'TP.HCM'}</strong> · {t('caseOrchestration.assignedOfficer')}: <strong>Phạm Thu Trang</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px',
              borderRadius: '4px'
            }}
            aria-label={t('common.actions.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* 6-Stage Funnel Bar */}
        <div style={{ padding: '12px 20px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>
            {t('caseOrchestration.drawerSubtitle')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
            {stages.map((stg, idx) => {
              const isPassed = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={stg.key}
                  style={{
                    textAlign: 'center',
                    padding: '6px 2px',
                    borderRadius: '4px',
                    backgroundColor: isCurrent ? themeColors.primaryNavy : isPassed ? '#E0F2FE' : '#F1F5F9',
                    color: isCurrent ? '#FFFFFF' : isPassed ? '#0369A1' : '#94A3B8',
                    fontSize: '10.5px',
                    fontWeight: isCurrent ? '800' : '600',
                    lineHeight: 1.2
                  }}
                >
                  {stg.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Highlight Card: Next Safe Action */}
          <div
            style={{
              backgroundColor: '#F0F9FF',
              border: '1.5px solid #BAE6FD',
              borderRadius: '8px',
              padding: '14px 16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={13} /> {t('caseOrchestration.nextSafeAction')}
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#B91C1C', backgroundColor: '#FEF2F2', padding: '1px 6px', borderRadius: '4px' }}>
                Hôm nay 16:00
              </span>
            </div>

            <div style={{ fontSize: '14px', fontWeight: '800', color: themeColors.primaryNavy }}>
              {isMinor
                ? 'Liên hệ Tổng đài Quốc gia 111 & Cán bộ Bảo trợ Trẻ em Huyện'
                : 'Xác nhận tiếp nhận và hướng dẫn khám tại TTYT Huyện Hóc Môn'}
            </div>

            <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px' }}>
              {t('cases.table.assignee')}: <strong>TNV Nguyễn Văn Hùng</strong> (CLB CTXH)
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              {onOpenFollowUpModal && (
                <button
                  type="button"
                  className="btn-navy"
                  onClick={() => onOpenFollowUpModal(caseRecord)}
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <HeartHandshake size={14} /> {t('caseOrchestration.actions.recordFollowUp')}
                </button>
              )}

              {onOpenHandoverModal && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => onOpenHandoverModal(caseRecord)}
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <UserCheck size={14} /> {t('caseOrchestration.actions.reassign')}
                </button>
              )}
            </div>
          </div>

          {/* Section: Chronological Timeline */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '12px' }}>
              {t('caseOrchestration.timelineTitle')}
            </div>
            <CaseTimeline events={mockTimelineEvents} caseAlias={caseRecord.aliasName} />
          </div>
        </div>

        {/* Sticky Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            NEXTA · BƯỚC TIẾP
          </span>
          <button type="button" className="btn-outline" onClick={onClose} style={{ fontSize: '12.5px', padding: '6px 14px' }}>
            {t('common.actions.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

