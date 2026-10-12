import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { themeColors } from '@buoc-tiep/shared';
import {
  Navigation,
  ZoomIn,
  ZoomOut,
  Compass,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Building,
  HeartHandshake,
  Crosshair,
  Layers,
  Info
} from 'lucide-react';
import { ResourceRecord, CaseRecord } from '../types';

export interface RealWelfareMapProps {
  resources: ResourceRecord[];
  selectedResourceId?: string | null;
  onSelectResource?: (resource: ResourceRecord) => void;
  onOpenReferralModal?: (resourceId: string) => void;
  onOpenDetailModal?: (resource: ResourceRecord) => void;
  userLocation?: { lat: number; lng: number } | null;
  onUpdateUserLocation?: (loc: { lat: number; lng: number }) => void;
  height?: string | number;
  showFiltersToolbar?: boolean;
}

// Fallback HCMC District Coordinates if lat/lng is missing
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

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const getCategoryIconChar = (category: string) => {
  switch (category) {
    case 'medical': return '🏥';
    case 'shelter': return '🏠';
    case 'food': return '🍲';
    case 'employment': return '💼';
    case 'legal': return '⚖️';
    default: return '📍';
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'medical': return '#DC2626'; // Red
    case 'shelter': return '#16375D'; // Navy
    case 'food': return '#16A34A'; // Green
    case 'employment': return '#D97706'; // Amber
    case 'legal': return '#7C3AED'; // Purple
    default: return '#0284C7'; // Blue
  }
};

export const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'medical': return 'Y tế & Cấp cứu';
    case 'shelter': return 'Mái ấm & Lưu trú';
    case 'food': return 'Cứu trợ Thực phẩm';
    case 'employment': return 'Việc làm & Sinh kế';
    case 'legal': return 'Trợ giúp Pháp lý';
    default: return 'Nguồn lực An sinh';
  }
};

