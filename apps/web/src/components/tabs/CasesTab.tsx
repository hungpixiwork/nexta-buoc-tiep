import React, { useState, useEffect, useRef } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import {
  Search,
  MapPin,
  QrCode,
  Camera,
  ShieldAlert,
  Globe,
  Plus,
  Filter,
  MoreHorizontal,
  Clock,
  User,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Share2,
  CheckCircle2,
  Users,
  Eye,
  Layers,
  Map,
  List,
  Building2,
  HeartHandshake
} from 'lucide-react';
import { CaseRecord, ResourceRecord } from '../../types';
import { InteractiveMapView } from '../InteractiveMapView';
import { handleExportDocx } from '../../utils/docxExport';
import { CaseOrchestrationDrawer } from '../drawers/CaseOrchestrationDrawer';
import { FollowUpModal } from '../modals/FollowUpModal';
import { SupportGatewayPicker } from '../modals/SupportGatewayPicker';
import { useTranslation } from '../../i18n';

interface CasesTabProps {
  casesList: CaseRecord[];
  filteredCases: CaseRecord[];
  resourcesList: ResourceRecord[];
  loading: boolean;
  caseViewMode: 'list' | 'map';
  setCaseViewMode: (mode: 'list' | 'map') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterNeedCategory: string;
  setFilterNeedCategory: (c: string) => void;
  filterIntakeMode: string;
  setFilterIntakeMode: (m: string) => void;
  filterPriority: string;
  setFilterPriority: (p: string) => void;
  setSelectedCase: (c: CaseRecord | null) => void;
  setShowBatchQrModal: (show: boolean) => void;
  setShowVoiceModal: (show: boolean) => void;
  isStale: (createdAt: string) => boolean;
  onOpenForm07Modal?: (c: CaseRecord) => void;
  onCreateNewCase?: (caseData: any) => Promise<void>;
  onUpdatePriority?: (caseId: string, priority: string) => Promise<void>;
}

