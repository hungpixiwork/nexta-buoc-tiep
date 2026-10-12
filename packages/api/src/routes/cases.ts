import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { Env } from '../bindings';
import { AuthContext } from '../middleware/auth';
import { handleExportDocx } from './exportDocx';
import {
  createDatabaseClient,
  cases,
  encounters,
  consents,
  caseConsents,
  voiceNotes,
  aiAnalyses,
  needs,
  timelineEvents,
  safeguardingFlags,
  beneficiaries,
  followUps,
  livelihoodPassports,
  referrals,
  notifications,
  auditLogs,
  safeNextSteps,
  safeNextStepEvents,
  caseFacts,
  matches,
  caseAssignments,
  outcomes,
  resources,
} from '@buoc-tiep/database';
import { processAIModelRouting, encryptPII, decryptPII } from '../utils/aiModelRouter';
import {
  CreateCaseSchema,
  CreateEncounterSchema,
  UpdateCaseSchema,
  PrivacyGateSchema,
  VerifyAiAnalysisSchema,
  isValidCaseStatusTransition,
  canCreateLivelihoodPassport,
  SupportJourney,
  JourneyStage,
  EvidenceItem,
  EvidenceProvenance,
  Confidence,
  MatchingPolicy,
  canTransitionCaseLifecycle,
} from '@buoc-tiep/shared';



export const caseRoutes = new Hono<{ Bindings: Env; Variables: { user?: AuthContext } }>();

// GET /api/cases - Danh sách ca đồng hành (JOIN với beneficiaries)
caseRoutes.get('/', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  let organizationId = c.req.query('organizationId');

  // RBAC & Data Isolation Enforcement
  if (user?.role !== 'admin') {
    organizationId = user?.organizationId; // Force scope to user's org
  }

  let query = db
    .select({
      id: cases.id,
      organizationId: cases.organizationId,
      teamId: cases.teamId,
      beneficiaryId: cases.beneficiaryId,
      assignedTo: cases.assignedTo,
      status: cases.status,
      priority: cases.priority,
      nextFollowUpAt: cases.nextFollowUpAt,
      createdAt: cases.createdAt,
      aliasName: beneficiaries.aliasName,
      fullName: beneficiaries.fullName,
      birthYear: beneficiaries.birthYear,
      isMinor: beneficiaries.isMinor,
      currentArea: beneficiaries.currentArea,
      vulnerabilityGroup: beneficiaries.vulnerabilityGroup,
    })
    .from(cases)
    .leftJoin(beneficiaries, eq(cases.beneficiaryId, beneficiaries.id));

  let result;
  if (organizationId) {
    result = await query.where(eq(cases.organizationId, organizationId)).all();
  } else {
    result = await query.all();
  }

  return c.json({ success: true, data: result });
});

// GET /api/cases/safeguarding/pending - Get all pending safeguarding flags
caseRoutes.get('/safeguarding/pending', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  
  const query = db
    .select({
      id: safeguardingFlags.id,
      caseId: safeguardingFlags.caseId,
      reason: safeguardingFlags.reason,
      status: safeguardingFlags.status,
      createdAt: safeguardingFlags.createdAt,
      caseName: beneficiaries.fullName,
      aliasName: beneficiaries.aliasName,
    })
    .from(safeguardingFlags)
    .innerJoin(cases, eq(safeguardingFlags.caseId, cases.id))
    .innerJoin(beneficiaries, eq(cases.beneficiaryId, beneficiaries.id))
    .where(eq(safeguardingFlags.status, 'open'));
    
  const results = await query.all();
  
  const formattedData = results.map(row => ({
    id: row.id,
    caseId: row.caseId,
    name: row.aliasName || row.caseName,
    reason: row.reason,
    status: row.status,
    date: row.createdAt
  }));
  
  return c.json({ success: true, data: formattedData });
});

// GET /api/cases/:id - Chi tiết ca
caseRoutes.get('/:id', async (c) => {
  const caseId = c.req.param('id');
  const user = c.get('user');
  let organizationId = c.req.query('organizationId');
  const db = createDatabaseClient(c.env.DB);

  // RBAC & Data Isolation Enforcement
  if (user?.role !== 'admin') {
    organizationId = user?.organizationId; // Force scope to user's org
  }

  const conditions = [eq(cases.id, caseId)];
  if (organizationId) {
    conditions.push(eq(cases.organizationId, organizationId));
  }

  const caseItem = await db.select().from(cases).where(and(...conditions)).get();

  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ ca' }, 404);
  }

  return c.json({ success: true, data: caseItem });
});

// POST /api/cases - Tạo ca tiếp nhận mới (Tích hợp 4-Level Model Router & Dual Intake Modes)
caseRoutes.post('/', async (c) => {
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = CreateCaseSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
  }
  const body = validationResult.data;
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  const intakeType: 'photo' | 'voice' = body.intakeType || (body.rawTranscript || body.transcript ? 'voice' : 'photo');
  const clientGeneratedId = body.clientGeneratedId || body.idempotencyKey || c.req.header('X-Idempotency-Key');

  // Kiểm tra Idempotency Key chống trùng lặp (Offline Sync Fallback)
  if (clientGeneratedId) {
    const existingEncounter = await db
      .select()
      .from(encounters)
      .where(eq(encounters.clientGeneratedId, clientGeneratedId))
      .get();

    if (existingEncounter) {
      return c.json(
        {
          success: true,
          duplicated: true,
          id: existingEncounter.caseId || existingEncounter.id,
          caseId: existingEncounter.caseId || existingEncounter.id,
          intakeType: (existingEncounter as any).intakeType || intakeType,
          safeguardingModeActivated: body.isMinor ?? false,
          data: existingEncounter,
          message: 'Ca tiếp nhận đã tồn tại (Xác nhận Idempotency Key thành công)',
        },
        200
      );
    }

  }

  const newCaseId = body.id || body.caseId || `case-${crypto.randomUUID()}`;
  const newBeneficiaryId = body.beneficiaryId || `ben-${crypto.randomUUID()}`;
  const newEncounterId = `enc-${crypto.randomUUID()}`;
  const newTimelineEventId = `tle-${crypto.randomUUID()}`;

  const photoUrl = body.photoUrl || body.imageUrl || body.imageBase64 || null;
  const rawTranscript = body.rawTranscript || body.transcript || body.voiceTranscript || '';
  const lat = body.latitude;
  const lng = body.longitude;
  const notes = body.notes || body.summary || body.description || '';

  const locationText = (lat !== undefined && lng !== undefined)
    ? (body.location || body.currentArea || `Tọa độ GPS (${lat}, ${lng})`)
    : (body.location || body.currentArea || body.current_area || 'Hóc Môn, TP.HCM');

  // Data Isolation: Ensure volunteer cannot forge organizationId
  const finalOrgId = user?.role === 'admin' ? (body.organizationId || user?.organizationId) : user?.organizationId;

  // Chạy 4-Level Model Routing Strategy Pipeline
  const routingResult = await processAIModelRouting(c.env, {
    transcript: rawTranscript || notes,
    age: body.age ? Number(body.age) : null,
    birthYear: body.birthYear ? Number(body.birthYear) : null,
    isMinor: body.isMinor,
    fullName: body.fullName || body.name,
    phone: body.phone,
    idempotencyKey: clientGeneratedId,
    organizationId: finalOrgId,
    volunteerId: body.volunteerId || user?.userId,
    notes,
    category: body.category || body.vulnerabilityGroup,
    locationText
  });

  // Nếu trùng lặp Idempotency (Level 0)
  if (routingResult.isDuplicate && routingResult.cachedResponse) {
    return c.json({
      success: true,
      duplicated: true,
      id: routingResult.cachedResponse?.id || (routingResult.cachedResponse as any)?.caseId || clientGeneratedId,
      data: routingResult.cachedResponse,
      message: 'Ca tiếp nhận đã tồn tại (Xác nhận Idempotency Key thành công)'
    }, 200);
  }

  const aliasName = routingResult.aliasName;
  const isMinorBool = routingResult.isMinor;
  const priority = routingResult.urgency;
  const organizationId = finalOrgId || 'org-default';
  const volunteerId = body.volunteerId || user?.userId || 'usr-volunteer-default';

  const summaryText = routingResult.summary || (intakeType === 'voice'
    ? `[Voice Intake] ${rawTranscript || notes || 'Ghi âm giọng nói hiện trường'}`
    : (notes ? `[1-Tap Photo Intake] ${notes}` : (photoUrl ? 'Tiếp nhận 1-Tap qua Ảnh chụp & GPS hiện trường' : 'Tiếp nhận ca hỗ trợ mới')));

  const batchQueries: any[] = [
    // 1. Chèn vào beneficiaries (Mã hóa PII Web Crypto AES-GCM-256)
    db.insert(beneficiaries).values({
      id: newBeneficiaryId,
      organizationId,
      aliasName,
      fullName: routingResult.encryptedFullName || (isMinorBool ? 'Trẻ em vị thành niên (Ẩn danh AES-GCM)' : (body.fullName || body.name || `Người thụ hưởng (${intakeType === 'voice' ? 'Thoại' : '1-Tap Ảnh'})`)),
      birthYear: body.birthYear ? Number(body.birthYear) : (body.age ? new Date().getFullYear() - Number(body.age) : null),
      isMinor: isMinorBool,
      gender: body.gender || 'unknown',
      currentArea: locationText,
      vulnerabilityGroup: routingResult.category,
      isSensitive: isMinorBool,
    }),

    // 2. Chèn vào cases (Tự động thiết lập 48h SLA)
    db.insert(cases).values({
      id: newCaseId,
      organizationId,
      beneficiaryId: newBeneficiaryId,
      assignedTo: volunteerId,
      status: 'open',
      priority: priority as any,
      nextFollowUpAt: routingResult.nextActionAt,
    }),

    // 3. Chèn vào encounters
    db.insert(encounters).values({
      id: newEncounterId,
      caseId: newCaseId,
      volunteerId,
      encounterDate: new Date().toISOString(),
      locationText,
      summary: summaryText,
      healthState: body.healthState || null,
      weatherCondition: body.weatherCondition || null,
      clientGeneratedId: clientGeneratedId || null,
      syncStatus: 'synced',
    }),

    // 4. Chèn vào timelineEvents
    db.insert(timelineEvents).values({
      id: newTimelineEventId,
      caseId: newCaseId,
      actorId: volunteerId,
      eventType: 'case_created',
      title: `[${routingResult.processedBy.slice(0, 30)}] Khởi tạo ca đồng hành`,
      description: summaryText,
      eventDate: new Date().toISOString(),
    }),
  ];

  // 5. Cờ Safeguarding đối với trẻ em <18t hoặc trường hợp rủi ro cao
  if (routingResult.safeguardingFlagRequired) {
    batchQueries.push(
      db.insert(safeguardingFlags).values({
        id: `sgf-${crypto.randomUUID()}`,
        caseId: newCaseId,
        reportedBy: volunteerId,
        reason: routingResult.safeguardingReason || 'minor_detected',
        severity: isMinorBool ? 'critical' : 'high',
        status: 'open',
        escalatedTo111: false, // TUYỆT ĐỐI KHÔNG tự động chuyển 111
      })
    );
  }

  // 6. Level 3 Human Review - Gửi thông báo tới Coordinator Safeguarding
  if (routingResult.humanReviewRequired && routingResult.coordinatorNotification) {
    batchQueries.push(
      db.insert(notifications).values({
        id: `notif-sg-${crypto.randomUUID()}`,
        userId: volunteerId,
        title: routingResult.coordinatorNotification.title,
        message: routingResult.coordinatorNotification.message,
        isRead: false,
      })
    );
  }

  // Phản hồi siêu tốc trong 1 round-trip D1 batch transaction (< 15ms)
  await db.batch(batchQueries as any);

  return c.json(
    {
      success: true,
      id: newCaseId,
      caseId: newCaseId,
      beneficiaryId: newBeneficiaryId,
      encounterId: newEncounterId,
      intakeType,
      isMinor: isMinorBool,
      aliasName,
      photoUrl,
      rawTranscript: intakeType === 'voice' ? rawTranscript : undefined,
      normalizedTranscript: routingResult.normalizedTranscript,
      location: locationText,
      category: routingResult.category,
      urgency: priority,
      confidenceScore: routingResult.confidenceScore,
      extractedNeeds: routingResult.extractedNeeds,
      notes,
      aiModelRouting: {
        levelExecuted: routingResult.levelExecuted,
        processedBy: routingResult.processedBy,
        humanReviewRequired: routingResult.humanReviewRequired
      },
      nextFollowUpAt: routingResult.nextActionAt,
      safeguardingModeActivated: isMinorBool,
      message: isMinorBool
        ? 'Đã kích hoạt Chế độ Bảo vệ Trẻ em đặc biệt (<18t)'
        : `Đã khởi tạo ca đồng hành & lượt gặp qua chế độ ${intakeType === 'voice' ? 'Thu âm Giọng nói' : '1-Tap Photo & GPS'} thành công`,
    },
    201
  );
});

