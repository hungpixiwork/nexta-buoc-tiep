import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { Env } from '../bindings';
import { createDatabaseClient, resources, referrals, timelineEvents } from '@buoc-tiep/database';
import {
  CreateReferralSchema,
  CreateResourceSchema,
  filterVerifiedAndActiveResources,
  isResourceOperationalAndVerified,
  SupportResource,
} from '@buoc-tiep/shared';
import { z } from 'zod';

export const resourceRoutes = new Hono<{ Bindings: Env }>();

const VerifyResourceSchema = z.object({
  isVerified: z.boolean(),
  verifiedBy: z.string().optional().default('usr-social-worker-default'),
  notes: z.string().optional(),
});

// GET /api/resources - Danh mục nguồn lực an sinh xã hội đã lọc bỏ nguồn unverified/stale kèm tọa độ địa lý
resourceRoutes.get('/', async (c) => {
  const searchParam = (c.req.query('search') || '').trim().toLowerCase();
  const districtParam = c.req.query('district') || 'ALL';
  const categoryParam = c.req.query('category') || 'ALL';
  const isVerifiedParam = c.req.query('isVerified') || 'all'; // 'true', 'false', 'all'
  const is24HoursParam = c.req.query('is24Hours'); // 'true', 'false'
  const excludeStaleParam = c.req.query('excludeStale') ?? 'false'; // 'true', 'false'
  const maxStaleDaysParam = parseInt(c.req.query('maxStaleDays') || '90', 10);
  const vulnerabilityGroupParam = c.req.query('vulnerabilityGroup');
  const ageParam = c.req.query('age') ? parseInt(c.req.query('age')!, 10) : undefined;

  const db = createDatabaseClient(c.env.DB);

  // Truy vấn SQL ban đầu
  const conditions: any[] = [];
  if (districtParam !== 'ALL' && districtParam !== 'all') {
    conditions.push(eq(resources.district, districtParam));
  }
  if (categoryParam !== 'ALL' && categoryParam !== 'all') {
    conditions.push(eq(resources.category, categoryParam as any));
  }
  if (isVerifiedParam === 'true') {
    conditions.push(eq(resources.isVerified, true));
  } else if (isVerifiedParam === 'false') {
    conditions.push(eq(resources.isVerified, false));
  }
  if (is24HoursParam === 'true') {
    conditions.push(eq(resources.is24Hours, true));
  }

  const rawResources = conditions.length > 0
    ? await db.select().from(resources).where(and(...conditions)).all()
    : await db.select().from(resources).all();

  // Chuyển đổi D1 SQL rows sang SupportResource Domain Models
  let domainResources: SupportResource[] = rawResources.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category as any,
    district: item.district,
    ward: item.ward || undefined,
    city: item.city || 'TP. Hồ Chí Minh',
    province: item.province || 'TP. Hồ Chí Minh',
    address: item.address,
    phone: item.phone || undefined,
    hotline: item.hotline || undefined,
    email: item.email || undefined,
    website: item.website || undefined,
    latitude: item.latitude !== null && item.latitude !== undefined ? Number(item.latitude) : undefined,
    longitude: item.longitude !== null && item.longitude !== undefined ? Number(item.longitude) : undefined,
    operatingHours: item.operatingHours || undefined,
    is24Hours: Boolean(item.is24Hours),
    is_24_7: Boolean(item.is24Hours),
    verificationStatus: item.verificationStatus || (item.isVerified ? 'VERIFIED' : 'UNVERIFIED'),
    isVerified: Boolean(item.isVerified),
    verifiedBy: item.verifiedBy || undefined,
    verifiedAt: item.verifiedAt || undefined,
    acceptsReferral: item.acceptsReferral !== null && item.acceptsReferral !== undefined ? Boolean(item.acceptsReferral) : true,
    emergencySupport: Boolean(item.emergencySupport),
    description: item.description || undefined,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || undefined,
  }));

  // Áp dụng text search client-side/filter nếu có query search
  if (searchParam) {
    domainResources = domainResources.filter(r => 
      r.name.toLowerCase().includes(searchParam) ||
      r.address.toLowerCase().includes(searchParam) ||
      (r.district && r.district.toLowerCase().includes(searchParam)) ||
      (r.ward && r.ward.toLowerCase().includes(searchParam)) ||
      (r.description && r.description.toLowerCase().includes(searchParam)) ||
      r.category.toLowerCase().includes(searchParam)
    );
  }

  // Áp dụng bộ lọc Domain (lọc stale, unverified, eligibility)
  const isVerifiedOnly = isVerifiedParam === 'true';
  const excludeStale = excludeStaleParam === 'true';

  const candidate = (vulnerabilityGroupParam || ageParam !== undefined)
    ? {
        vulnerabilityGroup: vulnerabilityGroupParam,
        age: ageParam,
        district: districtParam !== 'ALL' && districtParam !== 'all' ? districtParam : undefined,
      }
    : undefined;

  const filteredData = filterVerifiedAndActiveResources(domainResources, {
    district: districtParam,
    category: categoryParam,
    isVerifiedOnly,
    excludeStale,
    maxStaleDays: maxStaleDaysParam,
    candidate,
  });

  const filteredOutCount = rawResources.length - filteredData.length;

  return c.json({
    success: true,
    totalInDb: rawResources.length,
    returned: filteredData.length,
    filteredOutCount,
    filtersApplied: {
      search: searchParam || null,
      district: districtParam,
      category: categoryParam,
      isVerifiedOnly,
      is24Hours: is24HoursParam === 'true',
      excludeStale,
      maxStaleDays: maxStaleDaysParam,
      vulnerabilityGroup: vulnerabilityGroupParam || null,
      age: ageParam || null,
    },
    data: filteredData,
  });
});

