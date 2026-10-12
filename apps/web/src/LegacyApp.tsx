import React, { useState, useEffect } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { MobileAppDemo } from './components/MobileAppDemo';
import { handleExportDocx } from './utils/docxExport';
import {
  CaseRecord, ResourceRecord, ReferralRecord, ImpactSummary,
  VolunteerRecord, AuditTrailRecord, Form07Data, NgoCapacityStatus, DeclineReasonEnum
} from './types';
import {
  DEFAULT_MOCK_CASES, DEFAULT_MOCK_RESOURCES, DEFAULT_MOCK_REFERRALS,
  DEFAULT_MOCK_VOLUNTEERS, DEFAULT_MOCK_AUDIT_TRAIL, DEFAULT_IMPACT_SUMMARY
} from './data/mockData';

// Sub-components
import { HeaderNav, TabType } from './components/HeaderNav';
import { CasesTab } from './components/tabs/CasesTab';
import { SignalsTab } from './components/tabs/SignalsTab';
import { ReviewsTab } from './components/tabs/ReviewsTab';
import { ReferralsTab } from './components/tabs/ReferralsTab';
import { ResourcesTab } from './components/tabs/ResourcesTab';
import { SurveysTab } from './components/tabs/SurveysTab';
import { VolunteersTab } from './components/tabs/VolunteersTab';
import { ImpactTab } from './components/tabs/ImpactTab';
import { SafeguardingTab } from './components/tabs/SafeguardingTab';
import { DataTab } from './components/tabs/DataTab';

// Modals
import { Form07Modal } from './components/modals/Form07Modal';
import { AssignSignalModal, EditReviewModal, AssignDistrictModal, AddVolunteerModal } from './components/modals/VolunteerModals';
import { CaseDetailModal, ReferralModal } from './components/modals/CaseModals';
import { BatchQrModal } from './components/modals/BatchQrModal';
import { VoiceIntakeModal } from './components/modals/VoiceIntakeModal';
import { DeclineReferralModal } from './components/modals/DeclineReferralModal';
import { AnonymousCaseModal } from './components/modals/AnonymousCaseModal';
import { usePartnerInboxRealtime } from './hooks/usePartnerInboxRealtime';

import { PublicImpactDashboard } from './components/public/PublicImpactDashboard';
import { InteractiveDemoPortal } from './components/demo/InteractiveDemoPortal';

// Re-export types for backward compatibility
export type { CaseRecord, ResourceRecord, ReferralRecord, ImpactSummary, VolunteerRecord, AuditTrailRecord, Form07Data, NgoCapacityStatus, DeclineReasonEnum };

// D1 API Config
const API_BASE_URL = (import.meta.env as Record<string, string | undefined>).VITE_API_URL ||
  'https://buoc-tiep-api.ppnh10092002.workers.dev';