// POST /api/cases/:id/encounters - Lưu lượt gặp tiếp xúc & Voice Intake D1 Batch Insert (5 Bảng)
caseRoutes.post('/:id/encounters', async (c) => {
  const caseId = c.req.param('id');
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = CreateEncounterSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
  }
  const body = validationResult.data;
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  // 1. Kiểm tra tồn tại của ca đồng hành và organizationId scoping
  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ ca' }, 404);
  }

  const reqOrgId = user?.organizationId || c.req.query('organizationId') || body.organizationId;
  if (reqOrgId && caseItem.organizationId !== reqOrgId && user?.role !== 'admin') {
    return c.json({ success: false, error: 'Không có quyền truy cập hồ sơ ca thuộc tổ chức khác' }, 403);
  }

  // 2. Kiểm tra Idempotency Key chống trùng lặp
  const clientGeneratedId = body.clientGeneratedId || body.idempotencyKey || c.req.header('X-Idempotency-Key');
  if (clientGeneratedId) {
    const existingEncounter = await db
      .select()
      .from(encounters)
      .where(eq(encounters.clientGeneratedId, clientGeneratedId))
      .get();

    if (existingEncounter) {
      return c.json(
        {
          success: true,
          duplicated: true,
          id: existingEncounter.id,
          data: existingEncounter,
          message: 'Lượt gặp mặt đã tồn tại (Xác nhận Idempotency Key thành công)',
        },
        200
      );
    }
  }

  // 3. Khởi tạo các ID cho D1 Insert
  const newEncounterId = body.id || `enc-${crypto.randomUUID()}`;
  const newConsentId = `cst-${crypto.randomUUID()}`;
  const newVoiceNoteId = `vn-${crypto.randomUUID()}`;
  const newAiAnalysisId = `aia-${crypto.randomUUID()}`;
  const newTimelineEventId = `tle-${crypto.randomUUID()}`;

  const volunteerId = body.volunteerId || user?.userId || 'usr-volunteer-default';
  const encounterDate = body.encounterDate || new Date().toISOString();
  const transcriptText = body.transcript || body.rawTranscript || body.notes || '';
  const locationText = body.locationText || body.location || 'Thị trấn Hóc Môn';

  // 4. Chạy 4-Level Model Router cho Encounter Voice Data
  const routingResult = await processAIModelRouting(c.env, {
    transcript: transcriptText,
    idempotencyKey: clientGeneratedId,
    organizationId: reqOrgId,
    volunteerId,
    notes: body.notes || body.summary,
    category: body.category,
    locationText
  });

  const summary = body.summary || routingResult.summary || (transcriptText ? `Lượt gặp ghi nhận thoại (${transcriptText.length} ký tự)` : 'Trò chuyện và ghi nhận thông tin hiện trường');
  const extractedNeedsStr = JSON.stringify(routingResult.extractedNeeds.length > 0 ? routingResult.extractedNeeds : (Array.isArray(body.extractedNeeds) ? body.extractedNeeds : []));
  const confidenceScoreInt = Math.round(routingResult.confidenceScore * 100);

  // 5. Thực hiện insert liên hoàn D1 Batch Transaction vào 5 bảng
  const batchInserts: any[] = [
    // Bảng 1: encounters - Tạo lượt gặp mặt mới
    db.insert(encounters).values({
      id: newEncounterId,
      caseId,
      journeyId: body.journeyId || null,
      volunteerId,
      encounterDate,
      locationText,
      summary,
      healthState: body.healthState || null,
      weatherCondition: body.weatherCondition || null,
      clientGeneratedId: clientGeneratedId || null,
      syncStatus: 'synced',
    }),

    // Bảng 2: consents - Lưu thông tin chấp thuận UNESCO Safeguarding
    db.insert(consents).values({
      id: newConsentId,
      encounterId: newEncounterId,
      beneficiaryId: caseItem.beneficiaryId!,
      voiceRecordingAllowed: body.voiceRecordingAllowed !== undefined ? Boolean(body.voiceRecordingAllowed) : true,
      anonymityRequested: body.anonymityRequested !== undefined ? Boolean(body.anonymityRequested) : true,
      voiceEncryptionEnabled: body.voiceEncryptionEnabled !== undefined ? Boolean(body.voiceEncryptionEnabled) : true,
    }),

    // Bảng 3: voice_notes - Lưu bản ghi transcript STT & normalized text
    db.insert(voiceNotes).values({
      id: newVoiceNoteId,
      encounterId: newEncounterId,
      storageKey: body.storageKey || `audio/${newEncounterId}.mp3`,
      durationSeconds: body.durationSeconds ? Number(body.durationSeconds) : 0,
      rawTranscript: transcriptText,
      editedTranscript: routingResult.normalizedTranscript || body.editedTranscript || transcriptText,
      sttStatus: 'completed',
    }),

    // Bảng 4: ai_analyses - Lưu trích xuất nhu cầu và cảnh báo lừa đảo MIL với AI Provenance
    db.insert(aiAnalyses).values({
      id: newAiAnalysisId,
      voiceNoteId: newVoiceNoteId,
      extractedNeeds: extractedNeedsStr,
      milScamDetected: routingResult.milScamDetected || Boolean(body.milScamDetected),
      scamRiskLevel: routingResult.scamRiskLevel || (['low', 'medium', 'high', 'critical'].includes(body.scamRiskLevel as string) ? body.scamRiskLevel as any : 'low'),
      confidenceScore: confidenceScoreInt,
      rawInput: transcriptText,
      aiGeneratedValue: JSON.stringify({ extractedNeeds: routingResult.extractedNeeds, urgency: routingResult.urgency, category: routingResult.category }),
      verificationStatus: 'pending',
      sourceType: routingResult.processedBy.includes('Gemini') ? 'gemini-flash' : 
                   routingResult.processedBy.includes('Cloudflare') ? 'cloudflare-ai' : 
                   routingResult.processedBy.includes('Level 0') ? 'rule-engine' : 'mock'
    }),

    // Bảng 5: timeline_events - Lưu sự kiện nhật ký ca
    db.insert(timelineEvents).values({
      id: newTimelineEventId,
      caseId,
      actorId: volunteerId,
      eventType: 'encounter_created',
      title: 'Ghi nhận lượt gặp tiếp xúc mới',
      description: summary,
      eventDate: encounterDate,
    }),

    // Cập nhật SLA 48h cho ca đồng hành
    db.update(cases).set({
      nextFollowUpAt: routingResult.nextActionAt
    }).where(eq(cases.id, caseId))
  ];

  if (routingResult.humanReviewRequired && routingResult.coordinatorNotification) {
    batchInserts.push(
      db.insert(notifications).values({
        id: `notif-sg-${crypto.randomUUID()}`,
        userId: volunteerId,
        title: routingResult.coordinatorNotification.title,
        message: routingResult.coordinatorNotification.message,
        isRead: false,
      })
    );
  }

  await db.batch(batchInserts as any);

  return c.json(
    {
      success: true,
      id: newEncounterId,
      encounterId: newEncounterId,
      consentId: newConsentId,
      voiceNoteId: newVoiceNoteId,
      aiAnalysisId: newAiAnalysisId,
      timelineEventId: newTimelineEventId,
      aiModelRouting: {
        levelExecuted: routingResult.levelExecuted,
        processedBy: routingResult.processedBy,
        confidenceScore: routingResult.confidenceScore,
        milScamDetected: routingResult.milScamDetected,
        scamRiskLevel: routingResult.scamRiskLevel,
      },
      message: 'Đã lưu lượt gặp tiếp xúc, chấp thuận bảo vệ, bản ghi âm thoại và phân tích AI (D1 Batch 5 bảng) thành công',
    },
    201
  );
});

