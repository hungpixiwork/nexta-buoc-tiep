import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  TableLayoutType,
  Header,
} from 'docx';
import { ReferralDocumentModel } from './referral-document.types';
import { REFERRAL_DOCUMENT_SPEC } from './referral-document.layout';

/**
 * Builds standard OpenXML (.docx) document strictly matching REFERRAL_DOCUMENT_SPEC and UI Preview
 */
export function createReferralDocxDocument(model: ReferralDocumentModel): Document {
  const { metadata, issuer, recipient, beneficiary, circumstances, referral } = model;
  const spec = REFERRAL_DOCUMENT_SPEC;

  // Log layout dimensions in development
  if (typeof window !== 'undefined' && (window as any).__DEV_DOCX_LOG__) {
    console.table({
      pageWidthTwips: spec.page.widthTwips,
      leftMarginTwips: spec.page.marginTwips.left,
      rightMarginTwips: spec.page.marginTwips.right,
      contentWidthTwips: spec.content.widthTwips,
      headerLeftWidth: spec.content.headerLeftWidthTwips,
      headerRightWidth: spec.content.headerRightWidthTwips,
      labelColumnWidth: spec.content.labelColumnWidthTwips,
      valueColumnWidth: spec.content.valueColumnWidthTwips,
    });
  }

  const dateObj = new Date(metadata.generatedAt || Date.now());
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();

  const isApproved = metadata.isApproved;
  const watermarkText = isApproved ? 'BẢN CHÍNH THỨC' : 'BẢN NHÁP (DRAFT)';

  const displayName = metadata.redactPII
    ? `${beneficiary.aliasName} (🔒 Che tên thật theo Luật Trẻ em 2016)`
    : (beneficiary.fullName || beneficiary.aliasName);

  const doc = new Document({
    creator: 'BƯỚC TIẾP — UNESCO Youth Hackathon 2026',
    title: `Phiếu Đề Nghị Trợ Giúp Xã Hội Mẫu 07 — ${beneficiary.aliasName}`,
    description: 'Hồ sơ chuyển tiếp an sinh xã hội chuẩn Nghị định 20/2021/NĐ-CP',
    sections: [
      {
        properties: {
          page: {
            size: {
              width: spec.page.widthTwips,
              height: spec.page.heightTwips,
            },
            margin: {
              top: spec.page.marginTwips.top,
              right: spec.page.marginTwips.right,
              bottom: spec.page.marginTwips.bottom,
              left: spec.page.marginTwips.left,
            },
          },
        },
        children: [
          // 1. Header Table (2 columns: 50% / 50% in DXA)
          new Table({
            width: {
              size: spec.content.widthTwips,
              type: WidthType.DXA,
            },
            layout: TableLayoutType.FIXED,
            columnWidths: [spec.content.headerLeftWidthTwips, spec.content.headerRightWidthTwips],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: {
                      size: spec.content.headerLeftWidthTwips,
                      type: WidthType.DXA,
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: issuer.city,
                            bold: true,
                            size: 20, // 10pt
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: issuer.organization,
                            bold: true,
                            size: 20, // 10pt
                            color: '16375D',
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `Số: `,
                            italics: true,
                            size: 18,
                            font: 'Times New Roman',
                          }),
                          new TextRun({
                            text: metadata.documentNumber,
                            bold: true,
                            size: 18,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: {
                      size: spec.content.headerRightWidthTwips,
                      type: WidthType.DXA,
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                            bold: true,
                            size: 20,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Độc lập - Tự do - Hạnh phúc',
                            bold: true,
                            italics: true,
                            size: 20,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `TP. Hồ Chí Minh, ngày ${day} tháng ${month} năm ${year}`,
                            italics: true,
                            size: 18,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 200 } }),

          // 2. Document Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'PHIẾU ĐỀ NGHỊ TRỢ GIÚP XÃ HỘI VÀ CHUYỂN TUYẾN',
                bold: true,
                size: 28, // 14pt
                color: '16375D',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '(Mẫu số 07 — Ban hành kèm theo Nghị định số 20/2021/NĐ-CP ngày 15/03/2021 của Chính phủ)',
                bold: true,
                italics: true,
                size: 20, // 10pt
                color: 'D97706',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Mã phiếu D1: ', size: 18, font: 'Times New Roman', color: '64748B' }),
              new TextRun({ text: metadata.referenceId, bold: true, size: 18, font: 'Times New Roman' }),
              new TextRun({ text: ' • Mã định danh sinh kế: ', size: 18, font: 'Times New Roman', color: '64748B' }),
              new TextRun({ text: metadata.passportId, bold: true, size: 18, font: 'Times New Roman' }),
            ],
            spacing: { after: 200 },
          }),

          // 3. Recipient Block (Kính gửi)
          new Paragraph({
            children: [
              new TextRun({ text: 'Kính gửi: ', bold: true, size: 22, font: 'Times New Roman' }),
              new TextRun({
                text: recipient.agencyName.toUpperCase(),
                bold: true,
                size: 22,
                color: '16375D',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Địa chỉ cơ sở: ', bold: true, size: 20, font: 'Times New Roman' }),
              new TextRun({ text: recipient.address, size: 20, font: 'Times New Roman' }),
            ],
            spacing: { after: 220 },
          }),

          // 4. Section I: Beneficiary Table
          new Paragraph({
            children: [
              new TextRun({
                text: 'I. THÔNG TIN NGƯỜI THỤ HƯỞNG ĐƯỢC CHUYỂN TUYẾN',
                bold: true,
                size: 22,
                color: '16375D',
                font: 'Times New Roman',
              }),
            ],
            spacing: { after: 100 },
          }),

          new Table({
            width: {
              size: spec.content.widthTwips,
              type: WidthType.DXA,
            },
            layout: TableLayoutType.FIXED,
            columnWidths: [spec.content.labelColumnWidthTwips, spec.content.valueColumnWidthTwips],
            rows: [
              createTableRow('Họ và tên:', displayName, spec),
              createTableRow('Mã định danh sinh kế (Passport):', beneficiary.passportCode, spec, true),
              createTableRow('Tuổi / Giới tính:', `${beneficiary.age} tuổi • Giới tính: ${beneficiary.gender}`, spec),
              createTableRow('Địa bàn cư trú / Tiếp cận:', beneficiary.location, spec),
              createTableRow('Nhóm đối tượng yếu thế:', beneficiary.vulnerabilityGroup, spec),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 200 } }),

          // 5. Section II: Circumstances
          new Paragraph({
            children: [
              new TextRun({
                text: 'II. HOÀN CẢNH CỤ THỂ VÀ LÝ DO ĐỀ NGHỊ TRỢ GIÚP',
                bold: true,
                size: 22,
                color: '16375D',
                font: 'Times New Roman',
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Đánh giá thực địa CTXH: ', bold: true, size: 20, font: 'Times New Roman' }),
              new TextRun({ text: circumstances.fieldAssessment, size: 20, font: 'Times New Roman' }),
            ],
          }),
          ...(circumstances.notes
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Ghi chú bổ sung: ', bold: true, size: 20, font: 'Times New Roman' }),
                    new TextRun({ text: circumstances.notes, italics: true, size: 20, font: 'Times New Roman' }),
                  ],
                }),
              ]
            : []),

          new Paragraph({ text: '', spacing: { after: 200 } }),

          // 6. Section III: Proposed Measures
          new Paragraph({
            children: [
              new TextRun({
                text: 'III. CÁC BIỆN PHÁP TRỢ GIÚP XÃ HỘI ĐỀ XUẤT TIẾP NHẬN',
                bold: true,
                size: 22,
                color: '16375D',
                font: 'Times New Roman',
              }),
            ],
            spacing: { after: 100 },
          }),
          ...referral.proposedMeasures.map(
            (measure) =>
              new Paragraph({
                children: [
                  new TextRun({ text: '✓  ', bold: true, color: '16A34A', size: 20, font: 'Times New Roman' }),
                  new TextRun({ text: measure, bold: true, color: '15803D', size: 20, font: 'Times New Roman' }),
                ],
                spacing: { after: 50 },
              })
          ),

          new Paragraph({ text: '', spacing: { after: 360 } }),

          // 7. Signatures Table (2 columns: 50% / 50% in DXA)
          new Table({
            width: {
              size: spec.content.widthTwips,
              type: WidthType.DXA,
            },
            layout: TableLayoutType.FIXED,
            columnWidths: [spec.content.headerLeftWidthTwips, spec.content.headerRightWidthTwips],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: {
                      size: spec.content.headerLeftWidthTwips,
                      type: WidthType.DXA,
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'NGƯỜI / CÁN BỘ LẬP PHIẾU',
                            bold: true,
                            size: 20,
                            color: '16375D',
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: '(Ký, ghi rõ họ tên và xác thực thông tin)',
                            italics: true,
                            size: 18,
                            color: '64748B',
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({ text: '', spacing: { after: 700 } }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: issuer.officerName,
                            bold: true,
                            size: 20,
                            color: '16375D',
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: {
                      size: spec.content.headerRightWidthTwips,
                      type: WidthType.DXA,
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: issuer.signerTitle || 'ĐẠI DIỆN ĐƠN VỊ CHUYỂN TUYẾN',
                            bold: true,
                            size: 20,
                            color: '16375D',
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: '(Ký tên, đóng dấu xác nhận an sinh)',
                            italics: true,
                            size: 18,
                            color: '64748B',
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({ text: '', spacing: { after: 700 } }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: issuer.organization,
                            bold: true,
                            size: 20,
                            color: 'B45309',
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 260 } }),

          // 8. Footer Note
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Hệ thống BƯỚC TIẾP — UNESCO Youth Hackathon 2026. Dữ liệu được mã hóa & xác thực toàn vẹn qua Cloudflare D1 Serverless.',
                size: 16,
                color: '64748B',
                italics: true,
                font: 'Times New Roman',
              }),
            ],
          }),
        ],
      },
    ],
  });

  return doc;
}

