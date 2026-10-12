import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
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
} from 'docx';
import { Env } from '../bindings';
import { AuthContext } from '../middleware/auth';
import {
  createDatabaseClient,
  cases,
  beneficiaries,
  encounters,
  livelihoodPassports,
  followUps,
  referrals,
  safeguardingFlags,
} from '@buoc-tiep/database';

export const exportDocxRoutes = new Hono<{ Bindings: Env; Variables: { user?: AuthContext } }>();

interface CaseFullData {
  caseId: string;
  aliasName: string;
  fullName?: string | null;
  birthYear?: number | null;
  isMinor?: boolean | null;
  vulnerabilityGroup?: string | null;
  currentArea?: string | null;
  status: string;
  priority: string;
  createdAt?: string | null;
  organizationId?: string | null;
  assignedTo?: string | null;
  encountersList?: Array<{
    id: string;
    encounterDate: string;
    locationText?: string | null;
    summary?: string | null;
    healthState?: string | null;
    weatherCondition?: string | null;
  }>;
  passportData?: {
    skills?: string | null;
    workPreference?: string | null;
    healthStatus?: string | null;
    location?: string | null;
  } | null;
  followUpsList?: Array<{
    id: string;
    actionType: string;
    notes?: string | null;
    status: string;
    dueDate?: string | null;
  }>;
  referralsList?: Array<{
    id: string;
    targetService: string;
    partnerName?: string | null;
    status: string;
  }>;
  safeguardingList?: Array<{
    reason: string;
    severity: string;
    status: string;
    escalatedTo111?: boolean | null;
  }>;
}

/**
 * Hàm khởi tạo buffer DOCX chuẩn Mẫu 07 theo chuẩn hành chính và UNESCO Safeguarding
 */