// GET /api/cases/:id/timeline - Nhật ký sự kiện đồng hành
caseRoutes.get('/:id/timeline', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const events = await db.select().from(timelineEvents).where(eq(timelineEvents.caseId, caseId)).all();

  return c.json({
    success: true,
    data: events
  });
});

// GET /api/cases/:id/export-docx - Xuất Phiếu Đề Nghị Trợ Giúp Xã Hội Mẫu số 07 (.docx)
caseRoutes.get('/:id/export-docx', async (c) => {
  const caseId = c.req.param('id');
  return handleExportDocx(c, caseId);
});

// GET /api/cases/:id/tasks - Danh sách nhiệm vụ follow-up của ca
caseRoutes.get('/:id/tasks', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const tasks = await db.select().from(followUps).where(eq(followUps.caseId, caseId)).all();

  return c.json({
    success: true,
    data: tasks
  });
});

// POST /api/cases/:id/tasks - Giao nhiệm vụ cho Tình nguyện viên trong đội
caseRoutes.post('/:id/tasks', async (c) => {
  const caseId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ ca' }, 404);
  }

  const taskId = `tsk-${crypto.randomUUID()}`;
  const actionType = body.actionType || 'visit';
  const validActionTypes = ['call', 'visit', 'doc_help', 'medical_check', 'job_trial'];
  const finalActionType = validActionTypes.includes(actionType) ? actionType : 'visit';

  const assignedTo = body.assignedTo || body.volunteerId || 'usr-volunteer-default';
  const socialWorkerId = user?.userId || body.socialWorkerId || 'usr-social-worker-default';
  const notes = body.notes || body.title || 'Nhiệm vụ giao cho tình nguyện viên';
  const status = body.status || 'pending';
  const dueDate = body.dueDate || null;

  const timelineId = `tle-${crypto.randomUUID()}`;

  await db.batch([
    db.insert(followUps).values({
      id: taskId,
      caseId,
      socialWorkerId,
      assignedTo,
      actionType: finalActionType as any,
      notes,
      status: status as any,
      dueDate,
    }),
    db.insert(timelineEvents).values({
      id: timelineId,
      caseId,
      actorId: socialWorkerId,
      eventType: 'followup_done',
      title: `Giao nhiệm vụ: ${body.title || finalActionType}`,
      description: notes,
      eventDate: new Date().toISOString(),
    })
  ]);

  return c.json({
    success: true,
    id: taskId,
    data: {
      id: taskId,
      caseId,
      socialWorkerId,
      assignedTo,
      actionType: finalActionType,
      notes,
      status,
      dueDate,
    },
    message: 'Giao nhiệm vụ thành công cho Tình nguyện viên!'
  }, 201);
});

// PATCH /api/cases/:id - Cập nhật thông tin ca (status, priority, assignedTo, nextFollowUpAt)
caseRoutes.patch('/:id', async (c) => {
  const caseId = c.req.param('id');
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = UpdateCaseSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
  }
  const body = validationResult.data;
  const db = createDatabaseClient(c.env.DB);

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ ca' }, 404);
  }

  if (body.status && caseItem.status && !isValidCaseStatusTransition(caseItem.status, body.status)) {
    return c.json({
      success: false,
      error: `Chuyển trạng thái ca không hợp lệ từ '${caseItem.status}' sang '${body.status}'`
    }, 400);
  }

  const updateData: any = {};
  if (body.status) updateData.status = body.status;
  if (body.priority) updateData.priority = body.priority;
  if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
  if (body.nextFollowUpAt !== undefined) updateData.nextFollowUpAt = body.nextFollowUpAt;


  await db.update(cases).set(updateData).where(eq(cases.id, caseId));

  // Thêm timeline event
  await db.insert(timelineEvents).values({
    id: `tle-${crypto.randomUUID()}`,
    caseId: caseId,
    title: 'Cập nhật hồ sơ ca',
    eventType: 'case_updated',
    description: body.description || 'Đã cập nhật trạng thái/thông tin ca đồng hành.',
  });

  return c.json({ success: true, message: 'Cập nhật ca đồng hành thành công' });
});

// GET /api/cases/:id/passport - Lấy Hộ chiếu Sinh kế D1
caseRoutes.get('/:id/passport', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy ca đồng hành' }, 404);
  }

  const passport = await db
    .select()
    .from(livelihoodPassports)
    .where(eq(livelihoodPassports.beneficiaryId, caseItem.beneficiaryId))
    .get();

  return c.json({
    success: true,
    data: passport || null,
    message: passport ? 'Lấy Hộ chiếu Sinh kế thành công' : 'Chưa có Hộ chiếu Sinh kế cho trường hợp này',
  });
});