function createTableRow(
  label: string,
  value: string,
  spec: typeof REFERRAL_DOCUMENT_SPEC,
  isMonospace = false
): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: {
          size: spec.content.labelColumnWidthTwips,
          type: WidthType.DXA,
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
          left: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
          right: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 20,
                font: 'Times New Roman',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: {
          size: spec.content.valueColumnWidthTwips,
          type: WidthType.DXA,
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
          left: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
          right: { style: BorderStyle.SINGLE, size: 2, color: 'CBD5E1' },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: value,
                size: 20,
                font: isMonospace ? 'Courier New' : 'Times New Roman',
                bold: isMonospace,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Generates Blob for client-side download
 */
export async function buildReferralDocxBlob(model: ReferralDocumentModel): Promise<Blob> {
  const doc = createReferralDocxDocument(model);
  return await Packer.toBlob(doc);
}

/**
 * Generates Buffer / Uint8Array for NodeJS / server-side export
 */
export async function buildReferralDocxBuffer(model: ReferralDocumentModel): Promise<Uint8Array> {
  const doc = createReferralDocxDocument(model);
  return await Packer.toBuffer(doc);
}

/**
 * Triggers instant browser download of the generated DOCX file
 */
export async function downloadReferralDocx(
  model: ReferralDocumentModel,
  customFilename?: string
): Promise<void> {
  const blob = await buildReferralDocxBlob(model);
  let safeAlias = model.beneficiary.aliasName || 'BENEFICIARY';
  safeAlias = safeAlias.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `Mau_07_${safeAlias}_${dateStr}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
