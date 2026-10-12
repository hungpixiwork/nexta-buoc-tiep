import React, { useState } from 'react';
import { themeColors } from '@buoc-tiep/shared';
import { CaseRecord } from '../../types';
import { Printer, CreditCard, Receipt, MapPin, ShieldAlert, CheckCircle2, Scissors, X, Eye, EyeOff, Sparkles, PhoneCall } from 'lucide-react';
import { NextaQRCode, buildFieldCardQRValue } from '../qr';

interface BatchQrModalProps {
  show: boolean;
  casesList: CaseRecord[];
  printFormat: 'card85x54' | 'thermal80mm';
  setPrintFormat: (format: 'card85x54' | 'thermal80mm') => void;
  onClose: () => void;
  getRecoveryCode: (c: CaseRecord) => string;
}

export interface FieldCardPrintModel {
  cardId: string;
  caseId: string;
  personType: 'ADULT' | 'OLDER_ADULT' | 'CHILD';
  isMinor: boolean;
  displayName: string;
  aliasCode: string;
  locationLabel: string;
  currentSafeNextStep: {
    label: string;
    owner?: string;
    dueAt?: string;
  };
  safeguarding: {
    required: boolean;
    label?: string;
    hotline?: string;
  };
  assignedNavigator?: string;
  qrPayload: string;
  printedAt: string;
}

/**
 * Transforms D1 CaseRecord into standardized FieldCardPrintModel with strict Child Safeguarding
 */
export function mapCaseToPrintModel(c: CaseRecord, isPrivacyMode: boolean, recoveryCode: string): FieldCardPrintModel {
  const isMinor = Boolean(c.isMinor);
  const printedDate = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const cardId = `BT-${(c.aliasName || c.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '8842'}`;

  let displayName = c.fullName || c.aliasName || 'Đối tượng an sinh';
  if (isMinor) {
    displayName = c.aliasName.startsWith('CHILD') ? c.aliasName : `CHILD-2026-${cardId.slice(-4)}`;
  } else if (isPrivacyMode) {
    const parts = displayName.split(' ');
    displayName = parts.length > 1 ? `${parts[0]} *** ${parts[parts.length - 1]}` : `${displayName.slice(0, 2)}***`;
  }

  const currentSafeNextStep = isMinor
    ? {
        label: 'Kế hoạch Bảo vệ Trẻ em & Trợ giúp An sinh (111)',
        owner: 'Cán bộ Bảo trợ Xã hội',
        dueAt: 'Khẩn cấp 24h'
      }
    : {
        label: c.needCategories?.includes('medical')
          ? 'Khám sức khỏe & kết nối trạm y tế'
          : c.needCategories?.includes('shelter_job')
          ? 'Xác minh điểm hỗ trợ sinh kế & việc làm an toàn'
          : 'Xác minh điểm trợ cấp an sinh & thực phẩm',
        owner: 'TNV Hướng dẫn Thực địa',
        dueAt: 'Trong 48h'
      };

  const personType: 'ADULT' | 'OLDER_ADULT' | 'CHILD' = isMinor
    ? 'CHILD'
    : c.vulnerabilityGroup === 'elderly'
    ? 'OLDER_ADULT'
    : 'ADULT';

  // Build 100% privacy-sanitized opaque QR value via Layer 2 Builder
  const qrPayload = buildFieldCardQRValue(recoveryCode, cardId, isMinor);

  return {
    cardId,
    caseId: c.id,
    personType,
    isMinor,
    displayName,
    aliasCode: c.aliasName || cardId,
    locationLabel: c.currentArea || 'TP. Hồ Chí Minh',
    currentSafeNextStep,
    safeguarding: {
      required: isMinor || c.priority === 'urgent' || c.priority === 'high',
      label: isMinor ? 'BẢO TRỢ TRẺ EM KHẨN CẤP' : 'ƯU TIÊN THEO DÕI AN SINH',
      hotline: '111'
    },
    assignedNavigator: isMinor ? 'Cán bộ Bảo trợ Trẻ em' : 'TNV Điều phối Thực địa',
    qrPayload,
    printedAt: printedDate
  };
}

