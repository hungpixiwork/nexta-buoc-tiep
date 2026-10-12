import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { authRoutes } from '../../packages/api/src/routes/auth';
import { loopRoutes } from '../../packages/api/src/routes/loop';
import { authMiddleware } from '../../packages/api/src/middleware/auth';
import { hasSqlite, openMigratedD1 } from '../helpers/sqlite-d1';

const hasDb = await hasSqlite();
const JWT_SECRET = 'test-jwt-secret';

describe.skipIf(!hasDb)('Dùng thử Mini App — sandbox cách ly với dữ liệu thật', () => {
  it('trial chỉ thấy hành trình mẫu của mình; điều phối viên không thấy hành trình trial', async () => {
    const t = (await openMigratedD1())!;
    const app = new Hono();
    app.route('/api/v1/auth', authRoutes);
    app.use('/api/v1/loop/*', authMiddleware());
    app.route('/api/v1/loop', loopRoutes);
    const env = { DB: t.d1, JWT_SECRET };
    const call = (path: string, token: string, method = 'GET') => app.request(path, { method, headers: { Authorization: `Bearer ${token}` } }, env);

    // Một hành trình thật của tổ chức.
    await t.d1.prepare("INSERT INTO loop_cases (id, alias, stage, status) VALUES ('case-real', 'Chị Mai', 'UNDERSTAND', 'OPEN')").run();
    await t.d1.prepare("INSERT INTO loop_case_scope (case_id, host_org_id) VALUES ('case-real', 'org-1')").run();
    await t.d1.prepare("INSERT INTO nx_accounts (id, email, role, status) VALUES ('acc-new', 'new@x.vn', 'applicant', 'ACTIVE')").run();

    const now = Math.floor(Date.now() / 1000);
    const applicant = await sign({ sub: 'acc-new', email: 'new@x.vn', role: 'applicant', iat: now, exp: now + 600 }, JWT_SECRET);
    const trial = (await (await call('/api/v1/auth/trial', applicant, 'POST')).json()) as any;
    expect(trial.trial).toBe(true);

    const mine = (await (await call('/api/v1/loop/cases?status=OPEN', trial.token)).json()) as any;
    expect(mine.cases.map((c: any) => c.alias).sort()).toEqual(['Anh Bình (mẫu)', 'Cô Tư (mẫu)']);
    expect((await call('/api/v1/loop/cases/case-real', trial.token)).status).toBe(403);

    const coordinator = await sign({ sub: 'acc-coord', role: 'coordinator', iat: now, exp: now + 600 }, JWT_SECRET);
    const all = (await (await call('/api/v1/loop/cases?status=OPEN', coordinator)).json()) as any;
    expect(all.cases.map((c: any) => c.alias)).toEqual(['Chị Mai']);
  });
});