export const CasesTab: React.FC<CasesTabProps> = ({
  casesList,
  filteredCases,
  resourcesList,
  loading,
  caseViewMode,
  setCaseViewMode,
  searchQuery,
  setSearchQuery,
  filterNeedCategory,
  setFilterNeedCategory,
  filterIntakeMode: _filterIntakeMode,
  setFilterIntakeMode: _setFilterIntakeMode,
  filterPriority,
  setFilterPriority,
  setSelectedCase,
  setShowBatchQrModal,
  setShowVoiceModal,
  isStale: _isStale,
  onOpenForm07Modal,
  onCreateNewCase
}) => {
  const { t } = useTranslation();

  // Workflow Filter state (Quick Pills)
  const [workflowFilter, setWorkflowFilter] = useState<'all' | 'needs_action' | 'urgent' | 'safeguarding' | 'followup_due' | 'closed'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);

  // Orchestration & Follow-up Drawer/Modal states
  const [showOrchestrationDrawer, setShowOrchestrationDrawer] = useState(false);
  const [orchestrationCase, setOrchestrationCase] = useState<CaseRecord | null>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpCase, setFollowUpCase] = useState<CaseRecord | null>(null);
  const [showGatewayPicker, setShowGatewayPicker] = useState(false);
  
  // Context Action Menu state
  const [activeMenuCase, setActiveMenuCase] = useState<CaseRecord | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  
  // More Actions Dropdown state
  const [showMoreActionsMenu, setShowMoreActionsMenu] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement | null>(null);

  // Close menus on click outside or scroll
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (activeMenuCase && !target.closest('.case-context-menu-popover') && !target.closest('.case-more-btn')) {
        setActiveMenuCase(null);
        setMenuPosition(null);
      }
      if (showMoreActionsMenu && moreActionsRef.current && !moreActionsRef.current.contains(target)) {
        setShowMoreActionsMenu(false);
      }
    };

    const handleScroll = () => {
      if (activeMenuCase) {
        setActiveMenuCase(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeMenuCase, showMoreActionsMenu]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // New Case Form state
  const [newCaseForm, setNewCaseForm] = useState({
    personType: 'ADULT',
    fullName: '',
    aliasName: '',
    birthYear: 1980,
    currentArea: 'Hóc Môn, TP.HCM',
    priority: 'high',
    needs: ['food', 'shelter_job'] as string[],
    note: '',
    consentAgreed: true
  });

  // Apply workflow filtering
  const processedCases = filteredCases.filter(c => {
    if (workflowFilter === 'needs_action') return c.status === 'open' || c.priority === 'urgent' || c.priority === 'high';
    if (workflowFilter === 'urgent') return c.priority === 'urgent';
    if (workflowFilter === 'safeguarding') return Boolean(c.isMinor);
    if (workflowFilter === 'followup_due') return Boolean(c.nextFollowUpAt);
    if (workflowFilter === 'closed') return c.status === 'closed';
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(processedCases.length / pageSize));
  const paginatedCases = processedCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateNewCase) {
      await onCreateNewCase({
        ...newCaseForm,
        isMinor: newCaseForm.personType === 'CHILD',
        id: `case-${Date.now()}`
      });
      setShowNewCaseModal(false);
    } else {
      setShowNewCaseModal(false);
    }
  };

  const handleOpenContextMenu = (e: React.MouseEvent<HTMLButtonElement>, c: CaseRecord) => {
    e.stopPropagation();
    if (activeMenuCase?.id === c.id) {
      setActiveMenuCase(null);
      setMenuPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const isMinor = Boolean(c.isMinor);
    const estimatedHeight = isMinor ? 210 : 250;
    const wouldOverflow = rect.bottom + estimatedHeight > window.innerHeight;

    setMenuPosition({
      top: wouldOverflow ? Math.max(10, rect.top - estimatedHeight) : rect.bottom + 4,
      left: Math.max(10, rect.right - 200)
    });
    setActiveMenuCase(c);
  };

  return (
    <div className="card-flat" style={{ padding: '20px 24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
      
      {/* ============================================================ */}
      {/* 1. TOP TOOLBAR: SEARCH, ADVANCED FILTER & ESSENTIAL ACTIONS  */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
        
        {/* Row 1: Primary Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Left: Search input & Filter toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px', maxWidth: '540px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: themeColors.textMuted }} />
              <input
                type="text"
                placeholder={t('cases.searchPlaceholder')}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  height: '38px',
                  boxSizing: 'border-box',
                  padding: '0 14px 0 36px',
                  borderRadius: '8px',
                  border: `1px solid ${themeColors.borderDark}`,
                  fontSize: '13.5px',
                  backgroundColor: '#FFFFFF',
                  color: themeColors.primaryNavy,
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                height: '38px',
                padding: '0 12px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '700',
                backgroundColor: showAdvancedFilters ? '#EFF6FF' : '#FFFFFF',
                borderColor: showAdvancedFilters ? '#2563EB' : themeColors.borderDark,
                color: showAdvancedFilters ? '#1E40AF' : themeColors.primaryNavy,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                cursor: 'pointer'
              }}
            >
              <Filter size={14} />
              <span>{t('cases.advancedFilter')}{filterNeedCategory !== 'all' || filterPriority !== 'all' ? ' •' : ''}</span>
            </button>
          </div>

          {/* Right: View Toggle, Primary Create & Secondary Actions Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
            
            {/* View Mode Switcher: List vs Map */}
            <div style={{ display: 'inline-flex', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '8px', border: `1px solid ${themeColors.border}`, height: '38px', boxSizing: 'border-box', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setCaseViewMode('list')}
                title="Xem dạng Bảng"
                style={{
                  height: '32px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  backgroundColor: caseViewMode === 'list' ? '#FFFFFF' : 'transparent',
                  color: caseViewMode === 'list' ? themeColors.primaryNavy : themeColors.textBody,
                  boxShadow: caseViewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <List size={14} />
                <span>{t('cases.viewList')}</span>
              </button>
              <button
                type="button"
                onClick={() => setCaseViewMode('map')}
                title="Xem dạng Bản đồ tương tác"
                style={{
                  height: '32px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  backgroundColor: caseViewMode === 'map' ? '#FFFFFF' : 'transparent',
                  color: caseViewMode === 'map' ? themeColors.primaryNavy : themeColors.textBody,
                  boxShadow: caseViewMode === 'map' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Map size={14} />
                <span>{t('cases.viewMap')}</span>
              </button>
            </div>

            {/* Primary Action Button: + Tiếp nhận ca */}
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowNewCaseModal(true)}
              style={{
                height: '38px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 16px',
                fontWeight: '800',
                backgroundColor: '#16375D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Plus size={16} />
              <span>{t('cases.newCaseBtn')}</span>
            </button>

            {/* Secondary Actions Menu */}
            <div ref={moreActionsRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                className="btn-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreActionsMenu(!showMoreActionsMenu);
                }}
                style={{
                  height: '38px',
                  padding: '0 10px',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  borderColor: showMoreActionsMenu ? themeColors.primaryNavy : themeColors.borderDark
                }}
                title="Công cụ mở rộng"
              >
                <Layers size={14} />
                <span>Mở rộng</span>
              </button>

              {showMoreActionsMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '210px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    border: `1px solid ${themeColors.borderDark}`,
                    zIndex: 200,
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowBatchQrModal(true);
                      setShowMoreActionsMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: themeColors.primaryNavy,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <QrCode size={15} color="#2563EB" />
                    <span>{t('cases.qrModalBtn')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowVoiceModal(true);
                      setShowMoreActionsMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: themeColors.primaryNavy,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Camera size={15} color="#059669" />
                    <span>{t('cases.voiceModalBtn')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowGatewayPicker(true);
                      setShowMoreActionsMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: themeColors.primaryNavy,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Building2 size={15} color="#0B4F9C" />
                    <span>{t('cases.lookupGateways')}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Row 2: Workflow Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', borderBottom: `1px solid ${themeColors.border}`, paddingBottom: '12px' }}>
          {[
            { key: 'all', label: t('cases.filterAll'), count: casesList.length },
            { key: 'needs_action', label: t('cases.filterNeedsAction'), count: casesList.filter(c => c.status === 'open' || c.priority === 'urgent' || c.priority === 'high').length },
            { key: 'urgent', label: t('cases.filterUrgent'), count: casesList.filter(c => c.priority === 'urgent').length, color: '#DC2626' },
            { key: 'safeguarding', label: t('cases.filterMinor'), count: casesList.filter(c => c.isMinor).length, color: '#DC2626' },
            { key: 'followup_due', label: t('cases.filterFollowUp'), count: casesList.filter(c => Boolean(c.nextFollowUpAt)).length },
            { key: 'closed', label: t('cases.filterDone'), count: casesList.filter(c => c.status === 'closed').length, color: '#15803D' }
          ].map(pill => {
            const isSelected = workflowFilter === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => {
                  setWorkflowFilter(pill.key as any);
                  setCurrentPage(1);
                }}
                style={{
                  height: '30px',
                  padding: '0 10px',
                  borderRadius: '16px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #2563EB' : `1px solid ${themeColors.border}`,
                  backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                  color: isSelected ? '#1E40AF' : pill.color || themeColors.textBody,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <span>{pill.label}</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  backgroundColor: isSelected ? '#2563EB' : '#E2E8F0',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  lineHeight: '1.2'
                }}>
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 3 (Optional): Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: `1px solid ${themeColors.border}` }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, display: 'block', marginBottom: '4px' }}>{t('cases.table.need')}</label>
              <select
                value={filterNeedCategory}
                onChange={e => {
                  setFilterNeedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', backgroundColor: '#FFFFFF' }}
              >
                <option value="all">{t('cases.filterAll')}</option>
                <option value="food">🍱 Cơm / Nước (Nhu yếu phẩm)</option>
                <option value="medical">🚑 Y tế / Thuốc (Khẩn cấp)</option>
                <option value="shelter_job">🏠💼 Trọ / Sinh kế</option>
                <option value="sos111">🚨 SOS 111 (Bảo vệ trẻ em)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, display: 'block', marginBottom: '4px' }}>{t('cases.table.priority')}</label>
              <select
                value={filterPriority}
                onChange={e => {
                  setFilterPriority(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', backgroundColor: '#FFFFFF' }}
              >
                <option value="all">{t('cases.filterAll')}</option>
                <option value="urgent">{t('cases.priorityUrgent')}</option>
                <option value="high">{t('cases.priorityHigh')}</option>
                <option value="medium">{t('cases.priorityMedium')}</option>
                <option value="low">{t('cases.priorityLow')}</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setFilterNeedCategory('all');
                  setFilterPriority('all');
                  setSearchQuery('');
                  setWorkflowFilter('all');
                  setCurrentPage(1);
                }}
                style={{ padding: '8px 14px', fontSize: '13px', width: '100%', fontWeight: '700' }}
              >
                {t('cases.resetFilter')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. CASE VIEW: MAP VS HIGH-DENSITY PRODUCTION TABLE           */}
      {/* ============================================================ */}
      {caseViewMode === 'map' ? (
        <InteractiveMapView
          mode="cases"
          casesList={processedCases}
          resourcesList={resourcesList}
          onSelectCase={(c) => setSelectedCase(c)}
          onOpenVoiceModal={() => setShowVoiceModal(true)}
        />
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: themeColors.textMuted, fontSize: '14px' }}>
              {t('cases.loading')}
            </div>
          ) : paginatedCases.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px', border: `1px dashed ${themeColors.borderDark}` }}>
              <AlertCircle size={36} color="#94A3B8" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontWeight: '800', fontSize: '15px', color: themeColors.primaryNavy }}>{t('cases.emptyTitle')}</div>
              <p style={{ margin: '4px 0 16px 0', fontSize: '13px', color: themeColors.textMuted }}>
                {t('cases.emptyDesc')}
              </p>
              <button
                type="button"
                className="btn-navy"
                onClick={() => setShowNewCaseModal(true)}
                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700' }}
              >
                + {t('cases.newCaseBtn')}
              </button>
            </div>
          ) : (
          <table style={{ width: '100%', minWidth: '1020px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${themeColors.border}`, backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '12px 12px', color: themeColors.primaryNavy, width: '235px', fontWeight: '700', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                  {t('cases.table.alias')} / {t('cases.table.code')}
                </th>
                <th style={{ padding: '12px 12px', color: themeColors.primaryNavy, width: '115px', fontWeight: '700', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                  {t('cases.table.need')}
                </th>
                <th style={{ padding: '12px 12px', color: themeColors.primaryNavy, width: '215px', fontWeight: '700', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                  {t('cases.table.area')}
                </th>
                <th style={{ padding: '12px 12px', color: themeColors.primaryNavy, width: '145px', fontWeight: '700', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                  {t('cases.table.safeStep')}
                </th>
                <th style={{ padding: '12px 12px', color: themeColors.primaryNavy, width: '90px', fontWeight: '700', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                  {t('cases.table.priority')}
                </th>
                <th style={{ padding: '12px 12px', color: themeColors.primaryNavy, width: '105px', fontWeight: '700', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                  {t('cases.table.assignee')}
                </th>
                <th style={{ padding: '12px 12px', color: themeColors.primaryNavy, width: '80px', fontWeight: '700', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                  {t('cases.table.nextFollowUp')}
                </th>
                <th style={{ padding: '12px 8px', color: themeColors.primaryNavy, width: '40px', textAlign: 'center', fontWeight: '700', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                  ⋯
                </th>
              </tr>
            </thead>
              <tbody>
                {paginatedCases.map(c => {
                  const isMinorBool = Boolean(c.isMinor);
                  const cats = c.needCategories || ['food', 'medical', 'shelter_job'];
                  const isMenuOpen = activeMenuCase?.id === c.id;
                  const displayArea = (c.currentArea || '').replace(/\(GPS Blurred\)/gi, '').trim();

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      style={{
                        borderBottom: `1px solid ${themeColors.border}`,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        height: '62px',
                        backgroundColor: isMenuOpen ? '#F1F5F9' : '#FFFFFF'
                      }}
                      onMouseEnter={e => {
                        if (!isMenuOpen) e.currentTarget.style.backgroundColor = '#F8FAFC';
                      }}
                      onMouseLeave={e => {
                        if (!isMenuOpen) e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      {/* 1. Person / Case Cell */}
                      <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '17px',
                            backgroundColor: isMinorBool ? '#FEE2E2' : '#EFF6FF',
                            color: isMinorBool ? '#DC2626' : '#1E40AF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '13px',
                            flexShrink: 0,
                            border: `1px solid ${isMinorBool ? '#FECACA' : '#BFDBFE'}`
                          }}>
                            {isMinorBool ? 'C' : (c.fullName?.charAt(0) || 'N')}
                          </div>
                          <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: '700', color: themeColors.primaryNavy, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {isMinorBool ? c.aliasName : (c.fullName || c.aliasName)}
                              </span>
                              {isMinorBool && (
                                <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '10px', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                  {t('cases.filterMinor')}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: themeColors.textMuted, marginTop: '2px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                              BT-{c.id.substring(0, 12)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Needs Cell (Vertical Stacked Badges) */}
                      <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                          {cats.slice(0, 2).map(cat => {
                            if (cat === 'food') return <span key={cat} style={{ fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#15803D', whiteSpace: 'nowrap' }}>Nhu yếu phẩm</span>;
                            if (cat === 'medical') return <span key={cat} style={{ fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#B91C1C', whiteSpace: 'nowrap' }}>Y tế</span>;
                            if (cat === 'shelter_job') return <span key={cat} style={{ fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#B45309', whiteSpace: 'nowrap' }}>Sinh kế</span>;
                            if (cat === 'sos111') return <span key={cat} style={{ fontSize: '11px', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626', whiteSpace: 'nowrap' }}>Bảo vệ 111</span>;
                            return null;
                          })}
                          {cats.length > 2 && (
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 4px', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#64748B', whiteSpace: 'nowrap' }}>
                              +{cats.length - 2} khác
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Location Cell (Spacious & No Truncation) */}
                      <td style={{ padding: '8px 12px', fontSize: '13px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: themeColors.primaryNavy }} title={c.currentArea}>
                          <MapPin size={13} color="#EF4444" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {displayArea}
                          </span>
                        </div>
                      </td>

                      {/* 4. Current Step Cell */}
                      <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: isMinorBool ? '#FFF5F5' : c.status === 'closed' ? '#DCFCE7' : c.status === 'in_progress' ? '#EFF6FF' : '#F1F5F9',
                            color: isMinorBool ? '#DC2626' : c.status === 'closed' ? '#15803D' : c.status === 'in_progress' ? '#1D4ED8' : '#475569',
                            border: `1px solid ${isMinorBool ? '#FECACA' : c.status === 'closed' ? '#BBF7D0' : c.status === 'in_progress' ? '#BFDBFE' : '#E2E8F0'}`,
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}>
                            {isMinorBool ? 'Bảo vệ trẻ em' : c.status === 'closed' ? 'Tự chủ sinh kế' : c.status === 'in_progress' ? 'Đã chọn Bước Tiếp' : 'Đang xác minh'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Priority Cell */}
                      <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                        {c.priority === 'urgent' && <span className="badge-danger" style={{ fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>{t('cases.priorityUrgent')}</span>}
                        {c.priority === 'high' && <span className="badge-saffron" style={{ fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>{t('cases.priorityHigh')}</span>}
                        {c.priority === 'medium' && <span className="badge-navy" style={{ fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>{t('cases.priorityMedium')}</span>}
                        {c.priority === 'low' && <span className="badge-forest" style={{ fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>{t('cases.priorityLow')}</span>}
                      </td>

                      {/* 6. Owner Cell */}
                      <td style={{ padding: '8px 12px', fontSize: '12.5px', color: themeColors.textBody, verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={13} color="#64748B" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.assignedTo ? (c.assignedTo.startsWith('usr-') ? 'Cán bộ CTXH' : 'TNV Hùng') : 'Chưa phân công'}
                          </span>
                        </div>
                      </td>

                      {/* 7. Updated Cell */}
                      <td style={{ padding: '8px 12px', fontSize: '12px', color: themeColors.textMuted, verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap' }}>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>

                      {/* 8. Context Menu ⋯ Cell */}
                      <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <button
                          type="button"
                          className="case-more-btn"
                          onClick={(e) => handleOpenContextMenu(e, c)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            border: isMenuOpen ? `1px solid ${themeColors.primaryNavy}` : '1px solid transparent',
                            backgroundColor: isMenuOpen ? '#EFF6FF' : 'transparent',
                            color: themeColors.primaryNavy,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Tùy chọn tác vụ cho hồ sơ"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* ============================================================ */}
          {/* 3. PAGINATION BAR                                            */}
          {/* ============================================================ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${themeColors.border}`, fontSize: '13px', color: themeColors.textMuted }}>
            <div>
              Hiển thị <strong>{paginatedCases.length}</strong> / <strong>{processedCases.length}</strong> ca đồng hành
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn-outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={14} /> Trước
              </button>
              <span style={{ fontWeight: '700', color: themeColors.primaryNavy }}>
                Trang {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="btn-outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. CONTEXTUAL ACTION MENU POPOVER (FIXED & CLIPPING-FREE)     */}
      {/* ============================================================ */}
      {activeMenuCase && menuPosition && (
        <div
          className="case-context-menu-popover"
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            width: '205px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: `1px solid ${themeColors.borderDark}`,
            zIndex: 9999,
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            textAlign: 'left'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Open Detail */}
          <button
            type="button"
            onClick={() => {
              setSelectedCase(activeMenuCase);
              setActiveMenuCase(null);
            }}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: 'transparent',
              textAlign: 'left',
              fontSize: '12.5px',
              fontWeight: '600',
              color: themeColors.primaryNavy,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Eye size={14} color="#2563EB" />
            <span>{t('cases.table.actions')}</span>
          </button>

          {/* Adult Actions */}
          {!activeMenuCase.isMinor && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedCase(activeMenuCase);
                  setActiveMenuCase(null);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: themeColors.primaryNavy,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Globe size={14} color="#059669" />
                <span>{t('cases.table.alias')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenForm07Modal) {
                    onOpenForm07Modal(activeMenuCase);
                  } else {
                    setSelectedCase(activeMenuCase);
                  }
                  setActiveMenuCase(null);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: themeColors.primaryNavy,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Share2 size={14} color="#D97706" />
                <span>{t('referralsTab.createReferralBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOrchestrationCase(activeMenuCase);
                  setShowOrchestrationDrawer(true);
                  setActiveMenuCase(null);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#EFF6FF',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#0369A1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
              >
                <Layers size={14} color="#0369A1" />
                <span>{t('caseOrchestration.drawerSubtitle')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFollowUpCase(activeMenuCase);
                  setShowFollowUpModal(true);
                  setActiveMenuCase(null);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#059669',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ECFDF5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <HeartHandshake size={14} color="#059669" />
                <span>{t('followUpModal.title')}</span>
              </button>
            </>
          )}

          {/* Child Safeguarding Actions (NO LIVELIHOOD PASSPORT) */}
          {Boolean(activeMenuCase.isMinor) && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedCase(activeMenuCase);
                  setActiveMenuCase(null);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#DC2626',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ShieldAlert size={14} color="#DC2626" />
                <span>{t('cases.filterMinor')}</span>
              </button>

              {/* Case Orchestration 12-Step Drawer */}
              <button
                type="button"
                onClick={() => {
                  setOrchestrationCase(activeMenuCase);
                  setShowOrchestrationDrawer(true);
                  setActiveMenuCase(null);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#EFF6FF',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#0369A1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
              >
                <Layers size={14} color="#0369A1" />
                <span>{t('caseOrchestration.drawerSubtitle')}</span>
              </button>

              {/* Follow-up Modal */}
              <button
                type="button"
                onClick={() => {
                  setFollowUpCase(activeMenuCase);
                  setShowFollowUpModal(true);
                  setActiveMenuCase(null);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#059669',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ECFDF5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <HeartHandshake size={14} color="#059669" />
                <span>{t('followUpModal.title')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenForm07Modal) {
                    onOpenForm07Modal(activeMenuCase);
                  } else {
                    setSelectedCase(activeMenuCase);
                  }
                  setActiveMenuCase(null);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: themeColors.primaryNavy,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Share2 size={14} color="#D97706" />
                <span>{t('referralsTab.createReferralBtn')}</span>
              </button>
            </>
          )}

          <div style={{ height: '1px', backgroundColor: themeColors.border, margin: '4px 0' }} />

          {/* Export Form 07 Action */}
          <button
            type="button"
            onClick={() => {
              if (onOpenForm07Modal) {
                onOpenForm07Modal(activeMenuCase);
              } else {
                handleExportDocx(activeMenuCase);
              }
              setActiveMenuCase(null);
            }}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: 'transparent',
              textAlign: 'left',
              fontSize: '12.5px',
              fontWeight: '600',
              color: '#0284C7',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F0F9FF'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FileText size={14} color="#0284C7" />
            <span>{t('form07Modal.title')} (.docx)</span>
          </button>

          {/* Handoff */}
          {!activeMenuCase.isMinor && (
            <button
              type="button"
              onClick={() => {
                setSelectedCase(activeMenuCase);
                setActiveMenuCase(null);
              }}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                fontSize: '12.5px',
                fontWeight: '600',
                color: themeColors.primaryNavy,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Users size={14} color="#6366F1" />
              <span>{t('caseOrchestration.actions.reassign')}</span>
            </button>
          )}

        </div>
      )}

      {/* ============================================================ */}
      {/* 5. NEW CASE INTAKE MODAL                                     */}
      {/* ============================================================ */}
      {showNewCaseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22, 55, 93, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '16px', boxSizing: 'border-box' }}>
          <div className="card-flat" style={{ maxWidth: '560px', width: '100%', padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: `2px solid ${themeColors.primaryNavy}`, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '17.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span>{t('cases.newCaseBtn')}</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: themeColors.textMuted }}>
                  Lưu trữ hồ sơ đồng hành & tự động mã hóa danh tính an toàn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCaseModal(false)}
                style={{ border: 'none', background: '#F1F5F9', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer', color: themeColors.textBody, padding: 0, lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCaseSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Person Type Selector */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, display: 'block', marginBottom: '6px' }}>
                    1. Phân loại Đối tượng thụ hưởng:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { key: 'ADULT', label: 'Người lớn', desc: '≥ 18 tuổi' },
                      { key: 'CHILD', label: `${t('cases.filterMinor')} (P0)`, desc: '< 18 tuổi (Khóa việc làm)' },
                      { key: 'OLDER_ADULT', label: 'Người cao tuổi', desc: '≥ 60 tuổi' }
                    ].map(type => (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setNewCaseForm({ ...newCaseForm, personType: type.key })}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          textAlign: 'left',
                          border: newCaseForm.personType === type.key ? '2px solid #2563EB' : `1px solid ${themeColors.border}`,
                          backgroundColor: newCaseForm.personType === type.key ? '#EFF6FF' : '#FFFFFF',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: '800', fontSize: '12px', color: type.key === 'CHILD' ? '#DC2626' : themeColors.primaryNavy }}>{type.label}</div>
                        <div style={{ fontSize: '10px', color: themeColors.textMuted }}>{type.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Alias */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Họ và tên thật</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Thị Lan"
                      value={newCaseForm.fullName}
                      onChange={e => setNewCaseForm({ ...newCaseForm, fullName: e.target.value, aliasName: newCaseForm.aliasName || `ADULT-2026-${Math.floor(1000 + Math.random() * 9000)}` })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>{t('cases.table.alias')}</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: ADULT-2026-8842"
                      value={newCaseForm.aliasName}
                      onChange={e => setNewCaseForm({ ...newCaseForm, aliasName: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Location & Priority */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>{t('cases.table.area')}</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Thị trấn Hóc Môn, TP.HCM"
                      value={newCaseForm.currentArea}
                      onChange={e => setNewCaseForm({ ...newCaseForm, currentArea: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>{t('cases.table.priority')}</label>
                    <select
                      value={newCaseForm.priority}
                      onChange={e => setNewCaseForm({ ...newCaseForm, priority: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', marginTop: '4px', backgroundColor: '#FFFFFF', boxSizing: 'border-box' }}
                    >
                      <option value="urgent">{t('cases.priorityUrgent')}</option>
                      <option value="high">{t('cases.priorityHigh')}</option>
                      <option value="medium">{t('cases.priorityMedium')}</option>
                      <option value="low">{t('cases.priorityLow')}</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Ghi chú tiếp cận ban đầu</label>
                  <textarea
                    rows={2}
                    placeholder="Ghi nhận nguyện vọng ban đầu của người thụ hưởng..."
                    value={newCaseForm.note}
                    onChange={e => setNewCaseForm({ ...newCaseForm, note: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', marginTop: '4px', resize: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Consent Checkbox */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: themeColors.textBody, cursor: 'pointer', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '6px', border: `1px solid ${themeColors.border}` }}>
                  <input
                    type="checkbox"
                    checked={newCaseForm.consentAgreed}
                    onChange={e => setNewCaseForm({ ...newCaseForm, consentAgreed: e.target.checked })}
                    style={{ marginTop: '2px' }}
                    required
                  />
                  <span>
                    <strong>Đồng thuận an sinh:</strong> Người thụ hưởng đã được giải thích rõ mục đích và đồng ý để NEXTA lưu trữ hồ sơ phục vụ kết nối nguồn lực trợ giúp.
                  </span>
                </label>

                {/* Modal Actions */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" className="btn-outline" onClick={() => setShowNewCaseModal(false)}>{t('common.actions.cancel')}</button>
                  <button type="submit" className="btn-navy" style={{ padding: '9px 20px', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {t('common.actions.save')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Orchestration 12-Step Drawer */}
      <CaseOrchestrationDrawer
        show={showOrchestrationDrawer}
        onClose={() => setShowOrchestrationDrawer(false)}
        caseRecord={orchestrationCase}
        onOpenFollowUpModal={(c) => {
          setFollowUpCase(c);
          setShowFollowUpModal(true);
        }}
        onOpenHandoverModal={(c) => {
          setSelectedCase(c);
          setShowOrchestrationDrawer(false);
        }}
      />

      {/* Human Follow-up Modal */}
      <FollowUpModal
        show={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        selectedCase={followUpCase}
      />

      {/* SSOT Support Gateway Picker */}
      <SupportGatewayPicker
        show={showGatewayPicker}
        onClose={() => setShowGatewayPicker(false)}
        onSelect={(_gw) => {
          setShowGatewayPicker(false);
        }}
      />
    </div>
  );
};

