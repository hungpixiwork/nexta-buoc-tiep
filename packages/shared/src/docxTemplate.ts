import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  Packer,
} from 'docx';

export interface Form07Data {
  officialDocNo: string;
  recipientName: string;
  recipientAddress: string;
  fullName: string;
  aliasName: string;
  passportId: string;
  age: number | string;
  gender: string;
  currentArea: string;
  vulnerabilityGroup: string;
  emergencyReason: string;
  proposedMeasuresList: string[];
  issuingOfficer: string;
  issuingDept: string;
  createdDate: string;
  isDraft?: boolean;
  watermarkText?: string;
}

export const DEFAULT_FORM_07_DATA: Form07Data = {
  officialDocNo: '07/2026/ĐN-BT',
  recipientName: 'ỦY BAN NHÂN DÂN HUYỆN HÓC MÔN',
  recipientAddress: 'Thị trấn Hóc Môn, Huyện Hóc Môn, TP. Hồ Chí Minh',
  fullName: 'Nguyễn Văn An',
  aliasName: 'Tèo Bụi',
  passportId: 'BT-2026-8892',
  age: 28,
  gender: 'Nam',
  currentArea: 'Khu vực Cầu Xáng, Huyện Hóc Môn, TP. Hồ Chí Minh',
  vulnerabilityGroup: 'Người lao động tự do cơ nhỡ, mất việc làm & không có chỗ ở cố định',
  emergencyReason: 'Bị kiệt sức do thất nghiệp kéo dài, không có chi phí trang trải ăn ở khẩn cấp và thiếu giấy tờ tùy thân',
  proposedMeasuresList: [
    'Biện pháp 1: Trợ giúp nhu yếu phẩm, ăn ở tạm thời khẩn cấp trong vòng 30 ngày.',
    'Biện pháp 2: Tầm soát sức khỏe, tư vấn y tế ban đầu & hỗ trợ tâm lý.',
    'Biện pháp 3: Hỗ trợ khôi phục giấy tờ tùy thân & Cấp Hộ chiếu Sinh kế số hóa BƯỚC TIẾP.',
    'Biện pháp 4: Đào tạo kỹ năng nghề ngắn hạn & Kết nối việc làm phù hợp tại địa phương.',
    'Biện pháp 5: Chuyển tuyến an toàn và đăng ký chương trình an sinh xã hội chính quy.'
  ],
  issuingOfficer: 'Trần Văn Bình (Cán bộ Xã hội)',
  issuingDept: 'TRUNG TÂM TRỢ GIÚP BƯỚC TIẾP',
  createdDate: 'Ngày 06 tháng 08 năm 2026',
  isDraft: false,
  watermarkText: 'BẢN CHÍNH THỨC'
};

/**
 * Builds a DOCX Document instance representing Mẫu số 07 NĐ 20/2021/NĐ-CP
 */