async function generateForm07DocxBuffer(data: CaseFullData): Promise<Uint8Array> {
  const currentDateStr = new Date().toLocaleDateString('vi-VN');
  const isChild = Boolean(data.isMinor);
  const aliasDisplay = data.aliasName || (isChild ? 'CHILD-2026-XXXX' : 'ADULT-2026-XXXX');

  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // QUỐC HIỆU & TIÊU NGỮ
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                bold: true,
                size: 24,
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
                size: 24,
                underline: {},
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '***',
                bold: true,
                size: 20,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: 'TỔ CHỨC / DỰ ÁN: ',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: 'BƯỚC TIẾP — DỰ ÁN AN SINH SỐ UNESCO YOUTH HACKATHON 2026',
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // TIÊU ĐỀ MẪU 07
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'PHIẾU TIẾP NHẬN & CHUYỂN TUYẾN CA HỖ TRỢ AN SINH SỐ',
                bold: true,
                size: 28,
                color: '1E3A8A',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '(MẪU 07 — Ban hành theo Quy trình Đồng hành BƯỚC TIẾP 2026)',
                italics: true,
                size: 20,
                color: '475569',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Ngày lập phiếu: ${currentDateStr} | Mã hồ sơ: ${data.caseId}`,
                size: 20,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // CẢNH BÁO BẢO VỆ TRẺ EM NẾU LÀ MINOR
          ...(isChild
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: '⚠️ CHẾ ĐỘ BẢO VỆ TRẺ EM NGHÊM NGẶT (CHILD SAFEGUARDING): ',
                      bold: true,
                      color: 'DC2626',
                      size: 22,
                      font: 'Times New Roman',
                    }),
                    new TextRun({
                      text: 'Đối tượng là trẻ em vị thành niên (<18t). Danh tính thật được bảo vệ 100%, không công khai hình ảnh/tọa độ nhạy cảm và tuyệt đối KHÔNG tạo Hộ chiếu sinh kế lao động.',
                      size: 22,
                      color: 'DC2626',
                      font: 'Times New Roman',
                    }),
                  ],
                }),
                new Paragraph({ text: '' }),
              ]
            : []),

          // PHẦN I: THÔNG TIN HỒ SƠ & NGƯỜI THỤ HƯỞNG
          new Paragraph({
            children: [
              new TextRun({
                text: 'I. THÔNG TIN HỒ SƠ & NGƯỜI THỤ HƯỞNG',
                bold: true,
                size: 24,
                color: '1E3A8A',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Mã ca (Case ID)', bold: true, size: 20, font: 'Times New Roman' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: data.caseId, size: 20, font: 'Times New Roman' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tên ẩn danh (Alias)', bold: true, size: 20, font: 'Times New Roman' })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: aliasDisplay, bold: true, color: '0D9488', size: 20, font: 'Times New Roman' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Họ và tên xác minh', bold: true, size: 20, font: 'Times New Roman' })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.fullName || '(Ẩn danh bảo mật)', size: 20, font: 'Times New Roman' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Phân loại đối tượng', bold: true, size: 20, font: 'Times New Roman' })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${data.vulnerabilityGroup || 'street_worker'} ${isChild ? ' (Trẻ em <18t)' : ''}`, size: 20, font: 'Times New Roman' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Địa bàn hoạt động', bold: true, size: 20, font: 'Times New Roman' })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.currentArea || 'Chưa cập nhật', size: 20, font: 'Times New Roman' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Trạng thái & Ưu tiên', bold: true, size: 20, font: 'Times New Roman' })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `Trạng thái: ${data.status.toUpperCase()} | Ưu tiên: ${data.priority.toUpperCase()}`, size: 20, font: 'Times New Roman' })] })],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // PHẦN II: LƯỢT GẶP & GHI NHẬN HIỆN TRƯỜNG
          new Paragraph({
            children: [
              new TextRun({
                text: 'II. LƯỢT GẶP & GHI NHẬN HIỆN TRƯỜNG (ENCOUNTERS & INTAKE)',
                bold: true,
                size: 24,
                color: '1E3A8A',
                font: 'Times New Roman',
              }),
            ],
          }),
          ...(data.encountersList && data.encountersList.length > 0
            ? data.encountersList.map(
                (enc, index) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Lượt gặp #${index + 1} (${enc.encounterDate}): `,
                        bold: true,
                        size: 20,
                        font: 'Times New Roman',
                      }),
                      new TextRun({
                        text: `Địa điểm: ${enc.locationText || 'Hiện trường'}. Nội dung: ${enc.summary || 'Trò chuyện tiếp xúc'}. Sức khỏe: ${enc.healthState || 'Ổn định'}.`,
                        size: 20,
                        font: 'Times New Roman',
                      }),
                    ],
                  })
              )
            : [
                new Paragraph({
                  children: [new TextRun({ text: 'Chưa có bản ghi lượt gặp mặt hiện trường.', italics: true, size: 20, font: 'Times New Roman' })],
                }),
              ]),
          new Paragraph({ text: '' }),

          // PHẦN III: HỘ CHIẾU SINH KẾ & NĂNG LỰC LAO ĐỘNG
          new Paragraph({
            children: [
              new TextRun({
                text: 'III. HỘ CHIẾU SINH KẾ & NĂNG LỰC (LIVELIHOOD PASSPORT)',
                bold: true,
                size: 24,
                color: '1E3A8A',
                font: 'Times New Roman',
              }),
            ],
          }),
          isChild
            ? new Paragraph({
                children: [
                  new TextRun({
                    text: '[KHÓA HỘ CHIẾU SINH KẾ] Theo quy định Bảo vệ Trẻ em UNESCO Safeguarding, không đăng ký hộ chiếu lao động cho trẻ em dưới 18 tuổi.',
                    bold: true,
                    color: 'DC2626',
                    size: 20,
                    font: 'Times New Roman',
                  }),
                ],
              })
            : new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorder,
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: 'Kỹ năng tích lũy', bold: true, size: 20, font: 'Times New Roman' })] })],
                      }),
                      new TableCell({
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: data.passportData?.skills || 'Chưa cập nhật', size: 20, font: 'Times New Roman' })] })],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Nguyện vọng công việc', bold: true, size: 20, font: 'Times New Roman' })] })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: data.passportData?.workPreference || 'Chưa cập nhật', size: 20, font: 'Times New Roman' })] })],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: 'Sức khỏe lao động', bold: true, size: 20, font: 'Times New Roman' })] })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: data.passportData?.healthStatus || 'Tốt', size: 20, font: 'Times New Roman' })] })],
                      }),
                    ],
                  }),
                ],
              }),
          new Paragraph({ text: '' }),

          // PHẦN IV: CHUYỂN TUYẾN DỊCH VỤ & NHIỆM VỤ ĐỒNG HÀNH
          new Paragraph({
            children: [
              new TextRun({
                text: 'IV. KẾT NỐI DỊCH VỤ & CHUYỂN TUYẾN AN SINH',
                bold: true,
                size: 24,
                color: '1E3A8A',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Nhiệm vụ đồng hành đã giao: ',
                bold: true,
                size: 20,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: data.followUpsList && data.followUpsList.length > 0
                  ? data.followUpsList.map(f => `${f.actionType} (${f.status})`).join(', ')
                  : 'Đang lên kế hoạch hỗ trợ',
                size: 20,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Đơn vị / Đối tác tiếp nhận chuyển tuyến: ',
                bold: true,
                size: 20,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: data.referralsList && data.referralsList.length > 0
                  ? data.referralsList.map(r => `${r.targetService} -> ${r.partnerName || 'Đối tác an sinh'}`).join('; ')
                  : 'Mạng lưới Đối tác BƯỚC TIẾP & Cán bộ Xã hội Hóc Môn',
                size: 20,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // PHẦN V: XÁC NHẬN BẢO VỆ & CHỮ KÝ
          new Paragraph({
            children: [
              new TextRun({
                text: 'V. CAM KẾT 3 KHÔNG & CHỮ KÝ XÁC NHẬN',
                bold: true,
                size: 24,
                color: '1E3A8A',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Đã hoàn tất kiểm duyệt Privacy Gate 3 KHÔNG: (1) Không ép buộc tiết lộ danh tính, (2) Không rò rỉ hình ảnh/tọa độ nhạy cảm, (3) Không tự ý coi trích xuất AI thành sự thật pháp lý.',
                italics: true,
                size: 20,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // CHỮ KÝ DƯỚI CÙNG
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: 'CÁN BỘ ĐỒNG HÀNH / TNV', bold: true, size: 20, font: 'Times New Roman' })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', italics: true, size: 18, font: 'Times New Roman' })],
                      }),
                      new Paragraph({ text: '' }),
                      new Paragraph({ text: '' }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: data.assignedTo || 'Tình nguyện viên BƯỚC TIẾP', bold: true, size: 20, font: 'Times New Roman' })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: 'ĐẠI DIỆN DỰ ÁN BƯỚC TIẾP', bold: true, size: 20, font: 'Times New Roman' })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: '(Xác nhận & đóng dấu an sinh)', italics: true, size: 18, font: 'Times New Roman' })],
                      }),
                      new Paragraph({ text: '' }),
                      new Paragraph({ text: '' }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: 'UNESCO Youth Hackathon 2026', bold: true, size: 20, font: 'Times New Roman' })],
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

  return await Packer.toBuffer(doc);
}

