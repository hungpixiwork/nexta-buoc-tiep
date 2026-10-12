import React, { useState, useMemo, useRef, useEffect } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import {
  MapPin,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Building,
  List,
  Map as MapIcon,
  Plus,
  Phone,
  Search,
  Crosshair,
  ExternalLink,
  Navigation,
  Sparkles,
  Filter,
  ArrowUpDown,
  FileText
} from 'lucide-react';
import { CaseRecord, ResourceRecord } from '../../types';
import { RealWelfareMap, calculateHaversineDistanceKm, getCategoryColor, getCategoryLabel, getCategoryIconChar } from '../RealWelfareMap';
import { AddResourceModal } from '../modals/AddResourceModal';
import { ResourceDetailModal } from '../modals/ResourceDetailModal';

interface ResourcesTabProps {
  casesList: CaseRecord[];
  resourcesList: ResourceRecord[];
  resourceViewMode: 'list' | 'map';
  setResourceViewMode: (mode: 'list' | 'map') => void;
  resourceCategoryFilter: string;
  setResourceCategoryFilter: (c: string) => void;
  resourceDistrictFilter: string;
  setResourceDistrictFilter: (d: string) => void;
  setShowReferralModal: (show: boolean) => void;
  setReferralForm: React.Dispatch<React.SetStateAction<any>>;
  onUpdatePartnerStatus?: (resourceId: string, newStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'SUSPENDED') => void;
  onAddNewResource?: (newResource: Partial<ResourceRecord>) => Promise<boolean | void>;
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({
  casesList,
  resourcesList,
  resourceViewMode,
  setResourceViewMode,
  resourceCategoryFilter,
  setResourceCategoryFilter,
  resourceDistrictFilter,
  setResourceDistrictFilter,
  setShowReferralModal,
  setReferralForm,
  onUpdatePartnerStatus,
  onAddNewResource
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<string>('all');
  const [only247Filter, setOnly247Filter] = useState<boolean>(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailModalResource, setDetailModalResource] = useState<ResourceRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Filtered & Enriched Resources List
  const filteredAndSortedResources = useMemo(() => {
    let result = resourcesList.filter(r => {
      // Category filter
      if (resourceCategoryFilter !== 'all' && r.category !== resourceCategoryFilter) return false;
      // District filter
      if (resourceDistrictFilter !== 'all' && !(r.district || '').toLowerCase().includes(resourceDistrictFilter.toLowerCase())) return false;
      // Partner verification status filter
      if (partnerStatusFilter !== 'all') {
        const status = (r.verificationStatus || (r.isVerified ? 'VERIFIED' : 'UNVERIFIED')).toUpperCase();
        if (status !== partnerStatusFilter.toUpperCase()) return false;
      }
      // 24/7 filter
      if (only247Filter && !r.is24Hours && !r.is_24_7) return false;
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (r.name || '').toLowerCase().includes(q);
        const matchAddr = (r.address || '').toLowerCase().includes(q);
        const matchDist = (r.district || '').toLowerCase().includes(q);
        const matchWard = (r.ward || '').toLowerCase().includes(q);
        const matchDesc = (r.description || '').toLowerCase().includes(q);
        if (!matchName && !matchAddr && !matchDist && !matchWard && !matchDesc) return false;
      }
      return true;
    });

    // Calculate dynamic distance if user location is available
    if (userLocation) {
      result = result.map(r => {
        if (r.latitude && r.longitude) {
          const dist = calculateHaversineDistanceKm(userLocation.lat, userLocation.lng, r.latitude, r.longitude);
          return { ...r, distanceKm: dist };
        }
        return r;
      });

      if (sortByDistance) {
        result.sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));
      }
    }

    return result;
  }, [resourcesList, resourceCategoryFilter, resourceDistrictFilter, partnerStatusFilter, only247Filter, searchQuery, userLocation, sortByDistance]);

  // Scroll card into view when a marker is clicked on the map
  const handleSelectResourceFromMap = (r: ResourceRecord) => {
    setSelectedResourceId(r.id);
    const element = cardRefs.current.get(r.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleOpenDetail = (resource: ResourceRecord) => {
    setDetailModalResource(resource);
    setIsDetailModalOpen(true);
  };

  const handleOpenReferral = (resourceId: string) => {
    setReferralForm((prev: any) => ({ ...prev, resourceId }));
    setShowReferralModal(true);
  };

  const getPartnerBadge = (status?: string, isVerified?: boolean) => {
    const s = (status || (isVerified ? 'VERIFIED' : 'UNVERIFIED')).toUpperCase();
    if (s === 'PENDING' || s === 'PENDING_REVIEW') {
      return (
        <span className="badge-saffron" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <Clock size={11} /> Chờ Thẩm Định
        </span>
      );
    }
    if (s === 'SUSPENDED' || s === 'INACTIVE') {
      return (
        <span className="badge-danger" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <AlertTriangle size={11} /> Tạm Khóa
        </span>
      );
    }
    return (
      <span className="badge-forest" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        <CheckCircle2 size={11} /> Đã Xác Minh (VERIFIED)
      </span>
    );
  };

  return (
    <div className="card-flat" style={{ padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
      
      {/* Top Header & Overview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={22} color="#2563EB" />
            <span>Danh Bạ Nguồn Lực An Sinh Thực Địa TP.HCM</span>
            <span style={{ fontSize: '12px', fontWeight: '800', backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '2px 8px', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
              {filteredAndSortedResources.length} / {resourcesList.length} Điểm
            </span>
          </h3>
          <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: themeColors.textMuted }}>
            Bản đồ địa lý thực tế OpenStreetMap kết nối CSDL Cloudflare D1 (Y tế, Mái ấm, Bếp ăn, Việc làm, Trợ giúp pháp lý)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Add Resource Button */}
          <button
            className="btn-navy"
            style={{ padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', whiteSpace: 'nowrap' }}
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={15} />
            <span>Thêm Nguồn Lực Mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: '12px 14px',
        borderRadius: '10px',
        border: `1px solid ${themeColors.border}`,
        marginBottom: '16px'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search size={15} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Tìm theo tên, địa chỉ, phường xã, dịch vụ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              borderRadius: '6px',
              border: `1px solid ${themeColors.borderDark}`,
              fontSize: '12.5px',
              backgroundColor: '#FFFFFF'
            }}
          />
        </div>

        {/* Category Filter */}
        <select
          value={resourceCategoryFilter}
          onChange={e => setResourceCategoryFilter(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', backgroundColor: '#FFF', fontWeight: '600' }}
        >
          <option value="all">🗺️ Tất cả loại hình</option>
          <option value="medical">🏥 Y tế & Cấp cứu</option>
          <option value="shelter">🏠 Bảo trợ & Mái ấm</option>
          <option value="food">🍲 Cứu trợ thực phẩm</option>
          <option value="employment">💼 Việc làm & Sinh kế</option>
          <option value="legal">⚖️ Trợ giúp Pháp lý</option>
        </select>

        {/* District Filter */}
        <select
          value={resourceDistrictFilter}
          onChange={e => setResourceDistrictFilter(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', backgroundColor: '#FFF', fontWeight: '600' }}
        >
          <option value="all">📍 Toàn TP. Hồ Chí Minh</option>
          <option value="Hóc Môn">Huyện Hóc Môn</option>
          <option value="Bình Chánh">Huyện Bình Chánh</option>
          <option value="Củ Chi">Huyện Củ Chi</option>
          <option value="Quận 12">Quận 12</option>
          <option value="Gò Vấp">Quận Gò Vấp</option>
          <option value="Bình Tân">Quận Bình Tân</option>
          <option value="Quận 1">Quận 1</option>
          <option value="Quận 3">Quận 3</option>
          <option value="Quận 5">Quận 5</option>
          <option value="Thủ Đức">TP. Thủ Đức</option>
        </select>

        {/* Verification Status */}
        <select
          value={partnerStatusFilter}
          onChange={e => setPartnerStatusFilter(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', backgroundColor: '#FFF', fontWeight: '600' }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="VERIFIED">Đã xác minh (VERIFIED)</option>
          <option value="PENDING">Chờ thẩm định</option>
          <option value="SUSPENDED">Tạm khóa</option>
        </select>

        {/* 24/7 Fast Toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: themeColors.primaryNavy, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={only247Filter}
            onChange={e => setOnly247Filter(e.target.checked)}
          />
          ⏰ Mở cửa 24/7
        </label>

        {/* Sort by distance toggle if GPS available */}
        {userLocation && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: '#1D4ED8', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={sortByDistance}
              onChange={e => setSortByDistance(e.target.checked)}
            />
            📍 Gần tôi nhất
          </label>
        )}
      </div>

      {/* Main 2-Column Split View: Map (65%) | List (35%) */}
      <div className="welfare-directory-split">
        
        {/* Left Column: Real Interactive Map */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '600px', minHeight: '380px' }}>
          <RealWelfareMap
            resources={filteredAndSortedResources}
            selectedResourceId={selectedResourceId}
            onSelectResource={handleSelectResourceFromMap}
            onOpenReferralModal={handleOpenReferral}
            onOpenDetailModal={handleOpenDetail}
            userLocation={userLocation}
            onUpdateUserLocation={setUserLocation}
            height="100%"
          />
        </div>

        {/* Right Column: Synchronized Scrollable Resource List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '640px',
          overflowY: 'auto',
          paddingRight: '4px',
          gap: '10px'
        }}>
          {filteredAndSortedResources.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px dashed #CBD5E1',
              padding: '24px',
              textAlign: 'center'
            }}>
              <Building size={32} color="#94A3B8" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: '800', fontSize: '14px', color: themeColors.primaryNavy }}>
                Không tìm thấy nguồn lực phù hợp
              </div>
              <p style={{ fontSize: '12px', color: themeColors.textMuted, margin: '4px 0 12px 0' }}>
                Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc phía trên.
              </p>
              <button
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => {
                  setSearchQuery('');
                  setResourceCategoryFilter('all');
                  setResourceDistrictFilter('all');
                  setPartnerStatusFilter('all');
                  setOnly247Filter(false);
                }}
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            filteredAndSortedResources.map(r => {
              const isSelected = selectedResourceId === r.id;
              const catColor = getCategoryColor(r.category);
              const is24_7 = r.is24Hours || r.is_24_7;

              return (
                <div
                  key={r.id}
                  ref={el => { if (el) cardRefs.current.set(r.id, el); }}
                  onClick={() => setSelectedResourceId(r.id)}
                  style={{
                    backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                    border: isSelected ? `2px solid #16A34A` : `1px solid ${themeColors.border}`,
                    borderRadius: '10px',
                    padding: '14px',
                    boxShadow: isSelected ? '0 4px 12px rgba(22, 163, 74, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Header Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          color: catColor,
                          backgroundColor: '#F8FAFC',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: `1px solid ${themeColors.border}`
                        }}>
                          {getCategoryIconChar(r.category)} {getCategoryLabel(r.category)}
                        </span>

                        {is24_7 && (
                          <span style={{ fontSize: '9.5px', fontWeight: '800', backgroundColor: '#FEE2E2', color: '#DC2626', padding: '2px 5px', borderRadius: '4px', border: '1px solid #FCA5A5' }}>
                            ⏰ 24/7
                          </span>
                        )}

                        {r.distanceKm !== undefined && (
                          <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 6px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                            📍 {r.distanceKm} km
                          </span>
                        )}
                      </div>

                      {getPartnerBadge(r.verificationStatus, r.isVerified)}
                    </div>

                    {/* Title */}
                    <h4 style={{
                      margin: '0 0 6px 0',
                      fontSize: '14.5px',
                      fontWeight: '800',
                      color: isSelected ? '#166534' : themeColors.primaryNavy,
                      lineHeight: 1.3
                    }}>
                      {r.name}
                    </h4>

                    {/* Address */}
                    <div style={{ fontSize: '12px', color: themeColors.textBody, display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '4px' }}>
                      <MapPin size={13} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{r.address} <strong>({r.district})</strong></span>
                    </div>

                    {/* Phone & Hours */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '11.5px', color: themeColors.textMuted }}>
                      {r.phone || r.hotline ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={11} color="#16A34A" />
                          <span style={{ fontWeight: '700', color: '#2563EB' }}>{r.phone || r.hotline}</span>
                        </div>
                      ) : (
                        <span>Hotline tiếp nhận</span>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} color="#D97706" />
                        <span>{r.operatingHours || (is24_7 ? '24/24' : 'Giờ hành chính')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: `1px solid ${themeColors.border}`,
                    gap: '6px'
                  }}>
                    <button
                      className="btn-outline"
                      style={{ padding: '4px 8px', fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(r);
                      }}
                    >
                      <FileText size={12} /> Chi tiết
                    </button>

                    <a
                      href={r.latitude && r.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline"
                      style={{ padding: '4px 8px', fontSize: '11.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: themeColors.primaryNavy }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Navigation size={12} /> Chỉ đường
                    </a>

                    <button
                      className="btn-navy"
                      style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: '800' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReferral(r.id);
                      }}
                    >
                      Chuyển tuyến
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Resource Modal */}
      <AddResourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (newRes) => {
          if (onAddNewResource) {
            await onAddNewResource(newRes);
          }
        }}
      />

      {/* Resource Detail Modal */}
      <ResourceDetailModal
        resource={detailModalResource}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onOpenReferralModal={handleOpenReferral}
      />
    </div>
  );
};
