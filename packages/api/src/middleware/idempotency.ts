import { MiddlewareHandler } from 'hono';
import { Env } from '../bindings';

export interface IdempotencyContext {
  idempotencyKey?: string;
}

/**
 * Middleware trích xuất và chuẩn hóa Header X-Idempotency-Key cho Deduplication Engine
 */
export const idempotencyMiddleware = (): MiddlewareHandler<{
  Bindings: Env;
  Variables: { idempotencyKey?: string };
}> => {
  return async (c, next) => {
    const key = c.req.header('X-Idempotency-Key') || c.req.header('Idempotency-Key');
    if (key) {
      c.set('idempotencyKey', key.trim());
    }
    await next();
  };
};