// POST /api/resources - Thêm nguồn lực an sinh xã hội mới với tọa độ thực
resourceRoutes.post('/', async (c) => {
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = CreateResourceSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
  }
  const body = validationResult.data;
  const db = createDatabaseClient(c.env.DB);
  const id = `res-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  await db.insert(resources).values({
    id,
    name: body.name,
    category: body.category as any,
    district: body.district,
    ward: body.ward || null,
    city: body.city || 'TP. Hồ Chí Minh',
    province: body.province || 'TP. Hồ Chí Minh',
    address: body.address,
    phone: body.phone || null,
    hotline: body.hotline || null,
    email: body.email || null,
    website: body.website || null,
    latitude: body.latitude !== undefined ? body.latitude : null,
    longitude: body.longitude !== undefined ? body.longitude : null,
    operatingHours: body.operatingHours || null,
    is24Hours: body.is24Hours ?? false,
    verificationStatus: (body.verificationStatus || 'VERIFIED') as any,
    isVerified: body.isVerified ?? true,
    verifiedAt: body.isVerified ? now : null,
    verifiedBy: body.isVerified ? 'usr-admin-system' : null,
    acceptsReferral: body.acceptsReferral ?? true,
    emergencySupport: body.emergencySupport ?? false,
    description: body.description || null,
  });

  return c.json({
    success: true,
    id,
    isVerified: body.isVerified ?? true,
    message: 'Thêm địa điểm nguồn lực thành công'
  }, 201);
});

// PUT /api/resources/:id - Cập nhật địa điểm nguồn lực an sinh
resourceRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = CreateResourceSchema.partial().safeParse(rawBody);
  if (!validationResult.success) {
    return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
  }
  const body = validationResult.data;
  const db = createDatabaseClient(c.env.DB);

  const existing = await db.select().from(resources).where(eq(resources.id, id)).get();
  if (!existing) {
    return c.json({ success: false, error: 'Không tìm thấy địa điểm nguồn lực' }, 404);
  }

  const updateValues: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (body.name !== undefined) updateValues.name = body.name;
  if (body.category !== undefined) updateValues.category = body.category;
  if (body.district !== undefined) updateValues.district = body.district;
  if (body.ward !== undefined) updateValues.ward = body.ward;
  if (body.city !== undefined) updateValues.city = body.city;
  if (body.province !== undefined) updateValues.province = body.province;
  if (body.address !== undefined) updateValues.address = body.address;
  if (body.phone !== undefined) updateValues.phone = body.phone;
  if (body.hotline !== undefined) updateValues.hotline = body.hotline;
  if (body.email !== undefined) updateValues.email = body.email;
  if (body.website !== undefined) updateValues.website = body.website;
  if (body.latitude !== undefined) updateValues.latitude = body.latitude;
  if (body.longitude !== undefined) updateValues.longitude = body.longitude;
  if (body.operatingHours !== undefined) updateValues.operatingHours = body.operatingHours;
  if (body.is24Hours !== undefined) updateValues.is24Hours = body.is24Hours;
  if (body.verificationStatus !== undefined) updateValues.verificationStatus = body.verificationStatus;
  if (body.isVerified !== undefined) updateValues.isVerified = body.isVerified;
  if (body.acceptsReferral !== undefined) updateValues.acceptsReferral = body.acceptsReferral;
  if (body.emergencySupport !== undefined) updateValues.emergencySupport = body.emergencySupport;
  if (body.description !== undefined) updateValues.description = body.description;

  await db.update(resources).set(updateValues).where(eq(resources.id, id));

  return c.json({
    success: true,
    id,
    message: 'Cập nhật thông tin nguồn lực thành công'
  });
});

// GET /api/resources/referrals - Lấy danh sách toàn bộ phiếu chuyển tuyến nguồn lực
resourceRoutes.get('/referrals', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const result = await db.select().from(referrals).all();
  return c.json({ success: true, data: result });
});

// POST /api/resources/referrals - Tạo phiếu kết nối chuyển tuyến nguồn lực (Có kiểm tra bảo chứng unverified/stale)
resourceRoutes.post('/referrals', async (c) => {
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = CreateReferralSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
  }
  const body = validationResult.data;
  const db = createDatabaseClient(c.env.DB);
  const newReferralId = `ref-${crypto.randomUUID()}`;
  const newTimelineEventId = `tle-${crypto.randomUUID()}`;

  const caseId = body.caseId || 'case-lan-hoc-mon';
  const resourceId = body.resourceId || 'res-hoc-mon-01';
  const referredBy = body.referredBy || 'usr-volunteer-default';
  const status = body.status || 'proposed';
  const notes = body.notes || 'Kết nối khám sức khỏe & nhận suất ăn từ thiện';

  // Kiểm tra nguồn lực trước khi chuyển tuyến
  let warning: string | undefined = undefined;
  const targetResource = await db.select().from(resources).where(eq(resources.id, resourceId)).get();
  if (targetResource) {
    const domainRes: SupportResource = {
      id: targetResource.id,
      name: targetResource.name,
      category: targetResource.category as any,
      district: targetResource.district,
      address: targetResource.address,
      isVerified: Boolean(targetResource.isVerified),
      verifiedAt: targetResource.verifiedAt || undefined,
      createdAt: targetResource.createdAt || new Date().toISOString(),
    };
    const audit = isResourceOperationalAndVerified(domainRes);
    if (!audit.isValid) {
      warning = `CẢNH BÁO KIỂM ĐỊNH: ${audit.reason}`;
    }
  }

  await db.batch([
    db.insert(referrals).values({
      id: newReferralId,
      caseId,
      resourceId,
      referredBy,
      status: status as any,
      notes: warning ? `${notes} [${warning}]` : notes,
    }),
    db.insert(timelineEvents).values({
      id: newTimelineEventId,
      caseId,
      actorId: referredBy,
      eventType: 'referral_sent',
      title: 'Tạo phiếu kết nối chuyển tuyến nguồn lực',
      description: warning ? `${notes} (Cảnh báo: ${warning})` : notes,
      eventDate: new Date().toISOString(),
    }),
  ]);

  return c.json({
    success: true,
    id: newReferralId,
    status,
    timelineEventId: newTimelineEventId,
    warning,
    message: 'Đã khởi tạo phiếu kết nối chuyển tuyến nguồn lực và lưu vào nhật ký ca!'
  }, 201);
});

// GET /api/resources/:id - Chi tiết địa điểm hỗ trợ kèm trạng thái kiểm định
resourceRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const item = await db.select().from(resources).where(eq(resources.id, id)).get();

  if (!item) {
    return c.json({ success: false, error: 'Không tìm thấy địa điểm nguồn lực' }, 404);
  }

  const domainResource: SupportResource = {
    id: item.id,
    name: item.name,
    category: item.category as any,
    district: item.district,
    ward: item.ward || undefined,
    city: item.city || 'TP. Hồ Chí Minh',
    province: item.province || 'TP. Hồ Chí Minh',
    address: item.address,
    phone: item.phone || undefined,
    hotline: item.hotline || undefined,
    email: item.email || undefined,
    website: item.website || undefined,
    latitude: item.latitude !== null && item.latitude !== undefined ? Number(item.latitude) : undefined,
    longitude: item.longitude !== null && item.longitude !== undefined ? Number(item.longitude) : undefined,
    operatingHours: item.operatingHours || undefined,
    is24Hours: Boolean(item.is24Hours),
    is_24_7: Boolean(item.is24Hours),
    verificationStatus: item.verificationStatus || (item.isVerified ? 'VERIFIED' : 'UNVERIFIED'),
    isVerified: Boolean(item.isVerified),
    verifiedBy: item.verifiedBy || undefined,
    verifiedAt: item.verifiedAt || undefined,
    acceptsReferral: item.acceptsReferral !== null && item.acceptsReferral !== undefined ? Boolean(item.acceptsReferral) : true,
    emergencySupport: Boolean(item.emergencySupport),
    description: item.description || undefined,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || undefined,
  };

  const verificationCheck = isResourceOperationalAndVerified(domainResource);

  return c.json({
    success: true,
    data: {
      ...domainResource,
      verificationAudit: {
        isVerified: domainResource.isVerified,
        verificationStatus: domainResource.verificationStatus,
        verifiedAt: domainResource.verifiedAt || null,
        verifiedBy: domainResource.verifiedBy || null,
        operationalStatus: verificationCheck.isValid ? 'active_verified' : 'stale_or_unverified',
        statusReason: verificationCheck.reason || 'Nguồn lực hoạt động bình thường và đã qua kiểm định.',
      },
    },
  });
});

// POST /api/resources/:id/verify - Thẩm định / Cập nhật trạng thái xác minh nguồn lực thực địa
resourceRoutes.post('/:id/verify', async (c) => {
  const id = c.req.param('id');
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = VerifyResourceSchema.safeParse(rawBody);

  if (!validationResult.success) {
    return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
  }

  const { isVerified, verifiedBy, notes } = validationResult.data;
  const db = createDatabaseClient(c.env.DB);

  const existing = await db.select().from(resources).where(eq(resources.id, id)).get();
  if (!existing) {
    return c.json({ success: false, error: 'Không tìm thấy nguồn lực để thẩm định' }, 404);
  }

  const now = new Date().toISOString();
  await db.update(resources).set({
    isVerified,
    verificationStatus: isVerified ? 'VERIFIED' : 'UNVERIFIED',
    verifiedBy,
    verifiedAt: now,
    updatedAt: now,
  }).where(eq(resources.id, id));

  return c.json({
    success: true,
    id,
    isVerified,
    verifiedBy,
    verifiedAt: now,
    notes: notes || 'Đã cập nhật kết quả kiểm định thực địa thành công',
    message: isVerified ? 'Đã xác thực nguồn lực an sinh thành công!' : 'Đã gắn cờ ngưng xác thực nguồn lực.',
  });
});

