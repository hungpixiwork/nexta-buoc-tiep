import React, { useRef } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import {
  ShieldCheck, ArrowRight, Award, CheckCircle2,
  FileText, Users, Eye, HelpCircle, AlertTriangle, Clock,
  Sparkles, Layers, ShieldAlert, HeartHandshake, Check,
  Heart, Compass, PhoneCall, Shield, RefreshCw, MessageSquare
} from 'lucide-react';
import { useTranslation } from '../../i18n';

interface PublicImpactDashboardProps {
  onOpenDemoPortal?: () => void;
}

export const PublicImpactDashboard: React.FC<PublicImpactDashboardProps> = ({ onOpenDemoPortal }) => {
  const { t } = useTranslation();
  const measurementRef = useRef<HTMLDivElement>(null);

  const scrollToMeasurement = () => {
    measurementRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (IMPACT NARRATIVE & 6-STEP HUMAN JOURNEY) */}
      {/* ========================================================================= */}
      <section
        style={{
          backgroundColor: '#1E3A8A', // Deep Navy Light-theme Friendly
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '40px 36px',
          boxShadow: '0 4px 20px rgba(30, 58, 138, 0.12)',
        }}
      >
        <div style={{ maxWidth: '960px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '16px',
              letterSpacing: '0.2px',
            }}
          >
            <Award size={16} /> {t('hero.eyebrow')}
          </div>

          <h1 style={{ fontSize: '34px', fontWeight: '800', lineHeight: '1.25', margin: '0 0 14px 0', color: '#FFFFFF' }}>
            {t('hero.headline')}
          </h1>

          <p style={{ fontSize: '16px', color: '#E0E7FF', lineHeight: '1.6', margin: '0 0 24px 0' }}>
            {t('hero.supporting')}
          </p>

          {/* 6-Step Visual Human Journey */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '28px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#93C5FD', marginBottom: '10px' }}>
              The 6-Step NEXTA Journey — So No One Navigates Alone:
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
              }}
            >
              {[
                { name: t('hero.journey.step1'), desc: t('hero.journey.step1Desc') },
                { name: t('hero.journey.step2'), desc: t('hero.journey.step2Desc') },
                { name: t('hero.journey.step3'), desc: t('hero.journey.step3Desc') },
                { name: t('hero.journey.step4'), desc: t('hero.journey.step4Desc') },
                { name: t('hero.journey.step5'), desc: t('hero.journey.step5Desc') },
                { name: t('hero.journey.step6'), desc: t('hero.journey.step6Desc') },
              ].map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#60A5FA' }}>●</span> {step.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px', lineHeight: '1.3' }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs & Trust Line */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            {onOpenDemoPortal && (
              <button
                onClick={onOpenDemoPortal}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#1E3A8A',
                  padding: '12px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <span>{t('hero.primaryCta')}</span>
                <ArrowRight size={16} />
              </button>
            )}

            <button
              onClick={scrollToMeasurement}
              style={{
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1.5px solid rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {t('hero.secondaryCta')}
            </button>
          </div>

          <div style={{ marginTop: '16px', fontSize: '12.5px', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#34D399" />
            <span>{t('hero.trustLine')}</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE HUMAN SOUL BEHIND NEXTA (FEATURES BY HUMAN NEED) */}
      {/* ========================================================================= */}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: `1.5px solid ${themeColors.border}`,
          padding: '32px 28px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ maxWidth: '850px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Heart size={14} color="#2563EB" />
            <span>THE HUMAN IDEA BEHIND NEXTA</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: themeColors.primaryNavy, margin: '0 0 10px 0', lineHeight: '1.3' }}>
            "{t('humanSoul.quote')}"
          </h2>
          <p style={{ fontSize: '14px', color: themeColors.textBody, lineHeight: '1.6', margin: 0 }}>
            {t('humanSoul.subquote')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Card 1 */}
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: `1px solid ${themeColors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              <MessageSquare size={17} color={themeColors.primary} />
              <span>{t('humanSoul.card1Title')}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#16A34A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              <span>Human Value: {t('humanSoul.card1Value')}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: `1px solid ${themeColors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              <Compass size={17} color={themeColors.accentBlue} />
              <span>{t('humanSoul.card2Title')}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#16A34A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              <span>Human Value: {t('humanSoul.card2Value')}</span>
            </div>
          </div>

          {/* Card 3 */}
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: `1px solid ${themeColors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              <PhoneCall size={17} color="#D97706" />
              <span>{t('humanSoul.card3Title')}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#16A34A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              <span>Human Value: {t('humanSoul.card3Value')}</span>
            </div>
          </div>

          {/* Card 4 */}
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: `1px solid ${themeColors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              <ShieldCheck size={17} color="#059669" />
              <span>{t('humanSoul.card4Title')}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#16A34A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              <span>Human Value: {t('humanSoul.card4Value')}</span>
            </div>
          </div>

          {/* Card 5 */}
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: `1px solid ${themeColors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              <RefreshCw size={17} color="#2563EB" />
              <span>{t('humanSoul.card5Title')}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#16A34A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              <span>Human Value: {t('humanSoul.card5Value')}</span>
            </div>
          </div>

          {/* Card 6 */}
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: `1px solid ${themeColors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              <Shield size={17} color="#DC2626" />
              <span>{t('humanSoul.card6Title')}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#16A34A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              <span>Human Value: {t('humanSoul.card6Value')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROPOSED 12-WEEK PILOT SCOPE (HONEST TARGET LABELING) */}
      {/* ========================================================================= */}
      <section
        className="card-flat"
        style={{
          padding: '24px 28px',
          backgroundColor: '#FFFFFF',
          border: `1px solid ${themeColors.border}`,
          borderRadius: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: themeColors.primaryNavy }}>
            {t('pilot.title')}
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '0.5px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE',
            }}
          >
            {t('pilot.disclaimer')}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: themeColors.primaryNavy }}>
              10–15
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: themeColors.textBody, marginTop: '2px' }}>
              {t('pilot.navigators')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: themeColors.primaryNavy }}>
              3–5
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: themeColors.textBody, marginTop: '2px' }}>
              {t('pilot.partners')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: themeColors.primaryNavy }}>
              30–50
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: themeColors.textBody, marginTop: '2px' }}>
              {t('pilot.journeys')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: themeColors.primaryNavy }}>
              12
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: themeColors.textBody, marginTop: '2px' }}>
              {t('pilot.durationWeeks')}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. WHAT NEXTA MEASURES (4-STAGE OUTCOME MODEL) */}
      {/* ========================================================================= */}
      <section ref={measurementRef}>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800', color: themeColors.primaryNavy }}>
            {t('measurement.title')}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: themeColors.textBody }}>
            {t('measurement.subtitle')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {/* Stage 1 */}
          <div className="card-flat" style={{ padding: '20px', backgroundColor: '#FFFFFF', borderTop: `4px solid ${themeColors.primary}` }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              {t('measurement.stage1Title')}
            </div>
            <p style={{ fontSize: '13px', color: themeColors.textBody, lineHeight: '1.5', margin: '0 0 12px 0' }}>
              {t('measurement.stage1Desc')}
            </p>
            <div style={{ borderTop: `1px solid ${themeColors.border}`, paddingTop: '10px', fontSize: '12px', color: themeColors.textMuted }}>
              <div><strong>Metric:</strong> {t('measurement.stage1Metric')}</div>
              <div style={{ marginTop: '2px' }}><strong>Evidence:</strong> {t('measurement.stage1Source')}</div>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="card-flat" style={{ padding: '20px', backgroundColor: '#FFFFFF', borderTop: `4px solid ${themeColors.accentBlue}` }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              {t('measurement.stage2Title')}
            </div>
            <p style={{ fontSize: '13px', color: themeColors.textBody, lineHeight: '1.5', margin: '0 0 12px 0' }}>
              {t('measurement.stage2Desc')}
            </p>
            <div style={{ borderTop: `1px solid ${themeColors.border}`, paddingTop: '10px', fontSize: '12px', color: themeColors.textMuted }}>
              <div><strong>Metric:</strong> {t('measurement.stage2Metric')}</div>
              <div style={{ marginTop: '2px' }}><strong>Evidence:</strong> {t('measurement.stage2Source')}</div>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="card-flat" style={{ padding: '20px', backgroundColor: '#FFFFFF', borderTop: `4px solid #F59E0B` }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              {t('measurement.stage3Title')}
            </div>
            <p style={{ fontSize: '13px', color: themeColors.textBody, lineHeight: '1.5', margin: '0 0 12px 0' }}>
              {t('measurement.stage3Desc')}
            </p>
            <div style={{ borderTop: `1px solid ${themeColors.border}`, paddingTop: '10px', fontSize: '12px', color: themeColors.textMuted }}>
              <div><strong>Metric:</strong> {t('measurement.stage3Metric')}</div>
              <div style={{ marginTop: '2px' }}><strong>Evidence:</strong> {t('measurement.stage3Source')}</div>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="card-flat" style={{ padding: '20px', backgroundColor: '#FFFFFF', borderTop: `4px solid #10B981` }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              {t('measurement.stage4Title')}
            </div>
            <p style={{ fontSize: '13px', color: themeColors.textBody, lineHeight: '1.5', margin: '0 0 12px 0' }}>
              {t('measurement.stage4Desc')}
            </p>
            <div style={{ borderTop: `1px solid ${themeColors.border}`, paddingTop: '10px', fontSize: '12px', color: themeColors.textMuted }}>
              <div><strong>Metric:</strong> {t('measurement.stage4Metric')}</div>
              <div style={{ marginTop: '2px' }}><strong>Evidence:</strong> {t('measurement.stage4Source')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. REFERRAL JOURNEY FUNNEL (WITH EXPLICIT DEMO DATA BADGE) */}
      {/* ========================================================================= */}
      <section
        className="card-flat"
        style={{
          padding: '24px 28px',
          backgroundColor: '#FFFFFF',
          border: `1px solid ${themeColors.border}`,
          borderRadius: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: themeColors.primaryNavy }}>
              {t('funnel.title')}
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: themeColors.textBody }}>
              {t('funnel.subtitle')}
            </p>
          </div>

          <div
            title={t('funnel.demoTooltip')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FDE68A',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'help',
            }}
          >
            <span>{t('funnel.demoBadge')}</span>
            <HelpCircle size={13} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: t('funnel.steps.s1'), count: 42, pct: 100 },
            { label: t('funnel.steps.s2'), count: 36, pct: 85.7 },
            { label: t('funnel.steps.s3'), count: 34, pct: 81.0 },
            { label: t('funnel.steps.s4'), count: 28, pct: 66.7 },
            { label: t('funnel.steps.s5'), count: 28, pct: 66.7 },
            { label: t('funnel.steps.s6'), count: 25, pct: 59.5 },
            { label: t('funnel.steps.s7'), count: 22, pct: 52.4 },
          ].map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '240px', fontSize: '13px', fontWeight: '700', color: themeColors.primaryNavy }}>
                {step.label}
              </div>
              <div style={{ flex: 1, backgroundColor: '#F1F5F9', height: '22px', borderRadius: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${step.pct}%`,
                    height: '100%',
                    backgroundColor: idx === 6 ? '#10B981' : idx >= 4 ? '#2563EB' : '#0284C7',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ width: '120px', textAlign: 'right', fontSize: '13px', fontWeight: '800', color: themeColors.primaryNavy }}>
                {step.count} ({step.pct}%)
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. EVIDENCE QUALITY (EVIDENCE, NOT JUST NUMBERS) */}
      {/* ========================================================================= */}
      <section>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800', color: themeColors.primaryNavy }}>
            {t('evidenceSection.title')}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: themeColors.textBody }}>
            {t('evidenceSection.subtitle')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {/* Card 1: Survey Evidence */}
          <div className="card-flat" style={{ padding: '22px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy }}>
                {t('evidenceSection.card1Title')}
              </span>
              <span className="badge-forest" style={{ fontSize: '10.5px' }}>
                {t('evidenceSection.card1Badge')}
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              {t('evidenceSection.card1Value')}
            </div>
            <p style={{ fontSize: '13px', color: themeColors.textBody, lineHeight: '1.5', margin: 0 }}>
              {t('evidenceSection.card1Desc')}
            </p>
          </div>

          {/* Card 2: Field Insights */}
          <div className="card-flat" style={{ padding: '22px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy }}>
                {t('evidenceSection.card2Title')}
              </span>
              <span className="badge-forest" style={{ fontSize: '10.5px' }}>
                {t('evidenceSection.card2Badge')}
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              {t('evidenceSection.card2Value')}
            </div>
            <p style={{ fontSize: '13px', color: themeColors.textBody, lineHeight: '1.5', margin: 0 }}>
              {t('evidenceSection.card2Desc')}
            </p>
          </div>

          {/* Card 3: System Evidence */}
          <div className="card-flat" style={{ padding: '22px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy }}>
                {t('evidenceSection.card3Title')}
              </span>
              <span className="badge-navy" style={{ fontSize: '10.5px' }}>
                {t('evidenceSection.card3Badge')}
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '6px' }}>
              {t('evidenceSection.card3Value')}
            </div>
            <p style={{ fontSize: '13px', color: themeColors.textBody, lineHeight: '1.5', margin: 0 }}>
              {t('evidenceSection.card3Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. RESPONSIBLE AI BY DESIGN */}
      {/* ========================================================================= */}
      <section
        className="card-flat"
        style={{
          padding: '28px',
          backgroundColor: '#F8FAFC',
          border: `1.5px solid ${themeColors.border}`,
          borderRadius: '14px',
        }}
      >
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} color="#2563EB" />
            <span>{t('responsibleAi.title')}</span>
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: themeColors.textBody }}>
            {t('responsibleAi.subtitle')}
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${themeColors.border}`,
            borderRadius: '10px',
            padding: '12px 18px',
            fontSize: '13px',
            fontWeight: '700',
            color: themeColors.primaryNavy,
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          {t('responsibleAi.flow')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeColors.border}` }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '4px' }}>
              1. {t('responsibleAi.p1Title')}
            </div>
            <div style={{ fontSize: '12.5px', color: themeColors.textBody, lineHeight: '1.5' }}>
              {t('responsibleAi.p1Desc')}
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeColors.border}` }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '4px' }}>
              2. {t('responsibleAi.p2Title')}
            </div>
            <div style={{ fontSize: '12.5px', color: themeColors.textBody, lineHeight: '1.5' }}>
              {t('responsibleAi.p2Desc')}
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeColors.border}` }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '4px' }}>
              3. {t('responsibleAi.p3Title')}
            </div>
            <div style={{ fontSize: '12.5px', color: themeColors.textBody, lineHeight: '1.5' }}>
              {t('responsibleAi.p3Desc')}
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeColors.border}` }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '4px' }}>
              4. {t('responsibleAi.p4Title')}
            </div>
            <div style={{ fontSize: '12.5px', color: themeColors.textBody, lineHeight: '1.5' }}>
              {t('responsibleAi.p4Desc')}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. WHAT SUCCESS MEANS (OUTCOME STATEMENT) */}
      {/* ========================================================================= */}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: `2px solid ${themeColors.primaryNavy}`,
          padding: '28px',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: '800', color: themeColors.primary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
          {t('successStatement.eyebrow')}
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '800', color: themeColors.primaryNavy }}>
          {t('successStatement.title')}
        </h3>
        <p style={{ fontSize: '18px', fontWeight: '700', color: '#16A34A', lineHeight: '1.4', margin: '0 0 20px 0' }}>
          "{t('successStatement.statement')}"
        </p>

        <div style={{ borderTop: `1px solid ${themeColors.border}`, paddingTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: themeColors.textMuted, marginBottom: '10px' }}>
            {t('successStatement.categoriesTitle')}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              t('successStatement.cat1'),
              t('successStatement.cat2'),
              t('successStatement.cat3'),
              t('successStatement.cat4'),
              t('successStatement.cat5'),
            ].map((cat, i) => (
              <span
                key={i}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#F1F5F9',
                  color: '#1E293B',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: `1px solid ${themeColors.border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={12} color="#16A34A" />
                <span>{cat}</span>
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
