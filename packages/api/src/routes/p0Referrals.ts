import { Hono } from 'hono';
import { eq, and, inArray } from 'drizzle-orm';
import { Env } from '../bindings';
import { AuthContext } from '../middleware/auth';
import {
  createDatabaseClient,
  cases,
  beneficiaries,
  referrals,
  referralChannelConfigs,
  referralEvents,
  caseConsents,
  auditLogs,
  safeguardingFlags,
  encounters,
  voiceNotes,
  aiAnalyses,
} from '@buoc-tiep/database';
import {
  evaluateSafeguardingRisk,
  canCreateEmploymentReferral,
  sanitizeCsvCell,
  filterAllowlist,
  maskPhone,
  maskName,
  ReferralType,
  ReferralStatus,
  UpdateReferralStatusSchema,
  isValidReferralStatusTransition,
} from '@buoc-tiep/shared';
import { notifyReferralTransition } from '../services/notificationService';


export const p0ReferralRoutes = new Hono<{ Bindings: Env; Variables: { user?: AuthContext } }>();

// 1. GET /api/referral-channels - Danh sách các kênh tiếp nhận được cấu hình & xác minh
const getChannelsHandler = async (c: any) => {
  const db = createDatabaseClient(c.env.DB);
  const channels = await db.select().from(referralChannelConfigs).where(eq(referralChannelConfigs.enabled, true)).all();
  return c.json({ success: true, data: channels });
};

p0ReferralRoutes.get('/channels', getChannelsHandler);
p0ReferralRoutes.get('/', getChannelsHandler);
p0ReferralRoutes.get('', getChannelsHandler);


