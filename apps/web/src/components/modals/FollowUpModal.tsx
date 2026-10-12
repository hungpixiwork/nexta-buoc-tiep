import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { HeartHandshake, X, Send } from 'lucide-react';
import { CaseRecord } from '../../types';
import { useTranslation } from '../../i18n';

export interface FollowUpModalProps {
  show: boolean;
  onClose: () => void;
  selectedCase: CaseRecord | null;
  onSubmitSuccess?: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  show,
  onClose,
  selectedCase,
  onSubmitSuccess
}) => {
  const { t } = useTranslation();
  const [conditionStatus, setConditionStatus] = useState<'better' | 'same' | 'worse'>('better');
  const [priorStepHelpful, setPriorStepHelpful] = useState<'yes' | 'not_suitable' | 'could_not_complete'>('yes');
  const [nextActionRecommendation, setNextActionRecommendation] = useState<'continue' | 'try_another' | 'pause' | 'close'>('continue');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show || !selectedCase) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send structured follow-up data to backend API
      const res = await fetch('https://buoc-tiep-api.ppnh10092002.workers.dev/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCase.id,
          conditionStatus,
          priorStepHelpful,
          nextActionRecommendation,
          notes,
          recordedBy: 'usr-volunteer-01'
        })
      });

      if (res.ok) {
        if (onSubmitSuccess) onSubmitSuccess();
        onClose();
      } else {
        onClose();
      }
    } catch (_err) {
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
        padding: '16px'
      }}
    >
      <div
        className="card-flat"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartHandshake size={18} color="#0369A1" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: themeColors.primaryNavy }}>
                {t('followUpModal.title')}
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                {t('cases.table.alias')}: <strong>{selectedCase.aliasName}</strong> ({selectedCase.currentArea || 'TP.HCM'})
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '4px' }}
            aria-label={t('common.actions.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Question 1: Condition Status */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '8px' }}>
              {t('followUpModal.resultLabel')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { key: 'better', label: t('followUpModal.resultBetter'), color: '#16A34A', bg: '#DCFCE7' },
                { key: 'same', label: t('followUpModal.resultSame'), color: '#0369A1', bg: '#E0F2FE' },
                { key: 'worse', label: t('followUpModal.resultHarder'), color: '#DC2626', bg: '#FEE2E2' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setConditionStatus(opt.key as any)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '6px',
                    border: conditionStatus === opt.key ? `2px solid ${opt.color}` : '1px solid #CBD5E1',
                    backgroundColor: conditionStatus === opt.key ? opt.bg : '#FFFFFF',
                    color: conditionStatus === opt.key ? opt.color : '#475569',
                    fontWeight: conditionStatus === opt.key ? '800' : '600',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Was Prior Step Helpful? */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '8px' }}>
              2. Bước hỗ trợ trước đó có giúp ích không?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { key: 'yes', label: '✅ Rất giúp ích' },
                { key: 'not_suitable', label: '⚠️ Chưa phù hợp' },
                { key: 'could_not_complete', label: '❌ Chưa hoàn thành' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPriorStepHelpful(opt.key as any)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: priorStepHelpful === opt.key ? `2px solid ${themeColors.primaryNavy}` : '1px solid #CBD5E1',
                    backgroundColor: priorStepHelpful === opt.key ? '#F0F9FF' : '#FFFFFF',
                    color: priorStepHelpful === opt.key ? themeColors.primaryNavy : '#475569',
                    fontWeight: priorStepHelpful === opt.key ? '800' : '600',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Next Action */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '8px' }}>
              3. Tiếp theo nên làm gì?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { key: 'continue', label: 'Tiếp tục theo kế hoạch đã lập' },
                { key: 'try_another', label: 'Tìm phương án hỗ trợ thay thế' },
                { key: 'pause', label: 'Tạm dừng hỏi thăm thêm' },
                { key: 'close', label: 'Đã hoàn thành mục tiêu / Đóng ca' }
              ].map(opt => (
                <label
                  key={opt.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    border: nextActionRecommendation === opt.key ? '1.5px solid #0284C7' : '1px solid #E2E8F0',
                    borderRadius: '6px',
                    backgroundColor: nextActionRecommendation === opt.key ? '#F0F9FF' : '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: nextActionRecommendation === opt.key ? '700' : '500',
                    color: nextActionRecommendation === opt.key ? themeColors.primaryNavy : '#334155'
                  }}
                >
                  <input
                    type="radio"
                    name="nextAction"
                    checked={nextActionRecommendation === opt.key}
                    onChange={() => setNextActionRecommendation(opt.key as any)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Short Note */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
              {t('followUpModal.notesLabel')}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('followUpModal.notesPlaceholder')}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '12.5px',
                boxSizing: 'border-box',
                resize: 'none'
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSubmitting}>
              {t('common.actions.close')}
            </button>
            <button type="submit" className="btn-navy" disabled={isSubmitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Send size={15} /> {isSubmitting ? '...' : t('followUpModal.submitBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