export function RealWelfareMap({
  resources,
  selectedResourceId,
  onSelectResource,
  onOpenReferralModal,
  onOpenDetailModal,
  userLocation,
  onUpdateUserLocation,
  height = '560px'
}: RealWelfareMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [isLocating, setIsLocating] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [only247, setOnly247] = useState(false);
  const [onlyEmergency, setOnlyEmergency] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Helper to extract valid coords with jitter fallback
  const getResourceCoords = useCallback((r: ResourceRecord, index: number): [number, number] => {
    if (r.latitude !== null && r.latitude !== undefined && r.longitude !== null && r.longitude !== undefined) {
      return [Number(r.latitude), Number(r.longitude)];
    }
    const districtKey = Object.keys(DISTRICT_FALLBACK_COORDS).find(k =>
      (r.district || '').toLowerCase().includes(k.toLowerCase()) ||
      (r.address || '').toLowerCase().includes(k.toLowerCase())
    ) || 'Default';
    const base = DISTRICT_FALLBACK_COORDS[districtKey];
    // Deterministic small jitter so non-geocoded markers don't overlap completely
    const angle = (index * 137.5) * (Math.PI / 180);
    const radius = 0.003 + (index % 5) * 0.0015;
    return [base.lat + Math.sin(angle) * radius, base.lng + Math.cos(angle) * radius];
  }, []);

  // Filter resources based on internal map toggles
  const displayedResources = resources.filter(r => {
    if (activeCategoryFilter !== 'all' && r.category !== activeCategoryFilter) return false;
    if (only247 && !r.is24Hours && !r.is_24_7) return false;
    if (onlyEmergency && !r.emergencySupport) return false;
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const hcmCenter: [number, number] = [10.8231, 106.6297]; // HCMC geographic mid-point
    const map = L.map(mapContainerRef.current, {
      center: hcmCenter,
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false, // We render clean accessible custom controls
    });

    // High quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | BƯỚC TIẾP UNESCO 2026'
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;
    setMapLoaded(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      markerMapRef.current.clear();
    };
  }, []);

  // Render & Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markerMapRef.current.clear();

    const bounds: L.LatLngExpression[] = [];

    displayedResources.forEach((res, index) => {
      const coords = getResourceCoords(res, index);
      bounds.push(coords);

      const isSelected = selectedResourceId === res.id;
      const catColor = getCategoryColor(res.category);
      const iconChar = getCategoryIconChar(res.category);
      const is24_7 = res.is24Hours || res.is_24_7;

      // Custom Clean HTML Pin
      const customPinHtml = `
        <div class="welfare-map-pin ${isSelected ? 'is-selected' : ''}" style="
          position: relative;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: ${isSelected ? '#1E40AF' : '#FFFFFF'};
          border: 2.5px solid ${catColor};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 8px rgba(0,0,0,0.22);
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          <span style="
            transform: rotate(45deg);
            font-size: 16px;
            display: block;
            line-height: 1;
          ">${iconChar}</span>
          ${is24_7 ? `
            <div style="
              position: absolute;
              top: -6px;
              right: -6px;
              background-color: #EF4444;
              color: #FFFFFF;
              font-size: 8px;
              font-weight: 900;
              padding: 1px 3px;
              border-radius: 4px;
              transform: rotate(45deg);
              border: 1px solid #FFFFFF;
              box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            ">24/7</div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: customPinHtml,
        className: 'custom-welfare-marker',
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38]
      });

      const marker = L.marker(coords, { icon: customIcon });

      // Build rich interactive popup
      const distText = userLocation
        ? `<div style="display:inline-flex; align-items:center; gap:3px; background:#EFF6FF; color:#1D4ED8; padding:2px 6px; border-radius:4px; font-weight:700; font-size:11px; margin-top:4px;">
            <span>📍 Cách bạn:</span> <strong>${calculateHaversineDistanceKm(userLocation.lat, userLocation.lng, coords[0], coords[1])} km</strong>
          </div>`
        : '';

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 250px; max-width: 290px; color: #0F172A; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${catColor}; background: #F8FAFC; padding: 2px 6px; border-radius: 4px; border: 1px solid #E2E8F0;">
              ${getCategoryLabel(res.category)}
            </span>
            ${res.isVerified ? `
              <span style="font-size: 10px; font-weight: 700; color: #16A34A; display: inline-flex; align-items: center; gap: 2px;">
                ✓ ĐÃ XÁC MINH
              </span>
            ` : `
              <span style="font-size: 10px; font-weight: 700; color: #D97706;">
                ⏳ CHỜ THẨM ĐỊNH
              </span>
            `}
          </div>

          <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 800; color: #16375D; line-height: 1.3;">
            ${res.name}
          </h4>

          <div style="font-size: 12px; color: #334155; margin-bottom: 4px; display: flex; align-items: flex-start; gap: 4px;">
            <span>📍</span>
            <span>${res.address} <strong>(${res.district})</strong></span>
          </div>

          ${res.phone || res.hotline ? `
            <div style="font-size: 12px; color: #334155; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span>📞</span>
              <a href="tel:${res.phone || res.hotline}" style="color: #2563EB; font-weight: 700; text-decoration: none;">
                ${res.phone || res.hotline}
              </a>
            </div>
          ` : ''}

          <div style="font-size: 11.5px; color: #64748B; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
            <span>🕒</span>
            <span>${res.operatingHours || (is24_7 ? 'Phục vụ 24/24' : 'Giờ hành chính')}</span>
          </div>

          ${distText}

          <div style="display: flex; gap: 6px; margin-top: 10px; padding-top: 8px; border-top: 1px solid #E2E8F0;">
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="flex: 1; text-align: center; background-color: #F1F5F9; color: #1E293B; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-decoration: none; border: 1px solid #CBD5E1;"
            >
              🗺️ Chỉ đường
            </a>
            <button 
              id="btn-popup-referral-${res.id}" 
              style="flex: 1.2; background-color: #16375D; color: #FFFFFF; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;"
            >
              🔄 Chuyển Tuyến
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 320,
        className: 'welfare-custom-popup'
      });

      marker.on('click', () => {
        if (onSelectResource) onSelectResource(res);
      });

      marker.on('popupopen', () => {
        const btnRef = document.getElementById(`btn-popup-referral-${res.id}`);
        if (btnRef && onOpenReferralModal) {
          btnRef.onclick = (e) => {
            e.stopPropagation();
            onOpenReferralModal(res.id);
          };
        }
      });

      marker.addTo(layer);
      markerMapRef.current.set(res.id, marker);
    });

    // Auto-fit bounds if we have valid markers
    if (bounds.length > 0 && !selectedResourceId) {
      try {
        map.fitBounds(L.latLngBounds(bounds), {
          padding: [40, 40],
          maxZoom: 14
        });
      } catch (err) {
        console.warn('[Map] Fit bounds error:', err);
      }
    }
  }, [displayedResources, selectedResourceId, getResourceCoords, userLocation, onSelectResource, onOpenReferralModal]);

  // Center on selected resource
  useEffect(() => {
    if (!selectedResourceId || !mapInstanceRef.current) return;
    const marker = markerMapRef.current.get(selectedResourceId);
    if (marker) {
      const latLng = marker.getLatLng();
      mapInstanceRef.current.flyTo(latLng, 15, { duration: 0.8 });
      marker.openPopup();
    }
  }, [selectedResourceId]);

  // Handle Geolocation
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (onUpdateUserLocation) onUpdateUserLocation(loc);

        const map = mapInstanceRef.current;
        if (map) {
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([loc.lat, loc.lng]);
          } else {
            const userIconHtml = `
              <div style="
                width: 22px;
                height: 22px;
                background-color: #2563EB;
                border: 3px solid #FFFFFF;
                border-radius: 50%;
                box-shadow: 0 0 0 6px rgba(37,99,235,0.3), 0 2px 6px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
              "></div>
            `;
            const userIcon = L.divIcon({
              html: userIconHtml,
              className: 'user-loc-marker',
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            });
            userMarkerRef.current = L.marker([loc.lat, loc.lng], { icon: userIcon })
              .bindPopup('<strong>📍 Vị trí hiện tại của bạn</strong>')
              .addTo(map);
          }
          map.flyTo([loc.lat, loc.lng], 14, { duration: 1.0 });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Không lấy được vị trí GPS:', err.message);
        // Fallback to center HCMC
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([10.8231, 106.6297], 12);
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleResetMap = () => {
    if (mapInstanceRef.current && displayedResources.length > 0) {
      const bounds = displayedResources.map((res, i) => getResourceCoords(res, i));
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${themeColors.border}`, backgroundColor: '#F8FAFC' }}>
      
      {/* Top Map Quick Control Bar */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        {/* Category Filters Pills */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          padding: '4px 6px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          pointerEvents: 'auto',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          maxWidth: 'calc(100% - 60px)'
        }}>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'medical', label: '🏥 Y tế' },
            { id: 'shelter', label: '🏠 Mái ấm' },
            { id: 'food', label: '🍲 Bếp ăn' },
            { id: 'employment', label: '💼 Việc làm' },
            { id: 'legal', label: '⚖️ Pháp lý' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id)}
              style={{
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: activeCategoryFilter === tab.id ? '800' : '600',
                backgroundColor: activeCategoryFilter === tab.id ? '#16375D' : 'transparent',
                color: activeCategoryFilter === tab.id ? '#FFFFFF' : '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 24/7 and Emergency Toggles */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          padding: '4px 8px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          pointerEvents: 'auto'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: '700', color: '#DC2626', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={only247} 
              onChange={e => setOnly247(e.target.checked)} 
            />
            ⏰ 24/7
          </label>
          <div style={{ width: '1px', height: '14px', backgroundColor: '#CBD5E1' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: '700', color: '#16375D', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={onlyEmergency} 
              onChange={e => setOnlyEmergency(e.target.checked)} 
            />
            🚨 Khẩn cấp
          </label>
        </div>
      </div>

      {/* Floating Action Controls on Right Side */}
      <div style={{
        position: 'absolute',
        top: '64px',
        right: '12px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <button
          onClick={handleLocateUser}
          disabled={isLocating}
          title="Định vị GPS của tôi"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
          }}
        >
          <Crosshair size={18} className={isLocating ? 'animate-spin' : ''} />
        </button>

        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          title="Phóng to"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
          }}
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          title="Thu nhỏ"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
          }}
        >
          <ZoomOut size={18} />
        </button>

        <button
          onClick={handleResetMap}
          title="Đặt lại góc nhìn"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
          }}
        >
          <Compass size={18} />
        </button>
      </div>

      {/* Map Legend Overlay at Bottom Left */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        fontSize: '11px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        maxWidth: '260px'
      }}>
        <div style={{ fontWeight: '800', color: '#16375D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>BẢN ĐỒ THỰC ĐỊA TP.HCM</span>
          <span style={{ color: '#2563EB', fontWeight: '900' }}>{displayedResources.length} điểm</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#DC2626' }}>🏥</span> <span>Y tế cấp cứu</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#16375D' }}>🏠</span> <span>Mái ấm lưu trú</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#16A34A' }}>🍲</span> <span>Cứu trợ thực phẩm</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#D97706' }}>💼</span> <span>Việc làm sinh kế</span>
          </div>
        </div>
      </div>

      {/* Actual Leaflet DOM Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '380px' }} />
    </div>
  );
}
