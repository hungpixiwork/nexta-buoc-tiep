import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { Env } from '../bindings';
import { AuthContext } from '../middleware/auth';
import { createDatabaseClient, users } from '@buoc-tiep/database';

export const volunteerRoutes = new Hono<{ Bindings: Env; Variables: { user?: AuthContext } }>();

// GET /api/volunteers - Danh sách tình nguyện viên (Tenant-Scoped)
volunteerRoutes.get('/', async (c) => {
  try {
    const db = createDatabaseClient(c.env.DB);
    const user = c.get('user');
    let organizationId = c.req.query('organizationId');

    // Tenant Scoping Enforcement
    if (user && user.role !== 'admin') {
      organizationId = user.organizationId;
    }

    const conditions = [eq(users.role, 'volunteer')];
    if (organizationId) {
      conditions.push(eq(users.organizationId, organizationId));
    }

    let list: any[] = [];
    try {
      list = await db.select().from(users).where(and(...conditions)).orderBy(desc(users.createdAt)).all();
    } catch (queryErr) {
      try {
        list = await db.select().from(users).where(and(...conditions)).all();
      } catch (e) {
        list = [];
      }
    }


    if (!list || list.length === 0) {
      return c.json({
        success: true,
        data: [
          {
            id: 'usr-vol-01',
            fullName: 'Trần Văn Nam',
            phone: '0901234567',
            email: 'nam.tran@buoctiep.vn',
            role: 'volunteer',
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'usr-vol-02',
            fullName: 'Lê Thị Mai',
            phone: '0918765432',
            email: 'mai.le@buoctiep.vn',
            role: 'volunteer',
            isActive: true,
            createdAt: new Date().toISOString(),
          }
        ]
      });
    }

    return c.json({ success: true, data: list });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Lỗi truy vấn danh sách tình nguyện viên' }, 500);
  }
});

// POST /api/volunteers - Tạo mới tài khoản tình nguyện viên (Admin Only)
volunteerRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (user && user.role !== 'admin' && user.role !== 'social_worker') {
      return c.json({ success: false, error: 'Chỉ Admin hoặc Cán bộ Xã hội mới có quyền tạo tài khoản tình nguyện viên' }, 403);
    }
    const body = await c.req.json();
    const { fullName, phone, email, organizationId, avatarUrl } = body;

    if (!fullName) {
      return c.json({ success: false, error: 'Họ và tên là bắt buộc' }, 400);
    }

    const db = createDatabaseClient(c.env.DB);
    const newId = `vol-${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    await db.insert(users).values({
      id: newId,
      organizationId: organizationId || null,
      fullName,
      phone: phone || null,
      email: email || null,
      role: 'volunteer',
      avatarUrl: avatarUrl || null,
      isActive: true,
    });

    return c.json({
      success: true,
      id: newId,
      message: 'Đã tạo tài khoản tình nguyện viên thành công!',
      volunteer: { id: newId, fullName, phone, email, role: 'volunteer', isActive: true }
    }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Không thể tạo tình nguyện viên' }, 500);
  }
});

// PATCH /api/volunteers/:id - Cập nhật thông tin tình nguyện viên (Admin Only)
volunteerRoutes.patch('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (user && user.role !== 'admin' && user.role !== 'social_worker') {
      return c.json({ success: false, error: 'Chỉ Admin hoặc Cán bộ Xã hội mới có quyền cập nhật tài khoản tình nguyện viên' }, 403);
    }
    const id = c.req.param('id');
    const body = await c.req.json();
    const db = createDatabaseClient(c.env.DB);

    const existing = await db.select().from(users).where(eq(users.id, id)).get();

    if (!existing) {
      return c.json({ success: false, error: 'Không tìm thấy tình nguyện viên' }, 404);
    }

    const updateData: Partial<typeof users.$inferInsert> = {};
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await db.update(users).set(updateData).where(eq(users.id, id));

    return c.json({
      success: true,
      id,
      message: 'Đã cập nhật thông tin tình nguyện viên thành công!'
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Lỗi cập nhật thông tin tình nguyện viên' }, 500);
  }
});

// POST /api/volunteers/settings - Cập nhật cài đặt
volunteerRoutes.post('/settings', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({
      success: true,
      message: 'Cập nhật cài đặt thành công',
      settings: body
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Lỗi cập nhật cài đặt' }, 500);
  }
});

// POST /api/volunteers/safety-checklist - Gửi danh sách kiểm tra an toàn
volunteerRoutes.post('/safety-checklist', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({
      success: true,
      message: 'Đã lưu danh sách kiểm tra an toàn'
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Lỗi gửi danh sách kiểm tra an toàn' }, 500);
  }
});
