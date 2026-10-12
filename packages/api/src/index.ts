import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env } from './bindings';
import { authMiddleware } from './middleware/auth';
import { idempotencyMiddleware } from './middleware/idempotency';
import { authRoutes } from './routes/auth';
import { passportRoutes } from './routes/passports';
import { opportunityRoutes } from './routes/opportunities';
import { milRoutes } from './routes/mil';
import { journeyRoutes } from './routes/journeys';
import { caseRoutes } from './routes/cases';
import { followupRoutes } from './routes/followups';
import { resourceRoutes } from './routes/resources';
import { impactRoutes } from './routes/impact';
import { surveyRoutes } from './routes/survey';
import { a2aRoutes } from './routes/a2a';
import { hermesRoutes } from './routes/hermes';
import { p0ReferralRoutes } from './routes/p0Referrals';
import { realtimeRoutes } from './routes/realtime';
export { PartnerInboxRoom } from './durable-objects/PartnerInboxRoom';
import { volunteerRoutes } from './routes/volunteers';
import { auditLogRoutes } from './routes/auditLogs';
import { exportDocxRoutes } from './routes/exportDocx';
import { cronRoutes, handleCronSlaScan } from './routes/cron';
import { partnerRoutes } from './routes/partner';
import { safeguardingRoutes } from './routes/safeguarding';
import { analyticsRoutes, publicRoutes } from './routes/analytics';
import { orchestrationRoutes } from './routes/orchestration';
import { loopRoutes } from './routes/loop';
import { onboardingRoutes, adminRoutes } from './routes/onboarding';
import { campaignRoutes } from './routes/campaigns';
import { missionRoutes } from './routes/missions';
import { signalRoutes } from './routes/signals';

const app = new Hono<{ Bindings: Env }>();

// Global Middleware Chain
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'Idempotency-Key'],
}));
app.use('*', idempotencyMiddleware());

import { getApiExplorerHtml } from './ui/apiExplorerHtml';
import { getOpenApiSpec } from './openapi/openapiSpec';

