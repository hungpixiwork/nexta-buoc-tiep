import { Hono } from 'hono';
import { Env } from '../bindings';
import { createDatabaseClient, milIncidentLogs } from '@buoc-tiep/database';
import { eq } from 'drizzle-orm';
import {
  CreateIncidentSchema,
  CreateVerifiedInfoCardSchema,
  PRESET_VERIFIED_MIL_CARDS,
  filterCardsByCategory,
  searchCardsByKeywords,
  detectScamRiskInText,
  evaluateLearningPolicy,
  convertIncidentToMILCard,
  VerifiedInfoCard,
} from '@buoc-tiep/shared';

export const milRoutes = new Hono<{ Bindings: Env }>();

// In-memory / D1 KV Cache cho Thẻ MIL (khởi tạo với Preset Cards)
const milCardsDatabase: VerifiedInfoCard[] = [...(PRESET_VERIFIED_MIL_CARDS || [])];

// GET /api/mil/cards - Danh sách thẻ giáo dục truyền thông & an toàn số MIL
milRoutes.get('/cards', async (c) => {
  const category = c.req.query('category');
  const q = c.req.query('q');

  let filtered = filterCardsByCategory(milCardsDatabase, category);
  if (q) {
    filtered = searchCardsByKeywords(filtered, q);
  }

  return c.json({
    success: true,
    total: filtered.length,
    data: filtered,
  });
});

// GET /api/mil/cards/:id - Chi tiết 1 thẻ bài học MIL
milRoutes.get('/cards/:id', async (c) => {
  const id = c.req.param('id');
  const card = milCardsDatabase.find((item) => item.id === id);

  if (!card) {
    return c.json({ success: false, error: 'Không tìm thấy thẻ giáo dục MIL tương ứng' }, 404);
  }

  return c.json({ success: true, data: card });
});

// POST /api/mil/cards - Tạo thẻ giáo dục MIL mới (Được kiểm định bởi Chuyên gia/Admin)
milRoutes.post('/cards', async (c) => {
  const body = await c.req.json();
  const validation = CreateVerifiedInfoCardSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ success: false, errors: validation.error.flatten() }, 400);
  }

  const newCard: VerifiedInfoCard = {
    id: `mil-card-${Date.now()}`,
    title: validation.data.title,
    category: validation.data.category,
    summary: validation.data.summary,
    content: validation.data.content,
    warningSigns: validation.data.warningSigns,
    actionSteps: validation.data.actionSteps,
    isVerified: validation.data.isVerified,
    verifiedBy: validation.data.verifiedBy,
    sourceUrl: validation.data.sourceUrl,
    tags: validation.data.tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  milCardsDatabase.unshift(newCard);

  return c.json(
    { success: true, id: newCard.id, message: 'Đã tạo thẻ giáo dục MIL kiểm định mới', data: newCard },
    201
  );
});

// GET /api/mil/incidents - Nhật ký sự cố lừa đảo / an toàn số
milRoutes.get('/incidents', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const result = await db.select().from(milIncidentLogs).all();
  return c.json({ success: true, data: result });
});

// POST /api/mil/incidents - Báo cáo sự cố MIL & Tự động phát hiện rủi ro & Reverse Learning Policy
milRoutes.post('/incidents', async (c) => {
  const body = await c.req.json();
  const validation = CreateIncidentSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ success: false, errors: validation.error.flatten() }, 400);
  }

  const { description, incidentType, riskLevel, userId } = validation.data;

  // 1. Phân tích tự động dấu hiệu lừa đảo số qua detectScamRiskInText
  const scamAnalysis = detectScamRiskInText(description);

  // 2. Đánh giá chính sách học tập đảo ngược MIL Reverse-Learning Policy
  const policyRecommendation = evaluateLearningPolicy(incidentType, riskLevel);

  const db = createDatabaseClient(c.env.DB);
  const newId = `inc-${crypto.randomUUID()}`;

  await db.insert(milIncidentLogs).values({
    id: newId,
    userId,
    incidentType,
    description,
    riskLevel,
  });

  return c.json(
    {
      success: true,
      id: newId,
      message: 'Đã tiếp nhận báo cáo sự cố an toàn số MIL',
      scamAnalysis,
      policyRecommendation,
    },
    201
  );
});

// POST /api/mil/incidents/:id/convert-to-card - Chuyển đổi sự cố MIL thành Thẻ Bài học An toàn Số (Reverse Learning)
milRoutes.post('/incidents/:id/convert-to-card', async (c) => {
  const id = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);

  const [incident] = await db
    .select()
    .from(milIncidentLogs)
    .where(eq(milIncidentLogs.id, id))
    .limit(1);

  if (!incident) {
    return c.json({ success: false, error: 'Không tìm thấy bản ghi sự cố MIL' }, 404);
  }

  // Tự động sinh Thẻ Bài học MIL được ẩn danh hóa 100% qua convertIncidentToMILCard
  const generatedCard = convertIncidentToMILCard({
    id: incident.id,
    incidentType: incident.incidentType as any,
    description: incident.description ?? undefined,
    riskLevel: incident.riskLevel as any,
  });


  milCardsDatabase.unshift(generatedCard);

  return c.json({
    success: true,
    message: 'Đã chuyển đổi sự cố MIL thành Thẻ Giáo dục An toàn Số thành công (Đã ẩn danh hóa 100%)',
    data: generatedCard,
  });
});