// 2. POST /api/cases/:caseId/referrals & /api/referrals/cases/:caseId/referrals
const postCaseReferralHandler = async (c: any) => {
  try {
    const caseId = c.req.param('caseId');
    const user = c.get('user');
    const body = await c.req.json().catch(() => ({}));
    const db = createDatabaseClient(c.env.DB);

    const referralType: ReferralType = body.type || 'GENERAL';
    const destinationCode = body.destinationCode || (
      referralType === 'CHILD_SAFEGUARDING' ? 'HELPLINE_111' :
      referralType === 'CIVIC_INCIDENT_1022' ? 'CIVIC_1022' :
      referralType === 'SOCIAL_ASSISTANCE' ? 'DVC_MAU_07' :
      referralType === 'EMPLOYMENT' ? 'TT_DVVL_HCM' : 'HELPLINE_111'
    );

  // Read case and beneficiary data
  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ ca' }, 404);
  }

  const beneficiary = await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseItem.beneficiaryId)).get();

  let latestEncounter: any = null;
  try {
    latestEncounter = await db.select().from(encounters).where(eq(encounters.caseId, caseId)).get();
  } catch (e) {
    latestEncounter = null;
  }

  let caseSafeguardFlags: any[] = [];
  try {
    caseSafeguardFlags = await db.select().from(safeguardingFlags).where(eq(safeguardingFlags.caseId, caseId)).all();
  } catch (e) {
    caseSafeguardFlags = [];
  }

  // Evaluate Safeguarding Risk
  const safeguardingInput = {
    isMinor: beneficiary?.isMinor,
    birthYear: beneficiary?.birthYear,
    vulnerabilityGroup: beneficiary?.vulnerabilityGroup,
    vulnerabilityFlags: [beneficiary?.vulnerabilityGroup || ''],
    riskFlags: caseSafeguardFlags.map(f => f.reason),
  };
  const assessment = evaluateSafeguardingRisk(safeguardingInput);

  // RULE CHECK: Employment Hard Deny
  if (referralType === 'EMPLOYMENT') {
    const eligibility = canCreateEmploymentReferral(safeguardingInput);
    if (!eligibility.allowed) {
      return c.json({
        success: false,
        error: {
          code: 'EMPLOYMENT_REFERRAL_BLOCKED',
          message: eligibility.reason,
          details: { blockers: assessment.reasons }
        }
      }, 403);
    }
  }

  // Find channel destination config
  const channelConfig = await db.select().from(referralChannelConfigs).where(eq(referralChannelConfigs.code, destinationCode)).get();
  if (channelConfig && channelConfig.verificationStatus !== 'VERIFIED') {
    return c.json({
      success: false,
      error: `Kênh tiếp nhận ${channelConfig.organizationName} chưa ở trạng thái xác minh (VERIFIED).`
    }, 400);
  }

  // Construct Sanitized Payload JSON
  const payloadJson = {
    referralType,
    caseId,
    aliasName: maskName(beneficiary?.fullName, Boolean(beneficiary?.isMinor), beneficiary?.aliasName),
    isMinor: Boolean(beneficiary?.isMinor || assessment.isPotentialMinor),
    vulnerabilityGroup: beneficiary?.vulnerabilityGroup || 'Không xác định',
    district: beneficiary?.currentArea || 'TP.Hồ Chí Minh',
    urgency: assessment.urgency,
    safeguardingReasons: assessment.reasons,
    locationText: latestEncounter?.locationText || 'TP.Hồ Chí Minh',
    observedFacts: [latestEncounter?.summary || 'Đã ghi nhận tiếp xúc thực địa ban đầu.'],
    reportedStatements: [latestEncounter?.healthState ? `Tình trạng sức khỏe: ${latestEncounter.healthState}` : 'Đã ghi nhận ý kiến người thụ hưởng.'],
    notes: body.notes || 'Bản nháp chuyển tuyến P0 được khởi tạo tự động.',
    consentConfirmed: Boolean(body.consentConfirmed),
  };

  const referralId = `ref-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  await db.insert(referrals).values({
    id: referralId,
    caseId,
    referredBy: user?.userId || body.createdBy || 'usr-volunteer-default',
    type: referralType,
    status: 'DRAFT',
    version: 1,
    payloadJson: JSON.stringify(payloadJson),
    destinationConfigId: channelConfig?.id || null,
    privacyClassification: assessment.isPotentialMinor ? 'CHILD_SAFEGUARDING_RESTRICTED' : 'SENSITIVE',
    createdAt: now,
    updatedAt: now,
  });

  // Log Referral Audit Event (CREATED)
  await db.insert(referralEvents).values({
    id: `refe-${crypto.randomUUID()}`,
    referralId,
    caseId,
    eventType: 'CREATED',
    actorId: user?.userId || 'usr-volunteer-default',
    metadataJson: JSON.stringify({ type: referralType, destinationCode }),
    createdAt: now,
  });

    return c.json({
      success: true,
      data: {
        id: referralId,
        caseId,
        type: referralType,
        status: 'DRAFT',
        destination: channelConfig?.organizationName || destinationCode,
        assessment,
        payload: payloadJson,
      },
      message: 'Khởi tạo bản nháp Chuyển tuyến P0 thành công.',
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Internal Server Error' }, 500);
  }
};

p0ReferralRoutes.post('/cases/:caseId/referrals', postCaseReferralHandler);
p0ReferralRoutes.post('/:caseId/referrals', postCaseReferralHandler);


// 3. GET /api/referrals/:id - Xem chi tiết Bản nháp Chuyển tuyến & Workflow
p0ReferralRoutes.get('/:id', async (c) => {
  const referralId = c.req.param('id');
  const user = c.get('user');
  const db = createDatabaseClient(c.env.DB);

  const referral = await db.select().from(referrals).where(eq(referrals.id, referralId)).get();
  if (!referral) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ chuyển tuyến' }, 404);
  }

  const caseItem = await db.select().from(cases).where(eq(cases.id, referral.caseId)).get();
  const beneficiary = caseItem ? await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseItem.beneficiaryId)).get() : null;
  const channelConfig = referral.destinationConfigId
    ? await db.select().from(referralChannelConfigs).where(eq(referralChannelConfigs.id, referral.destinationConfigId)).get()
    : null;

  // Log VIEWED event
  await db.insert(referralEvents).values({
    id: `refe-${crypto.randomUUID()}`,
    referralId,
    caseId: referral.caseId,
    eventType: 'VIEWED',
    actorId: user?.userId || 'usr-default',
    createdAt: new Date().toISOString(),
  });

  return c.json({
    success: true,
    data: {
      ...referral,
      payload: referral.payloadJson ? JSON.parse(referral.payloadJson as string) : null,
      beneficiaryAlias: beneficiary?.aliasName,
      isMinor: Boolean(beneficiary?.isMinor),
      channelConfig,
    }
  });
});

// 4. POST /api/referrals/:id/approve - Phê duyệt bản nháp (Human-in-the-loop)
p0ReferralRoutes.post('/:id/approve', async (c) => {
  const referralId = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const db = createDatabaseClient(c.env.DB);

  const referral = await db.select().from(referrals).where(eq(referrals.id, referralId)).get();
  if (!referral) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ chuyển tuyến' }, 404);
  }

  if (referral.status === 'APPROVED') {
    return c.json({ success: true, message: 'Hồ sơ chuyển tuyến đã được duyệt trước đó.', data: referral });
  }

  const now = new Date().toISOString();
  await db.update(referrals).set({
    status: 'APPROVED',
    approvedBy: user?.userId || 'usr-approver-default',
    approvedAt: now,
    updatedAt: now,
    notes: body.notes || referral.notes,
  }).where(eq(referrals.id, referralId));

  // Log APPROVED event
  await db.insert(referralEvents).values({
    id: `refe-${crypto.randomUUID()}`,
    referralId,
    caseId: referral.caseId,
    eventType: 'APPROVED',
    actorId: user?.userId || 'usr-approver-default',
    metadataJson: JSON.stringify({ approvedAt: now, notes: body.notes }),
    createdAt: now,
  });

  return c.json({
    success: true,
    message: 'Phê duyệt hồ sơ chuyển tuyến P0 thành công.',
    referralId,
    status: 'APPROVED',
    approvedAt: now,
  });
});

// 5. POST /api/referrals/:id/open-external - Trả về Action Descriptor điều hướng kênh ngoài & Log audit
p0ReferralRoutes.post('/:id/open-external', async (c) => {
  const referralId = c.req.param('id');
  const user = c.get('user');
  const db = createDatabaseClient(c.env.DB);

  const referral = await db.select().from(referrals).where(eq(referrals.id, referralId)).get();
  if (!referral) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ chuyển tuyến' }, 404);
  }

  const channelConfig = referral.destinationConfigId
    ? await db.select().from(referralChannelConfigs).where(eq(referralChannelConfigs.id, referral.destinationConfigId)).get()
    : null;

  const now = new Date().toISOString();
  await db.update(referrals).set({
    status: 'OPENED_EXTERNALLY',
    openedExternallyAt: now,
    updatedAt: now,
  }).where(eq(referrals.id, referralId));

  // Log EXTERNAL_CHANNEL_OPENED event
  await db.insert(referralEvents).values({
    id: `refe-${crypto.randomUUID()}`,
    referralId,
    caseId: referral.caseId,
    eventType: 'EXTERNAL_CHANNEL_OPENED',
    actorId: user?.userId || 'usr-default',
    metadataJson: JSON.stringify({ channelCode: channelConfig?.code, actionTime: now }),
    createdAt: now,
  });

  // Action Descriptor Builder
  let actionDescriptor = {
    type: channelConfig?.channelType || 'WEBSITE',
    label: `Kết nối với ${channelConfig?.organizationName || 'Cơ quan tiếp nhận'}`,
    href: channelConfig?.url || channelConfig?.phone ? `tel:${channelConfig.phone}` : 'https://tongdai111.vn',
    requiresConfirmation: true,
    disclaimer: 'Hành động này mở kênh liên hệ ngoài hệ thống. Hồ sơ chuyển tuyến chưa tự động được gửi đi cho tới khi người vận hành thực hiện thao tác trực tiếp.'
  };

  if (referral.type === 'CHILD_SAFEGUARDING') {
    actionDescriptor = {
      type: 'PHONE',
      label: 'Gọi Tổng đài Bảo vệ Trẻ em 111',
      href: `tel:${channelConfig?.phone || '111'}`,
      requiresConfirmation: true,
      disclaimer: 'Ưu tiên cuộc gọi khẩn cấp khi phát hiện trẻ em có nguy cơ bị bóc lột, bạo lực hoặc xâm hại.'
    };
  } else if (referral.type === 'CIVIC_INCIDENT_1022') {
    actionDescriptor = {
      type: 'WEBSITE',
      label: 'Mở Cổng Phản ánh 1022 TP.HCM',
      href: channelConfig?.url || 'https://1022.tphcm.gov.vn',
      requiresConfirmation: true,
      disclaimer: 'Nội dung phản ánh đã được đóng gói chuẩn hóa theo mẫu 1022 TP.HCM.'
    };
  }

  return c.json({
    success: true,
    referralId,
    status: 'OPENED_EXTERNALLY',
    actionDescriptor,
  });
});

// 6. POST /api/referrals/:id/mark-submitted - Đánh dấu thủ công đã hoàn tất gửi hồ sơ
p0ReferralRoutes.post('/:id/mark-submitted', async (c) => {
  const referralId = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const db = createDatabaseClient(c.env.DB);

  const now = new Date().toISOString();
  await db.update(referrals).set({
    status: 'SUBMITTED_MANUALLY',
    submittedAt: now,
    outcome: body.outcome || 'Đã gửi hồ sơ thành công tới cơ quan tiếp nhận.',
    updatedAt: now,
  }).where(eq(referrals.id, referralId));

  await db.insert(referralEvents).values({
    id: `refe-${crypto.randomUUID()}`,
    referralId,
    caseId: body.caseId || 'case-default',
    eventType: 'MARKED_SUBMITTED',
    actorId: user?.userId || 'usr-default',
    metadataJson: JSON.stringify({ submittedAt: now, outcome: body.outcome }),
    createdAt: now,
  });

  return c.json({ success: true, referralId, status: 'SUBMITTED_MANUALLY', submittedAt: now });
});

// 6b. PATCH /api/referrals/:id/status - Cập nhật trạng thái chuyển tuyến có kiểm tra State Machine Invariants
p0ReferralRoutes.patch('/:id/status', async (c) => {
  const referralId = c.req.param('id');
  const user = c.get('user');
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = UpdateReferralStatusSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
  }

  const { status, approvedBy, notes, outcome } = validationResult.data;
  const db = createDatabaseClient(c.env.DB);

  const referral = await db.select().from(referrals).where(eq(referrals.id, referralId)).get();
  if (!referral) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ chuyển tuyến' }, 404);
  }

  if (referral.status && !isValidReferralStatusTransition(referral.status, status)) {
    return c.json({
      success: false,
      error: `Chuyển trạng thái referral không hợp lệ từ '${referral.status}' sang '${status}'`
    }, 400);
  }

  const now = new Date().toISOString();
  await db.update(referrals).set({
    status: status as any,
    approvedBy: approvedBy || (status === 'APPROVED' ? (user?.userId || 'usr-approver-default') : referral.approvedBy),
    approvedAt: status === 'APPROVED' ? now : referral.approvedAt,
    openedExternallyAt: status === 'OPENED_EXTERNALLY' ? now : referral.openedExternallyAt,
    submittedAt: status === 'SUBMITTED_MANUALLY' ? now : referral.submittedAt,
    notes: notes || referral.notes,
    outcome: outcome || referral.outcome,
    updatedAt: now,
  }).where(eq(referrals.id, referralId));

  await db.insert(referralEvents).values({
    id: `refe-${crypto.randomUUID()}`,
    referralId,
    caseId: referral.caseId,
    eventType: 'STATUS_CHANGED',
    actorId: user?.userId || 'usr-default',
    metadataJson: JSON.stringify({ from: referral.status, to: status, notes, outcome }),
    createdAt: now,
  });

  // Section 25 REALTIME ARCHITECTURE: D1 transition đã commit ở trên (nguồn sự thật) — broadcast
  // realtime tới PartnerInboxRoom là best-effort, không bao giờ được phép làm fail response này
  // (notifyReferralTransition tự nuốt mọi lỗi bên trong, xem services/notificationService.ts).
  await notifyReferralTransition(c.env, {
    referralId,
    caseId: referral.caseId,
    organisationId: referral.destinationConfigId || 'unassigned',
    fromStatus: referral.status,
    toStatus: status,
    actorId: user?.userId || 'usr-default',
    reason: notes,
    correlationId: referralId,
    occurredAt: now,
  });

  return c.json({
    success: true,
    message: `Đã chuyển trạng thái hồ sơ chuyển tuyến sang '${status}' thành công.`,
    referralId,
    status,
    updatedAt: now,
  });
});


// 7. GET /api/referrals/:id/export - Render Export (HTML A4 Print / Watermarked HTML / CSV / JSON)
p0ReferralRoutes.get('/:id/export', async (c) => {
  const referralId = c.req.param('id');
  const format = c.req.query('format') || 'html';
  const db = createDatabaseClient(c.env.DB);

  const referral = await db.select().from(referrals).where(eq(referrals.id, referralId)).get();
  if (!referral) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ chuyển tuyến' }, 404);
  }

  const payload = referral.payloadJson ? JSON.parse(referral.payloadJson as string) : {};
  const isApproved = referral.status === 'APPROVED' || referral.status === 'SUBMITTED_MANUALLY';
  const watermarkText = isApproved ? 'BẢN CHÍNH THỨC' : 'BẢN NHÁP (DRAFT)';

  if (format === 'json') {
    return c.json({ success: true, watermark: watermarkText, data: payload });
  }

  if (format === 'csv') {
    const headers = ['Ma_Ca', 'Mã_Biệt_Danh', 'Loại_Chuyển_Tuyến', 'Mức_Độ_Khẩn_Cấp', 'Khu_Vực', 'Ghi_Chú'];
    const row = [
      sanitizeCsvCell(payload.caseId),
      sanitizeCsvCell(payload.aliasName),
      sanitizeCsvCell(payload.referralType),
      sanitizeCsvCell(payload.urgency),
      sanitizeCsvCell(payload.district),
      sanitizeCsvCell(payload.notes),
    ];
    const csvContent = '\uFEFF' + [headers.join(','), row.join(',')].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="BT-referral-${referralId}.csv"`,
      },
    });
  }

  // Default: HTML A4 Print Responsive Template with Watermark
  const htmlView = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>BƯỚC TIẾP — Phiếu Chuyển Tuyến ${referral.type}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; background: #fff; }
      .no-print { display: none !important; }
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      padding: 24px;
    }
    .page-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 40px;
      position: relative;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .watermark {
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 52px;
      font-weight: 800;
      color: ${isApproved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'};
      letter-spacing: 4px;
      pointer-events: none;
      user-select: none;
    }
    .header-table { width: 100%; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 700; color: #1e40af; text-transform: uppercase; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #64748b; }
    .section-title { font-size: 15px; font-weight: 600; color: #1e293b; border-left: 4px solid #2563eb; padding-left: 8px; margin: 20px 0 12px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .info-table td { padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 14px; }
    .info-table td.label { background: #f1f5f9; font-weight: 600; width: 30%; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
    .badge-urgent { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
    .badge-ok { background: #ecfdf5; color: #059669; border: 1px solid #6ee7b7; }
    .footer-note { font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    .btn-print { background: #2563eb; color: #ffffff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:800px; margin:0 auto 16px; text-align:right;">
    <button class="btn-print" onclick="window.print()">🖨️ In / Tải về PDF A4</button>
  </div>

  <div class="page-card">
    <div class="watermark">${watermarkText}</div>

    <table class="header-table">
      <tr>
        <td>
          <div class="title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div class="subtitle">Độc lập - Tự do - Hạnh phúc</div>
          <div style="margin-top:12px; font-weight:bold; color:#1e40af;">HỆ THỐNG ĐỒNG HÀNH BƯỚC TIẾP — UNESCO YOUTH HACKATHON 2026</div>
        </td>
        <td style="text-align:right; vertical-align:top;">
          <div style="font-size:12px; color:#64748b;">Mã hồ sơ: <b>${referral.id}</b></div>
          <div style="font-size:12px; color:#64748b;">Ngày khởi tạo: ${referral.createdAt ? referral.createdAt.slice(0, 10) : '2026-08-05'}</div>
          <div style="margin-top:6px;"><span class="badge ${isApproved ? 'badge-ok' : 'badge-urgent'}">${referral.status}</span></div>
        </td>
      </tr>
    </table>

    <div class="section-title">I. PHẠM VI & THÔNG TIN CHUYỂN TUYẾN P0</div>
    <table class="info-table">
      <tr><td class="label">Loại chuyển tuyến</td><td><b>${referral.type}</b></td></tr>
      <tr><td class="label">Mã đối tượng (Alias)</td><td><b>${payload.aliasName || 'Ẩn danh'}</b></td></tr>
      <tr><td class="label">Phân loại bảo vệ</td><td>${payload.isMinor ? '⚠️ Trẻ em vị thành niên (<18t)' : 'Người lao động yếu thế'}</td></tr>
      <tr><td class="label">Địa bàn / Khu vực</td><td>${payload.district || 'TP.Hồ Chí Minh'}</td></tr>
      <tr><td class="label">Mức độ khẩn cấp</td><td><span class="badge badge-urgent">${payload.urgency || 'MEDIUM'}</span></td></tr>
    </table>

    <div class="section-title">II. NỘI DUNG GHI NHẬN THỰC ĐỊA BAN ĐẦU</div>
    <table class="info-table">
      <tr><td class="label">Dấu hiệu quan sát</td><td>${(payload.observedFacts || []).join('<br/>') || 'Chưa ghi nhận'}</td></tr>
      <tr><td class="label">Ý kiến tự trình bày</td><td>${(payload.reportedStatements || []).join('<br/>') || 'Chưa ghi nhận'}</td></tr>
      <tr><td class="label">Ghi chú điều phối</td><td>${payload.notes || 'Không có ghi chú thêm'}</td></tr>
    </table>

    <div class="footer-note">
      * Ghi chú an toàn: Hồ sơ này tuân thủ Quy trình Bảo mật 3 KHÔNG & CHILD_GUARD. Mọi dữ liệu cá nhân nhạy cảm đã được mã hóa danh tính theo tiêu chuẩn UNESCO Youth Hackathon 2026.
    </div>
  </div>
</body>
</html>
  `;

  return c.html(htmlView);
});

// 8. POST /api/referrals/batch-export-employment - Xuất danh sách Micro-CV việc làm theo lô (CSV/XLSX Formula Sanitized)
p0ReferralRoutes.post('/batch-export-employment', async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const caseIds: string[] = body.caseIds || [];
  const db = createDatabaseClient(c.env.DB);

  if (caseIds.length === 0) {
    return c.json({ success: false, error: 'Cần chọn ít nhất 1 ca để xuất danh sách ứng viên.' }, 400);
  }

  // Fetch cases and beneficiaries
  const caseItems = await db.select().from(cases).where(inArray(cases.id, caseIds)).all();

  const candidateRows = [];
  const blockedCases = [];

  for (const item of caseItems) {
    const ben = await db.select().from(beneficiaries).where(eq(beneficiaries.id, item.beneficiaryId)).get();
    const eligibility = canCreateEmploymentReferral({
      isMinor: ben?.isMinor,
      birthYear: ben?.birthYear,
      vulnerabilityGroup: ben?.vulnerabilityGroup,
    });

    if (!eligibility.allowed) {
      blockedCases.push({ caseId: item.id, reason: eligibility.reason });
      continue;
    }

    candidateRows.push({
      candidateCode: sanitizeCsvCell(ben?.aliasName || item.id),
      vulnerabilityGroup: sanitizeCsvCell(ben?.vulnerabilityGroup || 'street_worker'),
      district: sanitizeCsvCell(ben?.currentArea || 'TP.HCM'),
      preferredRoles: sanitizeCsvCell('Lao động phổ thông, Phục vụ, Chạy xe'),
      contactMode: sanitizeCsvCell('THROUGH_CASE_WORKER'),
      status: sanitizeCsvCell(item.status),
    });
  }

  // Generate CSV with UTF-8 BOM & Formula Sanitization
  const csvHeaders = ['Mã_Ứng_Viên', 'Nhóm_Yếu_Thế', 'Quận_Huyện', 'Vị_Trí_Mong_Muốn', 'Hình_Thức_Liên_Hệ', 'Trạng_Thái'];
  const csvLines = [
    csvHeaders.join(','),
    ...candidateRows.map(r => [r.candidateCode, r.vulnerabilityGroup, r.district, r.preferredRoles, r.contactMode, r.status].join(','))
  ];
  const csvOutput = '\uFEFF' + csvLines.join('\n');

  // Log Audit Event
  await db.insert(auditLogs).values({
    id: `audit-${crypto.randomUUID()}`,
    userId: user?.userId || 'usr-admin-default',
    action: 'BATCH_EMPLOYMENT_EXPORT',
    resourceType: 'EMPLOYMENT_REFERRAL',
    resourceId: `batch-${candidateRows.length}`,
    createdAt: new Date().toISOString(),
  });

  return new Response(csvOutput, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="BT-employment-candidates-${new Date().toISOString().slice(0, 10)}.csv"`,
      'X-Blocked-Cases-Count': String(blockedCases.length),
    },
  });
});
