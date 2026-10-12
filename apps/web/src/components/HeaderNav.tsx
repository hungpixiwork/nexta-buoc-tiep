import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { Globe, ArrowRight, Smartphone, Settings, ShieldAlert, Shield } from 'lucide-react';
import { CaseRecord, NgoCapacityStatus } from '../types';
import { useTranslation, Locale } from '../i18n';

export type TabType = 'public' | 'demo' | 'mobile' | 'cases' | 'safeguarding' | 'signals' | 'reviews' | 'referrals' | 'resources' | 'surveys' | 'volunteers' | 'impact' | 'data';

interface HeaderNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  loading: boolean;
  errorMsg: string | null;
  casesList: CaseRecord[];
  signalsList: any[];
  reviewsList: any[];
  loadData: () => void;
  isSlaOverdue: (createdAt: string, status: string) => boolean;
  ngoCapacity?: NgoCapacityStatus;
  onChangeNgoCapacity?: (status: NgoCapacityStatus) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  loading: _loading,
  errorMsg,
  casesList,
  signalsList: _signalsList,
  reviewsList: _reviewsList,
  loadData: _loadData,
  isSlaOverdue: _isSlaOverdue,
  ngoCapacity = 'AVAILABLE',
  onChangeNgoCapacity
}) => {
  const { t, locale, setLocale } = useTranslation();
  const [navMode, setNavMode] = useState<'public' | 'admin'>(() => {
    return ['cases', 'safeguarding', 'signals', 'reviews', 'referrals', 'volunteers', 'impact', 'surveys', 'data'].includes(activeTab)
      ? 'admin'
      : 'public';
  });

  const minorsCount = casesList.filter(c => c.isMinor).length;

  const handleSwitchNavMode = (mode: 'public' | 'admin') => {
    setNavMode(mode);
    if (mode === 'public') {
      if (!['public', 'demo', 'mobile', 'resources'].includes(activeTab)) {
        setActiveTab('public');
      }
    } else {
      if (['public'].includes(activeTab)) {
        setActiveTab('cases');
      }
    }
  };

  return (
    <>
      {/* Global Header Bar */}
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: `1px solid ${themeColors.border}`, padding: '12px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Left: Brand & Purpose */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: themeColors.primaryNavy,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '18px',
                flexShrink: 0,
              }}
            >
              BT
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: themeColors.primaryNavy, lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                {t('header.title')}
              </div>
              <div style={{ fontSize: '12px', color: themeColors.textBody, marginTop: '2px', whiteSpace: 'nowrap' }}>
                {t('header.subtitle')}
              </div>
            </div>
          </div>

          {/* Right: Controls & Language */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Mode Switcher Pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px', border: `1px solid ${themeColors.border}`, height: '34px', boxSizing: 'border-box' }}>
              <button
                onClick={() => handleSwitchNavMode('public')}
                style={{
                  height: '28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer',
                  backgroundColor: navMode === 'public' ? '#FFFFFF' : 'transparent',
                  color: navMode === 'public' ? themeColors.primaryNavy : themeColors.textBody,
                  boxShadow: navMode === 'public' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {t('header.publicPortal')}
              </button>
              <button
                onClick={() => handleSwitchNavMode('admin')}
                style={{
                  height: '28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer',
                  backgroundColor: navMode === 'admin' ? '#FFFFFF' : 'transparent',
                  color: navMode === 'admin' ? themeColors.primaryNavy : themeColors.textBody,
                  boxShadow: navMode === 'admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Settings size={13} style={{ flexShrink: 0 }} />
                <span>{t('header.adminConsole')}</span>
              </button>
            </div>

            {/* Language Switcher */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#F8FAFC', padding: '0 8px', height: '34px', borderRadius: '8px', border: `1px solid ${themeColors.border}`, boxSizing: 'border-box' }}>
              <Globe size={14} color={themeColors.primaryNavy} style={{ flexShrink: 0 }} />
              <select
                aria-label="Language Selector"
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                style={{
                  padding: '2px 4px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: themeColors.primaryNavy,
                  outline: 'none',
                }}
              >
                <option value="en">EN</option>
                <option value="vi">VI</option>
                <option value="en-XA">en-XA</option>
              </select>
            </div>

            {/* View Demo CTA */}
            <button
              onClick={() => {
                setActiveTab('demo');
                setNavMode('public');
              }}
              style={{
                height: '34px',
                backgroundColor: activeTab === 'demo' ? '#1D4ED8' : themeColors.primary,
                color: '#FFFFFF',
                border: 'none',
                padding: '0 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
            >
              <span>{t('header.tryDemoBtn')}</span>
              <ArrowRight size={13} style={{ flexShrink: 0 }} />
            </button>

            {/* Subtle Pilot Status */}
            <span
              style={{
                height: '34px',
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '11px',
                fontWeight: '700',
                padding: '0 10px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
            >
              {t('header.pilotBadge')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container & Navigation Tabs */}
      <div style={{ maxWidth: '1200px', margin: '20px auto 0 auto', padding: '0 24px' }}>
        {/* Error notification if any */}
        {errorMsg && (
          <div style={{ backgroundColor: themeColors.dangerBg, border: `1px solid ${themeColors.dangerBorder}`, padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', color: themeColors.danger }}>
            {errorMsg}
          </div>
        )}

        {/* Public Navigation Tabs */}
        {navMode === 'public' && (
          <nav aria-label="Public Navigation" style={{ display: 'flex', gap: '6px', borderBottom: `2px solid ${themeColors.border}`, marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('public')}
              style={{
                padding: '10px 16px',
                fontWeight: '800',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'public' ? `3px solid ${themeColors.primary}` : 'none',
                color: activeTab === 'public' ? themeColors.primary : themeColors.textBody,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {t('tabs.impact')}
            </button>

            <button
              onClick={() => setActiveTab('demo')}
              style={{
                padding: '10px 16px',
                fontWeight: '800',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'demo' ? `3px solid ${themeColors.accentBlue}` : 'none',
                color: activeTab === 'demo' ? themeColors.accentBlue : themeColors.textBody,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {t('tabs.demo')}
            </button>

            <button
              onClick={() => setActiveTab('mobile')}
              style={{
                padding: '10px 16px',
                fontWeight: '800',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'mobile' ? `3px solid #8B5CF6` : 'none',
                color: activeTab === 'mobile' ? '#7C3AED' : themeColors.textBody,
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Smartphone size={15} />
              {t('tabs.mobile')}
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              style={{
                padding: '10px 16px',
                fontWeight: '700',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'resources' ? `3px solid ${themeColors.primary}` : 'none',
                color: activeTab === 'resources' ? themeColors.primary : themeColors.textBody,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {t('tabs.resources')}
            </button>
          </nav>
        )}

        {/* Admin Navigation Tabs */}
        {navMode === 'admin' && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '800', color: themeColors.primaryNavy, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={14} color="#2563EB" style={{ flexShrink: 0 }} />
                <span>{t('tabs.adminSection')}</span>
              </span>
              {/* NGO Capacity Quick Switcher in Admin */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F8FAFC', padding: '2px 8px', borderRadius: '6px', border: `1px solid ${themeColors.border}` }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: themeColors.primaryNavy }}>{t('header.ngoCapacityLabel')}</span>
                <select
                  aria-label="NGO Capacity Status"
                  value={ngoCapacity}
                  onChange={(e) => onChangeNgoCapacity?.(e.target.value as NgoCapacityStatus)}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: ngoCapacity === 'AVAILABLE' ? '#10B981' : ngoCapacity === 'LIMITED' ? '#F59E0B' : '#EF4444',
                    color: '#FFFFFF',
                  }}
                >
                  <option value="AVAILABLE">{t('capacity.available')}</option>
                  <option value="LIMITED">{t('capacity.limited')}</option>
                  <option value="FULL_PAUSED">{t('capacity.fullPaused')}</option>
                </select>
              </div>
            </div>

            <nav
              aria-label="Admin Navigation"
              style={{
                display: 'flex',
                gap: '2px',
                borderBottom: `2px solid ${themeColors.border}`,
                flexWrap: 'nowrap',
                overflowX: 'auto',
                scrollbarWidth: 'thin',
                paddingBottom: '2px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('cases')}
                style={{ padding: '7px 10px', fontWeight: '700', border: 'none', background: 'none', borderBottom: activeTab === 'cases' ? `3px solid ${themeColors.primary}` : 'none', color: activeTab === 'cases' ? themeColors.primary : themeColors.textBody, cursor: 'pointer', fontSize: '12.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {t('tabs.cases')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('safeguarding')}
                style={{ padding: '7px 10px', fontWeight: '700', border: 'none', background: 'none', borderBottom: activeTab === 'safeguarding' ? `3px solid ${themeColors.danger}` : 'none', color: activeTab === 'safeguarding' ? themeColors.danger : themeColors.textBody, cursor: 'pointer', fontSize: '12.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {t('tabs.safeguarding')} ({minorsCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signals')}
                style={{ padding: '7px 10px', fontWeight: '700', border: 'none', background: 'none', borderBottom: activeTab === 'signals' ? `3px solid ${themeColors.primary}` : 'none', color: activeTab === 'signals' ? themeColors.primary : themeColors.textBody, cursor: 'pointer', fontSize: '12.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {t('tabs.signals')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                style={{ padding: '7px 10px', fontWeight: '700', border: 'none', background: 'none', borderBottom: activeTab === 'reviews' ? `3px solid ${themeColors.primary}` : 'none', color: activeTab === 'reviews' ? themeColors.primary : themeColors.textBody, cursor: 'pointer', fontSize: '12.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {t('tabs.reviews')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('referrals')}
                style={{ padding: '7px 10px', fontWeight: '700', border: 'none', background: 'none', borderBottom: activeTab === 'referrals' ? `3px solid ${themeColors.primary}` : 'none', color: activeTab === 'referrals' ? themeColors.primary : themeColors.textBody, cursor: 'pointer', fontSize: '12.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {t('tabs.referrals')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('resources')}
                style={{ padding: '7px 10px', fontWeight: '700', border: 'none', background: 'none', borderBottom: activeTab === 'resources' ? `3px solid ${themeColors.primary}` : 'none', color: activeTab === 'resources' ? themeColors.primary : themeColors.textBody, cursor: 'pointer', fontSize: '12.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {t('tabs.resources')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('volunteers')}
                style={{ padding: '7px 10px', fontWeight: '700', border: 'none', background: 'none', borderBottom: activeTab === 'volunteers' ? `3px solid ${themeColors.primary}` : 'none', color: activeTab === 'volunteers' ? themeColors.primary : themeColors.textBody, cursor: 'pointer', fontSize: '12.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {t('tabs.volunteers')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('surveys')}
                style={{ padding: '7px 10px', fontWeight: '700', border: 'none', background: 'none', borderBottom: activeTab === 'surveys' ? `3px solid ${themeColors.primary}` : 'none', color: activeTab === 'surveys' ? themeColors.primary : themeColors.textBody, cursor: 'pointer', fontSize: '12.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {t('tabs.surveys')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('impact')}
                style={{ padding: '7px 10px', fontWeight: '700', border: 'none', background: 'none', borderBottom: activeTab === 'impact' ? `3px solid ${themeColors.primary}` : 'none', color: activeTab === 'impact' ? themeColors.primary : themeColors.textBody, cursor: 'pointer', fontSize: '12.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {t('tabs.pilotOps')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('data')}
                style={{ padding: '7px 10px', fontWeight: '700', border: 'none', background: 'none', borderBottom: activeTab === 'data' ? `3px solid #0284C7` : 'none', color: activeTab === 'data' ? '#0284C7' : themeColors.textBody, cursor: 'pointer', fontSize: '12.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {t('tabs.data')}
              </button>
            </nav>
          </div>
        )}
      </div>
    </>
  );
};
