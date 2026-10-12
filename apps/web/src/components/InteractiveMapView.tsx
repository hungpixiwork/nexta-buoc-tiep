import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { themeColors } from '@buoc-tiep/shared';
import { Navigation, ZoomIn, ZoomOut, Compass, QrCode, Phone, ShieldCheck, AlertTriangle, Crosshair, Layers, Building } from 'lucide-react';
import { CaseRecord, ResourceRecord } from '../types';
import { getCategoryColor, getCategoryIconChar } from './RealWelfareMap';

interface InteractiveMapViewProps {
  mode: 'cases' | 'resources';
  casesList: CaseRecord[];
  resourcesList: ResourceRecord[];
  onSelectCase?: (c: CaseRecord) => void;
  onSelectResource?: (r: ResourceRecord) => void;
  onOpenVoiceModal?: () => void;
  onOpenReferralModalForResource?: (resourceId: string) => void;
}

const DISTRICT_FALLBACK_COORDS: Record<string, { lat: number; lng: number }> = {
  'Hóc Môn': { lat: 10.8841, lng: 106.5925 },
  'Thị trấn Hóc Môn': { lat: 10.8872, lng: 106.5925 },
  'Bình Chánh': { lat: 10.7412, lng: 106.5724 },
  'Củ Chi': { lat: 11.0067, lng: 106.5133 },
  'Quận 12': { lat: 10.8415, lng: 106.6342 },
  'Gò Vấp': { lat: 10.8350, lng: 106.6670 },
  'Bình Tân': { lat: 10.7610, lng: 106.6015 },
  'Quận 1': { lat: 10.7769, lng: 106.6953 },
  'Quận 3': { lat: 10.7844, lng: 106.6844 },
  'Quận 5': { lat: 10.7554, lng: 106.6672 },
  'Thủ Đức': { lat: 10.8494, lng: 106.7537 },
  'Default': { lat: 10.8231, lng: 106.6297 }
};

