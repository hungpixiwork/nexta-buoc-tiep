import { ReferralDocumentModel } from './referral-document.types';
import { REFERRAL_DOCUMENT_SPEC } from './referral-document.layout';

/**
 * Renders standard, semantic, printable A4 HTML matching REFERRAL_DOCUMENT_SPEC.
 * This is used for both live web preview and as input for html-to-docx.
 */
export function renderReferralHtml(model: ReferralDocumentModel): string {
  const { metadata, issuer, recipient, beneficiary, circumstances, referral } = model;

  const dateObj = new Date(metadata.generatedAt || Date.now());
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();

  const watermarkText = metadata.isApproved ? 'BẢN CHÍNH THỨC' : 'BẢN NHÁP (DRAFT)';
  const watermarkColor = metadata.isApproved ? REFERRAL_DOCUMENT_SPEC.colors.watermarkOfficial : REFERRAL_DOCUMENT_SPEC.colors.watermarkDraft;

  const displayName = metadata.redactPII
    ? `<span style="color: #b45309; font-weight: bold;">${beneficiary.aliasName}</span> <i style="font-size: 11px; color: #d97706;">(🔒 Che tên thật theo Luật Trẻ em 2016)</i>`
    : `<strong>${beneficiary.fullName || beneficiary.aliasName}</strong>`;

  const measuresHtml = (referral.proposedMeasures || [])
    .map(
      (m) => `
      <div style="margin-bottom: 4px; display: flex; align-items: flex-start; gap: 8px;">
        <span style="color: #16a34a; font-weight: bold; font-size: 14px;">✓</span>
        <span style="font-weight: 600; color: #16375d;">${m}</span>
      </div>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Phiếu Đề Nghị Trợ Giúp Xã Hội Mẫu 07 — ${beneficiary.aliasName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 20mm 20mm 25mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.45;
      color: #0f172a;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }
    .doc-page {
      width: 100%;
      max-width: 165mm;
      margin: 0 auto;
      position: relative;
      box-sizing: border-box;
    }
    .watermark {
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 46pt;
      font-weight: 900;
      color: ${watermarkColor};
      letter-spacing: 6px;
      pointer-events: none;
      user-select: none;
      text-transform: uppercase;
      white-space: nowrap;
      z-index: 0;
    }
    table.header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1.5pt solid #cbd5e1;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    table.header-table td {
      vertical-align: top;
      text-align: center;
      padding: 0 4px;
    }
    .title-block {
      text-align: center;
      margin-bottom: 18px;
    }
    .doc-title {
      font-size: 16pt;
      font-weight: 800;
      color: #16375d;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .doc-subtitle {
      font-size: 11pt;
      font-weight: 700;
      color: #d97706;
      font-style: italic;
      margin: 0 0 4px 0;
    }
    .doc-meta {
      font-size: 10.5pt;
      color: #64748b;
    }
    .recipient-block {
      margin-bottom: 16px;
      font-size: 12.5pt;
      line-height: 1.5;
    }
    .section-title {
      font-size: 12.5pt;
      font-weight: 800;
      color: #16375d;
      text-transform: uppercase;
      margin: 16px 0 8px 0;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      table-layout: fixed;
    }
    table.data-table td {
      border: 1pt solid #cbd5e1;
      padding: 7px 10px;
      font-size: 11.5pt;
      vertical-align: middle;
      word-wrap: break-word;
    }
    table.data-table td.label-col {
      width: 32%;
      background-color: #f8fafc;
      font-weight: 700;
      color: #0f172a;
    }
    table.data-table td.value-col {
      width: 68%;
    }
    .box-reason {
      background-color: #f8fafc;
      border: 1pt solid #e2e8f0;
      border-radius: 4px;
      padding: 10px 12px;
      font-size: 11.5pt;
      line-height: 1.5;
      margin-bottom: 14px;
    }
    table.signature-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1pt solid #cbd5e1;
    }
    table.signature-table td {
      width: 50%;
      text-align: center;
      vertical-align: top;
      padding: 0 8px;
    }
  </style>
</head>
<body>
  <div class="doc-page">
    <div class="watermark">${watermarkText}</div>

    <!-- Header Block -->
    <table class="header-table">
      <tr>
        <td style="width: 48%;">
          <div style="font-size: 10.5pt; font-weight: 700; text-transform: uppercase;">
            ${issuer.city}
          </div>
          <div style="font-size: 10.5pt; font-weight: 800; text-transform: uppercase; color: #16375d; margin-top: 2px;">
            ${issuer.organization}
          </div>
          <div style="font-size: 9.5pt; color: #475569; font-style: italic; margin-top: 4px;">
            Số: <strong>${metadata.documentNumber}</strong>
          </div>
        </td>
        <td style="width: 52%;">
          <div style="font-size: 10.5pt; font-weight: 800; text-transform: uppercase;">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </div>
          <div style="font-size: 10.5pt; font-weight: 700; font-style: italic; margin-top: 2px;">
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div style="font-size: 9.5pt; color: #475569; font-style: italic; margin-top: 4px;">
            TP. Hồ Chí Minh, ngày ${day} tháng ${month} năm ${year}
          </div>
        </td>
      </tr>
    </table>

    <!-- Main Title -->
    <div class="title-block">
      <h1 class="doc-title">PHIẾU ĐỀ NGHỊ TRỢ GIÚP XÃ HỘI VÀ CHUYỂN TUYẾN</h1>
      <div class="doc-subtitle">(Mẫu số 07 — Ban hành kèm theo Nghị định số 20/2021/NĐ-CP ngày 15/03/2021 của Chính phủ)</div>
      <div class="doc-meta">
        Mã phiếu D1: <strong>${metadata.referenceId}</strong> &bull; Mã định danh sinh kế: <strong>${metadata.passportId}</strong>
      </div>
    </div>

    <!-- Recipient Block -->
    <div class="recipient-block">
      <div><strong>Kính gửi:</strong> <span style="text-transform: uppercase; font-weight: 800; color: #16375d;">${recipient.agencyName}</span></div>
      <div><strong>Địa chỉ cơ sở:</strong> ${recipient.address}</div>
    </div>

    <!-- Section I -->
    <div class="section-title">I. THÔNG TIN NGƯỜI THỤ HƯỞNG ĐƯỢC CHUYỂN TUYẾN</div>
    <table class="data-table">
      <tr>
        <td class="label-col">Họ và tên:</td>
        <td class="value-col">${displayName}</td>
      </tr>
      <tr>
        <td class="label-col">Mã định danh sinh kế (Passport):</td>
        <td class="value-col" style="font-family: monospace; font-weight: bold;">${beneficiary.passportCode}</td>
      </tr>
      <tr>
        <td class="label-col">Tuổi / Giới tính:</td>
        <td class="value-col">${beneficiary.age} tuổi &bull; Giới tính: ${beneficiary.gender}</td>
      </tr>
      <tr>
        <td class="label-col">Địa bàn cư trú / Tiếp cận:</td>
        <td class="value-col">${beneficiary.location}</td>
      </tr>
      <tr>
        <td class="label-col">Nhóm đối tượng yếu thế:</td>
        <td class="value-col" style="font-weight: 600;">${beneficiary.vulnerabilityGroup}</td>
      </tr>
    </table>

    <!-- Section II -->
    <div class="section-title">II. HOÀN CẢNH CỤ THỂ VÀ LÝ DO ĐỀ NGHỊ TRỢ GIÚP</div>
    <div class="box-reason">
      <div style="margin-bottom: 6px;">
        <strong>Đánh giá thực địa CTXH:</strong> ${circumstances.fieldAssessment}
      </div>
      ${circumstances.notes ? `<div style="font-style: italic; color: #475569;"><strong>Ghi chú bổ sung:</strong> ${circumstances.notes}</div>` : ''}
    </div>

    <!-- Section III -->
    <div class="section-title">III. CÁC BIỆN PHÁP TRỢ GIÚP XÃ HỘI ĐỀ XUẤT TIẾP NHẬN</div>
    <div style="margin-bottom: 18px; padding: 4px 0;">
      ${measuresHtml}
    </div>

    <!-- Signatures Block -->
    <table class="signature-table">
      <tr>
        <td>
          <div style="font-size: 11pt; font-weight: 800; color: #16375d;">NGƯỜI / CÁN BỘ LẬP PHIẾU</div>
          <div style="font-size: 9.5pt; color: #64748b; font-style: italic;">(Ký, ghi rõ họ tên và xác thực thông tin)</div>
          <div style="height: 55px;"></div>
          <div style="font-size: 11pt; font-weight: 700; color: #16375d;">${issuer.officerName}</div>
        </td>
        <td>
          <div style="font-size: 11pt; font-weight: 800; color: #16375d;">${issuer.signerTitle || 'ĐẠI DIỆN ĐƠN VỊ CHUYỂN TUYẾN'}</div>
          <div style="font-size: 9.5pt; color: #64748b; font-style: italic;">(Ký tên, đóng dấu xác nhận an sinh)</div>
          <div style="height: 55px;"></div>
          <div style="font-size: 11pt; font-weight: 700; color: #16375d;">${issuer.organization}</div>
        </td>
      </tr>
    </table>

    <div style="text-align: center; font-size: 9pt; color: #94a3b8; font-style: italic; margin-top: 24px;">
      Hệ thống BƯỚC TIẾP — UNESCO Youth Hackathon 2026. Dữ liệu được mã hóa & xác thực toàn vẹn qua Cloudflare D1 Serverless.
    </div>
  </div>
</body>
</html>
  `.trim();
}
