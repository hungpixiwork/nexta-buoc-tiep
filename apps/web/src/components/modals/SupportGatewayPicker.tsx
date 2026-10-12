import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { Search, MapPin, ShieldCheck, AlertTriangle, X, ChevronRight } from 'lucide-react';
import { SupportGatewayRecord } from '@buoc-tiep/shared';
import { useTranslation } from '../../i18n';

export interface SupportGatewayPickerProps {
  show: boolean;
  onClose: () => void;
  onSelect: (gateway: SupportGatewayRecord) => void;
  selectedGatewayId?: string;
  initialCategory?: string;
  filterDistrict?: string;
}

const DEFAULT_GATEWAYS_SSOT: SupportGatewayRecord[] = [
  {
    id: 'gw-med-hocmon',
    code: 'GW-MED-HOCMON',
    name: 'Trung tâm Y tế Huyện Hóc Môn',
    category: 'healthcare',
    description: 'Khám chữa bệnh đa khoa, cấp phát thuốc BHYT/trợ cấp, hỗ trợ đối tượng yếu thế không có CCCD.',
    organizationId: 'org-ttyt-hocmon',
    serviceType: 'Khám chữa bệnh & Cấp thuốc',
    eligibilitySummary: 'Người lao động tự do, người cao tuổi, không phân biệt nơi cư trú',
    jurisdiction: 'Huyện Hóc Môn, TP.HCM',
    geographicCoverage: ['Hóc Môn', 'Quận 12'],
    channel: 'direct_walkin',
    verificationStatus: 'VERIFIED',
    status: 'AVAILABLE',
    confidence: 100
  },
  {
    id: 'gw-shelter-q12',
    code: 'GW-SHELTER-Q12',
    name: 'Mái ấm Ánh Sáng (Bảo trợ Tạm thời)',
    category: 'temporary_shelter',
    description: 'Lưu trú khẩn cấp 1-14 ngày, cung cấp 3 bữa ăn/ngày và kết nối việc làm an toàn.',
    organizationId: 'org-anh-sang',
    serviceType: 'Lưu trú khẩn cấp',
    eligibilitySummary: 'Phụ nữ & Người lớn tuổi không nơi nương tựa',
    jurisdiction: 'Quận 12, TP.HCM',
    geographicCoverage: ['Quận 12', 'Hóc Môn', 'Gò Vấp'],
    channel: 'referral_letter',
    verificationStatus: 'VERIFIED',
    status: 'AVAILABLE',
    confidence: 95
  },
  {
    id: 'gw-job-hocmon',
    code: 'GW-JOB-HOCMON',
    name: 'Điểm Hướng nghiệp & Việc làm Hội Phụ nữ Hóc Môn',
    category: 'livelihood',
    description: 'Giới thiệu việc làm buôn bán, tạp vụ, gia công thủ công, hỗ trợ vốn mượn sinh kế xoay vòng.',
    organizationId: 'org-hpn-hocmon',
    serviceType: 'Kết nối việc làm & Vốn sinh kế',
    eligibilitySummary: 'Lao động nữ trên 18 tuổi, có nhu cầu mưu sinh tự lực',
    jurisdiction: 'Huyện Hóc Môn, TP.HCM',
    geographicCoverage: ['Hóc Môn'],
    channel: 'direct_walkin',
    verificationStatus: 'VERIFIED',
    status: 'AVAILABLE',
    confidence: 90
  },
  {
    id: 'gw-child-111',
    code: 'GW-CHILD-111',
    name: 'Trung tâm Công tác Xã hội Trẻ em TP.HCM (Tích hợp 111)',
    category: 'child_safeguarding',
    description: 'Tiếp nhận và can thiệp khẩn cấp trẻ em yếu thế, bảo vệ pháp lý, hỗ trợ tâm lý và đưa vào diện bảo trợ công lập.',
    organizationId: 'org-ctxh-tre-em',
    serviceType: 'Bảo vệ trẻ em khẩn cấp',
    eligibilitySummary: 'Trẻ em và thanh thiếu niên < 18 tuổi cần bảo vệ',
    jurisdiction: 'Toàn TP. Hồ Chí Minh',
    geographicCoverage: ['TP. Hồ Chí Minh'],
    channel: 'phone',
    verificationStatus: 'VERIFIED',
    status: 'AVAILABLE',
    confidence: 100
  }
];

