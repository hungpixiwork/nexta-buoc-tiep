import React from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { Camera, Mic, Compass, ShieldAlert, MapPin, Utensils, HeartPulse, Home, Send, Check, X, FileText } from 'lucide-react';

interface VoiceIntakeModalProps {
  show: boolean;
  intakeTab: 'photo_gps' | 'voice_ai';
  setIntakeTab: (tab: 'photo_gps' | 'voice_ai') => void;
  intakePhotoUrl: string;
  setIntakePhotoUrl: (url: string) => void;
  intakeGps: { lat: number; lng: number };
  setIntakeGps: (gps: { lat: number; lng: number }) => void;
  intakeNeedCategories: string[];
  setIntakeNeedCategories: (cats: any[]) => void;
  intakeNote: string;
  setIntakeNote: (note: string) => void;
  voiceForm: any;
  setVoiceForm: React.Dispatch<React.SetStateAction<any>>;
  transcript: string;
  isRecording: boolean;
  actionLoading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  toggleNeedCategory: (category: 'food' | 'medical' | 'shelter_job' | 'sos111') => void;
  startSimulation: (type: 'lan' | 'hoang') => void;
}

export const VoiceIntakeModal: React.FC<VoiceIntakeModalProps> = ({
  show,
  intakeTab,
  setIntakeTab,
  intakePhotoUrl,
  setIntakePhotoUrl,
  intakeGps,
  setIntakeGps,
  intakeNeedCategories,
  setIntakeNeedCategories,
  intakeNote,
  setIntakeNote,
  voiceForm,
  setVoiceForm,
  transcript,
  isRecording,
  actionLoading,
  onClose,
  onSubmit,
  toggleNeedCategory,
  startSimulation
}) => {
  if (!show) return null;

  const isMinorCase = Number(voiceForm.age) < 18 || intakeNeedCategories.includes('sos111') || voiceForm.vulnerabilityGroup === 'youth';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px'
      }}
    >
      <div
        className="card-flat"
        style={{
          maxWidth: '880px',
          width: '100%',
          padding: '0',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: `2px solid ${isMinorCase ? themeColors.danger : themeColors.primaryNavy}`,
          boxSizing: 'border-box'
        }}
      >
        {/* Fixed Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${themeColors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            backgroundColor: '#FFFFFF'
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                color: themeColors.primaryNavy,
                fontSize: '17px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {intakeTab === 'photo_gps' ? <Camera size={20} color="#2563EB" /> : <Mic size={20} color="#D97706" />}
              <span>Tiếp Nhận Ca Cứu Trợ Thực Địa</span>
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: themeColors.textMuted }}>
              Hỗ trợ 2 chế độ tiếp nhận: <strong>Báo qua Ảnh & GPS</strong> hoặc <strong>Giọng nói AI</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: '#F1F5F9',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: themeColors.textMuted,
              padding: 0,
              lineHeight: 1,
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Dual Mode Switcher Bar */}
        <div style={{ padding: '10px 20px 0 20px', flexShrink: 0, backgroundColor: '#FFFFFF' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              backgroundColor: '#F1F5F9',
              padding: '4px',
              borderRadius: '8px',
              border: `1px solid ${themeColors.border}`
            }}
          >
            <button
              type="button"
              onClick={() => setIntakeTab('photo_gps')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                backgroundColor: intakeTab === 'photo_gps' ? '#16375D' : 'transparent',
                color: intakeTab === 'photo_gps' ? '#FFFFFF' : themeColors.textBody,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: intakeTab === 'photo_gps' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Camera size={15} style={{ flexShrink: 0 }} />
              <span>Chế Độ 1: Ảnh & GPS Thực Địa</span>
            </button>

            <button
              type="button"
              onClick={() => setIntakeTab('voice_ai')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                backgroundColor: intakeTab === 'voice_ai' ? '#D97706' : 'transparent',
                color: intakeTab === 'voice_ai' ? '#FFFFFF' : themeColors.textBody,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: intakeTab === 'voice_ai' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Mic size={15} style={{ flexShrink: 0 }} />
              <span>Chế Độ 2: Giọng Nói AI (Trợ Lý)</span>
            </button>
          </div>
        </div>

        {/* Main Form Wrapping Scrollable Body & Fixed Footer */}
        <form
          onSubmit={onSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          {/* Scrollable Body */}
          <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {/* Mode 1: Photo & GPS Intake */}
            {intakeTab === 'photo_gps' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Step 1: Photo Intake */}
                <div style={{ backgroundColor: '#F8FAFC', border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={15} color="#2563EB" style={{ flexShrink: 0 }} />
                    <span>BƯỚC 1: CHỤP / TẢI ẢNH HIỆN TRƯỜNG THỰC ĐỊA</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '150px', height: '100px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#E2E8F0', border: `2px dashed ${themeColors.borderDark}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                      {intakePhotoUrl ? (
                        <img src={intakePhotoUrl} alt="Ảnh chụp hiện trường" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', color: themeColors.textMuted, padding: '8px', fontSize: '11.5px' }}>Chưa chọn ảnh</div>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <label
                          className="btn-navy"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: '#16375D',
                            color: '#FFFFFF',
                            borderRadius: '6px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          <Camera size={14} style={{ flexShrink: 0 }} /> Chụp / Chọn ảnh từ thiết bị
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (uploadEvent) => {
                                  if (uploadEvent.target?.result) {
                                    setIntakePhotoUrl(uploadEvent.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <span style={{ fontSize: '12px', color: themeColors.textMuted, whiteSpace: 'nowrap' }}>hoặc chọn mẫu thực địa:</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ fontSize: '11.5px', padding: '4px 8px', backgroundColor: intakePhotoUrl.includes('photo-1544717305') ? '#EFF6FF' : '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}
                          onClick={() => {
                            setIntakePhotoUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80');
                            setVoiceForm((prev: any) => ({ ...prev, name: 'Em Hoàng (15t)', age: '15', location: 'Bến xe An Sương, Hóc Môn', vulnerabilityGroup: 'youth' }));
                            setIntakeNeedCategories(['food', 'medical', 'sos111']);
                            setIntakeNote('Gặp em lang thang bến xe An Sương 2 ngày, đói mệt, trầy chân nhẹ, cần SOS 111.');
                          }}
                        >
                          Bến xe An Sương (Trẻ em)
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ fontSize: '11.5px', padding: '4px 8px', backgroundColor: intakePhotoUrl.includes('photo-1534528741775') ? '#EFF6FF' : '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}
                          onClick={() => {
                            setIntakePhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80');
                            setVoiceForm((prev: any) => ({ ...prev, name: 'Cô Lan (62t)', age: '62', location: 'Ngã tư Thị trấn Hóc Môn', vulnerabilityGroup: 'elderly' }));
                            setIntakeNeedCategories(['food', 'shelter_job']);
                            setIntakeNote('Bán vé số kiệt sức gối sưng, cần hỗ trợ bữa ăn và chỗ ở tạm.');
                          }}
                        >
                          Ngã tư Hóc Môn (Người già)
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ fontSize: '11.5px', padding: '4px 8px', backgroundColor: intakePhotoUrl.includes('photo-1507003211169') ? '#EFF6FF' : '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}
                          onClick={() => {
                            setIntakePhotoUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80');
                            setVoiceForm((prev: any) => ({ ...prev, name: 'Bác Chín (58t)', age: '58', location: 'Vĩnh Lộc B, Bình Chánh', vulnerabilityGroup: 'street_worker' }));
                            setIntakeNeedCategories(['medical', 'shelter_job']);
                            setIntakeNote('Thợ hồ mất việc 3 tuần, đau khớp lưng, cần khám y tế và việc làm nhẹ.');
                          }}
                        >
                          Chợ Q.12 (Lao động tự do)
                        </button>
                      </div>
                      <input
                        type="text"
                        value={intakePhotoUrl}
                        onChange={e => setIntakePhotoUrl(e.target.value)}
                        placeholder="Nhập đường dẫn URL ảnh hiện trường..."
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Real GPS Location */}
                <div style={{ backgroundColor: '#F8FAFC', border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={15} color="#DC2626" style={{ flexShrink: 0 }} />
                      <span>BƯỚC 2: VỊ TRÍ GPS VÀ ĐỊA BÀN THỰC ĐỊA</span>
                    </div>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#1E40AF',
                        borderColor: '#BFDBFE',
                        backgroundColor: '#EFF6FF',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                      onClick={() => {
                        if (!navigator.geolocation) {
                          alert('Trình duyệt không hỗ trợ Geolocation API.');
                          return;
                        }
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const lat = Number(pos.coords.latitude.toFixed(6));
                            const lng = Number(pos.coords.longitude.toFixed(6));
                            setIntakeGps({ lat, lng });
                            if (!voiceForm.location || voiceForm.location.trim() === '') {
                              setVoiceForm((prev: any) => ({ ...prev, location: `Tọa độ GPS thực địa (${lat}, ${lng})` }));
                            }
                            alert(`Đã nhận tọa độ GPS thực địa từ thiết bị:\nLat: ${lat}\nLng: ${lng}\nĐộ chính xác: ±${Math.round(pos.coords.accuracy)}m`);
                          },
                          (err) => {
                            let msg = 'Không thể lấy tọa độ GPS.';
                            if (err.code === 1) msg = 'Quyền truy cập vị trí (GPS) bị từ chối trên thiết bị. Vui lòng cho phép quyền vị trí trong cài đặt trình duyệt hoặc nhập tọa độ thủ công.';
                            else if (err.code === 2) msg = 'Vị trí không khả dụng. Vui lòng kiểm tra kết nối GPS.';
                            else if (err.code === 3) msg = 'Quá thời gian yêu cầu vị trí GPS.';
                            alert(msg);
                          },
                          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                      }}
                    >
                      <Compass size={13} style={{ flexShrink: 0 }} /> Tự động lấy GPS hiện tại
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Tên Địa bàn / Địa chỉ thực địa</label>
                      <input
                        type="text"
                        required
                        value={voiceForm.location}
                        onChange={e => setVoiceForm({ ...voiceForm, location: e.target.value })}
                        placeholder="VD: Bến xe An Sương, Thị trấn Hóc Môn..."
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Tọa độ GPS Lat/Lng</label>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <input
                          type="number"
                          step="any"
                          value={intakeGps.lat}
                          onChange={e => setIntakeGps({ ...intakeGps, lat: parseFloat(e.target.value) || 10.8833 })}
                          style={{ width: '100%', padding: '7px 6px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                        />
                        <input
                          type="number"
                          step="any"
                          value={intakeGps.lng}
                          onChange={e => setIntakeGps({ ...intakeGps, lng: parseFloat(e.target.value) || 106.5944 })}
                          style={{ width: '100%', padding: '7px 6px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: 4 Need Categories */}
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', color: themeColors.primaryNavy, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={15} color="#2563EB" style={{ flexShrink: 0 }} />
                    <span>BƯỚC 3: CHỌN NHANH 4 THẺ PHÂN LOẠI NHU CẦU</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {/* Card 1: Cơm / Nước */}
                    <div
                      onClick={() => toggleNeedCategory('food')}
                      style={{
                        padding: '10px 8px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                        backgroundColor: intakeNeedCategories.includes('food') ? '#DCFCE7' : '#F8FAFC',
                        border: intakeNeedCategories.includes('food') ? '2px solid #16A34A' : `1px solid ${themeColors.border}`,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3px' }}>
                        <Utensils size={18} color={intakeNeedCategories.includes('food') ? '#15803D' : '#64748B'} />
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '11.5px', color: intakeNeedCategories.includes('food') ? '#15803D' : themeColors.textBody, whiteSpace: 'nowrap' }}>CƠM / NƯỚC</div>
                      <div style={{ fontSize: '10px', color: themeColors.textMuted, marginTop: '2px', whiteSpace: 'nowrap' }}>Nhu yếu phẩm khẩn</div>
                    </div>

                    {/* Card 2: Y tế */}
                    <div
                      onClick={() => toggleNeedCategory('medical')}
                      style={{
                        padding: '10px 8px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                        backgroundColor: intakeNeedCategories.includes('medical') ? '#FEE2E2' : '#F8FAFC',
                        border: intakeNeedCategories.includes('medical') ? '2px solid #DC2626' : `1px solid ${themeColors.border}`,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3px' }}>
                        <HeartPulse size={18} color={intakeNeedCategories.includes('medical') ? '#B91C1C' : '#64748B'} />
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '11.5px', color: intakeNeedCategories.includes('medical') ? '#B91C1C' : themeColors.textBody, whiteSpace: 'nowrap' }}>Y TẾ / THUỐC</div>
                      <div style={{ fontSize: '10px', color: themeColors.textMuted, marginTop: '2px', whiteSpace: 'nowrap' }}>Sơ cứu & Chăm sóc</div>
                    </div>

                    {/* Card 3: Trọ / Việc */}
                    <div
                      onClick={() => toggleNeedCategory('shelter_job')}
                      style={{
                        padding: '10px 8px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                        backgroundColor: intakeNeedCategories.includes('shelter_job') ? '#FEF3C7' : '#F8FAFC',
                        border: intakeNeedCategories.includes('shelter_job') ? '2px solid #D97706' : `1px solid ${themeColors.border}`,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3px' }}>
                        <Home size={18} color={intakeNeedCategories.includes('shelter_job') ? '#B45309' : '#64748B'} />
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '11.5px', color: intakeNeedCategories.includes('shelter_job') ? '#B45309' : themeColors.textBody, whiteSpace: 'nowrap' }}>TRỌ / VIỆC LÀM</div>
                      <div style={{ fontSize: '10px', color: themeColors.textMuted, marginTop: '2px', whiteSpace: 'nowrap' }}>Nơi ở & Việc nhẹ</div>
                    </div>

                    {/* Card 4: SOS 111 */}
                    <div
                      onClick={() => toggleNeedCategory('sos111')}
                      style={{
                        padding: '10px 8px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                        backgroundColor: intakeNeedCategories.includes('sos111') ? '#FEE2E2' : '#F8FAFC',
                        border: intakeNeedCategories.includes('sos111') ? '2px solid #EF4444' : `1px solid ${themeColors.border}`,
                        boxShadow: intakeNeedCategories.includes('sos111') ? '0 0 8px rgba(239,68,68,0.3)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3px' }}>
                        <ShieldAlert size={18} color={intakeNeedCategories.includes('sos111') ? '#DC2626' : '#64748B'} />
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '11.5px', color: intakeNeedCategories.includes('sos111') ? '#DC2626' : themeColors.textBody, whiteSpace: 'nowrap' }}>SOS 111</div>
                      <div style={{ fontSize: '10px', color: themeColors.danger, fontWeight: '700', marginTop: '2px', whiteSpace: 'nowrap' }}>Bảo vệ khẩn cấp</div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Simple 1-Line Emergency Note */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color="#2563EB" style={{ flexShrink: 0 }} />
                    <span>BƯỚC 4: GHI CHÚ QUAN SÁT THỰC ĐỊA</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={intakeNote}
                    onChange={e => setIntakeNote(e.target.value)}
                    placeholder="VD: Gặp tại bến xe An Sương 2 ngày, đói mệt và chân bị thương nhẹ..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Step 5: Name / Alias & Age */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.2fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Họ và tên / Alias đối tượng</label>
                    <input
                      type="text"
                      required
                      value={voiceForm.name}
                      onChange={e => setVoiceForm({ ...voiceForm, name: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Tuổi</label>
                    <input
                      type="number"
                      required
                      value={voiceForm.age}
                      onChange={e => setVoiceForm({ ...voiceForm, age: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Nhóm đối tượng</label>
                    <select
                      value={voiceForm.vulnerabilityGroup}
                      onChange={e => setVoiceForm({ ...voiceForm, vulnerabilityGroup: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', marginTop: '4px', backgroundColor: '#FFF', boxSizing: 'border-box' }}
                    >
                      <option value="youth">Thanh thiếu niên cơ nhỡ</option>
                      <option value="street_worker">Lao động đường phố</option>
                      <option value="homeless">Vô gia cư / Cơ nhỡ</option>
                      <option value="elderly">Người già neo đơn</option>
                    </select>
                  </div>
                </div>

                {/* Safeguarding Alert */}
                {isMinorCase && (
                  <div style={{ backgroundColor: themeColors.dangerBg, border: `1px solid ${themeColors.dangerBorder}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <ShieldAlert color={themeColors.danger} size={18} style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '11.5px', color: themeColors.danger, fontWeight: '700', lineHeight: '1.4' }}>
                      CHẾ ĐỘ BẢO VỆ TRẺ EM KHẨN CẤP (&lt;18T / SOS 111): Ca này được tự động mã hóa alias ẩn danh, làm mờ GPS và gửi thông báo trực tiếp đến Tổng đài 111!
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Voice AI Intake */}
            {intakeTab === 'voice_ai' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '16px' }}>
                {/* Left side: Voice Recording Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ backgroundColor: '#F8FAFC', border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minHeight: '190px' }}>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: '700', color: themeColors.textMuted, marginBottom: '6px' }}>HỘI THOẠI TRANSCRIPT (REAL-TIME STT)</div>
                      <div style={{ fontSize: '13.5px', color: themeColors.primaryNavy, lineHeight: '1.5', minHeight: '110px' }}>
                        {transcript || <span style={{ color: themeColors.textMuted, fontStyle: 'italic' }}>Nhấn nút chạy mẫu giọng nói hoặc nói vào Microphone...</span>}
                      </div>
                    </div>

                    {/* Audio wave animation */}
                    {isRecording && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '18px', justifyContent: 'center', margin: '6px 0' }}>
                        <span className="wave-bar" style={{ animationDelay: '0.1s' }}></span>
                        <span className="wave-bar" style={{ animationDelay: '0.3s' }}></span>
                        <span className="wave-bar" style={{ animationDelay: '0.5s' }}></span>
                        <span className="wave-bar" style={{ animationDelay: '0.2s' }}></span>
                        <span className="wave-bar" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    )}
                  </div>

                  {/* Live Mic and Simulation triggers */}
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <button
                        type="button"
                        className="btn-navy"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          fontSize: '12.5px',
                          fontWeight: '800',
                          backgroundColor: isRecording ? '#DC2626' : '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                        onClick={() => {
                          const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                          if (!SpeechRec) {
                            alert('Trình duyệt chưa hỗ trợ Web Speech Recognition API trực tiếp. Bạn có thể sử dụng các mẫu giọng nói thực địa bên dưới hoặc nhập dữ liệu.');
                            return;
                          }
                          try {
                            const rec = new SpeechRec();
                            rec.lang = 'vi-VN';
                            rec.continuous = true;
                            rec.interimResults = true;
                            rec.onresult = (event: any) => {
                              const liveText = Array.from(event.results).map((r: any) => r[0].transcript).join(' ');
                              if (liveText) {
                                setVoiceForm((prev: any) => ({
                                  ...prev,
                                  summary: liveText,
                                  location: prev.location || 'Bến xe An Sương, Hóc Môn'
                                }));
                              }
                            };
                            rec.start();
                            alert('Đang lắng nghe giọng nói tiếng Việt từ Microphone... Vui lòng nói thông tin ca cần trợ giúp.');
                          } catch (e: any) {
                            alert('Lỗi truy cập Microphone: ' + e.message);
                          }
                        }}
                      >
                        <Mic size={15} style={{ flexShrink: 0 }} /> Thu âm Micro Trực Tiếp (Tiếng Việt STT)
                      </button>
                    </div>

                    <div style={{ fontSize: '11.5px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '6px' }}>
                      Hoặc chạy Mẫu Thử Nghiệm Giọng Nói Thực Địa:
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ flex: 1, padding: '7px 8px', fontSize: '11.5px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}
                        disabled={isRecording}
                        onClick={() => startSimulation('lan')}
                      >
                        Cô Lan (62t - Neo đơn)
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ flex: 1, padding: '7px 8px', fontSize: '11.5px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}
                        disabled={isRecording}
                        onClick={() => startSimulation('hoang')}
                      >
                        Em Hoàng (15t - Trẻ em)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right side: AI Extracted Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Họ và tên / Alias trích xuất</label>
                    <input
                      type="text"
                      required
                      value={voiceForm.name}
                      onChange={e => setVoiceForm({ ...voiceForm, name: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', marginTop: '3px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Tuổi</label>
                      <input
                        type="number"
                        required
                        value={voiceForm.age}
                        onChange={e => setVoiceForm({ ...voiceForm, age: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', marginTop: '3px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Nhóm đối tượng</label>
                      <select
                        value={voiceForm.vulnerabilityGroup}
                        onChange={e => setVoiceForm({ ...voiceForm, vulnerabilityGroup: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', marginTop: '3px', backgroundColor: '#FFF', boxSizing: 'border-box' }}
                      >
                        <option value="youth">Thanh thiếu niên cơ nhỡ</option>
                        <option value="street_worker">Lao động đường phố</option>
                        <option value="homeless">Vô gia cư / Cơ nhỡ</option>
                        <option value="elderly">Người già neo đơn</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Địa bàn thực địa</label>
                    <input
                      type="text"
                      required
                      value={voiceForm.location}
                      onChange={e => setVoiceForm({ ...voiceForm, location: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '12.5px', marginTop: '3px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* 4 Need Categories selector in Mode 2 */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy, marginBottom: '4px', display: 'block' }}>Phân loại nhu cầu</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {[
                        { id: 'food', label: 'Cơm/Nước', icon: Utensils },
                        { id: 'medical', label: 'Y tế', icon: HeartPulse },
                        { id: 'shelter_job', label: 'Trọ/Việc', icon: Home },
                        { id: 'sos111', label: 'SOS 111', icon: ShieldAlert }
                      ].map(cat => {
                        const isSelected = intakeNeedCategories.includes(cat.id);
                        const IconComp = cat.icon;
                        return (
                          <button
                            type="button"
                            key={cat.id}
                            onClick={() => toggleNeedCategory(cat.id as any)}
                            style={{
                              padding: '6px 4px',
                              borderRadius: '6px',
                              border: isSelected ? '2px solid #16375D' : `1px solid ${themeColors.border}`,
                              backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                              color: isSelected ? '#16375D' : themeColors.textBody,
                              fontSize: '10.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '2px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <IconComp size={14} color={isSelected ? '#16375D' : '#64748B'} />
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Safeguarding Alert in Mode 2 */}
                  {isMinorCase && (
                    <div style={{ backgroundColor: themeColors.dangerBg, border: `1px solid ${themeColors.dangerBorder}`, borderRadius: '8px', padding: '8px 10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <ShieldAlert color={themeColors.danger} size={16} style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: '11px', color: themeColors.danger, fontWeight: '700' }}>
                        BẢO VỆ TRẺ EM (&lt;18T / SOS 111): Tự động ẩn danh & kết nối 111.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Unified Fixed Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: `1px solid ${themeColors.border}`,
              backgroundColor: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              flexShrink: 0
            }}
          >
            <div style={{ fontSize: '11.5px', color: themeColors.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} color="#16A34A" style={{ flexShrink: 0 }} />
              <span>Dữ liệu đồng bộ trực tiếp CSDL Cloudflare D1 Native</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '7px 16px', fontSize: '12.5px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}
                onClick={onClose}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn-navy"
                disabled={actionLoading || !voiceForm.name}
                style={{
                  padding: '7px 20px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  backgroundColor: '#16375D',
                  color: '#fff',
                  borderRadius: '6px',
                  cursor: (actionLoading || !voiceForm.name) ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  opacity: (actionLoading || !voiceForm.name) ? 0.6 : 1
                }}
              >
                <Send size={14} style={{ flexShrink: 0 }} />
                <span>{actionLoading ? 'Đang lưu hồ sơ...' : 'Lưu Hồ Sơ Tiếp Nhận'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

