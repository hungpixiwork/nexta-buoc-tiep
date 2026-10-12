import React from 'react';
import { ReferralDocumentModel } from './referral-document.types';
import { REFERRAL_DOCUMENT_SPEC } from './referral-document.layout';

interface ReferralDocumentPreviewProps {
  model: ReferralDocumentModel;
}

export const ReferralDocumentPreview: React.FC<ReferralDocumentPreviewProps> = ({ model }) => {
  const { metadata, issuer, recipient, beneficiary, circumstances, referral } = model;
  const spec = REFERRAL_DOCUMENT_SPEC;

  const dateObj = new Date(metadata.generatedAt || Date.now());
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();

  const watermarkText = metadata.isApproved ? 'BẢN CHÍNH THỨC' : 'BẢN NHÁP (DRAFT)';
  const watermarkColor = metadata.isApproved ? spec.colors.watermarkOfficial : spec.colors.watermarkDraft;

  return (
    <div
      className="printable-form07 doc-page"
      style={{
        width: '100%',
        maxWidth: '165mm',
        margin: '0 auto',
        padding: '24px 32px',
        position: 'relative',
        color: spec.colors.textPrimary,
        backgroundColor: '#FFFFFF',
        fontFamily: spec.typography.fontFamily,
        lineHeight: spec.typography.lineHeight,
        fontSize: '13pt',
        boxSizing: 'border-box',
      }}
    >
      {/* Watermark Overlay */}
      <div
        className="watermark-print"
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-30deg)',
          fontSize: '46pt',
          fontWeight: 900,
          color: watermarkColor,
          letterSpacing: '6px',
          pointerEvents: 'none',
          userSelect: 'none',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}
      >
        {watermarkText}
      </div>

      {/* Header Block: 2 Columns */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '18px',
          borderBottom: `1.5pt solid ${spec.colors.borderLight}`,
          paddingBottom: '14px',
        }}
      >
        <div style={{ textAlign: 'center', width: '48%' }}>
          <div style={{ fontSize: '10.5pt', fontWeight: 700, textTransform: 'uppercase' }}>
            {issuer.city}
          </div>
          <div
            style={{
              fontSize: '10.5pt',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: spec.colors.textNavy,
              marginTop: '2px',
            }}
          >
            {issuer.organization}
          </div>
          <div style={{ fontSize: '9.5pt', color: spec.colors.textSecondary, fontStyle: 'italic', marginTop: '4px' }}>
            Số: <strong>{metadata.documentNumber}</strong>
          </div>
        </div>

        <div style={{ textAlign: 'center', width: '52%' }}>
          <div style={{ fontSize: '10.5pt', fontWeight: 800, textTransform: 'uppercase' }}>
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </div>
          <div style={{ fontSize: '10.5pt', fontWeight: 700, fontStyle: 'italic', marginTop: '2px' }}>
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div style={{ fontSize: '9.5pt', color: spec.colors.textSecondary, fontStyle: 'italic', marginTop: '4px' }}>
            TP. Hồ Chí Minh, ngày {day} tháng {month} năm {year}
          </div>
        </div>
      </div>

      {/* Main Title Block */}
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <h2
          style={{
            margin: '0 0 4px 0',
            fontSize: `${spec.typography.docTitlePt}pt`,
            fontWeight: 800,
            color: spec.colors.textNavy,
            textTransform: 'uppercase',
          }}
        >
          PHIẾU ĐỀ NGHỊ TRỢ GIÚP XÃ HỘI VÀ CHUYỂN TUYẾN
        </h2>
        <div
          style={{
            fontSize: `${spec.typography.docSubtitlePt}pt`,
            fontWeight: 700,
            color: spec.colors.textAccent,
            fontStyle: 'italic',
            margin: '0 0 4px 0',
          }}
        >
          (Mẫu số 07 — Ban hành kèm theo Nghị định số 20/2021/NĐ-CP ngày 15/03/2021 của Chính phủ)
        </div>
        <div style={{ fontSize: `${spec.typography.smallPt}pt`, color: spec.colors.textSecondary }}>
          Mã phiếu D1: <strong>{metadata.referenceId}</strong> &bull; Mã định danh sinh kế: <strong>{metadata.passportId}</strong>
        </div>
      </div>

      {/* Recipient Block */}
      <div style={{ marginBottom: '16px', fontSize: '12.5pt', lineHeight: 1.5 }}>
        <div>
          <strong>Kính gửi:</strong>{' '}
          <span style={{ textTransform: 'uppercase', fontWeight: 800, color: spec.colors.textNavy }}>
            {recipient.agencyName}
          </span>
        </div>
        <div>
          <strong>Địa chỉ cơ sở:</strong> {recipient.address}
        </div>
      </div>

      {/* Section I: Beneficiary Table */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: `${spec.typography.sectionHeadingPt}pt`,
            fontWeight: 800,
            color: spec.colors.textNavy,
            textTransform: 'uppercase',
            borderBottom: `1px dashed ${spec.colors.borderLight}`,
            paddingBottom: '4px',
            marginBottom: '8px',
          }}
        >
          I. THÔNG TIN NGƯỜI THỤ HƯỞNG ĐƯỢC CHUYỂN TUYẾN
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11.5pt',
            tableLayout: 'fixed',
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  width: `${spec.content.labelColPercent}%`,
                  padding: '7px 10px',
                  border: `1pt solid ${spec.colors.borderLight}`,
                  backgroundColor: spec.colors.bgHeader,
                  fontWeight: 700,
                }}
              >
                Họ và tên:
              </td>
              <td
                style={{
                  width: `${spec.content.valueColPercent}%`,
                  padding: '7px 10px',
                  border: `1pt solid ${spec.colors.borderLight}`,
                }}
              >
                {metadata.redactPII ? (
                  <span style={{ color: '#B45309', fontWeight: 700 }}>
                    {beneficiary.aliasName}{' '}
                    <span style={{ fontSize: '11px', fontStyle: 'italic', color: '#D97706' }}>
                      (🔒 Che tên thật theo Luật Trẻ em 2016)
                    </span>
                  </span>
                ) : (
                  <strong>{beneficiary.fullName || beneficiary.aliasName}</strong>
                )}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '7px 10px',
                  border: `1pt solid ${spec.colors.borderLight}`,
                  backgroundColor: spec.colors.bgHeader,
                  fontWeight: 700,
                }}
              >
                Mã định danh sinh kế (Passport):
              </td>
              <td
                style={{
                  padding: '7px 10px',
                  border: `1pt solid ${spec.colors.borderLight}`,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                }}
              >
                {beneficiary.passportCode}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '7px 10px',
                  border: `1pt solid ${spec.colors.borderLight}`,
                  backgroundColor: spec.colors.bgHeader,
                  fontWeight: 700,
                }}
              >
                Tuổi / Giới tính:
              </td>
              <td
                style={{
                  padding: '7px 10px',
                  border: `1pt solid ${spec.colors.borderLight}`,
                }}
              >
                {beneficiary.age} tuổi &bull; Giới tính: {beneficiary.gender}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '7px 10px',
                  border: `1pt solid ${spec.colors.borderLight}`,
                  backgroundColor: spec.colors.bgHeader,
                  fontWeight: 700,
                }}
              >
                Địa bàn cư trú / Tiếp cận:
              </td>
              <td
                style={{
                  padding: '7px 10px',
                  border: `1pt solid ${spec.colors.borderLight}`,
                }}
              >
                {beneficiary.location}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '7px 10px',
                  border: `1pt solid ${spec.colors.borderLight}`,
                  backgroundColor: spec.colors.bgHeader,
                  fontWeight: 700,
                }}
              >
                Nhóm đối tượng yếu thế:
              </td>
              <td
                style={{
                  padding: '7px 10px',
                  border: `1pt solid ${spec.colors.borderLight}`,
                  fontWeight: 600,
                }}
              >
                {beneficiary.vulnerabilityGroup}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section II: Circumstances */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: `${spec.typography.sectionHeadingPt}pt`,
            fontWeight: 800,
            color: spec.colors.textNavy,
            textTransform: 'uppercase',
            borderBottom: `1px dashed ${spec.colors.borderLight}`,
            paddingBottom: '4px',
            marginBottom: '8px',
          }}
        >
          II. HOÀN CẢNH CỤ THỂ VÀ LÝ DO ĐỀ NGHỊ TRỢ GIÚP
        </div>
        <div
          style={{
            backgroundColor: spec.colors.bgHeader,
            border: `1pt solid ${spec.colors.borderLight}`,
            borderRadius: '4px',
            padding: '10px 12px',
            fontSize: '11.5pt',
            lineHeight: 1.5,
          }}
        >
          <div style={{ marginBottom: '6px' }}>
            <strong>Đánh giá thực địa CTXH:</strong> {circumstances.fieldAssessment}
          </div>
          {circumstances.notes && (
            <div style={{ fontStyle: 'italic', color: spec.colors.textSecondary }}>
              <strong>Ghi chú bổ sung:</strong> {circumstances.notes}
            </div>
          )}
        </div>
      </div>

      {/* Section III: Proposed Measures */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: `${spec.typography.sectionHeadingPt}pt`,
            fontWeight: 800,
            color: spec.colors.textNavy,
            textTransform: 'uppercase',
            borderBottom: `1px dashed ${spec.colors.borderLight}`,
            paddingBottom: '4px',
            marginBottom: '8px',
          }}
        >
          III. CÁC BIỆN PHÁP TRỢ GIÚP XÃ HỘI ĐỀ XUẤT TIẾP NHẬN
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5pt' }}>
          {(referral.proposedMeasures || []).map((m, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
              <span style={{ fontWeight: 600, color: spec.colors.textNavy }}>{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signatures Block: 2 Columns */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '28px',
          paddingTop: '14px',
          borderTop: `1pt solid ${spec.colors.borderLight}`,
        }}
      >
        <div style={{ textAlign: 'center', width: '48%' }}>
          <div style={{ fontSize: '11pt', fontWeight: 800, color: spec.colors.textNavy }}>
            NGƯỜI / CÁN BỘ LẬP PHIẾU
          </div>
          <div style={{ fontSize: '9.5pt', color: spec.colors.textSecondary, fontStyle: 'italic' }}>
            (Ký, ghi rõ họ tên và xác thực thông tin)
          </div>
          <div style={{ height: '55px' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: 700, color: spec.colors.textNavy }}>
            {issuer.officerName}
          </div>
        </div>

        <div style={{ textAlign: 'center', width: '48%' }}>
          <div style={{ fontSize: '11pt', fontWeight: 800, color: spec.colors.textNavy }}>
            {issuer.signerTitle || 'ĐẠI DIỆN ĐƠN VỊ CHUYỂN TUYẾN'}
          </div>
          <div style={{ fontSize: '9.5pt', color: spec.colors.textSecondary, fontStyle: 'italic' }}>
            (Ký tên, đóng dấu xác nhận an sinh)
          </div>
          <div style={{ height: '55px' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: 700, color: spec.colors.textNavy }}>
            {issuer.organization}
          </div>
        </div>
      </div>

      {/* Footer System Note */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '9pt',
          color: '#94A3B8',
          fontStyle: 'italic',
          marginTop: '24px',
        }}
      >
        Hệ thống BƯỚC TIẾP — UNESCO Youth Hackathon 2026. Dữ liệu được mã hóa & xác thực toàn vẹn qua Cloudflare D1 Serverless.
      </div>
    </div>
  );
};
