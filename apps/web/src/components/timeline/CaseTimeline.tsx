import React from 'react';
import { themeColors } from '@buoc-tiep/shared';
import {
  Clock,
  UserCheck,
  Building2,
  FileCheck2,
  HeartHandshake,
  ShieldAlert,
  CheckCircle2,
  ArrowRightCircle
} from 'lucide-react';
import { useTranslation } from '../../i18n';

export interface TimelineEventItem {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  actorName?: string;
  actorRole?: string;
  eventDate: string;
  isUrgent?: boolean;
}

export interface CaseTimelineProps {
  events: TimelineEventItem[];
  caseAlias: string;
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ events, caseAlias: _caseAlias }) => {
  const { t, locale } = useTranslation();
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';

  if (!events || events.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <Clock size={24} color="#94A3B8" style={{ margin: '0 auto 6px auto' }} />
        <div style={{ fontSize: '13px', fontWeight: '700', color: themeColors.primaryNavy }}>
          {t('caseTimeline.empty')}
        </div>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'INTAKE_SUBMITTED':
      case 'OBSERVATION_CAPTURED':
        return <ArrowRightCircle size={15} color="#0369A1" />;
      case 'SAFEGUARDING_TRIGGERED':
        return <ShieldAlert size={15} color="#DC2626" />;
      case 'REFERRAL_CREATED':
      case 'GATEWAY_MATCHED':
        return <Building2 size={15} color="#0B4F9C" />;
      case 'TASK_ASSIGNED':
      case 'TASK_ACCEPTED':
        return <UserCheck size={15} color="#166534" />;
      case 'SERVICE_ATTENDED':
      case 'OUTCOME_RECORDED':
        return <CheckCircle2 size={15} color="#16A34A" />;
      case 'FOLLOW_UP_COMPLETED':
        return <HeartHandshake size={15} color="#0284C7" />;
      default:
        return <FileCheck2 size={15} color="#64748B" />;
    }
  };

  return (
    <div style={{ position: 'relative', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Vertical Spine Line */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          bottom: '8px',
          left: '9px',
          width: '2px',
          backgroundColor: '#E2E8F0'
        }}
      />

      {events.map((evt, idx) => {
        const isLatest = idx === 0;

        return (
          <div key={evt.id || `evt-${idx}`} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {/* Timeline Node Icon Circle */}
            <div
              style={{
                position: 'absolute',
                left: '-24px',
                top: '0px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: isLatest ? '#E0F2FE' : '#FFFFFF',
                border: isLatest ? `2px solid ${themeColors.primaryNavy}` : '2px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}
            >
              {getEventIcon(evt.eventType)}
            </div>

            {/* Event Content Card */}
            <div
              style={{
                backgroundColor: isLatest ? '#F0F9FF' : '#FFFFFF',
                border: isLatest ? '1px solid #BAE6FD' : '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '10px 12px',
                boxShadow: isLatest ? '0 2px 6px rgba(3, 105, 161, 0.08)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '800', fontSize: '13px', color: evt.isUrgent ? '#DC2626' : themeColors.primaryNavy }}>
                  {evt.title}
                </span>
                <span style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={11} /> {new Date(evt.eventDate).toLocaleDateString(dateLocale)} {new Date(evt.eventDate).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {evt.description && (
                <div style={{ fontSize: '12px', color: '#334155', marginTop: '3px', lineHeight: 1.35 }}>
                  {evt.description}
                </div>
              )}

              {evt.actorName && (
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontStyle: 'italic' }}>
                  {evt.actorName} {evt.actorRole ? `(${evt.actorRole})` : ''}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

