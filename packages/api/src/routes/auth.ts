import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { Env } from '../bindings';
import { hashPassword, verifyPassword, generateOtp, hashOtp, normalizeEmail, EMAIL_RE, OTP_MAX_ATTEMPTS, OTP_TTL_MINUTES, safeEqual } from '../lib/security';
import { sendOtpEmail } from '../lib/mailer';
import { fetchZaloProfile } from '../lib/zalo';

export const authRoutes = new Hono<{ Bindings: Env }>();

function getJwtSecret(env: Env): string {
  if (!env.JWT_SECRET) {
    throw new Error('Server misconfiguration: JWT_SECRET is not set');
  }
  return env.JWT_SECRET;
}

// 1. Google OAuth Token Verification & Login
authRoutes.post('/google', async (c) => {
  try {
    const body = await c.req.json();
    const { id_token, access_token } = body;

    if (!id_token && !access_token) {
      return c.json({ error: 'Missing id_token or access_token' }, 400);
    }

    let googleUser: { sub: string; email: string; name: string; picture?: string };
    
    if (access_token) {
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!resp.ok) return c.json({ error: 'Invalid Google access token' }, 401);
      googleUser = await resp.json() as any;
    } else {
      const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
      if (!resp.ok) return c.json({ error: 'Invalid Google ID token' }, 401);
      googleUser = await resp.json() as any;
    }

    const { sub: googleId, email, name, picture } = googleUser;

    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? OR id = ?'
    ).bind(email, googleId).first();

    let userId = googleId;
    let userRole = 'volunteer';

    if (!existingUser) {
      userId = `usr_${googleId.slice(0, 12)}`;
      await c.env.DB.prepare(
        `INSERT INTO users (id, full_name, email, role, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
      ).bind(userId, name || 'Tình nguyện viên', email, userRole).run();
    } else {
      userId = existingUser.id as string;
      userRole = (existingUser.role as string) || 'volunteer';
    }

    const secret = getJwtSecret(c.env);
    const payload = {
      sub: userId,
      email,
      name,
      role: userRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    };

    const token = await sign(payload, secret);

    if (c.env.CACHE_KV) {
      await c.env.CACHE_KV.put(`session:${userId}`, JSON.stringify(payload), { expirationTtl: 30 * 24 * 60 * 60 });
    }

    return c.json({
      success: true,
      message: 'Đăng nhập Google thành công',
      user: { id: userId, email, full_name: name, avatar: picture, role: userRole },
      token,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Google Auth Login Failed' }, 500);
  }
});

// 1b. Dev Login (Fast development authentication bypass)
authRoutes.post('/dev-login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    // Demo sign-in is open in development; on production it needs the shared demo code.
    if (c.env.ENVIRONMENT === 'production') {
      const code = typeof body.demoCode === 'string' ? body.demoCode : '';
      if (!c.env.DEMO_ACCESS_CODE || !safeEqual(code, c.env.DEMO_ACCESS_CODE)) {
        return c.json({ success: false, error: 'Demo sign-in is disabled', code: 'DEMO_DISABLED' }, 403);
      }
    }
    const DEMO_ROLES = ['volunteer', 'partner', 'admin', 'coordinator', 'host_admin', 'observer'];
    const role = DEMO_ROLES.includes(body.role) ? body.role : 'volunteer';
    const email = body.email || `${role}@buoctiep.vn`;
    const name = body.name || (role === 'admin' ? 'Quản trị viên Demo' : role === 'partner' ? 'Đại diện Đơn vị Đối tác' : 'Tình nguyện viên Demo');
    const userId = body.userId || `dev_${role}_${Date.now()}`;

    const secret = getJwtSecret(c.env);
    const payload = {
      sub: userId,
      email,
      name,
      role,
      organizationId: body.organizationId || 'org-default',
      teamId: body.teamId || 'team-hoc-mon',
      demo: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    };

    const token = await sign(payload, secret);

    if (c.env.CACHE_KV) {
      await c.env.CACHE_KV.put(`session:${userId}`, JSON.stringify(payload), { expirationTtl: 30 * 24 * 60 * 60 });
    }

    return c.json({
      success: true,
      message: 'Đăng nhập môi trường phát triển (Dev Login) thành công',
      user: { id: userId, email, full_name: name, role },
      token,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Dev Login Failed' }, 500);
  }
});

// 2. Local Login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ success: false, error: 'Email và mật khẩu là bắt buộc' }, 400);
    }

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) {
      return c.json({ success: false, error: 'Email hoặc mật khẩu không đúng' }, 401);
    }

    const check = await verifyPassword(password, user.password_hash as string | null);
    if (!check.ok) {
      return c.json({ success: false, error: 'Email hoặc mật khẩu không đúng' }, 401);
    }
    if (check.needsRehash) {
      await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(password), user.id).run().catch(() => {});
    }

    const secret = getJwtSecret(c.env);
    const payload = {
      sub: user.id as string,
      email: user.email as string,
      name: user.full_name as string,
      role: user.role as string,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    };

    const token = await sign(payload, secret);

    if (c.env.CACHE_KV) {
      await c.env.CACHE_KV.put(`session:${user.id}`, JSON.stringify(payload), { expirationTtl: 30 * 24 * 60 * 60 });
    }

    return c.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      token,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Lỗi đăng nhập' }, 500);
  }
});

// 3. Register
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { full_name, phone, email, password } = body;

    if (!full_name || !email || !password) {
      return c.json({ success: false, error: 'Họ tên, email và mật khẩu là bắt buộc' }, 400);
    }

    const existingUser = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (existingUser) {
      return c.json({ success: false, error: 'Email đã được sử dụng' }, 400);
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    // Roles are granted only through the approval flow (/api/v1/onboarding), never self-selected.
    const userRole = 'volunteer';
    if (typeof password !== 'string' || password.length < 8) {
      return c.json({ success: false, error: 'Mật khẩu tối thiểu 8 ký tự' }, 400);
    }
    const pwdHash = await hashPassword(password);

    if (c.env.DB) {
      await c.env.DB.prepare(`
        INSERT INTO users (id, full_name, phone, email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(userId, full_name, phone || null, email, pwdHash, userRole).run();
    }

    const secret = getJwtSecret(c.env);
    const payload = {
      sub: userId,
      email,
      name: full_name,
      role: userRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    };

    const token = await sign(payload, secret);

    if (c.env.CACHE_KV) {
      await c.env.CACHE_KV.put(`session:${userId}`, JSON.stringify(payload), { expirationTtl: 30 * 24 * 60 * 60 });
    }

    return c.json({
      success: true,
      message: 'Đăng ký thành công',
      user: { id: userId, full_name, phone, email, role: userRole },
      token
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Lỗi đăng ký' }, 500);
  }
});

// 4. GET /api/auth/me
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const secret = c.env.JWT_SECRET;
    if (secret) {
      try {
        const payload = (await verify(token, secret, 'HS256')) as any;
        if (payload && payload.sub) {
          const dbUser = await c.env.DB?.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first();
          if (dbUser) {
            return c.json({
              success: true,
              user: {
                id: dbUser.id,
                full_name: dbUser.full_name,
                email: dbUser.email,
                phone: dbUser.phone,
                role: dbUser.role,
                avatar: dbUser.avatar_url,
                settings: {
                  childSafeguarding: true,
                  voiceEncryption: true,
                  offlineSync: true,
                },
              },
            });
          }
          return c.json({
            success: true,
            user: {
              id: payload.sub,
              full_name: payload.name || 'Người dùng BƯỚC TIẾP',
              email: payload.email,
              role: payload.role || 'volunteer',
              settings: {
                childSafeguarding: true,
                voiceEncryption: true,
                offlineSync: true,
              },
            },
          });
        }
      } catch (e) {
        return c.json({ error: 'Token không hợp lệ hoặc đã hết hạn.' }, 401);
      }
    }
  }

  return c.json({ error: 'Truy cập bị từ chối. Thiếu Token xác thực Authorization Bearer.' }, 401);
});

