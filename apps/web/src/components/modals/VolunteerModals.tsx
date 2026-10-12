import React from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { VolunteerRecord } from '../../types';
import { Radio, FileText, MapPin, UserPlus, Utensils, HeartPulse, Home, ShieldAlert, X, Send } from 'lucide-react';

interface AssignSignalModalProps {
  show: boolean;
  selectedSignal: any;
  assigneeName: string;
  setAssigneeName: (name: string) => void;
  onClose: () => void;
  onConfirm: (signalId: string, assignee: string) => void;
}

export const AssignSignalModal: React.FC<AssignSignalModalProps> = ({
  show,
  selectedSignal,
  assigneeName,
  setAssigneeName,
  onClose,
  onConfirm
}) => {
  if (!show || !selectedSignal) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
      <div className="card-flat" style={{ maxWidth: '480px', width: '100%', padding: '0', backgroundColor: '#FFFFFF', borderRadius: '12px', border: `2px solid ${themeColors.primaryNavy}`, overflow: 'hidden', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        {/* Fixed Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, backgroundColor: '#FFFFFF' }}>
          <h3 style={{ margin: 0, color: '#16375D', fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} color="#2563EB" style={{ flexShrink: 0 }} />
            <span>Giao Đội Xác Minh Thực Địa</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: '#F1F5F9', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: themeColors.textMuted, padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <p style={{ fontSize: '13px', color: themeColors.textBody, margin: '0 0 16px 0' }}>
            Chỉ định đội thực địa hoặc TNV phụ trách ghé qua <strong>{selectedSignal.approximateArea}</strong> để xác minh tín hiệu:
            <span style={{ display: 'block', padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', marginTop: '8px', fontStyle: 'italic', border: `1px solid ${themeColors.border}` }}>
              "{selectedSignal.observation}"
            </span>
          </p>

          <div>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '12.5px', color: '#16375D', marginBottom: '6px' }}>Chọn TNV / Đội Phụ Trách</label>
            <select
              value={assigneeName}
              onChange={e => setAssigneeName(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13.5px', backgroundColor: '#FFF', boxSizing: 'border-box' }}
            >
              <option value="TNV Nguyễn Văn Hùng">Đội Hóc Môn (TNV Nguyễn Văn Hùng)</option>
              <option value="TNV Lê Hoàng Nam">Đội Bình Chánh (TNV Lê Hoàng Nam)</option>
              <option value="TNV Trần Thu Trang">Đội Quận 12 (TNV Trần Thu Trang)</option>
              <option value="Cán bộ Trần Thị Mai">Cán bộ Trần Thị Mai</option>
            </select>
          </div>
        </div>

        {/* Fixed Footer */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'flex-end', gap: '8px', flexShrink: 0, backgroundColor: '#F8FAFC' }}>
          <button className="btn-outline" onClick={onClose} style={{ padding: '7px 14px', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Hủy
          </button>
          <button className="btn-navy" onClick={() => onConfirm(selectedSignal.id, assigneeName)} style={{ padding: '7px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Send size={13} style={{ flexShrink: 0 }} />
            <span>Xác Nhận & Giao Việc</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditReviewModalProps {
  show: boolean;
  selectedReview: any;
  editReviewForm: any;
  setEditReviewForm: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  onSave: () => void;
}

export const EditReviewModal: React.FC<EditReviewModalProps> = ({
  show,
  selectedReview,
  editReviewForm,
  setEditReviewForm,
  onClose,
  onSave
}) => {
  if (!show || !selectedReview) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
      <div className="card-flat" style={{ maxWidth: '600px', width: '100%', padding: '0', backgroundColor: '#FFFFFF', borderRadius: '14px', border: `2px solid ${themeColors.primaryNavy}`, overflow: 'hidden', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        {/* Fixed Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, backgroundColor: '#FFFFFF' }}>
          <div>
            <h3 style={{ margin: 0, color: '#16375D', fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#2563EB" style={{ flexShrink: 0 }} />
              <span>Chỉnh Sửa & Phê Duyệt Kết Quả AI</span>
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: themeColors.textMuted }}>
              Chuẩn hóa thông tin trích xuất từ giọng nói trước khi lưu hồ sơ chính thức.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: '#F1F5F9', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: themeColors.textMuted, padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {/* STT transcript reference */}
          <div style={{ padding: '10px 12px', backgroundColor: '#EDF3FB', borderRadius: '8px', borderLeft: `4px solid #16375D`, fontSize: '12.5px', color: '#16375D', marginBottom: '16px', fontStyle: 'italic' }}>
            <strong>Bản dịch giọng nói gốc:</strong>
            <br />
            "{selectedReview.transcript_clean}"
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '12px', color: '#16375D', marginBottom: '4px' }}>Tên / Mã Alias</label>
              <input
                type="text"
                value={editReviewForm.aliasName}
                onChange={e => setEditReviewForm({ ...editReviewForm, aliasName: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '12px', color: '#16375D', marginBottom: '4px' }}>Tuổi ước tính</label>
              <input
                type="number"
                value={editReviewForm.age}
                onChange={e => setEditReviewForm({ ...editReviewForm, age: e.target.value ? parseInt(e.target.value) : '' })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '12px', color: '#16375D', marginBottom: '4px' }}>Khu vực / Địa bàn tiếp nhận</label>
            <input
              type="text"
              value={editReviewForm.area}
              onChange={e => setEditReviewForm({ ...editReviewForm, area: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '12px', color: '#16375D', marginBottom: '6px' }}>Nhu cầu cần hỗ trợ (4 thẻ)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { id: 'food', label: 'Cơm / Nước', icon: Utensils },
                { id: 'medical', label: 'Y tế', icon: HeartPulse },
                { id: 'shelter_job', label: 'Trọ / Việc', icon: Home },
                { id: 'sos111', label: 'SOS 111', icon: ShieldAlert }
              ].map(cat => {
                const active = editReviewForm.needs.includes(cat.id);
                const IconComp = cat.icon;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      const updated = active
                        ? editReviewForm.needs.filter((n: string) => n !== cat.id)
                        : [...editReviewForm.needs, cat.id];
                      setEditReviewForm({ ...editReviewForm, needs: updated });
                    }}
                    style={{
                      padding: '8px 4px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer',
                      border: active ? '2px solid #16375D' : `1px solid ${themeColors.border}`,
                      backgroundColor: active ? '#EDF3FB' : '#fff',
                      color: active ? '#16375D' : themeColors.textBody,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <IconComp size={16} color={active ? '#16375D' : '#64748B'} style={{ flexShrink: 0 }} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '12px', color: '#16375D', marginBottom: '4px' }}>Ghi chú của cán bộ rà soát</label>
            <textarea
              rows={2}
              value={editReviewForm.note}
              onChange={e => setEditReviewForm({ ...editReviewForm, note: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Fixed Footer */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'flex-end', gap: '8px', flexShrink: 0, backgroundColor: '#F8FAFC' }}>
          <button className="btn-outline" onClick={onClose} style={{ padding: '7px 14px', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Hủy
          </button>
          <button className="btn-primary" style={{ backgroundColor: '#0F766E', padding: '7px 16px', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }} onClick={onSave}>
            Lưu & Phê Duyệt Ca
          </button>
        </div>
      </div>
    </div>
  );
};

interface AssignDistrictModalProps {
  selectedVolunteer: VolunteerRecord | null;
  onClose: () => void;
  onSave: (volId: string, districts: string[]) => void;
}

export const AssignDistrictModal: React.FC<AssignDistrictModalProps> = ({
  selectedVolunteer,
  onClose,
  onSave
}) => {
  if (!selectedVolunteer) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
      <div className="card-flat" style={{ maxWidth: '480px', width: '100%', padding: '0', backgroundColor: '#fff', borderRadius: '12px', border: `2px solid ${themeColors.primaryNavy}`, overflow: 'hidden', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        {/* Fixed Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, backgroundColor: '#FFFFFF' }}>
          <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>Phân Quyền Khu Vực Hoạt Động</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: '#F1F5F9', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: themeColors.textMuted, padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const checkedDistricts = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="district"]:checked')).map(i => i.value);
            onSave(selectedVolunteer.id, checkedDistricts.length > 0 ? checkedDistricts : ['Hóc Môn']);
          }}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          {/* Scrollable Body */}
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: themeColors.primaryNavy }}>
                TNV: {selectedVolunteer.fullName} ({selectedVolunteer.email})
              </div>
              <div style={{ fontSize: '12px', color: themeColors.textMuted, marginTop: '2px' }}>
                Chọn danh sách khu vực địa bàn cho phép TNV thực hiện khảo sát & tiếp nhận ca:
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Hóc Môn', 'Bình Chánh', 'Quận 8', 'Quận 12', 'Củ Chi', 'Quận 1'].map(district => {
                const isChecked = selectedVolunteer.assignedDistricts.includes(district);
                return (
                  <label key={district} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', border: `1px solid ${themeColors.border}`, borderRadius: '8px', cursor: 'pointer', backgroundColor: isChecked ? '#F0F9FF' : '#fff' }}>
                    <input
                      type="checkbox"
                      name="district"
                      value={district}
                      defaultChecked={isChecked}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontWeight: '700', fontSize: '13px', color: themeColors.primaryNavy, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#2563EB" style={{ flexShrink: 0 }} /> Khu vực {district}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Fixed Footer */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'flex-end', gap: '8px', flexShrink: 0, backgroundColor: '#F8FAFC' }}>
            <button type="button" className="btn-outline" onClick={onClose} style={{ padding: '7px 14px', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Hủy
            </button>
            <button type="submit" className="btn-navy" style={{ padding: '7px 16px', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Lưu Phân Quyền Địa Bàn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddVolunteerModalProps {
  show: boolean;
  newVolunteerForm: any;
  setNewVolunteerForm: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddVolunteerModal: React.FC<AddVolunteerModalProps> = ({
  show,
  newVolunteerForm,
  setNewVolunteerForm,
  onClose,
  onSubmit
}) => {
  if (!show) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
      <div className="card-flat" style={{ maxWidth: '520px', width: '100%', padding: '0', backgroundColor: '#fff', borderRadius: '12px', border: `2px solid ${themeColors.primaryNavy}`, overflow: 'hidden', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        {/* Fixed Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, backgroundColor: '#FFFFFF' }}>
          <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} color="#2563EB" style={{ flexShrink: 0 }} />
            <span>Thêm & Mời Tình Nguyện Viên</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: '#F1F5F9', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: themeColors.textMuted, padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Scrollable Body */}
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Họ và tên Tình nguyện viên</label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={newVolunteerForm.fullName}
                onChange={e => setNewVolunteerForm({ ...newVolunteerForm, fullName: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', marginTop: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Email đăng ký</label>
              <input
                type="email"
                required
                placeholder="tnv@buoctiep.vn"
                value={newVolunteerForm.email}
                onChange={e => setNewVolunteerForm({ ...newVolunteerForm, email: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', marginTop: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Số điện thoại liên hệ</label>
              <input
                type="tel"
                placeholder="0901234567"
                value={newVolunteerForm.phone}
                onChange={e => setNewVolunteerForm({ ...newVolunteerForm, phone: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', marginTop: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Vai trò hệ thống</label>
              <select
                value={newVolunteerForm.role}
                onChange={e => setNewVolunteerForm({ ...newVolunteerForm, role: e.target.value as any })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', marginTop: '3px', backgroundColor: '#FFF', boxSizing: 'border-box' }}
              >
                <option value="volunteer_field">TNV Khảo sát thực địa</option>
                <option value="volunteer_point">TNV Điểm chạm an sinh</option>
                <option value="coordinator">Cán bộ Điều phối NGO</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.primaryNavy }}>Khu vực phân quyền ban đầu</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                {['Hóc Môn', 'Bình Chánh', 'Quận 8', 'Quận 12'].map(dist => (
                  <label key={dist} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newVolunteerForm.assignedDistricts.includes(dist)}
                      onChange={e => {
                        const current = newVolunteerForm.assignedDistricts || [];
                        if (e.target.checked) {
                          setNewVolunteerForm({ ...newVolunteerForm, assignedDistricts: [...current, dist] });
                        } else {
                          setNewVolunteerForm({ ...newVolunteerForm, assignedDistricts: current.filter((d: string) => d !== dist) });
                        }
                      }}
                    />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={12} color="#2563EB" style={{ flexShrink: 0 }} /> {dist}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'flex-end', gap: '8px', flexShrink: 0, backgroundColor: '#F8FAFC' }}>
            <button type="button" className="btn-outline" onClick={onClose} style={{ padding: '7px 14px', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Hủy
            </button>
            <button type="submit" className="btn-navy" style={{ padding: '7px 16px', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Tạo & Mời TNV
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