// Health Check & Interactive Live Test Console
app.get('/', (c) => {
  const acceptHeader = c.req.header('Accept') || '';
  const formatQuery = c.req.query('format');

  if (formatQuery === 'json' || (acceptHeader.includes('application/json') && !acceptHeader.includes('text/html'))) {
    return c.json({
      service: 'BƯỚC TIẾP API Engine',
      version: '1.0.0',
      architecture: 'PDR Canonical REST API v1',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }

  return c.html(getApiExplorerHtml());
});

// OpenAPI 3.1 Spec Endpoint
app.get('/openapi.json', (c) => c.json(getOpenApiSpec()));
app.get('/api/openapi.json', (c) => c.json(getOpenApiSpec()));

// Health Endpoints
app.get('/health', (c) => c.json({
  service: 'BƯỚC TIẾP API Engine',
  version: '1.0.0',
  architecture: 'PDR Canonical REST API v1',
  status: 'healthy',
  timestamp: new Date().toISOString(),
}));

app.get('/health/live', (c) => c.json({
  status: 'alive',
  service: 'BƯỚC TIẾP API Engine',
  timestamp: new Date().toISOString()
}));

app.get('/health/ready', async (c) => {
  let dbStatus = 'connected';
  try {
    if (c.env.DB) {
      await c.env.DB.prepare('SELECT 1').first();
    }
  } catch {
    dbStatus = 'degraded';
  }
  return c.json({
    status: dbStatus === 'connected' ? 'ready' : 'degraded',
    database: dbStatus,
    service: 'BƯỚC TIẾP API Engine',
    timestamp: new Date().toISOString()
  });
});

app.get('/docs', (c) => c.html(getApiExplorerHtml()));
app.get('/api/docs', (c) => c.html(getApiExplorerHtml()));
app.get('/playground', (c) => c.html(getApiExplorerHtml()));

// 1. Public Unauthenticated Routes
app.route('/api/auth', authRoutes);
app.route('/api/v1/auth', authRoutes);

app.route('/api/public', publicRoutes);
app.route('/api/v1/public', publicRoutes);

app.route('/api/survey', surveyRoutes);
app.route('/api/v1/survey', surveyRoutes);

app.route('/api/a2a', a2aRoutes);
app.route('/api/hermes', hermesRoutes);
app.route('/api/cron', cronRoutes);
app.route('/api/realtime', realtimeRoutes);

// 2. Protected API Middleware Guards (JWT Bearer & Scoping)
app.use('/api/export/*', authMiddleware());
app.use('/api/export', authMiddleware());
app.use('/api/v1/export/*', authMiddleware());
app.use('/api/v1/export', authMiddleware());

app.use('/api/passports/*', authMiddleware());
app.use('/api/passports', authMiddleware());
app.use('/api/v1/passports/*', authMiddleware());
app.use('/api/v1/passports', authMiddleware());

app.use('/api/cases/*', authMiddleware());
app.use('/api/cases', authMiddleware());
app.use('/api/v1/cases/*', authMiddleware());
app.use('/api/v1/cases', authMiddleware());

app.use('/api/followups/*', authMiddleware());
app.use('/api/followups', authMiddleware());
app.use('/api/v1/followups/*', authMiddleware());
app.use('/api/v1/followups', authMiddleware());

app.use('/api/opportunities/*', authMiddleware());
app.use('/api/opportunities', authMiddleware());
app.use('/api/v1/opportunities/*', authMiddleware());
app.use('/api/v1/opportunities', authMiddleware());

app.use('/api/mil/*', authMiddleware());
app.use('/api/mil', authMiddleware());
app.use('/api/v1/mil/*', authMiddleware());
app.use('/api/v1/mil', authMiddleware());

app.use('/api/journeys/*', authMiddleware());
app.use('/api/journeys', authMiddleware());
app.use('/api/v1/journeys/*', authMiddleware());
app.use('/api/v1/journeys', authMiddleware());

app.use('/api/resources/*', authMiddleware());
app.use('/api/resources', authMiddleware());
app.use('/api/v1/resources/*', authMiddleware());
app.use('/api/v1/resources', authMiddleware());

app.use('/api/impact/*', authMiddleware());
app.use('/api/impact', authMiddleware());
app.use('/api/v1/impact/*', authMiddleware());
app.use('/api/v1/impact', authMiddleware());

app.use('/api/referrals/*', authMiddleware());
app.use('/api/referrals', authMiddleware());
app.use('/api/v1/referrals/*', authMiddleware());
app.use('/api/v1/referrals', authMiddleware());

app.use('/api/referral-channels/*', authMiddleware());
app.use('/api/referral-channels', authMiddleware());
app.use('/api/v1/referral-channels/*', authMiddleware());
app.use('/api/v1/referral-channels', authMiddleware());

app.use('/api/volunteers/*', authMiddleware());
app.use('/api/volunteers', authMiddleware());
app.use('/api/v1/volunteers/*', authMiddleware());
app.use('/api/v1/volunteers', authMiddleware());

app.use('/api/audit-logs/*', authMiddleware());
app.use('/api/audit-logs', authMiddleware());
app.use('/api/v1/audit-logs/*', authMiddleware());
app.use('/api/v1/audit-logs', authMiddleware());

app.use('/api/partner/*', authMiddleware());
app.use('/api/partner', authMiddleware());
app.use('/api/v1/partner/*', authMiddleware());
app.use('/api/v1/partner', authMiddleware());

app.use('/api/safeguarding/*', authMiddleware());
app.use('/api/safeguarding', authMiddleware());
app.use('/api/v1/safeguarding/*', authMiddleware());
app.use('/api/v1/safeguarding', authMiddleware());

app.use('/api/analytics/*', authMiddleware());
app.use('/api/analytics', authMiddleware());
app.use('/api/v1/analytics/*', authMiddleware());
app.use('/api/v1/analytics', authMiddleware());

// 3. Protected Route Mounts (/api & /api/v1)
app.route('/api/export', exportDocxRoutes);
app.route('/api/v1/export', exportDocxRoutes);

app.route('/api/passports', passportRoutes);
app.route('/api/v1/passports', passportRoutes);

app.route('/api/opportunities', opportunityRoutes);
app.route('/api/v1/opportunities', opportunityRoutes);

app.route('/api/mil', milRoutes);
app.route('/api/v1/mil', milRoutes);

app.route('/api/journeys', journeyRoutes);
app.route('/api/v1/journeys', journeyRoutes);

app.route('/api/cases', caseRoutes);
app.route('/api/v1/cases', caseRoutes);

app.route('/api/followups', followupRoutes);
app.route('/api/v1/followups', followupRoutes);

app.route('/api/resources', resourceRoutes);
app.route('/api/v1/resources', resourceRoutes);

app.route('/api/impact', impactRoutes);
app.route('/api/v1/impact', impactRoutes);

app.route('/api/referrals', p0ReferralRoutes);
app.route('/api/v1/referrals', p0ReferralRoutes);

app.route('/api/referral-channels', p0ReferralRoutes);
app.route('/api/v1/referral-channels', p0ReferralRoutes);

app.route('/api/volunteers', volunteerRoutes);
app.route('/api/v1/volunteers', volunteerRoutes);

app.route('/api/audit-logs', auditLogRoutes);
app.route('/api/v1/audit-logs', auditLogRoutes);

app.route('/api/partner', partnerRoutes);
app.route('/api/v1/partner', partnerRoutes);

app.route('/api/safeguarding', safeguardingRoutes);
app.route('/api/v1/safeguarding', safeguardingRoutes);

app.route('/api/analytics', analyticsRoutes);
app.route('/api/v1/analytics', analyticsRoutes);

// NEXTA closed loop (RE:ACT SSOT)
app.use('/api/v1/loop/*', authMiddleware());
app.route('/api/v1/loop', loopRoutes);

// Campaign Hub, Mission Flow & Signal Detection (RE:ACT Top 20)
app.use('/api/v1/campaigns/*', authMiddleware());
app.use('/api/v1/campaigns', authMiddleware());
app.route('/api/v1/campaigns', campaignRoutes);

app.use('/api/v1/missions/*', authMiddleware());
app.use('/api/v1/missions', authMiddleware());
app.route('/api/v1/missions', missionRoutes);

app.use('/api/v1/signals/*', authMiddleware());
app.use('/api/v1/signals', authMiddleware());
app.route('/api/v1/signals', signalRoutes);

// Onboarding: public registration pages + authenticated applicant routes (auth applied per route)
app.route('/api/v1/onboarding', onboardingRoutes);
app.route('/api/v1/admin', adminRoutes);

app.route('/api', orchestrationRoutes);
app.route('/api/v1', orchestrationRoutes);

export default {
  fetch: app.fetch,
  async scheduled(event: any, env: Env, ctx: any) {
    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(handleCronSlaScan(env));
    } else {
      await handleCronSlaScan(env);
    }
  }
};