// 5. Email one-time-code sign-in (no passwords stored)
authRoutes.post('/otp/request', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  if (!EMAIL_RE.test(email)) return c.json({ error: 'Invalid email', code: 'INVALID_EMAIL' }, 400);
  const db = c.env.DB;
  const recent = await db
    .prepare("SELECT COUNT(*) AS n FROM email_otps WHERE email = ? AND created_at > datetime('now', '-15 minutes')")
    .bind(email)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= 5) return c.json({ error: 'Too many codes requested, try again later', code: 'RATE_LIMITED' }, 429);

  const code = generateOtp();
  const pepper = c.env.OTP_PEPPER || getJwtSecret(c.env);
  await db
    .prepare('INSERT INTO email_otps (id, email, code_hash, expires_at) VALUES (?, ?, ?, ?)')
    .bind(`otp-${crypto.randomUUID()}`, email, await hashOtp(email, code, pepper), new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString())
    .run();
  const mail = await sendOtpEmail(c.env, email, code, body.lang === 'en' ? 'en' : 'vi');
  if (!mail.delivered && !mail.echoCode) return c.json({ error: 'Email delivery is not configured', code: mail.error }, 503);
  return c.json({ sent: mail.delivered, expiresInMinutes: OTP_TTL_MINUTES, ...(mail.echoCode ? { devCode: mail.echoCode } : {}) });
});