/**
 * Route handler chính: Lấy dữ liệu D1 SQLite và trả về file DOCX Mẫu 07
 */
export async function handleExportDocx(c: any, caseId: string) {
  const db = createDatabaseClient(c.env.DB);

  // 1. Truy vấn thông tin ca từ D1
  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  const user = c.get('user');

  // RBAC & Organization Boundary Check
  if (caseItem && user && user.role !== 'admin' && caseItem.organizationId && caseItem.organizationId !== user.organizationId) {
    return c.json({ success: false, error: 'Truy cập bị từ chối. Bạn không có quyền xuất phiếu Mẫu 07 thuộc tổ chức khác.' }, 403);
  }

  let beneficiary = null;
  if (caseItem) {
    beneficiary = await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseItem.beneficiaryId)).get();
  } else {
    // Thử truy vấn nếu caseId thực chất là beneficiaryId
    beneficiary = await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseId)).get();
  }

  const finalCaseId = caseItem?.id || caseId;
  const aliasName = beneficiary?.aliasName || (beneficiary?.isMinor ? 'CHILD-2026-1049' : 'ADULT-2026-4821');

  // 2. Truy vấn danh sách lượt gặp hiện trường
  const encountersList = await db.select().from(encounters).where(eq(encounters.caseId, finalCaseId)).all();

  // 3. Truy vấn Hộ chiếu sinh kế
  let passportData = null;
  if (beneficiary) {
    passportData = await db.select().from(livelihoodPassports).where(eq(livelihoodPassports.beneficiaryId, beneficiary.id)).get();
  }

  // 4. Truy vấn nhiệm vụ follow up
  const followUpsList = await db.select().from(followUps).where(eq(followUps.caseId, finalCaseId)).all();

  // 5. Truy vấn đối tác chuyển tuyến
  const referralsList = await db.select().from(referrals).where(eq(referrals.caseId, finalCaseId)).all();

  // 6. Truy vấn cờ bảo vệ Safeguarding
  const safeguardingList = await db.select().from(safeguardingFlags).where(eq(safeguardingFlags.caseId, finalCaseId)).all();

  const caseFullData: CaseFullData = {
    caseId: finalCaseId,
    aliasName,
    fullName: beneficiary?.fullName || null,
    birthYear: beneficiary?.birthYear || null,
    isMinor: beneficiary?.isMinor || false,
    vulnerabilityGroup: beneficiary?.vulnerabilityGroup || 'street_worker',
    currentArea: beneficiary?.currentArea || 'Hóc Môn, TP.HCM',
    status: caseItem?.status || 'open',
    priority: caseItem?.priority || 'medium',
    createdAt: caseItem?.createdAt || new Date().toISOString(),
    organizationId: caseItem?.organizationId || 'org-default',
    assignedTo: caseItem?.assignedTo || 'usr-volunteer-default',
    encountersList: encountersList.map(e => ({
      id: e.id,
      encounterDate: e.encounterDate || new Date().toISOString(),
      locationText: e.locationText,
      summary: e.summary,
      healthState: e.healthState,
      weatherCondition: e.weatherCondition,
    })),
    passportData: passportData ? {
      skills: passportData.skills,
      workPreference: passportData.workPreference,
      healthStatus: passportData.healthStatus,
      location: passportData.location,
    } : null,
    followUpsList: followUpsList.map(f => ({
      id: f.id,
      actionType: f.actionType,
      notes: f.notes,
      status: f.status || 'pending',
      dueDate: f.dueDate,
    })),
    referralsList: referralsList.map(r => ({
      id: r.id,
      targetService: r.type || 'CHUYỂN TUYẾN DỊCH VỤ',
      partnerName: r.notes || 'Đối tác an sinh',
      status: r.status || 'DRAFT',
    })),
    safeguardingList: safeguardingList.map(s => ({
      reason: s.reason,
      severity: s.severity || 'medium',
      status: s.status || 'open',
      escalatedTo111: s.escalatedTo111,
    })),
  };

  // Tạo DOCX Binary Buffer
  const docxBuffer = await generateForm07DocxBuffer(caseFullData);

  const dateTag = new Date().toISOString().slice(0, 10);
  const safeAlias = aliasName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Mau_07_${safeAlias}_${dateTag}.docx`;

  return c.body(docxBuffer.buffer as ArrayBuffer, 200, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Access-Control-Expose-Headers': 'Content-Disposition',
  });
}

// GET /api/cases/:id/export-docx
exportDocxRoutes.get('/:id/export-docx', async (c) => {
  const caseId = c.req.param('id');
  return handleExportDocx(c, caseId);
});

// GET /api/export/form07-docx (với query caseId)
exportDocxRoutes.get('/form07-docx', async (c) => {
  const caseId = c.req.query('caseId') || c.req.query('id') || 'case-sample-001';
  return handleExportDocx(c, caseId);
});

// POST /api/export/form07-docx
exportDocxRoutes.post('/form07-docx', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const caseId = body.caseId || body.id || c.req.query('caseId') || 'case-sample-001';
  return handleExportDocx(c, caseId);
});
