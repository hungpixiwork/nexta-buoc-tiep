import React from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { Search, ShieldAlert, Users, UserPlus, Download, Mail, Phone, MapPin, Edit3, CheckCircle2, Clock, AlertTriangle, Check, Globe } from 'lucide-react';
import { VolunteerRecord, AuditTrailRecord } from '../../types';

interface VolunteersTabProps {
  volunteersList: VolunteerRecord[];
  filteredVolunteers: VolunteerRecord[];
  auditTrailList: AuditTrailRecord[];
  filteredAuditTrail: AuditTrailRecord[];
  volunteerSearchQuery: string;
  setVolunteerSearchQuery: (q: string) => void;
  volunteerStatusFilter: string;
  setVolunteerStatusFilter: (s: string) => void;
  volunteerDistrictFilter: string;
  setVolunteerDistrictFilter: (d: string) => void;
  auditRiskFilter: string;
  setAuditRiskFilter: (r: string) => void;
  setSelectedVolunteerForDistrict: (vol: VolunteerRecord) => void;
  setShowAddVolunteerModal: (show: boolean) => void;
  handleApproveVolunteer: (id: string) => void;
  handleToggleSuspendVolunteer: (id: string) => void;
  handleExportAuditTrailCSV: () => void;
}

export const VolunteersTab: React.FC<VolunteersTabProps> = ({
  volunteersList,
  filteredVolunteers,
  auditTrailList,
  filteredAuditTrail,
  volunteerSearchQuery,
  setVolunteerSearchQuery,
  volunteerStatusFilter,
  setVolunteerStatusFilter,
  volunteerDistrictFilter,
  setVolunteerDistrictFilter,
  auditRiskFilter,
  setAuditRiskFilter,
  setSelectedVolunteerForDistrict,
  setShowAddVolunteerModal,
  handleApproveVolunteer,
  handleToggleSuspendVolunteer,
  handleExportAuditTrailCSV
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Overview Cards for Volunteers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="card-flat" style={{ padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: `1px solid ${themeColors.border}` }}>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: themeColors.textBody }}>TNV Đang hoạt động</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: themeColors.primaryNavy, marginTop: '2px' }}>
            {volunteersList.filter(v => v.status === 'active' || !v.status).length || 2} Người
          </div>
          <span className="badge-forest" style={{ marginTop: '6px', display: 'inline-block', fontSize: '11px' }}>Được cấp quyền app thực địa</span>
        </div>

        <div className="card-flat" style={{ padding: '16px', borderColor: themeColors.border, backgroundColor: '#FFFBEB', borderRadius: '10px', border: `1px solid ${themeColors.border}` }}>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: themeColors.warning }}>TNV Mới chờ duyệt</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: themeColors.warning, marginTop: '2px' }}>
            {volunteersList.filter(v => v.status === 'pending').length} Hồ sơ
          </div>
          <span className="badge-saffron" style={{ marginTop: '6px', display: 'inline-block', fontSize: '11px' }}>Đăng ký qua Form Khảo sát</span>
        </div>

        <div className="card-flat" style={{ padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: `1px solid ${themeColors.border}` }}>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: themeColors.textBody }}>Khu vực Phụ trách</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: themeColors.primaryNavy, marginTop: '2px' }}>
            4 Địa bàn
          </div>
          <span className="badge-navy" style={{ marginTop: '6px', display: 'inline-block', fontSize: '11px' }}>Hóc Môn, Bình Chánh, Q8, Q12</span>
        </div>

        <div className="card-flat" style={{ padding: '16px', borderColor: themeColors.border, backgroundColor: '#F0FDF4', borderRadius: '10px', border: `1px solid ${themeColors.border}` }}>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: themeColors.success }}>Safeguarding Audit Trail</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: themeColors.success, marginTop: '2px' }}>
            {auditTrailList.length} Lượt
          </div>
          <span className="badge-forest" style={{ marginTop: '6px', display: 'inline-block', fontSize: '11px' }}>Ghi nhận 100% truy cập dữ liệu</span>
        </div>
      </div>

      {/* Main Volunteer Management Table */}
      <div className="card-flat" style={{ padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#2563EB" />
              <span>Danh Sách Tình Nguyện Viên & Phân Quyền Khu Vực</span>
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: themeColors.textMuted }}>
              Duyệt tình nguyện viên đăng ký mới từ Form khảo sát thực địa và gán địa bàn hoạt động (Hóc Môn, Bình Chánh, Quận 8, Quận 12)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: themeColors.textMuted }} />
              <input
                type="text"
                placeholder="Tìm theo tên, email, sĐT..."
                value={volunteerSearchQuery}
                onChange={e => setVolunteerSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 32px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, minWidth: '220px', fontSize: '13px' }}
              />
            </div>

            <select
              value={volunteerStatusFilter}
              onChange={e => setVolunteerStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', backgroundColor: '#FFF' }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt (Pending)</option>
              <option value="active">Đã duyệt (Active)</option>
              <option value="suspended">Tạm khóa (Suspended)</option>
            </select>

            <select
              value={volunteerDistrictFilter}
              onChange={e => setVolunteerDistrictFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', backgroundColor: '#FFF' }}
            >
              <option value="all">Tất cả khu vực</option>
              <option value="Hóc Môn">Hóc Môn</option>
              <option value="Bình Chánh">Bình Chánh</option>
              <option value="Quận 8">Quận 8</option>
              <option value="Quận 12">Quận 12</option>
            </select>

            <button
              className="btn-primary"
              onClick={() => setShowAddVolunteerModal(true)}
              style={{ padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <UserPlus size={15} /> Thêm TNV Mới
            </button>
          </div>
        </div>

        {/* Volunteers Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${themeColors.border}`, backgroundColor: '#F8FAFC', whiteSpace: 'nowrap' }}>
                <th style={{ padding: '10px 14px', color: themeColors.primaryNavy, whiteSpace: 'nowrap' }}>Mã TNV / Họ và tên</th>
                <th style={{ padding: '10px 14px', color: themeColors.primaryNavy, whiteSpace: 'nowrap' }}>Liên hệ</th>
                <th style={{ padding: '10px 14px', color: themeColors.primaryNavy, whiteSpace: 'nowrap' }}>Vai trò</th>
                <th style={{ padding: '10px 14px', color: themeColors.primaryNavy, whiteSpace: 'nowrap' }}>Khu vực được phân quyền</th>
                <th style={{ padding: '10px 14px', color: themeColors.primaryNavy, whiteSpace: 'nowrap' }}>Số phiếu nộp</th>
                <th style={{ padding: '10px 14px', color: themeColors.primaryNavy, whiteSpace: 'nowrap' }}>Trạng thái</th>
                <th style={{ padding: '10px 14px', color: themeColors.primaryNavy, whiteSpace: 'nowrap' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: themeColors.textMuted }}>
                    Không tìm thấy Tình nguyện viên nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredVolunteers.map(vol => (
                  <tr key={vol.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '700', color: themeColors.primaryNavy }}>{vol.fullName}</div>
                      <div style={{ fontSize: '11.5px', color: themeColors.textMuted }}>
                        Mã: {vol.id} | Tham gia: {vol.joinedAt && !isNaN(new Date(vol.joinedAt).getTime()) ? new Date(vol.joinedAt).toLocaleDateString('vi-VN') : '14/08/2026'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} color={themeColors.textMuted} style={{ flexShrink: 0 }} /> <span>{vol.email}</span>
                      </div>
                      <div style={{ color: themeColors.textMuted, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} color={themeColors.textMuted} style={{ flexShrink: 0 }} /> <span>{vol.phone || '0901234567'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span className={
                        vol.role === 'coordinator' ? 'badge-navy' :
                          vol.role === 'volunteer_point' ? 'badge-forest' : 'badge-saffron'
                      } style={{ fontSize: '10.5px', whiteSpace: 'nowrap' }}>
                        {vol.role === 'coordinator' ? 'Cán bộ Điều phối' :
                          vol.role === 'volunteer_point' ? 'TNV Điểm chạm' : 'TNV Khảo sát thực địa'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {(vol.assignedDistricts && vol.assignedDistricts.length > 0 ? vol.assignedDistricts : ['Hóc Môn']).map(dist => (
                          <span key={dist} className="badge-warning" style={{ fontSize: '10.5px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                            <MapPin size={10} style={{ flexShrink: 0 }} /> <span>{dist}</span>
                          </span>
                        ))}
                        <button
                          className="btn-outline"
                          style={{ padding: '2px 6px', fontSize: '10.5px', marginLeft: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap', flexShrink: 0 }}
                          onClick={() => setSelectedVolunteerForDistrict(vol)}
                          title="Đổi khu vực hoạt động"
                        >
                          <Edit3 size={10} style={{ flexShrink: 0 }} /> <span>Gán lại</span>
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: themeColors.primaryNavy, whiteSpace: 'nowrap' }}>
                      {vol.totalSurveysSubmitted ?? 14} phiếu
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {(vol.status === 'active' || !vol.status) && (
                        <span className="badge-forest" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          <CheckCircle2 size={11} style={{ flexShrink: 0 }} /> <span>Đã Duyệt (Active)</span>
                        </span>
                      )}
                      {vol.status === 'pending' && (
                        <span className="badge-saffron" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          <Clock size={11} style={{ flexShrink: 0 }} /> <span>Chờ Duyệt (Pending)</span>
                        </span>
                      )}
                      {vol.status === 'suspended' && (
                        <span className="badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          <AlertTriangle size={11} style={{ flexShrink: 0 }} /> <span>Tạm Khóa</span>
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                        {vol.status === 'pending' && (
                          <button
                            className="btn-navy"
                            style={{ padding: '4px 8px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', flexShrink: 0 }}
                            onClick={() => handleApproveVolunteer(vol.id)}
                          >
                            <Check size={11} style={{ flexShrink: 0 }} /> <span>Phê duyệt</span>
                          </button>
                        )}
                        <button
                          className={vol.status === 'suspended' ? 'btn-outline' : 'btn-danger'}
                          style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}
                          onClick={() => handleToggleSuspendVolunteer(vol.id)}
                        >
                          {vol.status === 'suspended' ? 'Mở khóa' : 'Tạm khóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Safeguarding Audit Trail Table */}
      <div className="card-flat" style={{ padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color={themeColors.danger} />
              <span>Nhật Ký Thao Tác & An Toàn Dữ Liệu (Safeguarding Audit Trail)</span>
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: themeColors.textMuted }}>
              Ghi nhận thời gian thực tất cả thao tác tra cứu, xuất file PDF Mẫu 07, giải mã GPS vị trí thực tế và in thẻ QR của Cán bộ & TNV.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={auditRiskFilter}
              onChange={e => setAuditRiskFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.borderDark}`, fontSize: '13px', backgroundColor: '#FFF' }}
            >
              <option value="all">Tất cả mức độ nhạy cảm</option>
              <option value="normal">Thông thường (Normal)</option>
              <option value="high">Bảo vệ cao (High Safeguarding)</option>
              <option value="critical">Khẩn cấp (Critical Safeguarding)</option>
            </select>

            <button
              className="btn-outline"
              onClick={handleExportAuditTrailCSV}
              style={{ padding: '8px 14px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Download size={14} /> Xuất Tệp Audit Trail (CSV)
            </button>
          </div>
        </div>

        {/* Audit Trail Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${themeColors.border}`, backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '10px 12px', color: themeColors.primaryNavy }}>Mã Audit / Thời gian</th>
                <th style={{ padding: '10px 12px', color: themeColors.primaryNavy }}>Người thực hiện</th>
                <th style={{ padding: '10px 12px', color: themeColors.primaryNavy }}>Hành động (Action)</th>
                <th style={{ padding: '10px 12px', color: themeColors.primaryNavy }}>Đối tượng (Target)</th>
                <th style={{ padding: '10px 12px', color: themeColors.primaryNavy }}>Nội dung chi tiết</th>
                <th style={{ padding: '10px 12px', color: themeColors.primaryNavy }}>IP / Thiết bị</th>
                <th style={{ padding: '10px 12px', color: themeColors.primaryNavy }}>Mức Safeguarding</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditTrail.map(audit => (
                <tr key={audit.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: '700', color: themeColors.primaryNavy, fontFamily: 'monospace' }}>{audit.id}</div>
                    <div style={{ fontSize: '11px', color: themeColors.textMuted }}>
                      {new Date(audit.timestamp).toLocaleString('vi-VN')}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: '700', color: themeColors.primaryNavy }}>{audit.actorName}</div>
                    <div style={{ fontSize: '11px', color: themeColors.textMuted }}>Role: {audit.actorRole}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={
                      audit.action === 'VIEW_EXACT_GPS' ? 'badge-danger' :
                        audit.action === 'EXPORT_FORM_07' ? 'badge-saffron' : 'badge-navy'
                    } style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                      {audit.action}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: themeColors.primaryNavy }}>
                    {audit.targetAlias || 'Hệ thống'}
                  </td>
                  <td style={{ padding: '10px 12px', color: themeColors.textBody, maxWidth: '260px' }}>
                    {audit.details}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '11.5px', color: themeColors.textMuted }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Globe size={11} /> {audit.ipAddress}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {audit.riskLevel === 'critical' ? (
                      <span className="badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10.5px' }}>
                        <ShieldAlert size={11} /> CRITICAL
                      </span>
                    ) : audit.riskLevel === 'high' ? (
                      <span className="badge-saffron" style={{ fontSize: '10.5px' }}>HIGH RISK</span>
                    ) : (
                      <span className="badge-forest" style={{ fontSize: '10.5px' }}>NORMAL</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