export default function App() {
  const [viewMode, setViewMode] = useState<'mobile' | 'admin'>('admin');
  const [activeTab, setActiveTab] = useState<TabType>('public');


  // Main Data States
  const [casesList, setCasesList] = useState<CaseRecord[]>([]);
  const [resourcesList, setResourcesList] = useState<ResourceRecord[]>([]);
  const [referralsList, setReferralsList] = useState<ReferralRecord[]>([]);
  const [impactData, setImpactData] = useState<ImpactSummary | null>(null);
  const [volunteersList, setVolunteersList] = useState<VolunteerRecord[]>([]);
  const [auditTrailList, setAuditTrailList] = useState<AuditTrailRecord[]>([]);

  // NGO Capacity & Safeguarding States
  const [ngoCapacity, setNgoCapacity] = useState<NgoCapacityStatus>('AVAILABLE');
  const [showDeclineModal, setShowDeclineModal] = useState<boolean>(false);
  const [selectedReferralForDecline, setSelectedReferralForDecline] = useState<ReferralRecord | null>(null);
  const [showAnonymousModal, setShowAnonymousModal] = useState<boolean>(false);
  const [selectedCaseForAnonymous, setSelectedCaseForAnonymous] = useState<CaseRecord | null>(null);

  const handleChangeNgoCapacity = (newStatus: NgoCapacityStatus) => {
    setNgoCapacity(newStatus);
    const newAudit: AuditTrailRecord = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: 'Cán bộ Điều phối NGO',
      actorRole: 'admin',
      action: 'UPDATE_NGO_CAPACITY',
      details: `Thay đổi cờ tải nhanh tiếp nhận ca NGO thành: ${newStatus}`,
      ipAddress: '118.69.182.45',
      riskLevel: newStatus === 'FULL_PAUSED' ? 'high' : 'normal'
    };
    setAuditTrailList(prev => [newAudit, ...prev]);
    // Persist audit event to D1 backend
    apiFetch('/api/audit-logs', {
      method: 'POST',
      body: JSON.stringify({
        action: 'UPDATE_NGO_CAPACITY',
        resourceType: 'ORGANIZATION',
        resourceId: 'org-ngo-default',
        ipAddress: '118.69.182.45'
      })
    }).catch(err => console.warn('[Audit Log] Failed to persist NGO capacity change to D1:', err));
  };

  const handleConfirmDeclineReferral = (referralId: string, reason: DeclineReasonEnum, note: string) => {
    setReferralsList(prev => prev.map(r => {
      if (r.id === referralId) {
        return { ...r, status: 'declined', declineReason: reason, declineNote: note };
      }
      return r;
    }));
    const matchedRef = referralsList.find(r => r.id === referralId);
    const matchedCase = casesList.find(c => c.id === matchedRef?.caseId);
    const newAudit: AuditTrailRecord = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: 'Cán bộ NGO Tiếp nhận',
      actorRole: 'admin',
      action: 'DECLINE_REFERRAL',
      targetCaseId: matchedCase?.id,
      targetAlias: matchedCase?.aliasName,
      details: `Từ chối tiếp nhận chuyển tuyến [Lý do Enum: ${reason}]: ${note}`,
      ipAddress: '118.69.182.45',
      riskLevel: 'high'
    };
    setAuditTrailList(prev => [newAudit, ...prev]);
    setShowDeclineModal(false);
    setSelectedReferralForDecline(null);

    // Persist decline action to D1 API
    apiFetch(`/api/partner/referrals/${referralId}/decline`, {
      method: 'POST',
      body: JSON.stringify({
        declineReason: reason,
        notes: note
      })
    }).catch(err => console.warn('[Referral] Failed to persist decline to D1 API:', err));

    apiFetch('/api/audit-logs', {
      method: 'POST',
      body: JSON.stringify({
        action: 'DECLINE_REFERRAL',
        resourceType: 'REFERRAL',
        resourceId: referralId,
        ipAddress: '118.69.182.45'
      })
    }).catch(err => console.warn('[Audit Log] Failed to persist decline audit log to D1:', err));
  };

  const handleLogAuditAction = (action: AuditTrailRecord['action'], caseRecord: CaseRecord, details: string) => {
    const newAudit: AuditTrailRecord = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: 'Giám sát viên Safeguarding',
      actorRole: 'admin',
      action,
      targetCaseId: caseRecord.id,
      targetAlias: caseRecord.aliasName,
      details,
      ipAddress: '118.69.182.45',
      riskLevel: action === 'HOTLINE_111_TRIGGER' ? 'critical' : 'high'
    };
    setAuditTrailList(prev => [newAudit, ...prev]);

    // Persist critical safeguarding audit log to D1 API
    apiFetch('/api/audit-logs', {
      method: 'POST',
      body: JSON.stringify({
        action,
        resourceType: 'CASE',
        resourceId: caseRecord.id,
        ipAddress: '118.69.182.45'
      })
    }).catch(err => console.warn('[Audit Log] Failed to persist safeguarding audit log to D1:', err));
  };

  // Spotter Signals
  const [signalsList, setSignalsList] = useState<any[]>([
    {
      id: 'SIG-8801',
      approximateArea: 'Cổng Bến xe An Sương, Hóc Môn',
      observation: 'Thấy 1 em nhỏ khoảng 14-15t ngồi Co quắp ở ghế đá từ đêm qua, áo rách nhẹ.',
      riskHint: 'Trẻ em / Nguy cơ cao',
      reporterName: 'TNV Nguyễn Văn Hùng',
      createdAt: new Date().toISOString(),
      assignedTo: 'Đội Hóc Môn',
      verificationStatus: 'ASSIGNED'
    },
    {
      id: 'SIG-8802',
      approximateArea: 'Chợ Vĩnh Lộc B, Bình Chánh',
      observation: 'Người già đẩy xe phế liệu ngất xỉu nhẹ bên đường.',
      riskHint: 'Y tế khẩn cấp / Người già',
      reporterName: 'Người dân qua đường',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      assignedTo: null,
      verificationStatus: 'UNVERIFIED'
    }
  ]);

  // AI Human Reviews
  const [reviewsList, setReviewsList] = useState<any[]>([
    {
      id: 'REV-9001',
      caseId: 'case-demo-01',
      aliasName: 'CHILD-2026-8812',
      transcript_clean: 'Tui thấy thằng nhỏ lang thang ngoài bến xe An Sương... nói nhà ở miền Tây trốn lên.',
      confidence_score: 0.58,
      age_claimed: 15,
      urgency_candidate: 'HIGH',
      needs: ['food', 'medical', 'sos111'],
      reasonText: 'Confidence thấp (<60%) & Bảo vệ Trẻ em 111',
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    }
  ]);

  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [showEditReviewModal, setShowEditReviewModal] = useState<boolean>(false);
  const [editReviewForm, setEditReviewForm] = useState({
    aliasName: '',
    age: '' as number | string,
    area: '',
    needs: [] as string[],
    note: ''
  });

  const [showAssignSignalModal, setShowAssignSignalModal] = useState<boolean>(false);
  const [selectedSignalForAssign, setSelectedSignalForAssign] = useState<any | null>(null);
  const [assigneeName, setAssigneeName] = useState<string>('TNV Nguyễn Văn Hùng');

  // Filters & Controls
  const [volunteerStatusFilter, setVolunteerStatusFilter] = useState<string>('all');
  const [volunteerDistrictFilter, setVolunteerDistrictFilter] = useState<string>('all');
  const [volunteerSearchQuery, setVolunteerSearchQuery] = useState<string>('');
  const [auditRiskFilter, setAuditRiskFilter] = useState<string>('all');

  const [selectedVolunteerForDistrict, setSelectedVolunteerForDistrict] = useState<VolunteerRecord | null>(null);
  const [showAddVolunteerModal, setShowAddVolunteerModal] = useState<boolean>(false);
  const [newVolunteerForm, setNewVolunteerForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'volunteer_field' as const,
    assignedDistricts: ['Hóc Môn']
  });

  // Modal & Selection States
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [passportData, setPassportData] = useState<any | null>(null);
  const [loadingPassport, setLoadingPassport] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterNeedCategory, setFilterNeedCategory] = useState<string>('all');
  const [filterIntakeMode, setFilterIntakeMode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [resourceCategoryFilter, setResourceCategoryFilter] = useState<string>('all');
  const [resourceDistrictFilter, setResourceDistrictFilter] = useState<string>('all');
  const [surveyFilter, setSurveyFilter] = useState<string>('all');
  const [showForm07Modal, setShowForm07Modal] = useState<boolean>(false);
  const [form07Data, setForm07Data] = useState<Form07Data | null>(null);
  const [showBatchQrModal, setShowBatchQrModal] = useState<boolean>(false);
  const [dualConfirmedCases, setDualConfirmedCases] = useState<Record<string, boolean>>({});

  const [caseViewMode, setCaseViewMode] = useState<'list' | 'map'>('list');
  const [resourceViewMode, setResourceViewMode] = useState<'list' | 'map'>('list');
  const [printFormat, setPrintFormat] = useState<'card85x54' | 'thermal80mm'>('card85x54');

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Form & Voice AI States
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [intakeTab, setIntakeTab] = useState<'photo_gps' | 'voice_ai'>('photo_gps');
  const [intakePhotoUrl, setIntakePhotoUrl] = useState<string>('https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80');
  const [intakeGps, setIntakeGps] = useState<{ lat: number; lng: number }>({ lat: 10.8833, lng: 106.5944 });
  const [intakeNeedCategories, setIntakeNeedCategories] = useState<('food' | 'medical' | 'shelter_job' | 'sos111')[]>(['food', 'medical']);
  const [intakeNote, setIntakeNote] = useState<string>('Gặp ở bến xe An Sương 2 ngày, chân trầy nhẹ, cần cơm nước & y tế khẩn cấp.');

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [simulationScript, setSimulationScript] = useState<'lan' | 'hoang' | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [voiceForm, setVoiceForm] = useState({
    name: 'Em Hoàng (15t)',
    age: '15',
    vulnerabilityGroup: 'youth',
    location: 'Bến xe An Sương, Hóc Môn',
    needs: ['food', 'medical', 'sos111'],
    summary: 'Cần cơm nước, chỗ ở tạm và y tế khẩn cấp.'
  });

  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [referralForm, setReferralForm] = useState({
    caseId: '',
    resourceId: '',
    notes: 'Đề nghị hỗ trợ chỗ ở và y tế khẩn cấp cho đối tượng yếu thế.'
  });

  const [showHandoffForm, setShowHandoffForm] = useState<boolean>(false);
  const [handoffForm, setHandoffForm] = useState({
    assignedTo: 'TNV Nguyễn Văn Hùng',
    notes: 'Đã bàn giao thông tin thực địa và hỗ trợ ban đầu.',
    nextFollowUpAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [scamChecklist, setScamChecklist] = useState({
    q1: false,
    q2: false,
    q3: false,
    q4: false,
    q5: false
  });
  const [scamRisk, setScamRisk] = useState<'low' | 'medium' | 'high' | 'critical'>('low');

  // Helpers
  const isSlaOverdue = (createdAt: string, status: string) => {
    if (status === 'closed' || status === 'referred') return false;
    const created = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours > 48;
  };

  const isStale = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 15;
  };

  const getRecoveryCode = (c: CaseRecord) => {
    if (c.aliasName && c.aliasName.includes('-')) {
      const parts = c.aliasName.split('-');
      const lastPart = parts[parts.length - 1];
      if (lastPart.length >= 4) {
        return `BT-${lastPart.slice(-4).toUpperCase()}`;
      }
    }
    const cleanId = c.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `BT-${cleanId.slice(-4).padStart(4, '0')}`;
  };

  // Helper fetch API with Auth JWT
  const apiFetch = async (path: string, options: RequestInit = {}) => {
    let token = localStorage.getItem('bt_admin_token');
    if (!token) {
      token = await getDevToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...((options.headers || {}) as Record<string, string>)
    };

    try {
      let response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

      if (response.status === 401) {
        token = await getDevToken();
        headers['Authorization'] = `Bearer ${token}`;
        response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      console.error(`Fetch error at ${path}:`, err);
      throw err;
    }
  };

  const getDevToken = async () => {
    try {
      const loginResp = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'socialworker@buoctiep.vn',
          password: '123456'
        })
      });
      const loginData = await loginResp.json();
      if (loginData.success && loginData.token) {
        localStorage.setItem('bt_admin_token', loginData.token);
        return loginData.token;
      }

      const regResp = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Cán bộ Quản lý BƯỚC TIẾP',
          email: 'socialworker@buoctiep.vn',
          password: '123456',
          role: 'admin'
        })
      });
      const regData = await regResp.json();
      if (regData.success && regData.token) {
        localStorage.setItem('bt_admin_token', regData.token);
        return regData.token;
      }
      throw new Error('Đăng nhập/Đăng ký API thất bại');
    } catch (err) {
      console.error('Không kết nối được Hono API:', err);
      throw err;
    }
  };

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await getDevToken();

      const [casesRes, resourcesRes, referralsRes, impactRes, volunteersRes, auditLogsRes] = await Promise.allSettled([
        apiFetch('/api/cases'),
        apiFetch('/api/resources'),
        apiFetch('/api/resources/referrals'),
        apiFetch('/api/impact/summary'),
        apiFetch('/api/volunteers'),
        apiFetch('/api/audit-logs')
      ]);

      if (casesRes.status === 'fulfilled' && casesRes.value?.success && Array.isArray(casesRes.value.data)) {
        const enriched = casesRes.value.data.map((c: any, index: number) => ({
          ...c,
          intakeMode: c.intakeMode || (index % 2 === 0 ? 'photo_gps' : 'voice_ai'),
          photoUrl: c.photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
          gpsCoords: c.gpsCoords || { lat: 10.8833, lng: 106.5944 },
          needCategories: c.needCategories || ['food', 'medical'],
          note: c.note || c.summary || 'Hồ sơ tiếp cận từ thực địa.'
        }));
        setCasesList(enriched.length > 0 ? enriched : DEFAULT_MOCK_CASES);
      } else {
        setCasesList(DEFAULT_MOCK_CASES);
      }

      if (resourcesRes.status === 'fulfilled' && resourcesRes.value?.success && Array.isArray(resourcesRes.value.data)) {
        setResourcesList(resourcesRes.value.data.length > 0 ? resourcesRes.value.data : DEFAULT_MOCK_RESOURCES);
      } else {
        setResourcesList(DEFAULT_MOCK_RESOURCES);
      }

      if (referralsRes.status === 'fulfilled' && referralsRes.value?.success && Array.isArray(referralsRes.value.data)) {
        setReferralsList(referralsRes.value.data.length > 0 ? referralsRes.value.data : DEFAULT_MOCK_REFERRALS);
      } else {
        setReferralsList(DEFAULT_MOCK_REFERRALS);
      }

      if (impactRes.status === 'fulfilled' && impactRes.value?.success && impactRes.value.data) {
        setImpactData(impactRes.value.data);
      } else {
        setImpactData(DEFAULT_IMPACT_SUMMARY);
      }

      if (volunteersRes.status === 'fulfilled' && volunteersRes.value?.success && Array.isArray(volunteersRes.value.data)) {
        setVolunteersList(volunteersRes.value.data.length > 0 ? volunteersRes.value.data : DEFAULT_MOCK_VOLUNTEERS);
      } else {
        setVolunteersList(DEFAULT_MOCK_VOLUNTEERS);
      }

      if (auditLogsRes.status === 'fulfilled' && auditLogsRes.value?.success && Array.isArray(auditLogsRes.value.data)) {
        setAuditTrailList(auditLogsRes.value.data.length > 0 ? auditLogsRes.value.data : DEFAULT_MOCK_AUDIT_TRAIL);
      } else {
        setAuditTrailList(DEFAULT_MOCK_AUDIT_TRAIL);
      }

    } catch (err: any) {
      console.error('[Web Admin] Lỗi kết nối D1 API:', err);
      setErrorMsg('Đang sử dụng dữ liệu offline mẫu (Offline Fallback).');
      setCasesList(DEFAULT_MOCK_CASES);
      setResourcesList(DEFAULT_MOCK_RESOURCES);
      setReferralsList(DEFAULT_MOCK_REFERRALS);
      setVolunteersList(DEFAULT_MOCK_VOLUNTEERS);
      setAuditTrailList(DEFAULT_MOCK_AUDIT_TRAIL);
      setImpactData(DEFAULT_IMPACT_SUMMARY);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    const syntheticNewCases: CaseRecord[] = [
      {
        id: `case-syn-${Date.now()}-1`,
        organizationId: 'org-default',
        beneficiaryId: `ben-syn-${Date.now()}-1`,
        aliasName: 'ADULT-2026-9101',
        fullName: 'Trần Văn Mạnh',
        birthYear: 1974,
        isMinor: false,
        vulnerabilityGroup: 'street_worker',
        currentArea: 'Xã Bà Điểm, Hóc Môn',
        status: 'open',
        priority: 'high',
        createdAt: new Date().toISOString(),
        needCategories: ['shelter_job', 'food'],
        intakeMode: 'photo_gps',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        gpsCoords: { lat: 10.8492, lng: 106.6021 },
        note: 'Lao động thời vụ mất việc, tạm trú qua đêm tại lán trọ Bà Điểm, cần hỗ trợ kết nối việc làm phổ thông.'
      },
      {
        id: `case-syn-${Date.now()}-2`,
        organizationId: 'org-default',
        beneficiaryId: `ben-syn-${Date.now()}-2`,
        aliasName: 'CHILD-2026-9102',
        fullName: 'Em Hoàng (Trẻ em ẩn danh)',
        birthYear: 2011,
        isMinor: true,
        vulnerabilityGroup: 'youth',
        currentArea: 'Cổng chợ đầu mối Hóc Môn',
        status: 'open',
        priority: 'urgent',
        createdAt: new Date().toISOString(),
        needCategories: ['sos111', 'food', 'medical'],
        intakeMode: 'voice_ai',
        photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
        gpsCoords: { lat: 10.8675, lng: 106.5912 },
        note: 'Bảo vệ trẻ em: Em nhỏ 15t trốn gia đình lên TP tìm việc, nguy cơ bị bóc lột sức lao động. Kích hoạt Hotline 111 & Tổ CTXH.'
      }
    ];

    setCasesList(prev => [...syntheticNewCases, ...prev]);

    const newAudit: AuditTrailRecord = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: 'Super Admin',
      actorRole: 'admin',
      action: 'UPDATE_NGO_CAPACITY',
      details: 'Nạp bộ dữ liệu thử nghiệm Synthetic Pilot Cases vào hệ thống D1',
      ipAddress: '118.69.182.45',
      riskLevel: 'normal'
    };
    setAuditTrailList(prev => [newAudit, ...prev]);
  };

  const handleResetData = async () => {
    localStorage.removeItem('bt_admin_token');
    await loadData();
    const newAudit: AuditTrailRecord = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: 'Super Admin',
      actorRole: 'admin',
      action: 'UPDATE_NGO_CAPACITY',
      details: 'Đặt lại toàn bộ dữ liệu thử nghiệm về dataset chuẩn',
      ipAddress: '118.69.182.45',
      riskLevel: 'high'
    };
    setAuditTrailList(prev => [newAudit, ...prev]);
  };

  const handleArchiveRecord = (type: 'case' | 'referral' | 'volunteer', id: string) => {
    if (type === 'case') {
      setCasesList(prev => prev.map(c => c.id === id ? { ...c, status: 'closed' } : c));
    } else if (type === 'referral') {
      setReferralsList(prev => prev.map(r => r.id === id ? { ...r, status: 'closed' } : r));
    } else if (type === 'volunteer') {
      setVolunteersList(prev => prev.map(v => v.id === id ? { ...v, status: 'suspended' } : v));
    }
    const newAudit: AuditTrailRecord = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: 'Super Admin',
      actorRole: 'admin',
      action: 'UPDATE_NGO_CAPACITY',
      details: `Lưu trữ bản ghi ${type.toUpperCase()} [${id}]`,
      ipAddress: '118.69.182.45',
      riskLevel: 'normal'
    };
    setAuditTrailList(prev => [newAudit, ...prev]);
  };

  const handleAddNewResource = async (newResource: Partial<ResourceRecord>) => {
    try {
      const response = await apiFetch('/api/resources', {
        method: 'POST',
        body: JSON.stringify(newResource)
      });
      if (response && response.success) {
        const created: ResourceRecord = {
          id: response.id || `res-${Date.now()}`,
          name: newResource.name || '',
          category: newResource.category || 'medical',
          district: newResource.district || '',
          ward: newResource.ward,
          city: newResource.city || 'TP. Hồ Chí Minh',
          province: newResource.province || 'TP. Hồ Chí Minh',
          address: newResource.address || '',
          phone: newResource.phone,
          hotline: newResource.hotline,
          email: newResource.email,
          website: newResource.website,
          latitude: newResource.latitude,
          longitude: newResource.longitude,
          operatingHours: newResource.operatingHours,
          is24Hours: newResource.is24Hours,
          is_24_7: newResource.is24Hours,
          verificationStatus: 'VERIFIED',
          isVerified: true,
          acceptsReferral: newResource.acceptsReferral ?? true,
          emergencySupport: newResource.emergencySupport ?? false,
          description: newResource.description,
          createdAt: new Date().toISOString()
        };
        setResourcesList(prev => [created, ...prev]);
        return true;
      }
    } catch (err) {
      console.warn('Lỗi kết nối D1 API khi tạo nguồn lực, lưu cục bộ:', err);
      const fallbackCreated: ResourceRecord = {
        id: `res-${Date.now()}`,
        name: newResource.name || '',
        category: newResource.category || 'medical',
        district: newResource.district || '',
        ward: newResource.ward,
        city: 'TP. Hồ Chí Minh',
        province: 'TP. Hồ Chí Minh',
        address: newResource.address || '',
        phone: newResource.phone,
        hotline: newResource.hotline,
        email: newResource.email,
        website: newResource.website,
        latitude: newResource.latitude,
        longitude: newResource.longitude,
        operatingHours: newResource.operatingHours,
        is24Hours: newResource.is24Hours,
        is_24_7: newResource.is24Hours,
        verificationStatus: 'VERIFIED',
        isVerified: true,
        acceptsReferral: newResource.acceptsReferral ?? true,
        emergencySupport: newResource.emergencySupport ?? false,
        description: newResource.description,
        createdAt: new Date().toISOString()
      };
      setResourcesList(prev => [fallbackCreated, ...prev]);
      return true;
    }
  };

  const handleCreateNewCase = async (newCaseData: any) => {
    try {
      const payload = {
        organizationId: 'org-default',
        aliasName: newCaseData.aliasName,
        fullName: newCaseData.fullName,
        birthYear: newCaseData.birthYear,
        isMinor: Boolean(newCaseData.isMinor),
        vulnerabilityGroup: newCaseData.isMinor ? 'youth' : 'street_worker',
        currentArea: newCaseData.currentArea,
        priority: newCaseData.priority || 'high',
        status: 'open',
        intakeMode: 'photo_gps',
        needCategories: newCaseData.needs || ['food', 'shelter_job'],
        note: newCaseData.note || 'Tiếp nhận ca mới qua Web Admin Workspace.'
      };

      const res = await apiFetch('/api/cases', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res?.success) {
        await loadData();
      } else {
        const localCase: CaseRecord = {
          id: `case-${Date.now()}`,
          organizationId: 'org-default',
          beneficiaryId: `ben-${Date.now()}`,
          aliasName: newCaseData.aliasName,
          fullName: newCaseData.fullName,
          birthYear: newCaseData.birthYear,
          isMinor: Boolean(newCaseData.isMinor),
          vulnerabilityGroup: newCaseData.isMinor ? 'youth' : 'street_worker',
          currentArea: newCaseData.currentArea,
          status: 'open',
          priority: newCaseData.priority || 'high',
          createdAt: new Date().toISOString(),
          needCategories: newCaseData.needs || ['food', 'shelter_job'],
          note: newCaseData.note || 'Tiếp nhận ca mới qua Web Admin Workspace.'
        };
        setCasesList(prev => [localCase, ...prev]);
      }
    } catch (err) {
      console.error('Lỗi khi tạo ca:', err);
      const localCase: CaseRecord = {
        id: `case-${Date.now()}`,
        organizationId: 'org-default',
        beneficiaryId: `ben-${Date.now()}`,
        aliasName: newCaseData.aliasName,
        fullName: newCaseData.fullName,
        birthYear: newCaseData.birthYear,
        isMinor: Boolean(newCaseData.isMinor),
        vulnerabilityGroup: newCaseData.isMinor ? 'youth' : 'street_worker',
        currentArea: newCaseData.currentArea,
        status: 'open',
        priority: newCaseData.priority || 'high',
        createdAt: new Date().toISOString(),
        needCategories: newCaseData.needs || ['food', 'shelter_job'],
        note: newCaseData.note || 'Tiếp nhận ca mới qua Web Admin Workspace.'
      };
      setCasesList(prev => [localCase, ...prev]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Section 25 REALTIME ARCHITECTURE: WebSocket PartnerInboxRoom + fallback polling D1 reconciliation.
  usePartnerInboxRealtime({
    apiBaseUrl: API_BASE_URL,
    organisationId: 'org-unesco-01',
    getAuthToken: () => localStorage.getItem('bt_admin_token'),
    onEvent: (evt) => {
      if (!evt.referralId) return;
      setReferralsList(prev => prev.map(r => (r.id === evt.referralId && evt.toStatus) ? { ...r, status: evt.toStatus as ReferralRecord['status'] } : r));
    },
  });

  // Fetch Livelihood Passport details when selected
  useEffect(() => {
    if (selectedCase) {
      setLoadingPassport(true);
      apiFetch(`/api/passports/${selectedCase.beneficiaryId}`)
        .then(res => {
          if (res.success && res.data) {
            setPassportData(res.data);
          } else {
            setPassportData(null);
          }
        })
        .catch(err => {
          console.error('Lỗi tải Hộ chiếu Sinh kế:', err);
          setPassportData(null);
        })
        .finally(() => {
          setLoadingPassport(false);
        });
    } else {
      setPassportData(null);
    }
  }, [selectedCase]);

  // Voice simulator scripting logic
  const startSimulation = (type: 'lan' | 'hoang') => {
    setSimulationScript(type);
    setIsRecording(true);
    setTranscript('');

    if (type === 'lan') {
      const scriptText = 'Tui bán vé số ở ngã tư Hóc Môn, chân yếu quá mần không nổi nữa, cần chỗ ở tạm với công việc nhẹ...';
      let i = 0;
      const interval = setInterval(() => {
        setTranscript(scriptText.substring(0, i));
        i += 2;
        if (i > scriptText.length) {
          clearInterval(interval);
          setIsRecording(false);
          setVoiceForm({
            name: 'Cô Lan (62t)',
            age: '62',
            vulnerabilityGroup: 'elderly',
            location: 'Ngã tư Thị trấn Hóc Môn',
            needs: ['food', 'shelter_job'],
            summary: 'Cần hỗ trợ bữa ăn dinh dưỡng, chỗ trú ngụ tạm và công việc gia công nhẹ.'
          });
        }
      }, 50);
    } else {
      const scriptText = 'Em lang thang ở bến xe An Sương 2 ngày nay... bị lạc người thân, đói mệt và trầy chân...';
      let i = 0;
      const interval = setInterval(() => {
        setTranscript(scriptText.substring(0, i));
        i += 2;
        if (i > scriptText.length) {
          clearInterval(interval);
          setIsRecording(false);
          setVoiceForm({
            name: 'Em Hoàng (15t)',
            age: '15',
            vulnerabilityGroup: 'youth',
            location: 'Bến xe An Sương, Hóc Môn',
            needs: ['food', 'medical', 'sos111'],
            summary: 'Trẻ em lang thang bến xe An Sương, đói mệt, cần sơ cứu y tế và báo hotline 111 khẩn cấp.'
          });
        }
      }, 50);
    }
  };

  // Intake Toggle category
  const toggleNeedCategory = (category: 'food' | 'medical' | 'shelter_job' | 'sos111') => {
    if (intakeNeedCategories.includes(category)) {
      if (intakeNeedCategories.length > 1) {
        setIntakeNeedCategories(intakeNeedCategories.filter(c => c !== category));
      }
    } else {
      setIntakeNeedCategories([...intakeNeedCategories, category]);
    }
  };

  // Handlers
  const handleSaveIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    const isMinorBool = Number(voiceForm.age) < 18 || intakeNeedCategories.includes('sos111');
    const aliasGenerated = isMinorBool
      ? `CHILD-2026-${Math.floor(1000 + Math.random() * 9000)}`
      : `${voiceForm.name.split(' ').pop()?.toUpperCase() || 'CASE'}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCasePayload = {
      aliasName: aliasGenerated,
      fullName: isMinorBool ? 'Trẻ em ẩn danh (Bảo vệ 111)' : voiceForm.name,
      birthYear: new Date().getFullYear() - Number(voiceForm.age),
      isMinor: isMinorBool,
      currentArea: voiceForm.location || 'Hóc Môn',
      vulnerabilityGroup: voiceForm.vulnerabilityGroup,
      intakeMode: intakeTab,
      photoUrl: intakePhotoUrl,
      audioUrl: intakeTab === 'voice_ai' ? 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' : undefined,
      voiceTranscript: intakeTab === 'voice_ai' ? transcript : undefined,
      gpsCoords: intakeGps,
      needCategories: intakeNeedCategories,
      priority: (isMinorBool ? 'urgent' : (intakeNeedCategories.includes('medical') ? 'high' : 'medium')) as CaseRecord['priority'],
      note: intakeTab === 'photo_gps' ? intakeNote : voiceForm.summary
    };

    try {
      const res = await apiFetch('/api/cases', {
        method: 'POST',
        body: JSON.stringify(newCasePayload)
      });

      if (res.success && res.data) {
        setCasesList(prev => [res.data, ...prev]);
      } else {
        const fallbackCase: CaseRecord = {
          id: `case-d1-${Date.now()}`,
          organizationId: 'org-unesco-01',
          beneficiaryId: `ben-${Date.now()}`,
          ...newCasePayload,
          status: 'open',
          createdAt: new Date().toISOString(),
          assignedTo: 'TNV Nguyễn Văn Hùng'
        } as CaseRecord;
        setCasesList(prev => [fallbackCase, ...prev]);
      }

      setShowVoiceModal(false);
      alert(`Đã lưu thành công ca cứu trợ khẩn cấp vào D1 SQL Database!\nMã Alias: ${aliasGenerated}`);
    } catch (err) {
      console.error('Lỗi tạo ca D1:', err);
      const fallbackCase: CaseRecord = {
        id: `case-d1-${Date.now()}`,
        organizationId: 'org-unesco-01',
        beneficiaryId: `ben-${Date.now()}`,
        ...newCasePayload,
        status: 'open',
        createdAt: new Date().toISOString(),
        assignedTo: 'TNV Nguyễn Văn Hùng'
      } as CaseRecord;
      setCasesList(prev => [fallbackCase, ...prev]);
      setShowVoiceModal(false);
      alert(`Đã lưu ca offline vào danh sách!\nMã Alias: ${aliasGenerated}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await apiFetch('/api/resources/referrals', {
        method: 'POST',
        body: JSON.stringify({
          caseId: referralForm.caseId,
          resourceId: referralForm.resourceId,
          notes: referralForm.notes
        })
      });

      if (res.success && res.data) {
        setReferralsList(prev => [res.data, ...prev]);
      } else {
        const newRef: ReferralRecord = {
          id: `ref-${Date.now()}`,
          caseId: referralForm.caseId,
          resourceId: referralForm.resourceId,
          referredBy: 'Cán bộ CTXH',
          status: 'proposed',
          notes: referralForm.notes,
          createdAt: new Date().toISOString()
        };
        setReferralsList(prev => [newRef, ...prev]);
      }

      setShowReferralModal(false);
      alert('Đã khởi tạo phiếu chuyển tuyến thành công!');
    } catch (err) {
      console.error('Lỗi tạo referral D1:', err);
      const newRef: ReferralRecord = {
        id: `ref-${Date.now()}`,
        caseId: referralForm.caseId,
        resourceId: referralForm.resourceId,
        referredBy: 'Cán bộ CTXH',
        status: 'proposed',
        notes: referralForm.notes,
        createdAt: new Date().toISOString()
      };
      setReferralsList(prev => [newRef, ...prev]);
      setShowReferralModal(false);
      alert('Đã lưu phiếu chuyển tuyến vào danh sách!');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHandoffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setActionLoading(true);

    try {
      await apiFetch(`/api/cases/${selectedCase.id}/handoff`, {
        method: 'POST',
        body: JSON.stringify(handoffForm)
      });

      setCasesList(prev => prev.map(c => c.id === selectedCase.id ? {
        ...c,
        assignedTo: handoffForm.assignedTo,
        status: 'in_progress',
        nextFollowUpAt: handoffForm.nextFollowUpAt
      } : c));

      setSelectedCase(prev => prev ? {
        ...prev,
        assignedTo: handoffForm.assignedTo,
        status: 'in_progress',
        nextFollowUpAt: handoffForm.nextFollowUpAt
      } : null);

      setShowHandoffForm(false);
      alert(`Đã bàn giao ca thành công cho ${handoffForm.assignedTo}!`);
    } catch (err) {
      console.error('Lỗi bàn giao ca:', err);
      setCasesList(prev => prev.map(c => c.id === selectedCase.id ? {
        ...c,
        assignedTo: handoffForm.assignedTo,
        status: 'in_progress',
        nextFollowUpAt: handoffForm.nextFollowUpAt
      } : c));
      setShowHandoffForm(false);
      alert(`Đã bàn giao ca offline thành công cho ${handoffForm.assignedTo}!`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleScamCheckChange = (key: 'q1' | 'q2' | 'q3' | 'q4' | 'q5') => {
    const updated = { ...scamChecklist, [key]: !scamChecklist[key] };
    setScamChecklist(updated);
    const count = Object.values(updated).filter(Boolean).length;
    if (count === 0) setScamRisk('low');
    else if (count === 1) setScamRisk('medium');
    else if (count <= 3) setScamRisk('high');
    else setScamRisk('critical');
  };

  const handleAssignSignal = (signalId: string, assignee: string) => {
    setSignalsList(prev => prev.map(s => s.id === signalId ? {
      ...s,
      assignedTo: assignee,
      verificationStatus: 'ASSIGNED'
    } : s));
    setShowAssignSignalModal(false);
    setSelectedSignalForAssign(null);
    alert(`Đã giao việc cho ${assignee} xác minh tín hiệu ${signalId}`);
  };

  const handleVerifySignal = (signalId: string) => {
    setSignalsList(prev => prev.map(s => s.id === signalId ? {
      ...s,
      verificationStatus: 'VERIFIED'
    } : s));
    alert(`Tín hiệu ${signalId} đã được xác minh thành công! Đang mở form tiếp nhận ca mới...`);
    setShowVoiceModal(true);
  };

  const handleDismissSignal = (signalId: string) => {
    setSignalsList(prev => prev.map(s => s.id === signalId ? {
      ...s,
      verificationStatus: 'DISMISSED'
    } : s));
    alert(`Đã bác bỏ tín hiệu ${signalId}`);
  };

  const handleApproveReview = (reviewId: string) => {
    setReviewsList(prev => prev.map(r => r.id === reviewId ? {
      ...r,
      status: 'APPROVED'
    } : r));
    alert(`Đã phê duyệt thông tin trích xuất AI cho ca ${reviewId}`);
  };

  const handleEscalateReview = (reviewId: string) => {
    setReviewsList(prev => prev.map(r => r.id === reviewId ? {
      ...r,
      status: 'ESCALATED'
    } : r));
    alert(`🚨 Đã chuyển ca ${reviewId} tới Tổng đài 111 Khẩn cấp!`);
  };

  const handleRequestInfoReview = (reviewId: string) => {
    alert(`Đã gửi yêu cầu tình nguyện viên bổ sung thông tin thực địa cho ca ${reviewId}`);
  };

  const handleOpenEditReview = (rev: any) => {
    setSelectedReview(rev);
    setEditReviewForm({
      aliasName: rev.aliasName,
      age: rev.age_claimed || 15,
      area: 'Bến xe An Sương, Hóc Môn',
      needs: rev.needs || ['food', 'medical'],
      note: rev.reasonText
    });
    setShowEditReviewModal(true);
  };

  const handleSaveEditReview = () => {
    if (!selectedReview) return;
    setReviewsList(prev => prev.map(r => r.id === selectedReview.id ? {
      ...r,
      aliasName: editReviewForm.aliasName,
      age_claimed: Number(editReviewForm.age),
      needs: editReviewForm.needs,
      status: 'APPROVED'
    } : r));
    setShowEditReviewModal(false);
    setSelectedReview(null);
    alert('Đã lưu thông tin chỉnh sửa và phê duyệt ca thành công!');
  };

  const handleApproveVolunteer = async (volId: string) => {
    const vol = volunteersList.find(v => v.id === volId);
    setVolunteersList(prev => prev.map(v => v.id === volId ? { ...v, status: 'active' as const } : v));
    try {
      await apiFetch(`/api/volunteers/${volId}/approve`, { method: 'POST' });
    } catch (e) {
      console.log('Approve volunteer D1 offline fallback');
    }
  };

  const handleToggleSuspendVolunteer = async (volId: string) => {
    const vol = volunteersList.find(v => v.id === volId);
    if (!vol) return;
    const nextStatus = vol.status === 'suspended' ? 'active' : 'suspended';
    setVolunteersList(prev => prev.map(v => v.id === volId ? { ...v, status: nextStatus as any } : v));
  };

  const handleSaveDistrictAssignment = async (volId: string, districts: string[]) => {
    setVolunteersList(prev => prev.map(v => v.id === volId ? { ...v, assignedDistricts: districts } : v));
    setSelectedVolunteerForDistrict(null);
    alert('Đã cập nhật phân quyền khu vực hoạt động!');
  };

  const handleAddVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newVol: VolunteerRecord = {
      id: `vol-${Date.now()}`,
      fullName: newVolunteerForm.fullName,
      email: newVolunteerForm.email,
      phone: newVolunteerForm.phone,
      role: newVolunteerForm.role,
      assignedDistricts: newVolunteerForm.assignedDistricts,
      status: 'active',
      registrationSource: 'portal_signup',
      joinedAt: new Date().toISOString(),
      totalSurveysSubmitted: 0,
      lastActiveAt: new Date().toISOString()
    };

    setVolunteersList(prev => [newVol, ...prev]);
    setShowAddVolunteerModal(false);
    setNewVolunteerForm({
      fullName: '',
      email: '',
      phone: '',
      role: 'volunteer_field',
      assignedDistricts: ['Hóc Môn']
    });
    alert(`Đã thêm tình nguyện viên ${newVol.fullName} thành công!`);
  };

  const handleExportAuditTrailCSV = () => {
    const headers = ['Mã Audit', 'Thời gian', 'Người thực hiện', 'Vai trò', 'Hành động', 'Mã ca target', 'Mã Alias', 'IP Address', 'Risk Level', 'Chi tiết'];
    const rows = auditTrailList.map(a => [
      a.id,
      a.timestamp,
      `"${a.actorName}"`,
      a.actorRole,
      a.action,
      a.targetCaseId || '',
      a.targetAlias || '',
      a.ipAddress,
      a.riskLevel,
      `"${a.details.replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `buoc-tiep-audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered lists
  const filteredCases = casesList.filter(c => {
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchLower) ||
      c.aliasName.toLowerCase().includes(searchLower) ||
      c.currentArea.toLowerCase().includes(searchLower) ||
      (c.note && c.note.toLowerCase().includes(searchLower));

    const matchesIntakeMode = filterIntakeMode === 'all' || c.intakeMode === filterIntakeMode;
    const matchesNeedCategory = filterNeedCategory === 'all' ||
      (c.needCategories && c.needCategories.includes(filterNeedCategory as any));

    return matchesPriority && matchesSearch && matchesIntakeMode && matchesNeedCategory;
  }).sort((a, b) => {
    const aUrgent = a.priority === 'urgent' || isStale(a.createdAt);
    const bUrgent = b.priority === 'urgent' || isStale(b.createdAt);
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredVolunteers = volunteersList.filter(v => {
    const matchesStatus = volunteerStatusFilter === 'all' || v.status === volunteerStatusFilter;
    const matchesDistrict = volunteerDistrictFilter === 'all' || ((v.assignedDistricts || []).includes(volunteerDistrictFilter));
    const searchLower = volunteerSearchQuery.toLowerCase();
    const matchesSearch =
      v.fullName.toLowerCase().includes(searchLower) ||
      v.email.toLowerCase().includes(searchLower) ||
      v.phone.includes(searchLower);
    return matchesStatus && matchesDistrict && matchesSearch;
  });

  const filteredAuditTrail = auditTrailList.filter(a => {
    return auditRiskFilter === 'all' || a.riskLevel === auditRiskFilter;
  });

  // Mobile App View Switcher
  if (viewMode === 'mobile') {
    return <MobileAppDemo onSwitchToAdmin={() => setViewMode('admin')} />;
  }

  const handleOpenForm07ForCase = (c: CaseRecord) => {
    const matchedRef = referralsList.find(r => r.caseId === c.id);
    const matchedResource = resourcesList.find(r => r.id === matchedRef?.resourceId);
    const docNo = `${c.id.toUpperCase().replace('CASE-', '')}/PCT-BT`;

    const measures: string[] = [];
    if (c.needCategories?.includes('food')) measures.push('Nhu yếu phẩm khẩn cấp & Suất ăn dinh dưỡng');
    if (c.needCategories?.includes('medical')) measures.push('Trợ giúp Y tế, khám chữa bệnh & Cấp thuốc khẩn cấp');
    if (c.needCategories?.includes('shelter_job')) {
      measures.push('Tạm trú khẩn cấp tại Cơ sở Bảo trợ / Mái ấm an sinh');
      measures.push('Đào tạo an toàn số MIL (Media & Info Literacy) & Phòng chống lừa đảo việc làm');
    }
    if (c.isMinor || c.needCategories?.includes('sos111')) {
      measures.push('Bảo vệ trẻ em khẩn cấp (Tổng đài 111 & Tổ Công tác xã hội địa phương)');
    }
    if (measures.length === 0) {
      measures.push('Nhu yếu phẩm khẩn cấp & Suất ăn dinh dưỡng', 'Trợ giúp Y tế, khám chữa bệnh & Cấp thuốc khẩn cấp');
    }

    setForm07Data({
      referralId: matchedRef?.id || `REF-${c.id}`,
      officialDocNo: docNo,
      caseName: c.fullName || c.aliasName,
      aliasName: c.aliasName,
      fullName: c.fullName || c.aliasName,
      passportId: c.beneficiaryId ? `BT-${c.beneficiaryId.toUpperCase()}` : `BT-${c.id.toUpperCase()}`,
      age: c.birthYear ? (2026 - c.birthYear) : (c.isMinor ? 15 : 62),
      gender: c.isMinor ? 'Nam' : 'Nữ',
      currentArea: c.currentArea || 'Huyện Hóc Môn, TP.HCM',
      vulnerabilityGroup: c.vulnerabilityGroup || (c.isMinor ? 'Trẻ em lang thang / Safeguarding' : 'Lao động đường phố'),
      emergencyReason: c.note || 'Cần tiếp nhận hỗ trợ an sinh và trợ giúp xã hội khẩn cấp.',
      proposedMeasures: measures,
      resourceName: matchedResource?.name || 'Phòng Lao động - Thương binh & Xã hội huyện Hóc Môn',
      address: matchedResource?.address || 'Thị trấn Hóc Môn, Huyện Hóc Môn, TP.HCM',
      isApproved: c.status === 'referred' || c.status === 'closed',
      isMinor: c.isMinor,
      createdAt: c.createdAt || new Date().toISOString(),
      notes: 'Biên bản tiếp nhận và đề xuất biện pháp trợ giúp xã hội chuyển tuyến P0 theo NĐ 20/2021/NĐ-CP.',
      issuingOfficer: c.assignedTo || 'Cán bộ CTXH Thực địa',
      issuingDept: 'Ban Điều hành BƯỚC TIẾP — UNESCO Youth Hackathon 2026',
      redactPII: c.isMinor
    });
    setShowAnonymousModal(false);
    setShowForm07Modal(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: themeColors.background, color: themeColors.textPrimary }}>
      {/* Header & Overview Bento Metrics Bar */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        loading={loading}
        errorMsg={errorMsg}
        casesList={casesList}
        signalsList={signalsList}
        reviewsList={reviewsList}
        loadData={loadData}
        isSlaOverdue={isSlaOverdue}
        ngoCapacity={ngoCapacity}
        onChangeNgoCapacity={handleChangeNgoCapacity}
      />

      {/* Main Container Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto 32px auto', padding: '0 24px' }}>
        {/* Tab Public Impact Dashboard */}
        {activeTab === 'public' && (
          <PublicImpactDashboard onOpenDemoPortal={() => setActiveTab('demo')} />
        )}

        {/* Tab Interactive Demo Mode */}
        {activeTab === 'demo' && (
          <InteractiveDemoPortal onBackToPublic={() => setActiveTab('public')} />
        )}

        {/* Tab Mobile App Simulation */}
        {activeTab === 'mobile' && (
          <MobileAppDemo onSwitchToAdmin={() => setActiveTab('public')} />
        )}

        {/* Tab 1: Cases */}
        {activeTab === 'cases' && (

          <CasesTab
            casesList={casesList}
            filteredCases={filteredCases}
            resourcesList={resourcesList}
            loading={loading}
            caseViewMode={caseViewMode}
            setCaseViewMode={setCaseViewMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterNeedCategory={filterNeedCategory}
            setFilterNeedCategory={setFilterNeedCategory}
            filterIntakeMode={filterIntakeMode}
            setFilterIntakeMode={setFilterIntakeMode}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            setSelectedCase={setSelectedCase}
            setShowBatchQrModal={setShowBatchQrModal}
            setShowVoiceModal={setShowVoiceModal}
            isStale={isStale}
            onOpenForm07Modal={handleOpenForm07ForCase}
            onCreateNewCase={handleCreateNewCase}
          />
        )}

        {/* Tab Safeguarding & Hotline 111 Emergency Panel */}
        {activeTab === 'safeguarding' && (
          <SafeguardingTab
            casesList={casesList}
            auditTrailList={auditTrailList}
            onOpenAnonymousModal={(c) => {
              setSelectedCaseForAnonymous(c);
              setShowAnonymousModal(true);
            }}
            onOpenForm07Modal={handleOpenForm07ForCase}
            onLogAuditAction={handleLogAuditAction}
          />
        )}


        {/* Tab 2: Signals */}
        {activeTab === 'signals' && (
          <SignalsTab
            signalsList={signalsList}
            setSelectedSignalForAssign={setSelectedSignalForAssign}
            setShowAssignSignalModal={setShowAssignSignalModal}
            handleDismissSignal={handleDismissSignal}
            handleVerifySignal={handleVerifySignal}
          />
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'reviews' && (
          <ReviewsTab
            reviewsList={reviewsList}
            handleApproveReview={handleApproveReview}
            handleOpenEditReview={handleOpenEditReview}
            handleEscalateReview={handleEscalateReview}
            handleRequestInfoReview={handleRequestInfoReview}
          />
        )}

        {/* Tab 4: Referrals */}
        {activeTab === 'referrals' && (
          <ReferralsTab
            resourcesList={resourcesList}
            referralsList={referralsList}
            casesList={casesList}
            setShowReferralModal={setShowReferralModal}
            setForm07Data={setForm07Data}
            setShowForm07Modal={setShowForm07Modal}
            onUpdateReferralStatus={(id, status: ReferralRecord['status']) => {
              setReferralsList(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            }}
            onOpenDeclineModal={(ref) => {
              setSelectedReferralForDecline(ref);
              setShowDeclineModal(true);
            }}
          />
        )}

        {/* Tab 5: Resources */}
        {activeTab === 'resources' && (
          <ResourcesTab
            casesList={casesList}
            resourcesList={resourcesList}
            resourceViewMode={resourceViewMode}
            setResourceViewMode={setResourceViewMode}
            resourceCategoryFilter={resourceCategoryFilter}
            setResourceCategoryFilter={setResourceCategoryFilter}
            resourceDistrictFilter={resourceDistrictFilter}
            setResourceDistrictFilter={setResourceDistrictFilter}
            setShowReferralModal={setShowReferralModal}
            setReferralForm={setReferralForm}
            onAddNewResource={handleAddNewResource}
          />
        )}

        {/* Tab 6: Surveys */}
        {activeTab === 'surveys' && (
          <SurveysTab
            setActiveTab={setActiveTab}
            setShowVoiceModal={setShowVoiceModal}
          />
        )}

        {/* Tab 7: Volunteers */}
        {activeTab === 'volunteers' && (
          <VolunteersTab
            volunteersList={volunteersList}
            filteredVolunteers={filteredVolunteers}
            auditTrailList={auditTrailList}
            filteredAuditTrail={filteredAuditTrail}
            volunteerSearchQuery={volunteerSearchQuery}
            setVolunteerSearchQuery={setVolunteerSearchQuery}
            volunteerStatusFilter={volunteerStatusFilter}
            setVolunteerStatusFilter={setVolunteerStatusFilter}
            volunteerDistrictFilter={volunteerDistrictFilter}
            setVolunteerDistrictFilter={setVolunteerDistrictFilter}
            auditRiskFilter={auditRiskFilter}
            setAuditRiskFilter={setAuditRiskFilter}
            setSelectedVolunteerForDistrict={setSelectedVolunteerForDistrict}
            setShowAddVolunteerModal={setShowAddVolunteerModal}
            handleApproveVolunteer={handleApproveVolunteer}
            handleToggleSuspendVolunteer={handleToggleSuspendVolunteer}
            handleExportAuditTrailCSV={handleExportAuditTrailCSV}
          />
        )}

        {/* Tab 8: Impact */}
        {activeTab === 'impact' && (
          <ImpactTab impactData={impactData} />
        )}

        {/* Tab 9: Pilot Data Console (D1 Database Management) */}
        {activeTab === 'data' && (
          <DataTab
            casesList={casesList}
            resourcesList={resourcesList}
            referralsList={referralsList}
            volunteersList={volunteersList}
            auditTrailList={auditTrailList}
            onRefreshData={loadData}
            onSeedData={handleSeedData}
            onResetData={handleResetData}
            onArchiveRecord={handleArchiveRecord}
          />
        )}

        {/* Modals Container */}
        <Form07Modal
          showForm07Modal={showForm07Modal}
          setShowForm07Modal={setShowForm07Modal}
          form07Data={form07Data}
          setForm07Data={setForm07Data}
        />

        <BatchQrModal
          show={showBatchQrModal}
          casesList={casesList}
          printFormat={printFormat}
          setPrintFormat={setPrintFormat}
          onClose={() => setShowBatchQrModal(false)}
          getRecoveryCode={getRecoveryCode}
        />

        <VoiceIntakeModal
          show={showVoiceModal}
          intakeTab={intakeTab}
          setIntakeTab={setIntakeTab}
          intakePhotoUrl={intakePhotoUrl}
          setIntakePhotoUrl={setIntakePhotoUrl}
          intakeGps={intakeGps}
          setIntakeGps={setIntakeGps}
          intakeNeedCategories={intakeNeedCategories}
          setIntakeNeedCategories={setIntakeNeedCategories}
          intakeNote={intakeNote}
          setIntakeNote={setIntakeNote}
          voiceForm={voiceForm}
          setVoiceForm={setVoiceForm}
          transcript={transcript}
          isRecording={isRecording}
          actionLoading={actionLoading}
          onClose={() => {
            setShowVoiceModal(false);
            setIsRecording(false);
            setSimulationScript(null);
          }}
          onSubmit={handleSaveIntake}
          toggleNeedCategory={toggleNeedCategory}
          startSimulation={startSimulation}
        />

        <CaseDetailModal
          selectedCase={selectedCase}
          passportData={passportData}
          loadingPassport={loadingPassport}
          showHandoffForm={showHandoffForm}
          setShowHandoffForm={setShowHandoffForm}
          handoffForm={handoffForm}
          setHandoffForm={setHandoffForm}
          scamChecklist={scamChecklist}
          scamRisk={scamRisk}
          actionLoading={actionLoading}
          setSelectedCase={setSelectedCase}
          isStale={isStale}
          getRecoveryCode={getRecoveryCode}
          handleHandoffSubmit={handleHandoffSubmit}
          handleScamCheckChange={handleScamCheckChange}
        />

        <ReferralModal
          show={showReferralModal}
          casesList={casesList}
          resourcesList={resourcesList}
          referralForm={referralForm}
          setReferralForm={setReferralForm}
          actionLoading={actionLoading}
          onClose={() => setShowReferralModal(false)}
          onSubmit={handleSaveReferral}
        />

        <AssignSignalModal
          show={showAssignSignalModal}
          selectedSignal={selectedSignalForAssign}
          assigneeName={assigneeName}
          setAssigneeName={setAssigneeName}
          onClose={() => {
            setShowAssignSignalModal(false);
            setSelectedSignalForAssign(null);
          }}
          onConfirm={handleAssignSignal}
        />

        <EditReviewModal
          show={showEditReviewModal}
          selectedReview={selectedReview}
          editReviewForm={editReviewForm}
          setEditReviewForm={setEditReviewForm}
          onClose={() => {
            setShowEditReviewModal(false);
            setSelectedReview(null);
          }}
          onSave={handleSaveEditReview}
        />

        <AssignDistrictModal
          selectedVolunteer={selectedVolunteerForDistrict}
          onClose={() => setSelectedVolunteerForDistrict(null)}
          onSave={handleSaveDistrictAssignment}
        />

        <AddVolunteerModal
          show={showAddVolunteerModal}
          newVolunteerForm={newVolunteerForm}
          setNewVolunteerForm={setNewVolunteerForm}
          onClose={() => setShowAddVolunteerModal(false)}
          onSubmit={handleAddVolunteerSubmit}
        />

        {showDeclineModal && selectedReferralForDecline && (
          <DeclineReferralModal
            referral={selectedReferralForDecline}
            caseRecord={casesList.find(c => c.id === selectedReferralForDecline.caseId)}
            resourceRecord={resourcesList.find(r => r.id === selectedReferralForDecline.resourceId)}
            onClose={() => {
              setShowDeclineModal(false);
              setSelectedReferralForDecline(null);
            }}
            onConfirmDecline={handleConfirmDeclineReferral}
          />
        )}

        {showAnonymousModal && selectedCaseForAnonymous && (
          <AnonymousCaseModal
            caseRecord={selectedCaseForAnonymous}
            onClose={() => {
              setShowAnonymousModal(false);
              setSelectedCaseForAnonymous(null);
            }}
            onLogAudit={handleLogAuditAction}
            onOpenForm07={(c) => {
              const matchedRef = referralsList.find(r => r.caseId === c.id);
              const matchedResource = resourcesList.find(r => r.id === matchedRef?.resourceId);
              const docNo = `${c.id.toUpperCase().replace('CASE-', '')}/PCT-BT`;
              setForm07Data({
                referralId: matchedRef?.id || `REF-${c.id}`,
                officialDocNo: docNo,
                caseName: c.fullName,
                aliasName: c.aliasName,
                fullName: c.fullName,
                passportId: c.beneficiaryId ? `BT-${c.beneficiaryId.toUpperCase()}` : 'BT-7K2M-9Q4X',
                age: c.birthYear ? (2026 - c.birthYear) : (c.isMinor ? 15 : 60),
                gender: c.isMinor ? 'Nam' : 'Nữ',
                currentArea: c.currentArea,
                vulnerabilityGroup: c.isMinor ? 'Trẻ em lang thang / Safeguarding' : 'Người già neo đơn',
                emergencyReason: c.note || 'Cần hỗ trợ khẩn cấp',
                proposedMeasures: ['Trợ giúp Y tế khẩn', 'Tạm trú an toàn', 'Bảo vệ Tổng đài 111'],
                resourceName: matchedResource?.name || 'Mái ấm Ánh Sáng Hóc Môn',
                address: matchedResource?.address || 'Hóc Môn, TP.HCM',
                isApproved: true,
                isMinor: c.isMinor,
                createdAt: c.createdAt,
                notes: 'Biên bản tiếp nhận chuyển tuyến ưu tiên khẩn P0.',
                issuingOfficer: c.assignedTo || 'Cán bộ Safeguarding',
                issuingDept: 'Ban Điều hành BƯỚC TIẾP UNESCO 2026',
                redactPII: c.isMinor
              });
              setShowForm07Modal(true);
            }}
          />
        )}
      </main>
    </div>
  );
}
