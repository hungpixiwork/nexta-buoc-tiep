import { Hono } from 'hono';
import { Env } from '../bindings';
import { createDatabaseClient, opportunities } from '@buoc-tiep/database';
import { CreateOpportunitySchema } from '@buoc-tiep/shared';

export const opportunityRoutes = new Hono<{ Bindings: Env }>();

// GET /api/opportunities - Danh sách cơ hội sinh kế
opportunityRoutes.get('/', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const result = await db.select().from(opportunities).all();
  return c.json({ success: true, data: result });
});

// POST /api/opportunities - Tạo cơ hội mới
opportunityRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const validation = CreateOpportunitySchema.safeParse(body);

  if (!validation.success) {
    return c.json({ success: false, errors: validation.error.flatten() }, 400);
  }

  const db = createDatabaseClient(c.env.DB);
  const newId = `opp-${crypto.randomUUID()}`;

  await db.insert(opportunities).values({
    id: newId,
    title: validation.data.title,
    organizationName: validation.data.organizationName,
    description: validation.data.description,
    category: validation.data.category,
    requiredSkills: JSON.stringify(validation.data.requiredSkills),
    contactInfo: validation.data.contactInfo,
  });

  return c.json({ success: true, id: newId, message: 'Đã tạo cơ hội sinh kế thành công' }, 201);
});