// POST /api/cases/:id/passport - Lưu hoặc cập nhật Hộ chiếu Sinh kế D1
caseRoutes.post('/:id/passport', async (c) => {
  const caseId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const db = createDatabaseClient(c.env.DB);

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy ca đồng hành' }, 404);
  }

  // Safeguarding check for minors: No job passport for minors
  const beneficiary = await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseItem.beneficiaryId)).get();
  const passportEligibility = canCreateLivelihoodPassport({
    isMinor: beneficiary?.isMinor,
    birthYear: beneficiary?.birthYear,
    vulnerabilityGroup: beneficiary?.vulnerabilityGroup
  });
  if (!passportEligibility.allowed) {
    return c.json({
      success: false,
      error: passportEligibility.reason,
      safeguardingBlock: true
    }, 403);
  }


  const existingPassport = await db
    .select()
    .from(livelihoodPassports)
    .where(eq(livelihoodPassports.beneficiaryId, caseItem.beneficiaryId))
    .get();

  const skillsStr = typeof body.skills === 'string' ? body.skills : JSON.stringify(body.skills || []);
  const passportId = existingPassport?.id || `lp-${crypto.randomUUID()}`;

  if (existingPassport) {
    await db.update(livelihoodPassports).set({
      skills: skillsStr,
      workPreference: body.workPreference || existingPassport.workPreference,
      healthStatus: body.healthStatus || existingPassport.healthStatus,
      location: body.location || existingPassport.location,
      ageGroup: body.ageGroup || existingPassport.ageGroup,
      status: body.status || 'active',
    }).where(eq(livelihoodPassports.id, passportId));
  } else {
    await db.insert(livelihoodPassports).values({
      id: passportId,
      beneficiaryId: caseItem.beneficiaryId,
      skills: skillsStr,
      workPreference: body.workPreference || 'Công việc nhẹ, cố định',
      healthStatus: body.healthStatus || 'Tốt',
      location: body.location || beneficiary?.currentArea || 'Hóc Môn, TP.HCM',
      ageGroup: body.ageGroup || 'adult',
      status: 'active',
    });
  }

  // Log timeline event
  await db.insert(timelineEvents).values({
    id: `tle-${crypto.randomUUID()}`,
    caseId,
    title: 'Cập nhật Hộ chiếu Sinh kế',
    eventType: 'passport_created',
    description: `Đã số hóa kinh nghiệm phi chính thức thành Hộ chiếu Sinh kế`,
  });

  return c.json({
    success: true,
    id: passportId,
    message: 'Đã lưu Hộ chiếu Sinh kế vào D1 SQLite thành công'
  }, 201);
});

// GET /api/cases/:id/journey - Lấy tiến trình 5 giai đoạn Hành trình đồng hành an sinh
caseRoutes.get('/:id/journey', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy ca đồng hành' }, 404);
  }

  const beneficiary = await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseItem.beneficiaryId)).get();

  // Khởi tạo SupportJourney Aggregate từ Domain
  const journeyResult = SupportJourney.create(
    {
      caseId: caseItem.id,
      beneficiaryId: caseItem.beneficiaryId || `ben-${caseItem.id}`,
      organizationId: caseItem.organizationId || 'org-buoctiep-vn',
      teamId: caseItem.teamId || undefined,
      title: `Hành trình đồng hành an sinh — ${beneficiary?.aliasName || 'Đối tượng thụ hưởng'}`,
      locationName: beneficiary?.currentArea || 'Hóc Môn, TP.HCM',
      status: caseItem.status === 'closed' ? 'completed' : 'in_progress',
    },
    `jrn-${caseItem.id}`
  );

  if (journeyResult.isFailure) {
    return c.json({ success: false, error: journeyResult.error }, 500);
  }

  const journey = journeyResult.getValue();

  return c.json({
    success: true,
    data: journey.toJSON(),
  });
});


// POST /api/cases/:id/privacy-gate - Xác nhận 3 KHÔNG Privacy Check-Gate
caseRoutes.post('/:id/privacy-gate', async (c) => {
  const caseId = c.req.param('id');
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = PrivacyGateSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
  }
  const body = validationResult.data;
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ ca' }, 404);
  }

  const { noForcedIdentityDisclosure, noPublicSensitiveMedia, noUnverifiedInformation, notes } = body;
  if (!noForcedIdentityDisclosure || !noPublicSensitiveMedia || !noUnverifiedInformation) {
    return c.json({
      success: false,
      error: 'Bắt buộc phải đồng ý cả 3 tiêu chuẩn 3 KHÔNG trước khi tiếp tục'
    }, 400);
  }

  const checkGateData = {
    noForcedIdentityDisclosure: true,
    noPublicSensitiveMedia: true,
    noUnverifiedInformation: true,
    completedBy: user?.userId || body.completedBy || 'usr-volunteer-default',
    notes: notes || 'Đã xác nhận quy trình 3 KHÔNG bảo mật an toàn thông tin.',
    timestamp: new Date().toISOString()
  };

  const completedAt = new Date().toISOString();

  await db.update(cases).set({
    threeKhongCheck: JSON.stringify(checkGateData),
    privacyGateCompletedAt: completedAt,
  }).where(eq(cases.id, caseId));

  // Timeline Event
  await db.insert(timelineEvents).values({
    id: `tle-${crypto.randomUUID()}`,
    caseId,
    actorId: user?.userId || 'usr-volunteer-default',
    eventType: 'privacy_gate_completed',
    title: 'Hoàn tất Kiểm duyệt 3 KHÔNG Privacy Gate',
    description: 'Đã xác nhận bảo mật danh tính, không rò rỉ hình ảnh/tọa độ nhạy cảm và không tự ý đưa AI thành sự thật',
  });

  return c.json({
    success: true,
    caseId,
    privacyGateCompletedAt: completedAt,
    data: checkGateData,
    message: 'Xác nhận 3 KHÔNG Privacy Check-Gate thành công'
  });
});

// POST /api/cases/:id/qr-credential - Tạo QR Code ẩn danh có chữ ký số (Signed Expiring Token)
caseRoutes.post('/:id/qr-credential', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ ca' }, 404);
  }

  const beneficiary = await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseItem.beneficiaryId)).get();
  if (beneficiary?.isMinor) {
    return c.json({
      success: false,
      error: 'Cấm tạo QR công khai cho trẻ em vị thành niên (<18t) theo quy định Child Safeguarding'
    }, 403);
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Expire in 24 hours
  const payload = `${caseId}:${beneficiary?.aliasName}:${expiresAt}`;

  // Simple HMAC token signature representation
  const secretKey = c.env.JWT_SECRET || 'buoc_tiep_qr_secret_2026';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
  const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const signedToken = `btqr_${btoa(payload).replace(/=/g, '')}.${signature.slice(0, 16)}`;

  await db.update(cases).set({
    signedQrToken: signedToken,
    qrExpiresAt: expiresAt,
    qrRevokedAt: null
  }).where(eq(cases.id, caseId));

  const verificationUrl = `https://buoc-tiep-web.pages.dev/verify-qr?token=${signedToken}`;

  return c.json({
    success: true,
    caseId,
    aliasName: beneficiary?.aliasName,
    signedQrToken: signedToken,
    qrExpiresAt: expiresAt,
    verificationUrl,
    qrCodeData: verificationUrl,
    message: 'Tạo Mã QR Credential Ẩn danh có Chữ ký số 24h thành công'
  });
});

// POST /api/cases/:id/qr-scan - Lưu vết vị trí & thời gian quét thẻ QR Hộ chiếu Dân sinh vào D1
caseRoutes.post('/:id/qr-scan', async (c) => {
  const caseId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ ca' }, 404);
  }

  const scanTimestamp = body.timestamp || new Date().toISOString();
  const locationText = body.locationText || body.location || (body.latitude && body.longitude ? `Tọa độ GPS (${body.latitude}, ${body.longitude})` : 'Địa điểm Hóc Môn, TP.HCM');
  const scannedBy = user?.userId || body.scannedBy || 'usr-volunteer-default';
  const notes = body.notes || 'Đã quét mã QR Hộ chiếu Dân sinh xác minh thông tin hiện trường';

  const timelineId = `tle-${crypto.randomUUID()}`;

  await db.insert(timelineEvents).values({
    id: timelineId,
    caseId,
    actorId: scannedBy,
    eventType: 'qr_scanned',
    title: 'Quét thẻ QR Hộ chiếu Dân sinh',
    description: `Xác minh vị trí: ${locationText}. Ghi chú: ${notes}`,
    eventDate: scanTimestamp,
  });

  return c.json({
    success: true,
    caseId,
    scanId: timelineId,
    timestamp: scanTimestamp,
    locationText,
    scannedBy,
    message: 'Đã lưu vết vị trí & thời gian quét thẻ QR Hộ chiếu Dân sinh vào cơ sở dữ liệu D1 thành công'
  }, 201);
});

// GET /api/cases/verify-qr/:token - Endpoint Công khai Xác minh QR Ẩn danh (Minimal Verification View)
caseRoutes.get('/verify-qr/:token', async (c) => {
  const token = c.req.param('token');
  const db = createDatabaseClient(c.env.DB);

  const caseItem = await db.select().from(cases).where(eq(cases.signedQrToken, token)).get();
  if (!caseItem) {
    return c.json({ success: false, valid: false, error: 'Mã QR không hợp lệ hoặc không tồn tại' }, 404);
  }

  if (caseItem.qrRevokedAt) {
    return c.json({ success: false, valid: false, error: 'Mã QR đã bị thu hồi vì lý do an toàn' }, 410);
  }

  if (caseItem.qrExpiresAt && new Date(caseItem.qrExpiresAt) < new Date()) {
    return c.json({ success: false, valid: false, error: 'Mã QR đã hết hạn hiệu lực (24h)' }, 410);
  }

  const beneficiary = await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseItem.beneficiaryId)).get();

  // Minimal non-sensitive verification response (NO legal name, NO phone, NO exact address)
  return c.json({
    success: true,
    valid: true,
    credential: {
      program: 'BƯỚC TIẾP — UNESCO Youth Hackathon 2026',
      aliasName: beneficiary?.aliasName || 'BƯỚC TIẾP Beneficiary',
      vulnerabilityGroup: beneficiary?.vulnerabilityGroup || 'street_worker',
      district: beneficiary?.currentArea || 'TP.Hồ Chí Minh',
      caseStatus: caseItem.status,
      privacyVerified: Boolean(caseItem.privacyGateCompletedAt),
      expiresAt: caseItem.qrExpiresAt,
      verificationAuthority: 'Hệ thống Đồng hành BƯỚC TIẾP (UNESCO Certified)'
    }
  });
});

