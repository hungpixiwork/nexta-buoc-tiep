import { MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';
import { Env } from '../bindings';

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  teamId?: string;
  /** Token issued by demo sign-in — not scoped to a real organisation */
  demo?: boolean;
  /** Phiên dùng thử của Mini App — sandbox riêng (organizationId = trial-<accountId>), không thấy dữ liệu thật. */
  trial?: boolean;
}

export const authMiddleware = (): MiddlewareHandler<{ Bindings: Env; Variables: { user: AuthContext } }> => {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Truy cập bị từ chối. Thiếu Token xác thực Authorization Bearer.' }, 401);
    }

    const token = authHeader.substring(7);
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json({ error: 'Server misconfiguration: JWT_SECRET is missing.' }, 500);
    }

    try {
      const payload = await verify(token, secret, 'HS256') as any;
      if (!payload || !payload.sub) {
        return c.json({ error: 'Token không hợp lệ hoặc đã bị vô hiệu hóa.' }, 401);
      }

      // Context injection for Scoped Queries & RBAC
      c.set('user', {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role || 'volunteer',
        organizationId: payload.organizationId || 'org-default',
        teamId: payload.teamId || 'team-hoc-mon',
        demo: Boolean(payload.demo),
        trial: Boolean(payload.trial),
      });

      await next();
    } catch (err: any) {
      return c.json({ error: 'Xác thực thất bại. Token đã hết hạn hoặc chữ ký không hợp lệ.' }, 401);
    }
  };
};

export const requireRole = (allowedRoles: string[]): MiddlewareHandler<{ Bindings: Env; Variables: { user: AuthContext } }> => {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Truy cập bị từ chối. Yêu cầu xác thực Bearer Token.' }, 401);
    }
    if (!allowedRoles.includes(user.role)) {
      return c.json({ success: false, error: `Truy cập bị từ chối. Quyền '${user.role}' không có quyền truy cập vào tài nguyên này.` }, 403);
    }
    await next();
  };
};