authRoutes.post('/otp/verify', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) return c.json({ error: 'Invalid code', code: 'INVALID_CODE' }, 400);
  const db = c.env.DB;
  const otp = await db
    .prepare('SELECT * FROM email_otps WHERE email = ? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1')
    .bind(email)
    .first<any>();
  if (!otp || new Date(otp.expires_at).getTime() < Date.now()) return c.json({ error: 'Code expired', code: 'CODE_EXPIRED' }, 400);
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return c.json({ error: 'Too many attempts', code: 'TOO_MANY_ATTEMPTS' }, 429);
  const pepper = c.env.OTP_PEPPER || getJwtSecret(c.env);
  if (!safeEqual(await hashOtp(email, code, pepper), otp.code_hash)) {
    await db.prepare('UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?').bind(otp.id).run();
    return c.json({ error: 'Wrong code', code: 'WRONG_CODE', attemptsLeft: OTP_MAX_ATTEMPTS - otp.attempts - 1 }, 400);
  }
  const now = new Date().toISOString();
  await db.prepare('UPDATE email_otps SET consumed_at = ? WHERE id = ?').bind(now, otp.id).run();

  let account = await db.prepare('SELECT * FROM nx_accounts WHERE email = ?').bind(email).first<any>();
  if (!account) {
    const id = `acc-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    await db.prepare("INSERT INTO nx_accounts (id, email, role, status) VALUES (?, ?, 'applicant', 'ACTIVE')").bind(id, email).run();
    account = await db.prepare('SELECT * FROM nx_accounts WHERE id = ?').bind(id).first<any>();
  }
  if (account.status === 'SUSPENDED') return c.json({ error: 'Account suspended', code: 'SUSPENDED' }, 403);
  await db.prepare('UPDATE nx_accounts SET last_login_at = ? WHERE id = ?').bind(now, account.id).run();

  // Zalo Mini App: gắn tài khoản Zalo vào tài khoản email vừa xác minh bằng mã.
  let zaloLinked = false;
  if (typeof body.zalo_link_token === 'string' && body.zalo_link_token) {
    const link = await readZaloLinkToken(c.env, body.zalo_link_token);
    if (!link) return c.json({ error: 'Zalo link expired, sign in with Zalo again', code: 'ZALO_LINK_EXPIRED' }, 400);
    const owner = await db.prepare('SELECT id FROM nx_accounts WHERE zalo_id = ?').bind(link.zaloId).first<{ id: string }>();
    if (owner && owner.id !== account.id) return c.json({ error: 'This Zalo account is linked to another email', code: 'ZALO_ALREADY_LINKED' }, 409);
    await db
      .prepare('UPDATE nx_accounts SET zalo_id = ?, full_name = COALESCE(full_name, ?), updated_at = ? WHERE id = ?')
      .bind(link.zaloId, link.name, now, account.id)
      .run();
    account = { ...account, zalo_id: link.zaloId, full_name: account.full_name || link.name };
    zaloLinked = true;
  }

  return c.json({ ...(await accountSession(c.env, account)), ...(zaloLinked ? { zaloLinked } : {}) });
});

/** JWT 7 ngày cho tài khoản nx_accounts — dùng chung cho mã email và Zalo. */
async function accountSession(env: Env, account: any) {
  const payload = {
    sub: account.id,
    email: account.email,
    name: account.full_name || account.email,
    role: account.role,
    organizationId: account.org_id || undefined,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };
  const token = await sign(payload, getJwtSecret(env));
  return { token, account: { id: account.id, email: account.email, fullName: account.full_name, role: account.role, orgId: account.org_id } };
}

const ZALO_LINK_TTL_SECONDS = 15 * 60;

async function readZaloLinkToken(env: Env, token: string): Promise<{ zaloId: string; name: string } | null> {
  try {
    const p = (await verify(token, getJwtSecret(env), 'HS256')) as any;
    if (p?.typ !== 'zalo_link' || typeof p.zalo_id !== 'string') return null;
    return { zaloId: p.zalo_id, name: typeof p.name === 'string' ? p.name : '' };
  } catch {
    return null;
  }
}

// 6. Zalo Mini App sign-in: access token từ zmp-sdk `getAccessToken()`.
// Đã gắn → cấp phiên ngay. Chưa gắn → trả link_token (15 phút) để gắn qua mã email (/otp/verify).
authRoutes.post('/zalo', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const accessToken = typeof body.access_token === 'string' ? body.access_token.trim() : '';
  if (!accessToken) return c.json({ error: 'Missing Zalo access token', code: 'INVALID_ZALO_TOKEN' }, 400);
  if (!c.env.ZALO_APP_SECRET) return c.json({ error: 'Zalo sign-in is not configured', code: 'ZALO_NOT_CONFIGURED' }, 503);

  const profile = await fetchZaloProfile(accessToken, c.env.ZALO_APP_SECRET);
  if (!profile) return c.json({ error: 'Invalid Zalo access token', code: 'INVALID_ZALO_TOKEN' }, 401);

  const db = c.env.DB;
  const account = await db.prepare('SELECT * FROM nx_accounts WHERE zalo_id = ?').bind(profile.id).first<any>();
  if (!account) {
    const now = Math.floor(Date.now() / 1000);
    const linkToken = await sign(
      { typ: 'zalo_link', zalo_id: profile.id, name: profile.name, iat: now, exp: now + ZALO_LINK_TTL_SECONDS },
      getJwtSecret(c.env),
    );
    return c.json({ linked: false, link_token: linkToken, zalo: { name: profile.name, avatar: profile.avatar } });
  }
  if (account.status === 'SUSPENDED') return c.json({ error: 'Account suspended', code: 'SUSPENDED' }, 403);
  await db.prepare('UPDATE nx_accounts SET last_login_at = ? WHERE id = ?').bind(new Date().toISOString(), account.id).run();
  return c.json({ linked: true, ...(await accountSession(c.env, account)) });
});

// 7. Dùng thử trong Zalo Mini App: 1 chạm là trải nghiệm đủ tính năng người đồng hành,
// trong sandbox riêng (organizationId = trial-<accountId>). Chuyển gửi, danh sách và số liệu
// thật đều loại sandbox này (xem TRIAL_CASES_SQL ở loop.ts). Không đổi role trong nx_accounts.
const TRIAL_SAMPLES = [
  {
    alias: 'Cô Tư (mẫu)',
    preferred: 'Cô Tư (mẫu)',
    observation: 'Bán vé số ở chợ Hóc Môn, dạo này đau lưng, muốn tìm việc nhẹ ban ngày.',
    keywords: ['bán hàng rong', 'đau ốm', 'người cao tuổi'],
    stage: 'UNDERSTAND',
  },
  {
    alias: 'Anh Bình (mẫu)',
    preferred: null,
    observation: 'Mới lên thành phố, mất giấy tờ, mấy hôm nay ngủ ở bến xe.',
    keywords: ['mất giấy tờ', 'không có chỗ ở'],
    stage: 'CONSENT',
  },
] as const;

authRoutes.post('/trial', async (c) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Sign in first', code: 'UNAUTHENTICATED' }, 401);
  let payload: any;
  try {
    payload = await verify(auth.slice(7), getJwtSecret(c.env), 'HS256');
  } catch {
    return c.json({ error: 'Session expired', code: 'UNAUTHENTICATED' }, 401);
  }
  const db = c.env.DB;
  // Chỉ tài khoản thật (đăng nhập bằng mã email/Zalo) — token demo không đổi được sang dùng thử.
  const account = await db.prepare('SELECT * FROM nx_accounts WHERE id = ?').bind(payload.sub).first<any>();
  if (!account) return c.json({ error: 'Account not found', code: 'UNAUTHENTICATED' }, 401);
  if (account.status === 'SUSPENDED') return c.json({ error: 'Account suspended', code: 'SUSPENDED' }, 403);

  const orgId = `trial-${account.id}`;
  const name = account.full_name || account.email;
  const seeded = await db.prepare('SELECT 1 FROM loop_case_scope WHERE host_org_id = ? LIMIT 1').bind(orgId).first();
  if (!seeded) {
    const at = new Date().toISOString();
    const consent = JSON.stringify({ verbalConsent: true, allowPhoto: false, allowPhone: false, allowSharingWithPartner: true, preferredAddress: 'Cô Tư (mẫu)', minimumDataOnly: true, recordedBy: name, recordedAt: at });
    await db.batch(
      TRIAL_SAMPLES.flatMap((s) => {
        const id = `case-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
        const hasConsent = s.stage !== 'CONSENT';
        return [
          db
            .prepare(
              `INSERT INTO loop_cases (id, alias, observation, keywords_json, stage, status, navigator_id, navigator_name, preferred_address, consent_json, consent_given_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(id, s.alias, s.observation, JSON.stringify(s.keywords), s.stage, account.id, name, s.preferred, hasConsent ? consent : null, hasConsent ? at : null, at, at),
          db.prepare('INSERT INTO loop_case_scope (case_id, host_org_id, navigator_account_id) VALUES (?, ?, ?)').bind(id, orgId, account.id),
        ];
      }),
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: account.id, email: account.email, name, role: 'volunteer', organizationId: orgId, trial: true, iat: now, exp: now + 7 * 24 * 60 * 60 },
    getJwtSecret(c.env),
  );
  return c.json({ token, account: { id: account.id, email: account.email, fullName: account.full_name, role: 'volunteer', orgId }, trial: true });
});
