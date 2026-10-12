import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { Form07Data } from '../../types';
import { handleExportDocx } from '../../utils/docxExport';
import { ReferralDocumentPreview, buildReferralDocumentModel } from '../../documents/referral';
import { Edit3, Eye, FileCode, Printer, Download, Plus, Trash2, CheckCircle2, ShieldCheck, FileText, X, User } from 'lucide-react';

interface Form07ModalProps {
  showForm07Modal: boolean;
  setShowForm07Modal: (show: boolean) => void;
  form07Data: Form07Data | null;
  setForm07Data: (data: Form07Data | null) => void;
}

export const Form07Modal: React.FC<Form07ModalProps> = ({
  showForm07Modal,
  setShowForm07Modal,
  form07Data,
  setForm07Data,
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'edit' | 'preview' | 'json'>('edit');
  const [newMeasureInput, setNewMeasureInput] = useState('');
  const [jsonInputError, setJsonInputError] = useState<string | null>(null);

  if (!showForm07Modal || !form07Data) return null;

  const handleFieldChange = (field: keyof Form07Data, value: any) => {
    setForm07Data({
      ...form07Data,
      [field]: value,
    });
  };

  const handleAddMeasure = () => {
    if (!newMeasureInput.trim()) return;
    const current = form07Data.proposedMeasures || [];
    if (!current.includes(newMeasureInput.trim())) {
      setForm07Data({
        ...form07Data,
        proposedMeasures: [...current, newMeasureInput.trim()],
      });
    }
    setNewMeasureInput('');
  };

  const handleRemoveMeasure = (index: number) => {
    const current = form07Data.proposedMeasures || [];
    setForm07Data({
      ...form07Data,
      proposedMeasures: current.filter((_, i) => i !== index),
    });
  };

  const handleTogglePresetMeasure = (measureText: string) => {
    const current = form07Data.proposedMeasures || [];
    if (current.includes(measureText)) {
      setForm07Data({
        ...form07Data,
        proposedMeasures: current.filter((m) => m !== measureText),
      });
    } else {
      setForm07Data({
        ...form07Data,
        proposedMeasures: [...current, measureText],
      });
    }
  };

  const presetMeasures = [
    'Nhu yếu phẩm khẩn cấp & Suất ăn dinh dưỡng',
    'Trợ giúp Y tế, khám chữa bệnh & Cấp thuốc khẩn cấp',
    'Tạm trú khẩn cấp tại Cơ sở Bảo trợ / Mái ấm an sinh',
    'Đào tạo an toàn số MIL (Media & Info Literacy) & Phòng chống lừa đảo việc làm',
    'Tạo việc làm thử việc có bảo trợ (3-7 ngày)',
    'Bảo vệ trẻ em khẩn cấp (Tổng đài 111 & Tổ Công tác xã hội địa phương)',
  ];

  const createdDate = new Date(form07Data.createdAt || Date.now());
  const day = createdDate.getDate();
  const month = createdDate.getMonth() + 1;
  const year = createdDate.getFullYear();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
    >
      <div
        className="card-flat printable-form07-wrapper"
        style={{
          maxWidth: '920px',
          width: '100%',
          padding: '0',
          maxHeight: 'calc(100% - 24px)',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Control Navigation Header (Hidden on print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderBottom: `1px solid ${themeColors.border}`,
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            flexWrap: 'wrap',
            gap: '12px',
            flexShrink: 0
          }}
        >
          {/* Left Title & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color={themeColors.primaryNavy} />
            <div>
              <div style={{ fontWeight: '800', color: themeColors.primaryNavy, fontSize: '15px' }}>
                Soạn Thảo & Xuất Phiếu Đề Nghị Mẫu số 07 NĐ 20/2021/NĐ-CP
              </div>
              <div style={{ fontSize: '12px', color: themeColors.textMuted }}>
                Mã: <strong>{form07Data.officialDocNo || '001/PCT-BT'}</strong> &bull; Đối tượng:{' '}
                <strong>{form07Data.aliasName}</strong>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#E2E8F0',
              padding: '3px',
              borderRadius: '8px',
            }}
          >
            <button
              onClick={() => setActiveViewMode('edit')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: activeViewMode === 'edit' ? '#FFFFFF' : 'transparent',
                color: activeViewMode === 'edit' ? themeColors.primaryNavy : themeColors.textBody,
                boxShadow: activeViewMode === 'edit' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Edit3 size={14} /> Điền Nội Dung
            </button>
            <button
              onClick={() => setActiveViewMode('preview')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: activeViewMode === 'preview' ? '#FFFFFF' : 'transparent',
                color: activeViewMode === 'preview' ? themeColors.primaryNavy : themeColors.textBody,
                boxShadow: activeViewMode === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Eye size={14} /> Xem Trước Trang A4
            </button>
            <button
              onClick={() => setActiveViewMode('json')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: activeViewMode === 'json' ? '#FFFFFF' : 'transparent',
                color: activeViewMode === 'json' ? themeColors.primaryNavy : themeColors.textBody,
                boxShadow: activeViewMode === 'json' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <FileCode size={14} /> JSON Dữ Liệu
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn-navy"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => handleExportDocx(form07Data)}
              title="Xuất file Microsoft Word (.docx) bản chuẩn hành chính đã điền đủ thông tin"
            >
              <Download size={15} /> Tải File Word (.docx)
            </button>
            <button
              className="btn-navy"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#16375D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
              onClick={() => {
                setActiveViewMode('preview');
                setTimeout(() => window.print(), 100);
              }}
            >
              <Printer size={15} /> In / PDF A4
            </button>
            <button
              onClick={() => setShowForm07Modal(false)}
              style={{
                border: 'none',
                background: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                color: themeColors.textMuted,
                padding: '0 4px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body based on Active View Mode */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* MODE 1: Interactive Editor */}
          {activeViewMode === 'edit' && (
            <div style={{ padding: '24px', backgroundColor: '#F8FAFC' }}>
              {/* Quick Config Toggles */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: `1px solid ${themeColors.border}`,
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: form07Data.redactPII ? '#B45309' : '#334155',
                    backgroundColor: form07Data.redactPII ? '#FFFBEB' : '#F1F5F9',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${form07Data.redactPII ? '#FDE68A' : '#CBD5E1'}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form07Data.redactPII}
                    onChange={(e) => handleFieldChange('redactPII', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Chế độ Bảo vệ Trẻ em (Che họ tên thật theo Luật Trẻ em 2016)</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: form07Data.isApproved ? '#15803D' : '#DC2626',
                    backgroundColor: form07Data.isApproved ? '#F0FDF4' : '#FEF2F2',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${form07Data.isApproved ? '#BBF7D0' : '#FECACA'}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form07Data.isApproved}
                    onChange={(e) => handleFieldChange('isApproved', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>
                    {form07Data.isApproved
                      ? 'Bản Chính Thức (Đã Phê Duyệt)'
                      : 'Bản Nháp Đề Xuất (Draft)'}
                  </span>
                </label>
              </div>

              {/* Section 1: Administrative Header */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '10px',
                  border: `1px solid ${themeColors.border}`,
                  marginBottom: '20px',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '14.5px',
                    fontWeight: '800',
                    color: themeColors.primaryNavy,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FileText size={16} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span>1. THÔNG TIN HÀNH CHÍNH & VĂN BẢN</span>
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '14px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: themeColors.primaryNavy,
                        marginBottom: '4px',
                      }}
                    >
                      Số Công Văn / Phiếu Chuyển Tuyến
                    </label>
                    <input
                      type="text"
                      value={form07Data.officialDocNo}
                      onChange={(e) => handleFieldChange('officialDocNo', e.target.value)}
                      placeholder="VD: 001/PCT-BT"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: themeColors.primaryNavy,
                        marginBottom: '4px',
                      }}
                    >
                      Tổ Chức / Đơn Vị Lập Phiếu
                    </label>
                    <input
                      type="text"
                      value={form07Data.issuingDept}
                      onChange={(e) => handleFieldChange('issuingDept', e.target.value)}
                      placeholder="VD: Ban Điều hành BƯỚC TIẾP — UNESCO 2026"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: themeColors.primaryNavy,
                        marginBottom: '4px',
                      }}
                    >
                      Cán Bộ / Nhân Viên Lập Phiếu
                    </label>
                    <input
                      type="text"
                      value={form07Data.issuingOfficer ? (form07Data.issuingOfficer.startsWith('usr-') ? 'Cán bộ CTXH Thực địa' : form07Data.issuingOfficer) : 'Cán bộ CTXH Thực địa'}
                      onChange={(e) => handleFieldChange('issuingOfficer', e.target.value)}
                      placeholder="VD: Cán bộ CTXH Hóc Môn"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Destination Org */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '10px',
                  border: `1px solid ${themeColors.border}`,
                  marginBottom: '20px',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '14.5px',
                    fontWeight: '800',
                    color: themeColors.primaryNavy,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ShieldCheck size={16} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span>2. CƠ QUAN / CƠ SỞ TIẾP NHẬN (KÍNH GỬI)</span>
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '14px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: themeColors.primaryNavy,
                        marginBottom: '4px',
                      }}
                    >
                      Tên Cơ Quan / Cơ Sở Tiếp Nhận
                    </label>
                    <input
                      type="text"
                      value={form07Data.resourceName}
                      onChange={(e) => handleFieldChange('resourceName', e.target.value)}
                      placeholder="VD: Phòng Lao động - Thương binh & Xã hội huyện Hóc Môn"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: themeColors.primaryNavy,
                        marginBottom: '4px',
                      }}
                    >
                      Địa Chỉ Cơ Sở Tiếp Nhận
                    </label>
                    <input
                      type="text"
                      value={form07Data.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      placeholder="VD: Thị trấn Hóc Môn, Huyện Hóc Môn, TP.HCM"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Beneficiary Details */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '10px',
                  border: `1px solid ${themeColors.border}`,
                  marginBottom: '20px',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '14.5px',
                    fontWeight: '800',
                    color: themeColors.primaryNavy,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <User size={16} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span>3. THÔNG TIN NGƯỜI THỤ HƯỞNG (I)</span>
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: themeColors.primaryNavy,
                        marginBottom: '4px',
                      }}
                    >
                      Họ Và Tên Thật
                    </label>
                    <input
                      type="text"
                      value={form07Data.fullName}
                      onChange={(e) => handleFieldChange('fullName', e.target.value)}
                      placeholder="VD: Nguyễn Thị Lan"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: themeColors.primaryNavy,
                        marginBottom: '4px',
                      }}
                    >
                      Mã Bí Danh (Alias Định Danh)
                    </label>
                    <input
                      type="text"
                      value={form07Data.aliasName}
                      onChange={(e) => handleFieldChange('aliasName', e.target.value)}
                      placeholder="VD: ADULT-2026-8842"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: themeColors.primaryNavy,
                        marginBottom: '4px',
                      }}
                    >
                      Mã Hộ Chiếu Sinh Kế Số (D1)
                    </label>
                    <input
                      type="text"
                      value={form07Data.passportId}
                      onChange={(e) => handleFieldChange('passportId', e.target.value)}
                      placeholder="VD: BT-BEN-LAN-01"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: themeColors.primaryNavy,
                        marginBottom: '4px',
                      }}
                    >
                      Tuổi / Năm Sinh
                    </label>
                    <input
                      type="text"
                      value={form07Data.age}
                      onChange={(e) => handleFieldChange('age', e.target.value)}
                      placeholder="VD: 62 tuổi (Năm sinh 1964)"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: themeColors.primaryNavy,
                        marginBottom: '4px',
                      }}
                    >
                      Giới Tính
                    </label>
                    <select
                      value={form07Data.gender || 'Nữ'}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        backgroundColor: '#FFFFFF',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác / Chưa xác định</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: themeColors.primaryNavy,
                        marginBottom: '4px',
                      }}
                    >
                      Địa Bàn Cư Trú / Tiếp Cận Thực Địa
                    </label>
                    <input
                      type="text"
                      value={form07Data.currentArea}
                      onChange={(e) => handleFieldChange('currentArea', e.target.value)}
                      placeholder="VD: Thị trấn Hóc Môn, Huyện Hóc Môn, TP.HCM"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: themeColors.primaryNavy,
                      marginBottom: '4px',
                    }}
                  >
                    Phân Loại Nhóm Đối Tượng Yếu Thế
                  </label>
                  <input
                    type="text"
                    value={form07Data.vulnerabilityGroup}
                    onChange={(e) => handleFieldChange('vulnerabilityGroup', e.target.value)}
                    placeholder="VD: Lao động đường phố kiệt sức / Trẻ em lang thang"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Section 4: Emergency Reason & Field Assessment */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '10px',
                  border: `1px solid ${themeColors.border}`,
                  marginBottom: '20px',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '14.5px',
                    fontWeight: '800',
                    color: themeColors.primaryNavy,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FileText size={16} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span>4. HOÀN CẢNH & ĐÁNH GIÁ THỰC ĐỊA CTXH (II)</span>
                </h4>
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: themeColors.primaryNavy,
                      marginBottom: '4px',
                    }}
                  >
                    Đánh Giá Hoàn Cảnh Khẩn Cấp & Lý Do Chuyển Tuyến
                  </label>
                  <textarea
                    rows={3}
                    value={form07Data.emergencyReason}
                    onChange={(e) => handleFieldChange('emergencyReason', e.target.value)}
                    placeholder="Nêu rõ hoàn cảnh cụ thể, nguy cơ sức khỏe, chỗ ở hoặc nguy cơ bị bóc lột..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      lineHeight: '1.5',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: themeColors.primaryNavy,
                      marginBottom: '4px',
                    }}
                  >
                    Ghi Chú Đề Xuất Của Cán Bộ CTXH / Tình Nguyện Viên
                  </label>
                  <textarea
                    rows={2}
                    value={form07Data.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="VD: Đề nghị cơ sở trợ giúp xã hội ưu tiên tiếp nhận tạm trú và bố trí khám sức khỏe ban đầu..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      lineHeight: '1.5',
                    }}
                  />
                </div>
              </div>

              {/* Section 5: Proposed Measures Checklist */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '10px',
                  border: `1px solid ${themeColors.border}`,
                  marginBottom: '20px',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '14.5px',
                    fontWeight: '800',
                    color: themeColors.primaryNavy,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={16} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span>5. DANH MỤC BIỆN PHÁP TRỢ GIÚP XÃ HỘI ĐỀ XUẤT (III)</span>
                </h4>

                {/* Preset Fast Selection Chips */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: themeColors.textMuted,
                      marginBottom: '8px',
                    }}
                  >
                    Nhấp chọn nhanh các biện pháp trợ giúp chuẩn:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {presetMeasures.map((pm) => {
                      const isSelected = (form07Data.proposedMeasures || []).includes(pm);
                      return (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => handleTogglePresetMeasure(pm)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#DCFCE7' : '#F1F5F9',
                            color: isSelected ? '#15803D' : '#475569',
                            border: `1px solid ${isSelected ? '#86EFAC' : '#CBD5E1'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          {isSelected ? <CheckCircle2 size={13} /> : <Plus size={13} />}
                          <span>{pm}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Current Active Measures List */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: '700',
                      color: themeColors.primaryNavy,
                      marginBottom: '6px',
                    }}
                  >
                    Danh sách các biện pháp đã chọn sẽ xuất vào phiếu ({(form07Data.proposedMeasures || []).length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(form07Data.proposedMeasures || []).map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '600' }}>
                          <span>✓</span>
                          <span>{m}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMeasure(idx)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#DC2626',
                            padding: '2px',
                          }}
                          title="Xóa biện pháp này"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Custom Measure Input */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newMeasureInput}
                    onChange={(e) => setNewMeasureInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMeasure())}
                    placeholder="Nhập thêm biện pháp trợ giúp tùy biến khác..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddMeasure}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      backgroundColor: '#16375D',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={15} /> Thêm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: Live A4 Visual Preview (SSOT Component matching DOCX Export 1:1) */}
          {activeViewMode === 'preview' && (
            <div style={{ backgroundColor: '#F8FAFC', padding: '20px 0' }}>
              <ReferralDocumentPreview model={buildReferralDocumentModel(form07Data)} />
            </div>
          )}

          {/* MODE 3: Raw JSON Data */}
          {activeViewMode === 'json' && (
            <div style={{ padding: '24px', backgroundColor: '#0F172A', minHeight: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#38BDF8' }}>
                  Cấu trúc JSON Mẫu 07 (Có thể chỉnh sửa hoặc dán JSON mới):
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(form07Data, null, 2));
                    alert('Đã sao chép JSON Mẫu 07 vào bộ nhớ đệm');
                  }}
                  className="btn-outline"
                  style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#1E293B', color: '#38BDF8', borderColor: '#38BDF8' }}
                >
                  Sao chép JSON
                </button>
              </div>

              {jsonInputError && (
                <div style={{ backgroundColor: '#7F1D1D', color: '#FCA5A5', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' }}>
                  ❌ Lỗi cú pháp JSON: {jsonInputError}
                </div>
              )}

              <textarea
                rows={18}
                defaultValue={JSON.stringify(form07Data, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setForm07Data(parsed);
                    setJsonInputError(null);
                  } catch (err: any) {
                    setJsonInputError(err.message);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: '#020617',
                  color: '#38BDF8',
                  border: '1px solid #334155',
                  fontFamily: 'monospace',
                  fontSize: '12.5px',
                  lineHeight: '1.5',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderTop: `1px solid ${themeColors.border}`,
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '12px', color: themeColors.textMuted }}>
            {activeViewMode === 'edit' && 'Chế độ soạn thảo chi tiết. Chuyển sang "Xem Trước" để duyệt trang in A4.'}
            {activeViewMode === 'preview' && 'Trang in sẵn sàng. Bấm "Xuất File Word Mẫu 07 (.docx)" để tải tệp hành chính hoàn chỉnh.'}
            {activeViewMode === 'json' && 'Dữ liệu JSON Mẫu 07 đồng bộ thời gian thực với hệ sinh thái an sinh BƯỚC TIẾP.'}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowForm07Modal(false)}
              className="btn-outline"
              style={{ padding: '7px 16px', fontSize: '12.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => handleExportDocx(form07Data)}
              className="btn-navy"
              style={{
                padding: '7px 16px',
                fontSize: '12.5px',
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                border: 'none',
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
              <Download size={14} style={{ flexShrink: 0 }} /> Xuất File Word Mẫu 07 (.docx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