export function createForm07Document(inputData?: Partial<Form07Data>): Document {
  const data: Form07Data = {
    ...DEFAULT_FORM_07_DATA,
    ...inputData,
    proposedMeasuresList: inputData?.proposedMeasuresList?.length
      ? inputData.proposedMeasuresList
      : DEFAULT_FORM_07_DATA.proposedMeasuresList
  };

  const watermarkLabel = data.isDraft ? 'BẢN NHÁP' : (data.watermarkText || 'BẢN CHÍNH THỨC');

  // Border helpers
  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  const thinBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
  };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // ~2cm
              bottom: 1134,
              left: 1417, // ~2.5cm
              right: 1417,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `[ ${watermarkLabel} - HỆ THỐNG BƯỚC TIẾP UNESCO 2026 ]`,
                    italics: true,
                    size: 16,
                    color: data.isDraft ? 'D97706' : '1E40AF',
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Mẫu số 07 NĐ 20/2021/NĐ-CP | Trang ',
                    size: 18,
                    font: 'Times New Roman',
                    color: '6B7280',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    font: 'Times New Roman',
                    color: '6B7280',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // 1. Quốc hiệu - Tiêu ngữ & Đơn vị ban hành (Header Table)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorder,
            rows: [
              new TableRow({
                children: [
                  // Left Column: Đơn vị
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    borders: noBorder,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: data.issuingDept.toUpperCase(),
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
                            text: `Số: ${data.officialDocNo}`,
                            size: 20,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                    ],
                  }),
                  // Right Column: Quốc hiệu Tiêu ngữ
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    borders: noBorder,
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
                            size: 20,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: '-----------------------',
                            bold: true,
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

          // 2. Tiêu đề Văn bản
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
            children: [
              new TextRun({
                text: 'PHIẾU ĐỀ NGHỊ TRỢ GIÚP XÃ HỘI KHẨN CẤP',
                bold: true,
                size: 28,
                font: 'Times New Roman',
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: '(Theo Mẫu số 07 quy định tại Nghị định số 20/2021/NĐ-CP ngày 15/3/2021 của Chính phủ)',
                italics: true,
                size: 20,
                font: 'Times New Roman',
              }),
            ],
          }),

          // 3. Kính gửi
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: 'Kính gửi: ', bold: true, size: 22, font: 'Times New Roman' }),
              new TextRun({ text: data.recipientName, bold: true, size: 22, font: 'Times New Roman' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: 'Địa chỉ tiếp nhận: ', bold: true, size: 22, font: 'Times New Roman' }),
              new TextRun({ text: data.recipientAddress, size: 22, font: 'Times New Roman' }),
            ],
          }),

          // 4. Section I: THÔNG TIN NGƯỜI ĐƯỢC ĐỀ NGHỊ TRỢ GIÚP
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: 'I. THÔNG TIN NGƯỜI ĐƯỢC ĐỀ NGHỊ TRỢ GIÚP XÃ HỘI',
                bold: true,
                size: 24,
                font: 'Times New Roman',
                color: '1E40AF',
              }),
            ],
          }),

          // Table beneficiary details
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: thinBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Họ và tên:', bold: true, size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.fullName, bold: true, size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Biệt danh / Tên khác:', bold: true, size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.aliasName || '(Không có)', size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Mã số / CCCD:', bold: true, size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.passportId, bold: true, size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Tuổi / Giới tính:', bold: true, size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: `${data.age} tuổi  |  Giới tính: ${data.gender}`, size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Chỗ ở hiện tại:', bold: true, size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.currentArea, size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Nhóm yếu thế:', bold: true, size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    borders: thinBorder,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.vulnerabilityGroup, size: 20, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 200 } }),

          // 5. Section II: LÝ DO KHẨN CẤP
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: 'II. LÝ DO & HOÀN CẢNH ĐỀ NGHỊ TRỢ GIÚP KHẨN CẤP',
                bold: true,
                size: 24,
                font: 'Times New Roman',
                color: '1E40AF',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: data.emergencyReason,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),

          // 6. Section III: DANH SÁCH 5 BIỆN PHÁP TRỢ GIÚP XÃ HỘI
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: 'III. ĐỀ XUẤT 05 BIỆN PHÁP TRỢ GIÚP XÃ HỘI KHẨN CẤP',
                bold: true,
                size: 24,
                font: 'Times New Roman',
                color: '1E40AF',
              }),
            ],
          }),

          ...data.proposedMeasuresList.map(
            (measure, idx) =>
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: `${idx + 1}. `,
                    bold: true,
                    size: 22,
                    font: 'Times New Roman',
                  }),
                  new TextRun({
                    text: measure,
                    size: 22,
                    font: 'Times New Roman',
                  }),
                ],
              })
          ),

          new Paragraph({ text: '', spacing: { after: 300 } }),

          // 7. Khung chữ ký 2 bên (Signatures)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorder,
            rows: [
              new TableRow({
                children: [
                  // Left side: Cán bộ lập phiếu
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: noBorder,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'CÁN BỘ LẬP PHIẾU',
                            bold: true,
                            size: 22,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: '(Ký, ghi rõ họ tên)',
                            italics: true,
                            size: 18,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({ text: '', spacing: { after: 600 } }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: data.issuingOfficer,
                            bold: true,
                            size: 22,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                    ],
                  }),
                  // Right side: Thủ trưởng đơn vị tiếp nhận
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: noBorder,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: data.createdDate,
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
                            text: 'THỦ TRƯỞNG ĐƠN VỊ TIẾP NHẬN',
                            bold: true,
                            size: 22,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: '(Ký tên, đóng dấu)',
                            italics: true,
                            size: 18,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                      new Paragraph({ text: '', spacing: { after: 600 } }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `[Đã xác thực chữ ký số: ${data.recipientName}]`,
                            bold: true,
                            italics: true,
                            size: 18,
                            font: 'Times New Roman',
                            color: '059669',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return doc;
}

/**
 * Generates an ArrayBuffer representation of the Form 07 document.
 */
export async function generateForm07ArrayBuffer(data?: Partial<Form07Data>): Promise<ArrayBuffer> {
  const doc = createForm07Document(data);
  const buf = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buf);
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
}

/**
 * Generates a Blob representation of the Form 07 document (useful for Browser downloads).
 */
export async function generateForm07Blob(data?: Partial<Form07Data>): Promise<Blob> {
  const doc = createForm07Document(data);
  return await Packer.toBlob(doc);
}