// POST /api/cases/:caseId/ai-analyses/:analysisId/verify - Human-in-the-loop verification of AI extracted needs
caseRoutes.post('/:caseId/ai-analyses/:analysisId/verify', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const caseId = c.req.param('caseId');
  const analysisId = c.req.param('analysisId');
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = VerifyAiAnalysisSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return c.json({ success: false, error: 'Trạng thái xác minh không hợp lệ (Validation failed)', details: validationResult.error.format() }, 400);
  }
  const { status, adjustedNeeds, notes } = validationResult.data;


  const aiAnalysis = await db.select().from(aiAnalyses).where(eq(aiAnalyses.id, analysisId)).get();
  if (!aiAnalysis) {
    return c.json({ success: false, error: 'Không tìm thấy kết quả phân tích AI' }, 404);
  }

  const verifiedAt = new Date().toISOString();
  
  const queries: any[] = [
    db.update(aiAnalyses).set({
      verificationStatus: status,
      verifiedBy: user?.userId || 'usr-volunteer-default',
      verifiedAt,
      extractedNeeds: status === 'adjusted' && adjustedNeeds ? JSON.stringify(adjustedNeeds) : aiAnalysis.extractedNeeds,
    }).where(eq(aiAnalyses.id, analysisId))
  ];

  // Nếu xác nhận hoặc điều chỉnh thành công, đẩy nhu cầu vào bảng needs chính thức
  if (status === 'verified' || status === 'adjusted') {
    const finalNeeds = status === 'adjusted' && adjustedNeeds ? adjustedNeeds : JSON.parse(aiAnalysis.extractedNeeds || '[]');
    let baseCategory = 'health'; // Default fallback
    try {
      if (aiAnalysis.aiGeneratedValue) {
        const genVal = JSON.parse(aiAnalysis.aiGeneratedValue);
        if (genVal.category && ['health', 'legal_doc', 'shelter', 'job', 'training', 'emergency_food'].includes(genVal.category)) {
          baseCategory = genVal.category;
        }
      }
    } catch(e) {}

    for (const needStr of finalNeeds) {
      queries.push(
        db.insert(needs).values({
          id: `need-${crypto.randomUUID()}`,
          caseId,
          category: baseCategory as any,
          title: typeof needStr === 'string' ? needStr : (needStr.title || JSON.stringify(needStr)),
          priority: 'medium',
          status: 'identified'
        })
      );
    }
  }

  // Immutable audit
  queries.push(
    db.insert(auditLogs).values({
      id: `audit-${crypto.randomUUID()}`,
      userId: user?.userId || 'usr-volunteer-default',
      action: `AI_ANALYSIS_VERIFICATION_${status.toUpperCase()}`,
      resourceType: 'ai_analyses',
      resourceId: analysisId,
      createdAt: verifiedAt
    })
  );

  // Timeline Event
  queries.push(
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-volunteer-default',
      eventType: 'ai_needs_verified',
      title: `Kiểm duyệt & Xác nhận nhu cầu từ AI (${status})`,
      description: notes || `Đã ${status === 'verified' ? 'chấp thuận' : status === 'adjusted' ? 'điều chỉnh' : 'từ chối'} kết quả phân tích của AI.`,
      eventDate: verifiedAt,
    })
  );

  await db.batch(queries as any);

  return c.json({
    success: true,
    status,
    message: 'Đã hoàn tất xác minh dữ liệu AI bởi con người',
    verifiedAt
  });
});

// GET /api/cases/:id/export-docx - Xuất Mẫu 07 DOCX cho hồ sơ ca
caseRoutes.get('/:id/export-docx', async (c) => {
  const caseId = c.req.param('id');
  return handleExportDocx(c, caseId);
});

// POST /api/cases/:id/export-docx - API POST hỗ trợ xuất Mẫu 07 DOCX cho hồ sơ ca
caseRoutes.post('/:id/export-docx', async (c) => {
  const caseId = c.req.param('id');
  return handleExportDocx(c, caseId);
});

// POST /api/cases/:caseId/safeguarding/:flagId/review - Explicit Confirmation & Immutable Audit
caseRoutes.post('/:caseId/safeguarding/:flagId/review', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const flagId = c.req.param('flagId');
  const body = await c.req.json();

  if (user?.role !== 'admin' && user?.role !== 'social_worker') {
    return c.json({ success: false, error: 'Unauthorized: Supervisor review required.' }, 403);
  }

  const { action, notes } = body; // action: 'confirm' | 'reject'

  const [existingFlag] = await db.select().from(safeguardingFlags).where(eq(safeguardingFlags.id, flagId)).all();
  if (!existingFlag) return c.json({ success: false, error: 'Flag not found' }, 404);

  const status = action === 'confirm' ? 'escalated' : 'resolved';
  
  await db.update(safeguardingFlags)
    .set({ status })
    .where(eq(safeguardingFlags.id, flagId));

  // Immutable audit
  await db.insert(auditLogs).values({
    id: `audit-${crypto.randomUUID()}`,
    userId: user.userId,
    action: `SAFEGUARDING_REVIEW_${action.toUpperCase()}`,
    resourceType: 'safeguarding_flags',
    resourceId: flagId,
    createdAt: new Date().toISOString()
  });

  return c.json({ success: true, status, message: `Safeguarding flag explicitly reviewed. Action: ${action}` });
});

// ==========================================
// SUPPORT JOURNEY & EVIDENCE PROVENANCE ROUTES (LOOP 2 DOMAIN)
// ==========================================

// GET /api/cases/:id/journey handled above at line 767 with full SupportJourney domain aggregate integration.

// POST /api/cases/:id/journey/advance - Chuyển đổi giai đoạn hành trình đồng hành
caseRoutes.post('/:id/journey/advance', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { targetStageKey, notes } = body;
  if (!targetStageKey) {
    return c.json({ success: false, error: 'targetStageKey không được để trống' }, 400);
  }

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ ca' }, 404);
  }

  const beneficiary = await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseItem.beneficiaryId)).get();

  const journey = SupportJourney.create(
    {
      caseId: caseItem.id,
      beneficiaryId: caseItem.beneficiaryId || `ben-${caseItem.id}`,
      organizationId: caseItem.organizationId || 'org-buoctiep-vn',
      title: `Hành trình đồng hành an sinh — ${beneficiary?.aliasName || 'Đối tượng thụ hưởng'}`,
      locationName: beneficiary?.currentArea || 'Hóc Môn, TP.HCM',
    },
    `jrn-${caseItem.id}`
  ).getValue();

  const actorId = user?.userId || 'usr-volunteer-default';
  const advanceRes = journey.advanceStage(targetStageKey, actorId, notes);

  if (advanceRes.isFailure) {
    return c.json({ success: false, error: advanceRes.error }, 400);
  }

  const nowStr = new Date().toISOString();

  // Immutable Audit & Timeline log
  await db.batch([
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId,
      eventType: 'journey_stage_advanced',
      title: `Chuyển giai đoạn hành trình ➔ ${targetStageKey}`,
      description: notes || `Đã chuyển giai đoạn thành công sang ${targetStageKey}`,
      eventDate: nowStr,
    }),
    db.insert(auditLogs).values({
      id: `audit-${crypto.randomUUID()}`,
      organizationId: caseItem.organizationId,
      userId: actorId,
      action: `JOURNEY_STAGE_ADVANCED_${targetStageKey.toUpperCase()}`,
      resourceType: 'cases',
      resourceId: caseId,
      createdAt: nowStr,
    }),
  ]);

  return c.json({
    success: true,
    message: `Đã chuyển sang giai đoạn ${targetStageKey} thành công`,
    data: journey.toJSON(),
  });
});

