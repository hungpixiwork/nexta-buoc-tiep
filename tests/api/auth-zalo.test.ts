import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from '../../packages/api/src/routes/auth';
import { appSecretProof, ZALO_GRAPH_ME } from '../../packages/api/src/lib/zalo';
import { hashOtp } from '../../packages/api/src/lib/security';
import { hasSqlite, openMigratedD1 } from '../helpers/sqlite-d1';

const hasDb = await hasSqlite();
const JWT_SECRET = 'test-jwt-secret';
const ZALO_APP_SECRET = 'test-zalo-secret';

/** Graph API giả: chỉ chấp nhận token 'good-token' kèm đúng appsecret_proof. */
function stubZaloGraph(profile = { id: 'zalo-111', name: 'Chị Hoa' }) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    expect(url).toBe(ZALO_GRAPH_ME);
    const h = new Headers(init?.headers);
    const token = h.get('access_token') ?? '';
    const ok = token === 'good-token' && h.get('appsecret_proof') === (await appSecretProof(token, ZALO_APP_SECRET));
    return new Response(JSON.stringify(ok ? profile : { error: -501, message: 'Access token is invalid' }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function setup() {
  const t = (await openMigratedD1())!;
  const app = new Hono().route('/api/v1/auth', authRoutes);
  const env = { DB: t.d1, JWT_SECRET, ZALO_APP_SECRET };
  const post = (path: string, body: unknown) =>
    app.request(`/api/v1/auth${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, env);
  const addOtp = async (email: string, code: string) => {
    await t.d1
      .prepare('INSERT INTO email_otps (id, email, code_hash, expires_at) VALUES (?, ?, ?, ?)')
      .bind(`otp-${crypto.randomUUID()}`, email, await hashOtp(email, code, JWT_SECRET), new Date(Date.now() + 600_000).toISOString())
      .run();
  };
  return { t, post, addOtp };
}

afterEach(() => vi.unstubAllGlobals());

describe.skipIf(!hasDb)('Đăng nhập Zalo Mini App', () => {
  it('token Zalo sai → 401, không cấp phiên', async () => {
    const { post } = await setup();
    stubZaloGraph();
    const res = await post('/zalo', { access_token: 'bad-token' });
    expect(res.status).toBe(401);
    expect(((await res.json()) as any).code).toBe('INVALID_ZALO_TOKEN');
  });

  it('chưa gắn → link_token; nhập đúng mã email thì gắn, lần sau đăng nhập Zalo thẳng', async () => {
    const { t, post, addOtp } = await setup();
    await t.d1.prepare("INSERT INTO nx_accounts (id, email, role, org_id, status) VALUES ('acc-nav', 'nav@x.vn', 'navigator', 'org-1', 'ACTIVE')").run();
    stubZaloGraph();

    const first = (await (await post('/zalo', { access_token: 'good-token' })).json()) as any;
    expect(first.linked).toBe(false);
    expect(first.token).toBeUndefined();
    expect(typeof first.link_token).toBe('string');

    await addOtp('nav@x.vn', '123456');
    const verified = (await (await post('/otp/verify', { email: 'nav@x.vn', code: '123456', zalo_link_token: first.link_token })).json()) as any;
    expect(verified.zaloLinked).toBe(true);
    expect(verified.account).toMatchObject({ id: 'acc-nav', role: 'navigator', orgId: 'org-1' });

    const again = (await (await post('/zalo', { access_token: 'good-token' })).json()) as any;
    expect(again.linked).toBe(true);
    expect(again.account.id).toBe('acc-nav');
    expect(typeof again.token).toBe('string');
  });

  it('một tài khoản Zalo không gắn được vào hai email', async () => {
    const { t, post, addOtp } = await setup();
    await t.d1.prepare("INSERT INTO nx_accounts (id, email, role, status, zalo_id) VALUES ('acc-a', 'a@x.vn', 'navigator', 'ACTIVE', 'zalo-111')").run();
    await t.d1.prepare("INSERT INTO nx_accounts (id, email, role, status) VALUES ('acc-b', 'b@x.vn', 'navigator', 'ACTIVE')").run();
    stubZaloGraph({ id: 'zalo-222', name: 'Người khác' });
    const { link_token } = (await (await post('/zalo', { access_token: 'good-token' })).json()) as any;
    await addOtp('b@x.vn', '111111');
    expect((await post('/otp/verify', { email: 'b@x.vn', code: '111111', zalo_link_token: link_token })).status).toBe(200);
    await addOtp('a@x.vn', '222222');
    const res = await post('/otp/verify', { email: 'a@x.vn', code: '222222', zalo_link_token: link_token });
    expect(res.status).toBe(409);
    expect(((await res.json()) as any).code).toBe('ZALO_ALREADY_LINKED');
  });
});
