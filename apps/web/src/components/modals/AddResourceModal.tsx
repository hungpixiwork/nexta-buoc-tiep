import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { Building, MapPin, Phone, Clock, Globe, Mail, ShieldCheck, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ResourceRecord } from '../../types';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newResource: Partial<ResourceRecord>) => Promise<boolean | void>;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'medical' | 'legal' | 'shelter' | 'employment' | 'food' | 'general'>('medical');
  const [district, setDistrict] = useState('Hóc Môn');
  const [ward, setWard] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [hotline, setHotline] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [operatingHours, setOperatingHours] = useState('24/7 (Phục vụ liên tục)');
  const [is24Hours, setIs24Hours] = useState(true);
  const [latitude, setLatitude] = useState<string>('10.8872');
  const [longitude, setLongitude] = useState<string>('106.5925');
  const [acceptsReferral, setAcceptsReferral] = useState(true);
  const [emergencySupport, setEmergencySupport] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên cơ sở nguồn lực');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ cụ thể');
      return;
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setErrorMessage('Vĩ độ (Latitude) không hợp lệ (từ -90 đến 90)');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setErrorMessage('Kinh độ (Longitude) không hợp lệ (từ -180 đến 180)');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        name: name.trim(),
        category,
        district,
        ward: ward.trim() || undefined,
        city: 'TP. Hồ Chí Minh',
        province: 'TP. Hồ Chí Minh',
        address: address.trim(),
        phone: phone.trim() || undefined,
        hotline: hotline.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        latitude: latNum,
        longitude: lngNum,
        operatingHours: operatingHours.trim() || undefined,
        is24Hours,
        is_24_7: is24Hours,
        verificationStatus: 'VERIFIED',
        isVerified: true,
        acceptsReferral,
        emergencySupport,
        description: description.trim() || undefined
      });
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      setErrorMessage(err.message || 'Lỗi khi lưu nguồn lực vào cơ sở dữ liệu');
    }
  };

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
        borderRadius: '12px',
        maxWidth: '650px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: `1px solid ${themeColors.border}`,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: `1px solid ${themeColors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F8FAFC'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} color="#2563EB" />
              Thêm Địa Điểm Nguồn Lực An Sinh Mới
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: themeColors.textMuted }}>
              Điểm cứu trợ thực tế có tọa độ địa lý, tiếp nhận chuyển tuyến Form 07
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: themeColors.textMuted, padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {errorMessage && (
            <div style={{
              marginBottom: '16px',
              padding: '10px 14px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#B91C1C',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px' }}>
                Tên Cơ sở / Nguồn lực *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Trạm Y tế Xã Bà Điểm"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px' }}>
                Phân loại dịch vụ *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', backgroundColor: '#FFF' }}
              >
                <option value="medical">🏥 Y tế & Cấp cứu</option>
                <option value="shelter">🏠 Mái ấm & Lưu trú</option>
                <option value="food">🍲 Bếp ăn & Cứu trợ thực phẩm</option>
                <option value="employment">💼 Việc làm & Sinh kế</option>
                <option value="legal">⚖️ Trợ giúp Pháp lý</option>
                <option value="general">📍 Nguồn lực Tổng hợp</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px' }}>
                Quận / Huyện *
              </label>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', backgroundColor: '#FFF' }}
              >
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
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px' }}>
                Phường / Xã
              </label>
              <input
                type="text"
                placeholder="VD: Xã Bà Điểm / Phường Tân Thới Nhất"
                value={ward}
                onChange={e => setWard(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px' }}>
              Địa chỉ chi tiết *
            </label>
            <input
              type="text"
              required
              placeholder="VD: 54 Phan Văn Hớn, Ấp Tiền Lân, Xã Bà Điểm"
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px' }}
            />
          </div>

          {/* Coordinates Lat / Lng with helper presets */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${themeColors.border}`, marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="#2563EB" />
                Tọa độ Địa lý (GPS WGS84)
              </span>
              <span style={{ fontSize: '11px', color: themeColors.textMuted }}>Dùng để ghim chính xác trên bản đồ</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: themeColors.textBody, marginBottom: '2px' }}>
                  Vĩ độ (Latitude: 10.xxxx) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="10.8872"
                  value={latitude}
                  onChange={e => setLatitude(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: themeColors.textBody, marginBottom: '2px' }}>
                  Kinh độ (Longitude: 106.xxxx) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="106.5925"
                  value={longitude}
                  onChange={e => setLongitude(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px' }}>
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                placeholder="VD: 028 3891 0111"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px' }}>
                Hotline Khẩn cấp
              </label>
              <input
                type="text"
                placeholder="VD: 115 / 111 / 1022"
                value={hotline}
                onChange={e => setHotline(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px' }}>
                Giờ hoạt động
              </label>
              <input
                type="text"
                placeholder="VD: 24/7 hoặc 08:00 - 17:00"
                value={operatingHours}
                onChange={e => setOperatingHours(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px' }}>
                Email / Website
              </label>
              <input
                type="text"
                placeholder="contact@donvi.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', padding: '10px 12px', backgroundColor: '#EFF6FF', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: themeColors.primaryNavy, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={is24Hours}
                onChange={e => setIs24Hours(e.target.checked)}
              />
              ⏰ Phục vụ 24/7 liên tục
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: '#166534', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={acceptsReferral}
                onChange={e => setAcceptsReferral(e.target.checked)}
              />
              ✓ Tiếp nhận chuyển tuyến Form 07
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: '#DC2626', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emergencySupport}
                onChange={e => setEmergencySupport(e.target.checked)}
              />
              🚨 Hỗ trợ khẩn cấp P0
            </label>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px' }}>
              Mô tả dịch vụ & Ghi chú hỗ trợ
            </label>
            <textarea
              rows={3}
              placeholder="VD: Cung cấp chỗ ở miễn phí, tư vấn tâm lý và phát thuốc thiết yếu..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px' }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${themeColors.border}`, paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-navy"
              style={{ padding: '8px 20px', fontSize: '13px', fontWeight: '700' }}
            >
              {submitting ? 'Đang lưu vào D1...' : '✓ Lưu Nguồn Lực'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