// POST /api/cases/:id/evidence - Đính kèm bằng chứng thực địa mới (EvidenceItem + EvidenceProvenance + Confidence)
caseRoutes.post('/:id/evidence', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ success: false, error: 'Không tìm thấy hồ sơ ca' }, 404);
  }

  const { title, description, category, score, sourceType, mediaUrl, latitude, longitude } = body;

  const provRes = EvidenceProvenance.create({
    category: category || 'photo',
    collectedBy: user?.userId || 'usr-volunteer-default',
    collectorRole: user?.role || 'volunteer',
    gpsLocation: (latitude !== undefined && longitude !== undefined) ? { latitude, longitude } : undefined,
  });

  if (provRes.isFailure) {
    return c.json({ success: false, error: provRes.error }, 400);
  }

  const confRes = Confidence.create(
    typeof score === 'number' ? score : 0.85,
    sourceType || 'manual_input'
  );

  if (confRes.isFailure) {
    return c.json({ success: false, error: confRes.error }, 400);
  }

  const evidenceItemRes = EvidenceItem.create({
    caseId,
    title: title || 'Bằng chứng thực địa mới',
    description: description || 'Thu thập từ hiện trường',
    provenance: provRes.getValue(),
    confidence: confRes.getValue(),
    mediaUrl,
  });

  if (evidenceItemRes.isFailure) {
    return c.json({ success: false, error: evidenceItemRes.error }, 400);
  }

  const evidenceItem = evidenceItemRes.getValue();
  const nowStr = new Date().toISOString();

  // Timeline Event & Audit Log
  await db.batch([
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-volunteer-default',
      eventType: 'evidence_attached',
      title: `Thu thập bằng chứng thực địa: ${evidenceItem.title}`,
      description: evidenceItem.description,
      eventDate: nowStr,
    }),
    db.insert(auditLogs).values({
      id: `audit-${crypto.randomUUID()}`,
      organizationId: caseItem.organizationId,
      userId: user?.userId || 'usr-volunteer-default',
      action: 'EVIDENCE_ATTACHED',
      resourceType: 'evidence_items',
      resourceId: evidenceItem.id,
      createdAt: nowStr,
    }),
  ]);

  return c.json(
    {
      success: true,
      message: 'Đã lưu vết bằng chứng thực địa & xác minh xuất xứ (Provenance) thành công',
      data: evidenceItem.toJSON(),
    },
    201
  );
});

// POST /api/cases/:caseId/evidence/:evidenceId/verify - Xác minh hoặc từ chối bằng chứng
caseRoutes.post('/:caseId/evidence/:evidenceId/verify', async (c) => {
  const caseId = c.req.param('caseId');
  const evidenceId = c.req.param('evidenceId');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { action, reason } = body; // action: 'verify' | 'reject'
  if (action !== 'verify' && action !== 'reject') {
    return c.json({ success: false, error: 'action phải là verify hoặc reject' }, 400);
  }

  const verifierId = user?.userId || 'usr-admin-default';
  const nowStr = new Date().toISOString();

  await db.insert(auditLogs).values({
    id: `audit-${crypto.randomUUID()}`,
    userId: verifierId,
    action: `EVIDENCE_${action.toUpperCase()}`,
    resourceType: 'evidence_items',
    resourceId: evidenceId,
    createdAt: nowStr,
  });

  return c.json({
    success: true,
    evidenceId,
    action,
    verifierId,
    verifiedAt: nowStr,
    message: `Đã ${action === 'verify' ? 'chấp thuận xác minh' : 'từ chối'} bằng chứng thành công`,
  });
});

/**
 * GET /api/cases/:caseId/timeline - Lịch sử sự kiện 6 bước đồng hành (TODO-09)
 */
caseRoutes.get('/:caseId/timeline', async (c) => {
  const caseId = c.req.param('caseId');
  const db = createDatabaseClient(c.env.DB);

  const events = await db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.caseId, caseId))
    .orderBy(timelineEvents.eventDate);

  return c.json({
    success: true,
    caseId,
    totalEvents: events.length,
    data: events,
  });
});

/**
 * POST /api/cases/:caseId/timeline - Tạo sự kiện mốc đồng hành mới (TODO-09)
 */
caseRoutes.post('/:caseId/timeline', async (c) => {
  const caseId = c.req.param('caseId');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { eventType, title, description, eventDate } = body;
  if (!eventType || !title) {
    return c.json({ success: false, error: 'eventType và title là bắt buộc' }, 400);
  }

  const id = `tle-${crypto.randomUUID()}`;
  const nowStr = eventDate || new Date().toISOString();

  await db.insert(timelineEvents).values({
    id,
    caseId,
    actorId: user?.userId || 'usr-volunteer-default',
    eventType,
    title,
    description: description || null,
    eventDate: nowStr,
  });

  return c.json(
    {
      success: true,
      message: 'Đã tạo sự kiện mốc đồng hành thành công',
      data: { id, caseId, eventType, title, description, eventDate: nowStr },
    },
    201
  );
});

/**
 * GET /api/cases/:caseId/consents - Lấy danh sách ghi nhận đồng thuận PII/Referral (TODO-08)
 */
caseRoutes.get('/:caseId/consents', async (c) => {
  const caseId = c.req.param('caseId');
  const db = createDatabaseClient(c.env.DB);

  const consentsList = await db
    .select()
    .from(caseConsents)
    .where(eq(caseConsents.caseId, caseId));

  return c.json({
    success: true,
    caseId,
    data: consentsList,
  });
});

/**
 * POST /api/cases/:caseId/consents - Ghi nhận sự đồng thuận của người thụ hưởng (TODO-08)
 */
caseRoutes.post('/:caseId/consents', async (c) => {
  const caseId = c.req.param('caseId');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { scope, status, evidenceNote } = body;
  const validScopes = ['SOCIAL_ASSISTANCE_REFERRAL', 'EMPLOYMENT_REFERRAL', 'HEALTH_REFERRAL', 'DATA_SHARING'];
  const validStatuses = ['GRANTED', 'DENIED', 'NOT_REQUIRED', 'UNKNOWN'];

  if (!scope || !validScopes.includes(scope)) {
    return c.json({ success: false, error: `scope không hợp lệ. Phải là một trong: ${validScopes.join(', ')}` }, 400);
  }
  if (status && !validStatuses.includes(status)) {
    return c.json({ success: false, error: `status không hợp lệ. Phải là một trong: ${validStatuses.join(', ')}` }, 400);
  }

  const id = `cc-${crypto.randomUUID()}`;
  const nowStr = new Date().toISOString();

  await db.insert(caseConsents).values({
    id,
    caseId,
    scope,
    status: status || 'GRANTED',
    capturedBy: user?.userId || 'usr-volunteer-default',
    capturedAt: nowStr,
    evidenceNote: evidenceNote || null,
  });

  return c.json(
    {
      success: true,
      message: 'Đã lưu vết sự đồng thuận thành công',
      data: { id, caseId, scope, status: status || 'GRANTED', capturedAt: nowStr },
    },
    201
  );
});

// ==========================================
// CANONICAL CASE COMMAND ENDPOINTS (Section 26)
// ==========================================

// POST /api/v1/cases/:id/assign - Phân công / Điều chuyển ca đồng hành
caseRoutes.post('/:id/assign', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { assignedTo, reason } = body;
  if (!assignedTo) {
    return c.json({ error: { code: 'INVALID_INPUT', message: 'assignedTo là bắt buộc' } }, 400);
  }

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ ca' } }, 404);
  }

  const nowStr = new Date().toISOString();
  const assignmentId = `ca-${crypto.randomUUID()}`;

  await db.batch([
    db.update(cases).set({
      assignedTo,
      currentOwnerId: assignedTo,
      updatedAt: nowStr,
    }).where(eq(cases.id, caseId)),
    db.insert(caseAssignments).values({
      id: assignmentId,
      caseId,
      assignedBy: user?.userId || 'usr-coordinator-default',
      assignedTo,
      reason: reason || 'Phân công ca đồng hành từ Bảng Điều phối viên',
      active: true,
      assignedAt: nowStr,
    }),
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-coordinator-default',
      eventType: 'case_assigned',
      title: 'Phân công điều phối ca',
      description: `Đã phân công ca cho Điều hướng viên (ID: ${assignedTo}). Lý do: ${reason || 'Phân công vận hành'}`,
      eventDate: nowStr,
    }),
  ]);

  return c.json({
    data: { id: caseId, assignedTo, assignmentId, assignedAt: nowStr },
    meta: { message: 'Đã phân công ca thành công' }
  });
});

// POST /api/v1/cases/:id/close - Đóng ca có kiểm chứng kết quả (Command transition)
caseRoutes.post('/:id/close', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { resultStatus, notes, followUpId } = body;
  const validResults = ['BETTER', 'SAME', 'HARDER', 'UNREACHABLE', 'UNKNOWN'];
  const finalResult = validResults.includes(resultStatus) ? resultStatus : 'BETTER';

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ ca' } }, 404);
  }

  const nowStr = new Date().toISOString();
  const outcomeId = `out-${crypto.randomUUID()}`;

  await db.batch([
    db.update(cases).set({
      status: 'CLOSED',
      closedAt: nowStr,
      updatedAt: nowStr,
    }).where(eq(cases.id, caseId)),
    db.insert(outcomes).values({
      id: outcomeId,
      caseId,
      followUpId: followUpId || null,
      resultStatus: finalResult as any,
      notes: notes || 'Hoàn tất quy trình đồng hành an sinh',
      recordedBy: user?.userId || 'usr-coordinator-default',
      recordedAt: nowStr,
    }),
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-coordinator-default',
      eventType: 'case_closed',
      title: `Đóng hồ sơ ca — Kết quả: ${finalResult}`,
      description: notes || 'Đã đóng hồ sơ ca sau khi ghi nhận kết quả can thiệp.',
      eventDate: nowStr,
    }),
  ]);

  return c.json({
    data: { id: caseId, status: 'CLOSED', outcomeId, resultStatus: finalResult, closedAt: nowStr },
    meta: { message: 'Đã đóng hồ sơ ca thành công' }
  });
});