export const SupportGatewayPicker: React.FC<SupportGatewayPickerProps> = ({
  show,
  onClose,
  onSelect,
  selectedGatewayId,
  initialCategory = 'ALL',
  filterDistrict
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  if (!show) return null;

  const categories = [
    { key: 'ALL', label: t('resourcesTab.allCategories') },
    { key: 'healthcare', label: `🏥 ${t('resourcesTab.categoryMedical')}` },
    { key: 'livelihood', label: `💼 ${t('resourcesTab.categoryJob')}` },
    { key: 'temporary_shelter', label: `🏠 ${t('resourcesTab.categoryShelter')}` },
    { key: 'child_safeguarding', label: `🛡️ ${t('common.safeguarding.hotline111')}` },
    { key: 'food', label: `🍲 ${t('resourcesTab.categoryFood')}` }
  ];

  const filteredGateways = DEFAULT_GATEWAYS_SSOT.filter(gw => {
    if (selectedCategory !== 'ALL' && gw.category !== selectedCategory) return false;
    if (verifiedOnly && gw.verificationStatus !== 'VERIFIED') return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      gw.name.toLowerCase().includes(q) ||
      gw.description?.toLowerCase().includes(q) ||
      gw.jurisdiction.toLowerCase().includes(q) ||
      gw.serviceType?.toLowerCase().includes(q)
    );
  });

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
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
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
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: themeColors.primaryNavy }}>
              {t('supportGatewayPicker.title')}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
              {t('supportGatewayPicker.subtitle')}
            </p>
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

        {/* Filters & Search Toolbar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
              <Search size={16} color="#64748B" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('supportGatewayPicker.searchPlaceholder')}
                style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '13px', color: '#0F172A' }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: themeColors.primaryNavy, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={e => setVerifiedOnly(e.target.checked)}
              />
              {t('supportGatewayPicker.verifiedOnly')}
            </label>
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {categories.map(cat => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    fontWeight: isSelected ? '700' : '500',
                    borderRadius: '16px',
                    border: isSelected ? `1.5px solid ${themeColors.primaryNavy}` : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#E0F2FE' : '#FFFFFF',
                    color: isSelected ? themeColors.primaryNavy : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gateway List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredGateways.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
              <AlertTriangle size={28} color="#F59E0B" style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontWeight: '700', fontSize: '14px', color: themeColors.primaryNavy }}>
                {t('supportGatewayPicker.emptyState')}
              </div>
            </div>
          ) : (
            filteredGateways.map(gw => {
              const isSelected = selectedGatewayId === gw.id;
              const isChildGateway = gw.category === 'child_safeguarding';

              return (
                <div
                  key={gw.id}
                  style={{
                    border: isSelected ? `2px solid ${themeColors.primaryNavy}` : '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Top Bar */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '14.5px', color: isChildGateway ? '#DC2626' : themeColors.primaryNavy }}>
                          {gw.name}
                        </span>
                        <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#166534', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <ShieldCheck size={12} /> {t('common.status.verified')}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={12} color="#64748B" />
                        <strong>{gw.jurisdiction}</strong> · {gw.geographicCoverage.join(', ')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelect(gw)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        backgroundColor: themeColors.primaryNavy,
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {t('supportGatewayPicker.chooseThisService')} <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Description & Eligibility */}
                  <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                    {gw.description}
                  </div>

                  {/* Eligibility Pill */}
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 10px', fontSize: '11.5px', color: '#475569' }}>
                    <strong style={{ color: '#0F172A' }}>{t('cases.table.alias')}:</strong> {gw.eligibilitySummary}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-outline" onClick={onClose} style={{ padding: '6px 16px', fontSize: '12.5px' }}>
            {t('common.actions.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

