import React from 'react';
import { themeColors } from '@buoc-tiep/shared';
import {
  Building,
  MapPin,
  Phone,
  Clock,
  Globe,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  X,
  Navigation,
  Share2,
  Calendar
} from 'lucide-react';
import { ResourceRecord } from '../../types';
import { getCategoryLabel, getCategoryColor, getCategoryIconChar } from '../RealWelfareMap';

interface ResourceDetailModalProps {
  resource: ResourceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReferralModal?: (resourceId: string) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  onOpenReferralModal
}) => {
  if (!isOpen || !resource) return null;

  const catColor = getCategoryColor(resource.category);
  const catLabel = getCategoryLabel(resource.category);
  const iconChar = getCategoryIconChar(resource.category);
  const is24_7 = resource.is24Hours || resource.is_24_7;

  const googleMapsUrl = resource.latitude && resource.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${resource.latitude},${resource.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resource.address + ', ' + resource.district + ', TP.HCM')}`;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: `1px solid ${themeColors.border}`,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.18)'
      }}>
        {/* Header Banner */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${themeColors.border}`,
          backgroundColor: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase',
                color: catColor,
                backgroundColor: '#FFFFFF',
                padding: '3px 8px',
                borderRadius: '6px',
                border: `1px solid ${themeColors.border}`
              }}>
                {iconChar} {catLabel}
              </span>

              {resource.isVerified ? (
                <span className="badge-forest" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <CheckCircle2 size={12} /> Đã Kiểm Định Thực Địa
                </span>
              ) : (
                <span className="badge-saffron" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <AlertTriangle size={12} /> Chờ Thẩm Định Lại
                </span>
              )}

              {is24_7 && (
                <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FCA5A5' }}>
                  ⏰ 24/7
                </span>
              )}
            </div>

            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: themeColors.primaryNavy }}>
              {resource.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: themeColors.textMuted, padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px' }}>
          
          {/* Key Facts Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '10px', border: `1px solid ${themeColors.border}`, marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: themeColors.primaryNavy }}>
              <MapPin size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Địa chỉ:</strong> {resource.address}
                {resource.ward ? `, ${resource.ward}` : ''}, {resource.district}, TP. Hồ Chí Minh
                {resource.latitude && resource.longitude && (
                  <span style={{ display: 'block', fontSize: '11px', color: '#64748B', fontFamily: 'monospace', marginTop: '2px' }}>
                    Tọa độ GPS: {resource.latitude.toFixed(4)}, {resource.longitude.toFixed(4)}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: themeColors.primaryNavy }}>
              <Phone size={16} color="#16A34A" style={{ flexShrink: 0 }} />
              <div>
                <strong>Điện thoại:</strong>{' '}
                {resource.phone || resource.hotline ? (
                  <a href={`tel:${resource.phone || resource.hotline}`} style={{ color: '#2563EB', fontWeight: '700', textDecoration: 'none' }}>
                    {resource.phone || resource.hotline}
                  </a>
                ) : (
                  <span style={{ color: themeColors.textMuted }}>Chưa công khai</span>
                )}
                {resource.hotline && resource.phone && (
                  <span style={{ marginLeft: '8px', color: '#DC2626', fontWeight: '700' }}>
                    (Hotline: {resource.hotline})
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: themeColors.primaryNavy }}>
              <Clock size={16} color="#D97706" style={{ flexShrink: 0 }} />
              <div>
                <strong>Giờ phục vụ:</strong> {resource.operatingHours || (is24_7 ? 'Phục vụ 24/24' : 'Giờ hành chính')}
              </div>
            </div>

            {resource.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: themeColors.primaryNavy }}>
                <Mail size={16} color="#7C3AED" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${resource.email}`} style={{ color: '#2563EB', textDecoration: 'none' }}>
                    {resource.email}
                  </a>
                </div>
              </div>
            )}

            {resource.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: themeColors.primaryNavy }}>
                <Globe size={16} color="#0284C7" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Website:</strong>{' '}
                  <a href={resource.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    {resource.website} <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Description & Notes */}
          {resource.description && (
            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '800', color: themeColors.primaryNavy }}>
                Mô tả Dịch vụ & Năng lực Tiếp nhận
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: themeColors.textBody, lineHeight: 1.5, backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${themeColors.border}` }}>
                {resource.description}
              </p>
            </div>
          )}

          {/* Verification Audit Info */}
          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '12px', color: '#1E40AF', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Bảo chứng BƯỚC TIẾP:</strong> Đã qua thẩm định thực địa bởi Cán bộ Công tác Xã hội. Có thể tiếp nhận chuyển tuyến theo chuẩn Nghị định 20/2021/NĐ-CP (Mẫu số 07).
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                textDecoration: 'none',
                color: themeColors.primaryNavy
              }}
            >
              <Navigation size={16} /> Mở Bản Đồ Chỉ Đường
            </a>

            <button
              onClick={() => {
                onClose();
                if (onOpenReferralModal) onOpenReferralModal(resource.id);
              }}
              className="btn-navy"
              style={{
                flex: 1.2,
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              🔄 Tạo Phiếu Chuyển Tuyến Đến Đây
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