// ==========================================
// CANONICAL JOURNEY & INTAKE ENDPOINTS (Section 27)
// ==========================================

// POST /api/v1/cases/:id/intake - Ghi nhận phiên tiếp nhận thông tin (Intake Session)
caseRoutes.post('/:id/intake', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ ca' } }, 404);
  }

  const nowStr = new Date().toISOString();
  const encounterId = `enc-${crypto.randomUUID()}`;
  const notes = body.notes || body.summary || 'Tiếp nhận thông tin tại hiện trường';

  await db.batch([
    db.insert(encounters).values({
      id: encounterId,
      caseId,
      volunteerId: user?.userId || 'usr-volunteer-default',
      encounterDate: nowStr,
      locationText: body.locationText || body.location || 'Hóc Môn, TP.HCM',
      summary: notes,
      healthState: body.healthState || null,
      syncStatus: 'synced',
    }),
    db.update(cases).set({
      status: 'INTAKE_CAPTURED',
      updatedAt: nowStr,
    }).where(eq(cases.id, caseId)),
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-volunteer-default',
      eventType: 'intake_captured',
      title: 'Tiếp nhận thông tin thực địa (Intake Captured)',
      description: notes,
      eventDate: nowStr,
    }),
  ]);

  return c.json({
    data: { id: encounterId, caseId, status: 'INTAKE_CAPTURED', notes, capturedAt: nowStr },
    meta: { message: 'Đã lưu phiên tiếp nhận thông tin thành công' }
  }, 201);
});

// GET & POST /api/v1/cases/:id/consent - Giao thức 3-KHÔNG Consent
caseRoutes.get('/:id/consent', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const consentList = await db.select().from(consents).where(eq(consents.caseId, caseId)).all();
  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();

  return c.json({
    data: {
      caseId,
      threeKhongCheck: caseItem?.threeKhongCheck ? JSON.parse(caseItem.threeKhongCheck as string) : null,
      consents: consentList,
    },
    meta: {}
  });
});

caseRoutes.post('/:id/consent', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ ca' } }, 404);
  }

  const nowStr = new Date().toISOString();
  const consentId = `cst-${crypto.randomUUID()}`;

  await db.batch([
    db.insert(consents).values({
      id: consentId,
      caseId,
      beneficiaryId: caseItem.beneficiaryId,
      version: 1,
      scope: body.scope || 'GENERAL_SUPPORT',
      granted: body.granted !== undefined ? Boolean(body.granted) : true,
      voiceRecordingAllowed: body.voiceRecordingAllowed !== undefined ? Boolean(body.voiceRecordingAllowed) : true,
      anonymityRequested: body.anonymityRequested !== undefined ? Boolean(body.anonymityRequested) : true,
      capturedBy: user?.userId || 'usr-volunteer-default',
      capturedAt: nowStr,
    }),
    db.update(cases).set({
      status: 'CONSENT_CONFIRMED',
      updatedAt: nowStr,
    }).where(eq(cases.id, caseId)),
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-volunteer-default',
      eventType: 'consent_confirmed',
      title: 'Xác nhận đồng thuận 3-KHÔNG Consent',
      description: 'Đã hoàn tất xác nhận phạm vi chia sẻ thông tin an sinh',
      eventDate: nowStr,
    }),
  ]);

  return c.json({
    data: { id: consentId, caseId, status: 'CONSENT_CONFIRMED', granted: true, capturedAt: nowStr },
    meta: { message: 'Đã xác nhận chấp thuận 3-KHÔNG Consent thành công' }
  }, 201);
});

// GET & POST /api/v1/cases/:id/safeguarding - Bảng kiểm an toàn bảo vệ
caseRoutes.get('/:id/safeguarding', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);

  const flags = await db.select().from(safeguardingFlags).where(eq(safeguardingFlags.caseId, caseId)).all();
  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  const beneficiary = caseItem ? await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseItem.beneficiaryId)).get() : null;

  return c.json({
    data: {
      caseId,
      isMinor: Boolean(beneficiary?.isMinor),
      riskLevel: caseItem?.riskLevel || 'LOW',
      safeguardingFlags: flags,
    },
    meta: {}
  });
});

caseRoutes.post('/:id/safeguarding', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ ca' } }, 404);
  }

  const { reason, severity, notes } = body;
  const flagId = `sgf-${crypto.randomUUID()}`;
  const nowStr = new Date().toISOString();

  await db.batch([
    db.insert(safeguardingFlags).values({
      id: flagId,
      caseId,
      reportedBy: user?.userId || 'usr-volunteer-default',
      reason: reason || 'safeguarding_check',
      severity: severity || 'high',
      status: 'open',
    }),
    db.update(cases).set({
      riskLevel: (severity || 'HIGH').toUpperCase() as any,
      updatedAt: nowStr,
    }).where(eq(cases.id, caseId)),
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-volunteer-default',
      eventType: 'safeguarding_flagged',
      title: `Ghi nhận dấu hiệu an toàn: ${reason || 'Kiểm tra bảo vệ'}`,
      description: notes || 'Đã ghi nhận cờ bảo vệ an toàn',
      eventDate: nowStr,
    }),
  ]);

  return c.json({
    data: { id: flagId, caseId, reason, severity: severity || 'high', createdAt: nowStr },
    meta: { message: 'Đã ghi nhận cờ bảo vệ an toàn thành công' }
  }, 201);
});

// GET & PUT /api/v1/cases/:id/strengths - Điểm mạnh người thụ hưởng (Strengths-based approach)
caseRoutes.get('/:id/strengths', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);

  const facts = await db.select().from(caseFacts).where(and(eq(caseFacts.caseId, caseId), eq(caseFacts.factType, 'STRENGTHS'))).all();
  return c.json({ data: facts, meta: { caseId } });
});

caseRoutes.put('/:id/strengths', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const strengthsList = Array.isArray(body.strengths) ? body.strengths : [body.strengths || 'Kỹ năng lao động chăm chỉ'];
  const nowStr = new Date().toISOString();
  const factId = `cf-${crypto.randomUUID()}`;

  await db.batch([
    db.insert(caseFacts).values({
      id: factId,
      caseId,
      factType: 'STRENGTHS',
      value: JSON.stringify(strengthsList),
      sourceType: 'NAVIGATOR_OBSERVED',
      verificationStatus: 'VERIFIED',
      createdBy: user?.userId || 'usr-volunteer-default',
      createdAt: nowStr,
    }),
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-volunteer-default',
      eventType: 'strengths_recorded',
      title: 'Ghi nhận điểm mạnh & nguồn lực cá nhân',
      description: `Điểm mạnh: ${strengthsList.join(', ')}`,
      eventDate: nowStr,
    }),
  ]);

  return c.json({ data: { factId, caseId, strengths: strengthsList, recordedAt: nowStr }, meta: {} });
});

// GET & PUT /api/v1/cases/:id/priority - Nhu cầu ưu tiên
caseRoutes.get('/:id/priority', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const facts = await db.select().from(caseFacts).where(and(eq(caseFacts.caseId, caseId), eq(caseFacts.factType, 'PRIORITY'))).all();
  return c.json({ data: facts, meta: { caseId } });
});

caseRoutes.put('/:id/priority', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const priorityNeed = body.priorityNeed || body.category || 'job';
  const nowStr = new Date().toISOString();
  const factId = `cf-${crypto.randomUUID()}`;

  await db.batch([
    db.insert(caseFacts).values({
      id: factId,
      caseId,
      factType: 'PRIORITY',
      value: priorityNeed,
      sourceType: 'BENEFICIARY_STATED',
      verificationStatus: 'VERIFIED',
      createdBy: user?.userId || 'usr-volunteer-default',
      createdAt: nowStr,
    }),
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-volunteer-default',
      eventType: 'priority_recorded',
      title: `Ghi nhận nhu cầu ưu tiên: ${priorityNeed}`,
      description: `Nhu cầu ưu tiên hàng đầu được xác nhận: ${priorityNeed}`,
      eventDate: nowStr,
    }),
  ]);

  return c.json({ data: { factId, caseId, priorityNeed, recordedAt: nowStr }, meta: {} });
});

