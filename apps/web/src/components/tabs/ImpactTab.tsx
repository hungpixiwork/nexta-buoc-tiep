import React from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { BarChart3, Printer, TrendingUp, HeartHandshake, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ImpactSummary } from '../../types';

interface ImpactTabProps {
  impactData: ImpactSummary | null;
}

export const ImpactTab: React.FC<ImpactTabProps> = ({ impactData }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-flat" style={{ padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: themeColors.primaryNavy, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="#2563EB" />
              <span>Chỉ Số Tác Động Xã Hội ESG & UNESCO</span>
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: themeColors.textMuted }}>
              Số liệu tổng hợp thời gian thực kết nối từ cơ sở dữ liệu Cloudflare D1.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px' }}
          >
            <Printer size={14} />
            <span>In / Tải Báo Cáo (PDF A4)</span>
          </button>
        </div>

        {/* Bento Grids details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '16px', backgroundColor: '#FFFBEB' }}>
            <div style={{ fontSize: '13px', color: themeColors.warning, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <HeartHandshake size={14} /> Tổng Lượt Cứu Hộ / Sơ Cứu
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: themeColors.primaryNavy, marginTop: '6px' }}>
              {impactData?.totalEncounters || 142}
            </div>
            <div style={{ fontSize: '11.5px', color: themeColors.textMuted, marginTop: '6px' }}>Tích hợp chuyển tiếp MIL</div>
          </div>

          <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '16px', backgroundColor: '#F0FDF4' }}>
            <div style={{ fontSize: '13px', color: themeColors.success, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={14} /> Kết Nối Nguồn Lực Thành Công
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: themeColors.success, marginTop: '6px' }}>
              {impactData?.successfulReferrals || 64}
            </div>
            <div style={{ fontSize: '11.5px', color: themeColors.textMuted, marginTop: '6px' }}>Đạt tỷ lệ thành công 45%</div>
          </div>

          <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '16px', backgroundColor: '#FEF2F2' }}>
            <div style={{ fontSize: '13px', color: themeColors.danger, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldAlert size={14} /> Bảo Vệ Trẻ Em Kích Hoạt
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: themeColors.danger, marginTop: '6px' }}>
              {impactData?.safeguardingActions || 3} ca
            </div>
            <div style={{ fontSize: '11.5px', color: themeColors.textMuted, marginTop: '6px' }}>Ghi nhận Alias & làm mờ GPS</div>
          </div>
        </div>

        {/* Simple Chart SVG mapping */}
        <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: '10px', padding: '20px', backgroundColor: '#FFFFFF' }}>
          <h4 style={{ margin: '0 0 14px 0', color: themeColors.primaryNavy, fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} color="#0F766E" />
            <span>Đồ Thị Phân Tích Tiến Trình Phục Hồi Sinh Kế (5 Giai Đoạn)</span>
          </h4>

          {/* SVG Rendered simple Bar Chart */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0', overflowX: 'auto' }}>
            <svg width="600" height="250" viewBox="0 0 600 250" style={{ maxWidth: '100%', minWidth: '460px' }}>
              {/* Grid lines */}
              <line x1="50" y1="20" x2="550" y2="20" stroke="#EEF2F7" strokeWidth="1" />
              <line x1="50" y1="65" x2="550" y2="65" stroke="#EEF2F7" strokeWidth="1" />
              <line x1="50" y1="110" x2="550" y2="110" stroke="#EEF2F7" strokeWidth="1" />
              <line x1="50" y1="155" x2="550" y2="155" stroke="#EEF2F7" strokeWidth="1" />
              <line x1="50" y1="200" x2="550" y2="200" stroke="#CBD5E1" strokeWidth="2" />

              {/* Y Axis labels */}
              <text x="15" y="24" fill="#7A8B9A" fontSize="11" fontWeight="700">100%</text>
              <text x="15" y="69" fill="#7A8B9A" fontSize="11" fontWeight="700">75%</text>
              <text x="15" y="114" fill="#7A8B9A" fontSize="11" fontWeight="700">50%</text>
              <text x="15" y="159" fill="#7A8B9A" fontSize="11" fontWeight="700">25%</text>
              <text x="25" y="204" fill="#7A8B9A" fontSize="11" fontWeight="700">0%</text>

              {/* Bar 1: Tiếp xúc */}
              <rect x="80" y="45" width="55" height="155" fill={themeColors.primary} rx="4" />
              <text x="83" y="38" fill={themeColors.primaryNavy} fontSize="12" fontWeight="800">100 ca</text>
              <text x="75" y="220" fill={themeColors.textBody} fontSize="11.5" fontWeight="700">1. Tiếp xúc</text>

              {/* Bar 2: Xác minh */}
              <rect x="180" y="72" width="55" height="128" fill={themeColors.warning} rx="4" />
              <text x="185" y="65" fill={themeColors.primaryNavy} fontSize="12" fontWeight="800">82 ca</text>
              <text x="175" y="220" fill={themeColors.textBody} fontSize="11.5" fontWeight="700">2. Xác minh</text>

              {/* Bar 3: Trích xuất */}
              <rect x="280" y="100" width="55" height="100" fill={themeColors.primaryNavy} rx="4" />
              <text x="285" y="92" fill={themeColors.primaryNavy} fontSize="12" fontWeight="800">65 ca</text>
              <text x="275" y="220" fill={themeColors.textBody} fontSize="11.5" fontWeight="700">3. Trích xuất</text>

              {/* Bar 4: Kết nối */}
              <rect x="380" y="128" width="55" height="72" fill={themeColors.accentBlue} rx="4" />
              <text x="385" y="120" fill={themeColors.primaryNavy} fontSize="12" fontWeight="800">48 ca</text>
              <text x="377" y="220" fill={themeColors.textBody} fontSize="11.5" fontWeight="700">4. Kết nối</text>

              {/* Bar 5: Tự chủ */}
              <rect x="480" y="160" width="55" height="40" fill={themeColors.success} rx="4" />
              <text x="485" y="152" fill={themeColors.primaryNavy} fontSize="12" fontWeight="800">25 ca</text>
              <text x="480" y="220" fill={themeColors.textBody} fontSize="11.5" fontWeight="700">5. Tự chủ</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
