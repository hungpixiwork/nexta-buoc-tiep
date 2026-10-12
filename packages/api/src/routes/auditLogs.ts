import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { Env } from '../bindings';
import { AuthContext } from '../middleware/auth';
import { createDatabaseClient, auditLogs } from '@buoc-tiep/database';

export const auditLogRoutes = new Hono<{ Bindings: Env; Variables: { user?: AuthContext } }>();

// GET /api/audit-logs - Lịch sử nhật ký kiểm toán hệ thống (Admin & Scoped Only)
auditLogRoutes.get('/', async (c) => {
  try {
    const db = createDatabaseClient(c.env.DB);
    const user = c.get('user');
    const userId = c.req.query('userId');
    let organizationId = c.req.query('organizationId');

    // Tenant Scoping Enforcement
    if (user && user.role !== 'admin') {
      organizationId = user.organizationId;
    }

    let query = db.select().from(auditLogs);
    if (userId && (user?.role === 'admin' || user?.userId === userId)) {
      query = query.where(eq(auditLogs.userId, userId)) as any;
    } else if (organizationId) {
      query = query.where(eq(auditLogs.organizationId, organizationId)) as any;
    }

    const list = await query.orderBy(desc(auditLogs.createdAt)).limit(100).all();

    return c.json({
      success: true,
      data: list || []
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Lỗi truy vấn nhật ký audit logs' }, 500);
  }
});

// POST /api/audit-logs - Ghi nhận nhật ký tác động append-only
auditLogRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { action, resourceType, resourceId, userId, organizationId, ipAddress } = body;

    if (!action || !resourceType) {
      return c.json({ success: false, error: 'action và resourceType là bắt buộc' }, 400);
    }

    const db = createDatabaseClient(c.env.DB);
    const logId = `log-${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    await db.insert(auditLogs).values({
      id: logId,
      organizationId: organizationId || null,
      userId: userId || null,
      action,
      resourceType,
      resourceId: resourceId || null,
      ipAddress: ipAddress || c.req.header('cf-connecting-ip') || '127.0.0.1',
    });

    return c.json({
      success: true,
      id: logId,
      message: 'Đã ghi nhận audit log vào Cloudflare D1 thành công!'
    }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Không thể tạo audit log' }, 500);
  }
});