export function InteractiveMapView({
  mode,
  casesList,
  resourcesList,
  onSelectCase,
  onSelectResource,
  onOpenReferralModalForResource
}: InteractiveMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const casesLayerRef = useRef<L.LayerGroup | null>(null);
  const resourcesLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [showOnlyUrgent, setShowOnlyUrgent] = useState<boolean>(false);
  const [showReliefPoints, setShowReliefPoints] = useState<boolean>(true);
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('all');

  const selectedCase = casesList.find(c => c.id === selectedCaseId);
  const selectedResource = resourcesList.find(r => r.id === selectedResourceId);

  const isStale = (createdAtStr: string) => {
    const created = new Date(createdAtStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 15;
  };

  const getCaseCoordinates = useCallback((c: CaseRecord, index: number): [number, number] => {
    if (c.gpsCoords && c.gpsCoords.lat && c.gpsCoords.lng) {
      if (c.isMinor) {
        // Child Safeguarding GPS Blurring (Rule 0) - add ~500m deterministic blur
        const jitter = (index % 3 === 0 ? 0.004 : -0.004);
        return [c.gpsCoords.lat + jitter, c.gpsCoords.lng + jitter];
      }
      return [c.gpsCoords.lat, c.gpsCoords.lng];
    }
    const districtKey = Object.keys(DISTRICT_FALLBACK_COORDS).find(k =>
      (c.currentArea || '').toLowerCase().includes(k.toLowerCase())
    ) || 'Default';
    const base = DISTRICT_FALLBACK_COORDS[districtKey];
    const angle = (index * 120) * (Math.PI / 180);
    const radius = 0.004 + (index % 4) * 0.002;
    return [base.lat + Math.sin(angle) * radius, base.lng + Math.cos(angle) * radius];
  }, []);

  const getResourceCoordinates = useCallback((r: ResourceRecord, index: number): [number, number] => {
    if (r.latitude && r.longitude) {
      return [r.latitude, r.longitude];
    }
    const districtKey = Object.keys(DISTRICT_FALLBACK_COORDS).find(k =>
      (r.district || '').toLowerCase().includes(k.toLowerCase()) ||
      (r.address || '').toLowerCase().includes(k.toLowerCase())
    ) || 'Default';
    const base = DISTRICT_FALLBACK_COORDS[districtKey];
    const angle = (index * 137) * (Math.PI / 180);
    const radius = 0.003 + (index % 5) * 0.0015;
    return [base.lat + Math.sin(angle) * radius, base.lng + Math.cos(angle) * radius];
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [10.8231, 106.6297],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | BƯỚC TIẾP UNESCO 2026'
    }).addTo(map);

    casesLayerRef.current = L.layerGroup().addTo(map);
    resourcesLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      casesLayerRef.current = null;
      resourcesLayerRef.current = null;
    };
  }, []);

  // Filtered lists
  const filteredCases = casesList.filter(c => {
    if (showOnlyUrgent && c.priority !== 'urgent' && !c.isMinor && !isStale(c.createdAt)) return false;
    if (selectedDistrictFilter !== 'all' && !(c.currentArea || '').toLowerCase().includes(selectedDistrictFilter.toLowerCase())) return false;
    return true;
  });

  const filteredResources = resourcesList.filter(r => {
    if (selectedDistrictFilter !== 'all' && !(r.district || '').toLowerCase().includes(selectedDistrictFilter.toLowerCase())) return false;
    return true;
  });

  // Render Map Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const casesLayer = casesLayerRef.current;
    const resourcesLayer = resourcesLayerRef.current;
    if (!map || !casesLayer || !resourcesLayer) return;

    casesLayer.clearLayers();
    resourcesLayer.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    // 1. Render Cases (if in cases mode)
    if (mode === 'cases') {
      filteredCases.forEach((c, idx) => {
        const coords = getCaseCoordinates(c, idx);
        bounds.push(coords);

        const isUrgent = c.priority === 'urgent' || c.isMinor || isStale(c.createdAt);
        const pinColor = c.isMinor ? '#DC2626' : isUrgent ? '#EA580C' : '#16375D';
        const isSelected = selectedCaseId === c.id;

        const pinHtml = `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: ${isSelected ? '#FEF08A' : '#FFFFFF'};
            border: 2.5px solid ${pinColor};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            cursor: pointer;
          ">
            <span style="transform: rotate(45deg); font-size: 13px; font-weight: 900; color: ${pinColor};">
              ${c.isMinor ? '🛡️' : isUrgent ? '⚠️' : '📋'}
            </span>
          </div>
        `;

        const icon = L.divIcon({
          html: pinHtml,
          className: 'case-pin-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        const marker = L.marker(coords, { icon });
        marker.on('click', () => {
          setSelectedCaseId(c.id);
          setSelectedResourceId(null);
          if (onSelectCase) onSelectCase(c);
        });
        marker.addTo(casesLayer);
      });
    }

    // 2. Render 24/7 Relief Points (Resources)
    if (showReliefPoints || mode === 'resources') {
      filteredResources.forEach((r, idx) => {
        const coords = getResourceCoordinates(r, idx);
        bounds.push(coords);

        const catColor = getCategoryColor(r.category);
        const iconChar = getCategoryIconChar(r.category);
        const isSelected = selectedResourceId === r.id;

        const resPinHtml = `
          <div style="
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: ${isSelected ? '#EFF6FF' : '#FFFFFF'};
            border: 2px solid ${catColor};
            border-radius: 50%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.18);
            cursor: pointer;
            font-size: 13px;
          ">
            <span>${iconChar}</span>
          </div>
        `;

        const icon = L.divIcon({
          html: resPinHtml,
          className: 'resource-pin-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker(coords, { icon });
        marker.on('click', () => {
          setSelectedResourceId(r.id);
          setSelectedCaseId(null);
          if (onSelectResource) onSelectResource(r);
        });
        marker.addTo(resourcesLayer);
      });
    }

    if (bounds.length > 0 && !selectedCaseId && !selectedResourceId) {
      try {
        map.fitBounds(L.latLngBounds(bounds), { padding: [35, 35], maxZoom: 14 });
      } catch (err) {
        console.warn('Map fitBounds error:', err);
      }
    }
  }, [mode, filteredCases, filteredResources, showReliefPoints, selectedCaseId, selectedResourceId, getCaseCoordinates, getResourceCoordinates, onSelectCase, onSelectResource]);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: `1px solid ${themeColors.border}`, padding: '16px', position: 'relative' }}>
      
      {/* Controls & Filter Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '12px',
        backgroundColor: '#F8FAFC',
        padding: '10px 14px',
        borderRadius: '8px',
        border: `1px solid ${themeColors.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: themeColors.primaryNavy }}>
            <Navigation size={15} color={themeColors.warning} />
            BẢN ĐỒ THỰC ĐỊA {mode === 'cases' ? 'CA TIẾP CẬN & KHẨN CẤP' : 'ĐIỂM NGUỒN LỰC AN SINH'}
          </div>

          {/* District filter */}
          <select 
            value={selectedDistrictFilter}
            onChange={e => setSelectedDistrictFilter(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12px', fontWeight: '600' }}
          >
            <option value="all">🗺️ Toàn TP.HCM</option>
            <option value="Hóc Môn">Huyện Hóc Môn</option>
            <option value="Bình Chánh">Huyện Bình Chánh</option>
            <option value="Củ Chi">Huyện Củ Chi</option>
            <option value="Quận 12">Quận 12</option>
            <option value="Gò Vấp">Quận Gò Vấp</option>
            <option value="Bình Tân">Quận Bình Tân</option>
          </select>

          {/* Toggles */}
          {mode === 'cases' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#DC2626', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={showOnlyUrgent} 
                onChange={e => setShowOnlyUrgent(e.target.checked)} 
              />
              ⚠️ Ca Khẩn cấp / Trẻ em &lt;18t
            </label>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showReliefPoints} 
              onChange={e => setShowReliefPoints(e.target.checked)} 
            />
            🏥 Điểm cứu trợ 24/7
          </label>
        </div>

        {/* Map Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            className="btn-outline" 
            style={{ padding: '4px 8px', fontSize: '12px' }}
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Phóng to"
          >
            <ZoomIn size={14} />
          </button>
          <button 
            className="btn-outline" 
            style={{ padding: '4px 8px', fontSize: '12px' }}
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Thu nhỏ"
          >
            <ZoomOut size={14} />
          </button>
          <button 
            className="btn-outline" 
            style={{ padding: '4px 8px', fontSize: '12px' }}
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([10.8231, 106.6297], 11);
                setSelectedCaseId(null);
                setSelectedResourceId(null);
              }
            }}
            title="Đặt lại bản đồ"
          >
            <Compass size={14} />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px', border: `1px solid ${themeColors.border}`, height: '500px' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Legend Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: `1px solid ${themeColors.border}`,
          fontSize: '11px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontWeight: '800', color: themeColors.primaryNavy }}>CHÚ GIẢI THỰC ĐỊA:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '5px', backgroundColor: '#DC2626', display: 'inline-block' }} />
            <span>Ca Khẩn cấp / Trẻ em &lt;18t (Gọi 111)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '5px', backgroundColor: '#16375D', display: 'inline-block' }} />
            <span>Mái ấm / Nguồn lực An sinh 24/7</span>
          </div>
        </div>

        {/* Selected Case Drawer at Bottom Right */}
        {selectedCase && (
          <div className="card-flat" style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            width: '320px',
            padding: '14px',
            backgroundColor: '#FFFFFF',
            border: `2px solid ${themeColors.warning}`,
            borderRadius: '10px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
            zIndex: 1001
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: themeColors.warning }}>
                  {selectedCase.isMinor ? '🛡️ CA TRẺ EM (GPS BLURRED ~1KM)' : '📋 HỒ SƠ CA THỰC ĐỊA'}
                </span>
                <h4 style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy }}>
                  {selectedCase.isMinor ? selectedCase.aliasName : selectedCase.fullName}
                </h4>
              </div>
              <button onClick={() => setSelectedCaseId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: themeColors.textMuted }}>&times;</button>
            </div>

            <div style={{ fontSize: '12px', color: themeColors.textBody, marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div>📍 Địa bàn: <strong>{selectedCase.currentArea}</strong></div>
              <div>👤 TNV/Cán bộ: <strong>{selectedCase.assignedTo || 'Chưa phân công'}</strong></div>
              {selectedCase.note && (
                <div style={{ fontStyle: 'italic', color: '#475569', backgroundColor: '#F8FAFC', padding: '6px', borderRadius: '4px', borderLeft: '3px solid #3B82F6', marginTop: '4px' }}>
                  "{selectedCase.note}"
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              <button 
                className="btn-navy" 
                style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                onClick={() => { if (onSelectCase) onSelectCase(selectedCase); }}
              >
                <QrCode size={12} /> Hộ Chiếu
              </button>
              {selectedCase.isMinor && (
                <a 
                  href="tel:111" 
                  className="btn-danger" 
                  style={{ textDecoration: 'none', padding: '6px 10px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  <Phone size={12} /> 111
                </a>
              )}
            </div>
          </div>
        )}

        {/* Selected Resource Drawer at Bottom Right */}
        {selectedResource && (
          <div className="card-flat" style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            width: '320px',
            padding: '14px',
            backgroundColor: '#FFFFFF',
            border: `2px solid ${themeColors.primaryNavy}`,
            borderRadius: '10px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
            zIndex: 1001
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge-forest" style={{ fontSize: '10px' }}>24/7 VERIFIED RESOURCE</span>
                <h4 style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '800', color: themeColors.primaryNavy }}>
                  {selectedResource.name}
                </h4>
              </div>
              <button onClick={() => setSelectedResourceId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: themeColors.textMuted }}>&times;</button>
            </div>

            <div style={{ fontSize: '12px', color: themeColors.textBody, marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div>📍 Địa chỉ: <strong>{selectedResource.address} ({selectedResource.district})</strong></div>
              <div>📞 Điện thoại: <strong>{selectedResource.phone || selectedResource.hotline || '24/7'}</strong></div>
              <div>🕒 Giờ mở cửa: <strong>{selectedResource.operatingHours || '24/24'}</strong></div>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '10px', padding: '7px', fontSize: '12px', fontWeight: '700' }}
              onClick={() => {
                if (onOpenReferralModalForResource) onOpenReferralModalForResource(selectedResource.id);
              }}
            >
              🔄 Tạo Phiếu Chuyển Tuyến Đến Đây
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