export const BatchQrModal: React.FC<BatchQrModalProps> = ({
  show,
  casesList,
  printFormat,
  setPrintFormat,
  onClose,
  getRecoveryCode
}) => {
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);

  if (!show) return null;

  const printModels = casesList.map((c) => mapCaseToPrintModel(c, privacyMode, getRecoveryCode(c)));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="printable-batch-modal"
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
        zIndex: 1150,
        padding: '16px'
      }}
    >
      {/* Inject Print-First Dedicated CSS */}
      <style>{`
        @media print {
          @page {
            size: ${printFormat === 'thermal80mm' ? '80mm auto' : 'A4 portrait'};
            margin: ${printFormat === 'thermal80mm' ? '3mm' : '8mm'};
          }
          body {
            background-color: #FFFFFF !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-batch-modal,
          #printable-batch-modal .print-canvas-root,
          #printable-batch-modal .print-canvas-root * {
            visibility: visible !important;
          }
          #printable-batch-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #FFFFFF !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
          .a4-print-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 85mm) !important;
            gap: 6mm !important;
            justify-content: center !important;
            page-break-after: always;
          }
          .a4-card-box {
            width: 85mm !important;
            height: 54mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 1px solid #94A3B8 !important;
            box-shadow: none !important;
          }
          .a4-card-box .nexta-qr-container,
          .a4-card-box .nexta-qr-container svg {
            width: 26mm !important;
            height: 26mm !important;
          }
          .thermal-print-strip {
            width: 72mm !important;
            margin: 0 auto !important;
          }
          .thermal-ticket-item {
            width: 72mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border-bottom: 2px dashed #000000 !important;
            box-shadow: none !important;
            margin-bottom: 8mm !important;
          }
          .thermal-ticket-item .nexta-qr-container,
          .thermal-ticket-item .nexta-qr-container canvas,
          .thermal-ticket-item .nexta-qr-container svg {
            width: 38mm !important;
            height: 38mm !important;
          }
        }
      `}</style>

      <div
        className="card-flat"
        style={{
          maxWidth: printFormat === 'thermal80mm' ? '640px' : '980px',
          width: '100%',
          padding: '0',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#F1F5F9',
          borderRadius: '14px',
          border: `2px solid ${themeColors.primaryNavy}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          boxSizing: 'border-box'
        }}
      >
        {/* ============================================================ */}
        {/* MODAL CONTROL HEADER (SCREEN ONLY)                          */}
        {/* ============================================================ */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            padding: '14px 20px',
            borderBottom: `1px solid ${themeColors.border}`,
            flexShrink: 0
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: themeColors.primaryNavy, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={19} color="#2563EB" style={{ flexShrink: 0 }} />
              <span>In Thẻ Thực Địa NEXTA</span>
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: themeColors.textMuted }}>
              Đã chọn <strong>{casesList.length} hồ sơ</strong> thực địa từ CSDL D1 ({casesList.filter(c => c.isMinor).length} ca Trẻ em, {casesList.filter(c => !c.isMinor).length} ca Người lớn).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            {/* Privacy Toggle */}
            <button
              type="button"
              onClick={() => setPrivacyMode(!privacyMode)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                border: `1px solid ${privacyMode ? '#10B981' : themeColors.borderDark}`,
                backgroundColor: privacyMode ? '#ECFDF5' : '#FFFFFF',
                color: privacyMode ? '#047857' : themeColors.primaryNavy,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              title="Bật/Tắt chế độ làm mờ tên để bảo vệ quyền riêng tư PII khi in thực địa"
            >
              {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{privacyMode ? 'Đã bật Ẩn danh PII' : 'Bảo vệ danh tính'}</span>
            </button>

            {/* Print Action Button */}
            <button
              className="btn-navy"
              onClick={handlePrint}
              style={{
                padding: '7px 16px',
                fontSize: '12.5px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#16375D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Printer size={14} style={{ flexShrink: 0 }} />
              <span>{printFormat === 'thermal80mm' ? 'In Máy In Nhiệt (80mm)' : 'In Trang A4 (8 Thẻ)'}</span>
            </button>

            {/* Close Button */}
            <button
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
        </div>

        {/* ============================================================ */}
        {/* FORMAT SWITCHER TABS (SCREEN ONLY)                          */}
        {/* ============================================================ */}
        <div className="no-print" style={{ padding: '10px 20px 0 20px', backgroundColor: '#F1F5F9', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#E2E8F0', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setPrintFormat('card85x54')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: printFormat === 'card85x54' ? '#FFFFFF' : 'transparent',
                color: printFormat === 'card85x54' ? themeColors.primaryNavy : themeColors.textBody,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: printFormat === 'card85x54' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <CreditCard size={14} style={{ flexShrink: 0 }} />
              <span>Khổ Thẻ A4 (85×54mm · 8 Thẻ / Trang)</span>
            </button>
            <button
              onClick={() => setPrintFormat('thermal80mm')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: printFormat === 'thermal80mm' ? '#FFFFFF' : 'transparent',
                color: printFormat === 'thermal80mm' ? themeColors.primaryNavy : themeColors.textBody,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: printFormat === 'thermal80mm' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <Receipt size={14} style={{ flexShrink: 0 }} />
              <span>Cuộn In Nhiệt POS-80mm (Bluetooth Thực Địa)</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SCROLLABLE PREVIEW CANVAS (PRINT ROOT)                       */}
        {/* ============================================================ */}
        <div style={{ padding: '16px 20px 20px 20px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center' }}>
          <div className="print-canvas-root" style={{ width: '100%', maxWidth: printFormat === 'thermal80mm' ? '360px' : '880px' }}>
            {printFormat === 'card85x54' ? (
              /* ============================================================ */
              /* 1. A4 CANVAS: 8 CARDS PER PAGE (85x54mm Business Card Size)   */
              /* ============================================================ */
              <div
                className="a4-sheet-canvas"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                  padding: '16px',
                  border: `1px solid ${themeColors.border}`
                }}
              >
                <div
                  className="a4-print-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '14px'
                  }}
                >
                  {printModels.map((model) => (
                    <div
                      key={`a4-${model.caseId}`}
                      className="a4-card-box"
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: model.isMinor ? '1.5px solid #DC2626' : '1.5px solid #16375D',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxSizing: 'border-box',
                        minHeight: '190px'
                      }}
                    >
                      {/* Top Row: Brand & ID */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: '800', fontSize: '11px', color: '#16375D', letterSpacing: '0.3px' }}>
                            NEXTA / BƯỚC TIẾP
                          </span>
                          {model.isMinor && (
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#DC2626', backgroundColor: '#FEE2E2', padding: '1px 4px', borderRadius: '3px' }}>
                              111
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10.5px', fontWeight: '800', color: model.isMinor ? '#DC2626' : '#16375D' }}>
                          {model.cardId}
                        </span>
                      </div>

                      {/* Middle Content: Person Info + Large QR */}
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '8px 0' }}>
                        {/* QR Code Container (26mm+) */}
                        <div style={{ width: '74px', height: '74px', flexShrink: 0, border: '1px solid #CBD5E1', padding: '2px', backgroundColor: '#FFFFFF', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <NextaQRCode
                            value={model.qrPayload}
                            size={70}
                            variant={model.isMinor ? 'safeguarding' : 'print'}
                            renderMode="svg"
                            showLogo={false}
                            testId={`qr-a4-${model.cardId}`}
                            ariaLabel={`Mã QR thẻ in A4 tra cứu cho ${model.displayName}`}
                            style={{ padding: 0 }}
                          />
                        </div>

                        {/* Text Information */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: model.isMinor ? '#DC2626' : '#16375D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {model.displayName}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#475569', margin: '1px 0' }}>
                            Khu vực: <strong>{model.locationLabel}</strong>
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>
                            <strong style={{ color: '#0F172A', display: 'block', fontSize: '9.5px', textTransform: 'uppercase' }}>
                              {model.isMinor ? 'QUY TRÌNH BẢO VỆ (111):' : 'BƯỚC TIẾP HIỆN TẠI:'}
                            </strong>
                            <span style={{ color: model.isMinor ? '#B91C1C' : '#0369A1', fontWeight: '700', fontSize: '10.5px', lineHeight: 1.2 }}>
                              {model.currentSafeNextStep.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Line: Handover & Navigator */}
                      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: '#64748B' }}>
                        <span>Phụ trách: <strong>{model.assignedNavigator}</strong></span>
                        <span style={{ fontStyle: 'italic' }}>Bàn giao: _____________</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ============================================================ */
              /* 2. THERMAL POS-80MM ROLL STRIP (Clean Sans-Serif Layout)     */
              /* ============================================================ */
              <div
                className="thermal-print-strip"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  alignItems: 'center'
                }}
              >
                {printModels.map((model) => (
                  <div
                    key={`thermal-${model.caseId}`}
                    className="thermal-ticket-item"
                    style={{
                      width: '320px',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #334155',
                      borderRadius: '6px',
                      padding: '16px 14px',
                      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      color: '#0F172A',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Header */}
                    <div style={{ textAlign: 'center', borderBottom: '1px solid #000000', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: '900', fontSize: '14px', color: '#000000', letterSpacing: '0.5px' }}>
                        NEXTA / BƯỚC TIẾP
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: model.isMinor ? '#DC2626' : '#334155', marginTop: '2px' }}>
                        {model.isMinor ? 'THẺ BẢO VỆ TRẺ EM KHẨN CẤP (111)' : 'THẺ BƯỚC TIẾP AN SINH THỰC ĐỊA'}
                      </div>
                    </div>

                    {/* Target Information */}
                    <div style={{ margin: '12px 0 10px 0', fontSize: '12.5px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#000000' }}>
                        {model.displayName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                        Mã hồ sơ: <strong>{model.aliasCode}</strong> ({model.cardId})
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569' }}>
                        Khu vực: <strong>{model.locationLabel}</strong>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed #64748B', margin: '8px 0' }} />

                    {/* Step Information */}
                    <div style={{ margin: '8px 0' }}>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
                        {model.isMinor ? 'QUY TRÌNH BẢO VỆ TRẺ EM:' : 'BƯỚC TIẾP HIỆN TẠI:'}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: model.isMinor ? '#DC2626' : '#000000', marginTop: '2px', lineHeight: 1.3 }}>
                        {model.currentSafeNextStep.label}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px' }}>
                        Phụ trách: <strong>{model.assignedNavigator}</strong>
                      </div>
                    </div>

                    {/* Prominent Large Centered QR Code (38mm+) */}
                    <div style={{ textAlign: 'center', margin: '14px 0 10px 0' }}>
                      <div style={{ width: '130px', height: '130px', margin: '0 auto', border: '1px solid #000000', padding: '4px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <NextaQRCode
                          value={model.qrPayload}
                          size={120}
                          variant="thermal"
                          renderMode="canvas"
                          showLogo={false}
                          testId={`qr-thermal-${model.cardId}`}
                          ariaLabel={`Mã QR in nhiệt POS-80mm cho ${model.displayName}`}
                          style={{ padding: 0 }}
                        />
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#000000', marginTop: '4px', letterSpacing: '0.5px' }}>
                        QUÉT QR ĐỂ TRA CỨU HỒ SƠ
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ borderTop: '1px solid #000000', paddingTop: '6px', textAlign: 'center', fontSize: '9.5px', color: '#475569' }}>
                      Ngày in: {model.printedAt} · Hotline 24/7: <strong>111</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