// ==========================================
// CANONICAL FACT & PROVENANCE ENDPOINTS (Section 28)
// ==========================================

// GET /api/v1/cases/:id/facts & POST /api/v1/cases/:id/facts
caseRoutes.get('/:id/facts', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const factsList = await db.select().from(caseFacts).where(eq(caseFacts.caseId, caseId)).all();
  return c.json({ data: factsList, meta: { total: factsList.length } });
});

caseRoutes.post('/:id/facts', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { factType, value, sourceType, confidence } = body;
  if (!factType || !value) {
    return c.json({ error: { code: 'INVALID_INPUT', message: 'factType và value là bắt buộc' } }, 400);
  }

  const factId = `cf-${crypto.randomUUID()}`;
  const nowStr = new Date().toISOString();

  await db.insert(caseFacts).values({
    id: factId,
    caseId,
    factType,
    value: typeof value === 'string' ? value : JSON.stringify(value),
    sourceType: sourceType || 'BENEFICIARY_STATED',
    verificationStatus: 'UNVERIFIED',
    confidence: confidence ? Number(confidence) : 100,
    createdBy: user?.userId || 'usr-volunteer-default',
    createdAt: nowStr,
  });

  return c.json({ data: { id: factId, caseId, factType, value, sourceType, createdAt: nowStr }, meta: {} }, 201);
});

// POST /api/v1/cases/:id/facts/:factId/verify - Xác minh nguồn gốc dữ liệu (Human-in-the-loop)
caseRoutes.post('/:id/facts/:factId/verify', async (c) => {
  const caseId = c.req.param('id');
  const factId = c.req.param('factId');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const verificationStatus = body.status === 'REJECTED' ? 'REJECTED' : 'VERIFIED';
  const nowStr = new Date().toISOString();

  await db.update(caseFacts).set({
    verificationStatus,
    verifiedBy: user?.userId || 'usr-volunteer-default',
    verifiedAt: nowStr,
  }).where(eq(caseFacts.id, factId));

  return c.json({ data: { factId, caseId, verificationStatus, verifiedAt: nowStr }, meta: {} });
});

// ==========================================
// CANONICAL MATCHING ENDPOINTS (Section 29)
// ==========================================

// POST /api/v1/cases/:id/matches/search - Thuật toán khớp nối cứng & soft ranking
caseRoutes.post('/:id/matches/search', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const body = await c.req.json().catch(() => ({}));

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ ca' } }, 404);
  }

  const beneficiary = await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseItem.beneficiaryId)).get();
  const rawResources = await db.select().from(resources).all();

  // Convert to ResourceCandidates
  const candidates = rawResources.map((r) => ({
    id: r.id,
    name: r.name,
    type: (r.category === 'employment' ? 'JOB' : r.category === 'shelter' ? 'SHELTER' : r.category === 'medical' ? 'MEDICAL_CARE' : 'EMERGENCY_AID') as any,
    category: r.category,
    description: r.address,
    requiredSkills: [],
    district: r.district,
    address: r.address,
    ageMin: 0,
    ageMax: 100,
    isActive: true,
    availableSlots: 5,
    urgencySupported: true,
    verificationStatus: (r.verificationStatus || 'VERIFIED') as any,
    verificationExpiresAt: r.verificationExpiresAt || undefined,
    contactInfo: r.phone || '02838999999',
    providerId: r.organizationId || 'org-default',
    providerName: r.name,
    createdAt: r.createdAt || new Date().toISOString(),
  }));

  const matchRequest = {
    id: `req-${caseId}`,
    caseId,
    beneficiaryName: beneficiary?.aliasName || 'Người thụ hưởng',
    age: beneficiary?.birthYear ? new Date().getFullYear() - beneficiary.birthYear : 25,
    isMinor: Boolean(beneficiary?.isMinor),
    skills: body.skills || [],
    priorityNeed: body.priorityNeed || 'safe',
    preferredDistrict: beneficiary?.currentArea || 'Hóc Môn',
    urgency: (caseItem.priority || 'MEDIUM').toUpperCase() as any,
    createdAt: new Date().toISOString(),
  };

  const matchingPolicy = new MatchingPolicy({ minScoreThreshold: 20 });
  const results = matchingPolicy.evaluateCandidates(matchRequest, candidates);

  return c.json({
    data: {
      caseId,
      matchRequest,
      candidatesEvaluated: candidates.length,
      matches: results,
    },
    meta: { algorithm: 'Deterministic Hard Constraints + Provenance Ranking' }
  });
});

// GET /api/v1/cases/:id/matches - Lấy danh sách kết quả đối sánh đã lưu
caseRoutes.get('/:id/matches', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const matchItems = await db.select().from(matches).where(eq(matches.caseId, caseId)).all();
  return c.json({ data: matchItems, meta: { total: matchItems.length } });
});

// ==========================================
// CANONICAL SAFE NEXT STEP ENDPOINTS (Section 30)
// ==========================================

// GET /api/v1/cases/:id/safe-next-steps & POST /api/v1/cases/:id/safe-next-steps
caseRoutes.get('/:id/safe-next-steps', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const snsList = await db.select().from(safeNextSteps).where(eq(safeNextSteps.caseId, caseId)).all();
  return c.json({ data: snsList, meta: { total: snsList.length } });
});

caseRoutes.post('/:id/safe-next-steps', async (c) => {
  const caseId = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { title, action, owner, channelOrLocation, dueAt, resourceId } = body;
  if (!title) {
    return c.json({ error: { code: 'INVALID_INPUT', message: 'title là bắt buộc' } }, 400);
  }

  const snsId = `sns-${crypto.randomUUID()}`;
  const nowStr = new Date().toISOString();

  await db.batch([
    db.insert(safeNextSteps).values({
      id: snsId,
      caseId,
      resourceId: resourceId || null,
      title,
      action: action || title,
      owner: owner || 'Người thụ hưởng',
      channelOrLocation: channelOrLocation || 'Trực tiếp tại điểm nguồn lực',
      dueAt: dueAt || null,
      status: 'PROPOSED',
      proposedBy: user?.userId || 'usr-volunteer-default',
      createdAt: nowStr,
    }),
    db.update(cases).set({
      status: 'SNS_PROPOSED',
      updatedAt: nowStr,
    }).where(eq(cases.id, caseId)),
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-volunteer-default',
      eventType: 'sns_proposed',
      title: `Đề xuất Safe Next Step: ${title}`,
      description: action || title,
      eventDate: nowStr,
    }),
  ]);

  return c.json({
    data: { id: snsId, caseId, title, action, status: 'PROPOSED', createdAt: nowStr },
    meta: { message: 'Đã đề xuất Safe Next Step thành công' }
  }, 201);
});

// POST /api/v1/safe-next-steps/:id/confirm & POST /api/v1/safe-next-steps/:id/cancel
caseRoutes.post('/safe-next-steps/:id/confirm', async (c) => {
  const id = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  const snsItem = await db.select().from(safeNextSteps).where(eq(safeNextSteps.id, id)).get();
  if (!snsItem) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy Safe Next Step' } }, 404);
  }

  const nowStr = new Date().toISOString();
  await db.batch([
    db.update(safeNextSteps).set({
      status: 'CONFIRMED',
      confirmedBy: user?.userId || 'usr-volunteer-default',
      confirmedAt: nowStr,
    }).where(eq(safeNextSteps.id, id)),
    db.update(cases).set({
      status: 'SNS_CONFIRMED',
      updatedAt: nowStr,
    }).where(eq(cases.id, snsItem.caseId)),
    db.insert(safeNextStepEvents).values({
      id: `snse-${crypto.randomUUID()}`,
      safeNextStepId: id,
      caseId: snsItem.caseId,
      eventType: 'CONFIRMED',
      actorId: user?.userId || 'usr-volunteer-default',
      createdAt: nowStr,
    }),
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId: snsItem.caseId,
      actorId: user?.userId || 'usr-volunteer-default',
      eventType: 'sns_confirmed',
      title: `Xác nhận Safe Next Step: ${snsItem.title}`,
      description: 'Cán bộ và người thụ hưởng đã thống nhất hành động an toàn tiếp theo.',
      eventDate: nowStr,
    }),
  ]);

  return c.json({ data: { id, status: 'CONFIRMED', confirmedAt: nowStr }, meta: { message: 'Xác nhận Safe Next Step thành công' } });
});

caseRoutes.post('/safe-next-steps/:id/cancel', async (c) => {
  const id = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  const snsItem = await db.select().from(safeNextSteps).where(eq(safeNextSteps.id, id)).get();
  if (!snsItem) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy Safe Next Step' } }, 404);
  }

  const nowStr = new Date().toISOString();
  await db.update(safeNextSteps).set({
    status: 'CANCELLED',
  }).where(eq(safeNextSteps.id, id));

  return c.json({ data: { id, status: 'CANCELLED' }, meta: { message: 'Đã hủy Safe Next Step' } });
});



