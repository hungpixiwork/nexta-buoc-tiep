import { Hono } from 'hono';
import { Env } from '../bindings';
import { CreateSurveyResponseSchema } from '@buoc-tiep/shared';

export const surveyRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /api/survey
 * Direct insertion into Cloudflare D1 Database (buoc-tiep-db)
 */
surveyRoutes.post('/', async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    
    // Map camelCase or snake_case payload
    const normalizedBody = {
      contactName: rawBody.contactName || rawBody.contact_name,
      contactPhone: rawBody.contactPhone || rawBody.contact_phone,
      contactEmail: rawBody.contactEmail || rawBody.contact_email,
      contactOrg: rawBody.contactOrg || rawBody.contact_org,
      a1Experience: rawBody.a1Experience || rawBody.a1_experience,
      a2Frequency: rawBody.a2Frequency || rawBody.a2_frequency,
      a3OrgType: rawBody.a3OrgType || rawBody.a3_org_type,
      a4Role: rawBody.a4Role || rawBody.a4_role,
      a4ToolUsage: rawBody.a4ToolUsage || rawBody.a4_tool_usage,
      a5StopReasons: Array.isArray(rawBody.a5_stop_reasons) ? rawBody.a5_stop_reasons.join(', ') : rawBody.a5StopReasons || rawBody.a5_stop_reasons,
      b1AdoptionRate: rawBody.b1AdoptionRate || rawBody.b1_adoption_rate,
      b2ChurnFactors: Array.isArray(rawBody.b2_churn_factors) ? rawBody.b2_churn_factors.join(', ') : rawBody.b2ChurnFactors || rawBody.b2_churn_factors,
      b3Tradeoff: rawBody.b3Tradeoff || rawBody.b3_tradeoff,
      b4ExtraTime: rawBody.b4ExtraTime || rawBody.b4_extra_time,
      b5RetentionDriver: rawBody.b5RetentionDriver || rawBody.b5_retention_driver,
      b6DataPurpose: rawBody.b6DataPurpose || rawBody.b6_data_purpose,
      c1Fears: Array.isArray(rawBody.c1_fears) ? rawBody.c1_fears.join(', ') : rawBody.c1Fears || rawBody.c1_fears,
      c2MotivationImpact: rawBody.c2MotivationImpact || rawBody.c2_motivation_impact,
      c3AuthenticitySkepticism: rawBody.c3AuthenticitySkepticism || rawBody.c3_authenticity_skepticism,
      c4DoubtAction: rawBody.c4DoubtAction || rawBody.c4_doubt_action,
      c5VerifyMethod: rawBody.c5VerifyMethod || rawBody.c5_verify_method,
      c6ReferralWillingness: rawBody.c6ReferralWillingness || rawBody.c6_referral_willingness,
      d1ChildSafeguardingPriority: rawBody.d1ChildSafeguardingPriority || rawBody.d1_child_safeguarding_priority,
      d2LivelihoodPassportBarrier: rawBody.d2LivelihoodPassportBarrier || rawBody.d2_livelihood_passport_barrier,
      d3UiFriction: rawBody.d3UiFriction || rawBody.d3_ui_friction,
      d4IntakePreference: rawBody.d4IntakePreference || rawBody.d4_intake_preference,
      betaOptin: rawBody.betaOptin || rawBody.beta_optin,
      userFeedback: rawBody.userFeedback || rawBody.user_feedback,
      isPriorityLead: rawBody.isPriorityLead || rawBody.is_priority_lead,
    };

    const validationResult = CreateSurveyResponseSchema.safeParse(normalizedBody);
    if (!validationResult.success) {
      return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
    }
    const body = rawBody; // Retain full body for column maps

    const id = body.id || `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const contactName = body.contact_name || 'Anonymous';
    const contactPhone = body.contact_phone || 'N/A';
    const contactEmail = body.contact_email || null;
    const contactOrg = body.contact_org || null;

    const a1Experience = body.a1_experience || null;
    const a2Frequency = body.a2_frequency || null;
    const a3OrgType = body.a3_org_type || null;
    const a4Role = body.a4_role || null;
    const a4ToolUsage = body.a4_tool_usage || null;
    const a5StopReasons = Array.isArray(body.a5_stop_reasons) ? body.a5_stop_reasons.join(', ') : (body.a5_stop_reasons || null);

    const b1AdoptionRate = body.b1_adoption_rate || null;
    const b2ChurnFactors = Array.isArray(body.b2_churn_factors) ? body.b2_churn_factors.join(', ') : (body.b2_churn_factors || null);
    const b3Tradeoff = body.b3_tradeoff || null;
    const b4ExtraTime = body.b4_extra_time || null;
    const b5RetentionDriver = body.b5_retention_driver || null;
    const b6DataPurpose = body.b6_data_purpose || null;

    const c1Fears = Array.isArray(body.c1_fears) ? body.c1_fears.join(', ') : (body.c1_fears || null);
    const c2MotivationImpact = body.c2_motivation_impact || null;
    const c3AuthenticitySkepticism = (body.c3_authenticity_skepticism !== undefined && body.c3_authenticity_skepticism !== null && body.c3_authenticity_skepticism !== '')
      ? parseInt(String(body.c3_authenticity_skepticism), 10)
      : null;
    const c4DoubtAction = body.c4_doubt_action || null;
    const c5VerifyMethod = body.c5_verify_method || null;
    const c6ReferralWillingness = body.c6_referral_willingness || null;

    const d1ChildSafeguardingPriority = body.d1_child_safeguarding_priority || null;
    const d2LivelihoodPassportBarrier = body.d2_livelihood_passport_barrier || null;
    const d3UiFriction = body.d3_ui_friction || null;
    const d4IntakePreference = body.d4_intake_preference || null;

    const betaOptin = body.beta_optin || null;
    const userFeedback = body.user_feedback || null;
    
    // Flexible check for Priority Lead (75% or 50-75% + Beta registration)
    const isPriorityLead = (
      b1AdoptionRate && (b1AdoptionRate.includes('75%') || b1AdoptionRate.includes('50-75%')) &&
      betaOptin && betaOptin.includes('Có')
    ) ? 1 : 0;

    // D1 Database Native Insert
    if (c.env.DB) {
      await c.env.DB.prepare(`
        INSERT INTO survey_responses (
          id, contact_name, contact_phone, contact_email, contact_org,
          a1_experience, a2_frequency, a3_org_type, a4_role, a4_tool_usage, a5_stop_reasons,
          b1_adoption_rate, b2_churn_factors, b3_tradeoff, b4_extra_time, b5_retention_driver, b6_data_purpose,
          c1_fears, c2_motivation_impact, c3_authenticity_skepticism, c4_doubt_action, c5_verify_method, c6_referral_willingness,
          d1_child_safeguarding_priority, d2_livelihood_passport_barrier, d3_ui_friction, d4_intake_preference,
          beta_optin, user_feedback, is_priority_lead
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?
        )
      `).bind(
        id, contactName, contactPhone, contactEmail, contactOrg,
        a1Experience, a2Frequency, a3OrgType, a4Role, a4ToolUsage, a5StopReasons,
        b1AdoptionRate, b2ChurnFactors, b3Tradeoff, b4ExtraTime, b5RetentionDriver, b6DataPurpose,
        c1Fears, c2MotivationImpact, c3AuthenticitySkepticism, c4DoubtAction, c5VerifyMethod, c6ReferralWillingness,
        d1ChildSafeguardingPriority, d2LivelihoodPassportBarrier, d3UiFriction, d4IntakePreference,
        betaOptin, userFeedback, isPriorityLead
      ).run();
    }

    // Instant Telegram Bot Notification (Configured via Wrangler Secret)
    const telegramToken = c.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = c.env.TELEGRAM_CHAT_ID;

    if (telegramToken && telegramChatId) {
      const msg = `📣 *BƯỚC TIẾP — PHẢN HỒI KHẢO SÁT MỚI!*\n\n` +
        `👤 *Họ tên:* ${contactName}\n` +
        `📞 *SĐT / Zalo:* ${contactPhone}\n` +
        `🏢 *Tổ chức / CLB:* ${contactOrg || 'Cá nhân'}\n` +
        `📈 *Khả năng dùng:* ${b1AdoptionRate || 'N/A'}\n` +
        `🎙️ *Ưu tiên nhập liệu:* ${d4IntakePreference || 'N/A'}\n` +
        `⭐ *Đăng ký Beta:* ${betaOptin || 'Không'}\n` +
        `💬 *Ý kiến đóng góp:* ${userFeedback || 'Không có'}\n\n` +
        `📊 *Xem Admin Dashboard:* https://survey-buoctiep-unesco2026.pages.dev/results.html`;

      fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: msg,
          parse_mode: 'Markdown'
        })
      }).catch(e => console.warn('Telegram notification error:', e));
    }

    return c.json({
      success: true,
      id,
      message: 'Phản hồi khảo sát đã được lưu vào D1 Database và gửi thông báo qua Telegram',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Survey D1 Insert Error:', error);
    return c.json({
      success: false,
      error: error.message || 'Error writing to D1 Database'
    }, 500);
  }
});

/**
 * GET /api/survey
 * Retrieve survey summary & metrics from D1 Database (Protected for Admin)
 */
surveyRoutes.get('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const adminHeader = c.req.header('X-Admin-Secret') || c.req.query('admin_key');
    
    // Auth Check: Requires Bearer JWT or Admin Pass Key 'nuoitoi'
    if (!adminHeader && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return c.json({ success: false, error: 'Truy cập bị từ chối. Yêu cầu xác thực Admin để xem phản hồi khảo sát.' }, 401);
    }

    if (!c.env.DB) {
      return c.json({ success: false, error: 'DB binding not available' }, 500);
    }

    const { results } = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_responses,
        SUM(is_priority_lead) as priority_beta_leads
      FROM survey_responses
    `).all();

    const recentList = await c.env.DB.prepare(`
      SELECT *
      FROM survey_responses
      ORDER BY created_at DESC
      LIMIT 500
    `).all();

    return c.json({
      success: true,
      stats: results[0] || { total_responses: 0, priority_beta_leads: 0 },
      responses: recentList.results || []
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * DELETE /api/survey/:id
 * Delete response from D1 Database (Protected)
 */
surveyRoutes.delete('/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const adminHeader = c.req.header('X-Admin-Secret') || c.req.query('admin_key');
    if (!adminHeader && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return c.json({ success: false, error: 'Truy cập bị từ chối. Yêu cầu xác thực Admin.' }, 401);
    }
    const id = c.req.param('id');
    if (c.env.DB) {
      await c.env.DB.prepare('DELETE FROM survey_responses WHERE id = ?').bind(id).run();
    }
    return c.json({ success: true, message: `Deleted survey response ${id}` });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * PUT /api/survey/:id
 * Update survey entry details in D1 Database (Protected)
 */
surveyRoutes.put('/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const adminHeader = c.req.header('X-Admin-Secret') || c.req.query('admin_key');
    if (!adminHeader && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return c.json({ success: false, error: 'Truy cập bị từ chối. Yêu cầu xác thực Admin.' }, 401);
    }
    const id = c.req.param('id');
    const body = await c.req.json();

    if (c.env.DB) {
      await c.env.DB.prepare(`
        UPDATE survey_responses
        SET contact_name = COALESCE(?, contact_name),
            contact_phone = COALESCE(?, contact_phone),
            contact_email = COALESCE(?, contact_email),
            contact_org = COALESCE(?, contact_org),
            a1_experience = COALESCE(?, a1_experience),
            a2_frequency = COALESCE(?, a2_frequency),
            a3_org_type = COALESCE(?, a3_org_type),
            a4_role = COALESCE(?, a4_role),
            a4_tool_usage = COALESCE(?, a4_tool_usage),
            a5_stop_reasons = COALESCE(?, a5_stop_reasons),
            b1_adoption_rate = COALESCE(?, b1_adoption_rate),
            b2_churn_factors = COALESCE(?, b2_churn_factors),
            b3_tradeoff = COALESCE(?, b3_tradeoff),
            b4_extra_time = COALESCE(?, b4_extra_time),
            b5_retention_driver = COALESCE(?, b5_retention_driver),
            b6_data_purpose = COALESCE(?, b6_data_purpose),
            c1_fears = COALESCE(?, c1_fears),
            c2_motivation_impact = COALESCE(?, c2_motivation_impact),
            c3_authenticity_skepticism = COALESCE(?, c3_authenticity_skepticism),
            c4_doubt_action = COALESCE(?, c4_doubt_action),
            c5_verify_method = COALESCE(?, c5_verify_method),
            c6_referral_willingness = COALESCE(?, c6_referral_willingness),
            d1_child_safeguarding_priority = COALESCE(?, d1_child_safeguarding_priority),
            d2_livelihood_passport_barrier = COALESCE(?, d2_livelihood_passport_barrier),
            d3_ui_friction = COALESCE(?, d3_ui_friction),
            d4_intake_preference = COALESCE(?, d4_intake_preference),
            beta_optin = COALESCE(?, beta_optin),
            user_feedback = COALESCE(?, user_feedback),
            is_priority_lead = COALESCE(?, is_priority_lead)
        WHERE id = ?
      `).bind(
        body.contact_name || null,
        body.contact_phone || null,
        body.contact_email || null,
        body.contact_org || null,
        body.a1_experience || null,
        body.a2_frequency || null,
        body.a3_org_type || null,
        body.a4_role || null,
        body.a4_tool_usage || null,
        body.a5_stop_reasons || null,
        body.b1_adoption_rate || null,
        body.b2_churn_factors || null,
        body.b3_tradeoff || null,
        body.b4_extra_time || null,
        body.b5_retention_driver || null,
        body.b6_data_purpose || null,
        body.c1_fears || null,
        body.c2_motivation_impact || null,
        body.c3_authenticity_skepticism !== undefined ? body.c3_authenticity_skepticism : null,
        body.c4_doubt_action || null,
        body.c5_verify_method || null,
        body.c6_referral_willingness || null,
        body.d1_child_safeguarding_priority || null,
        body.d2_livelihood_passport_barrier || null,
        body.d3_ui_friction || null,
        body.d4_intake_preference || null,
        body.beta_optin || null,
        body.user_feedback || null,
        body.is_priority_lead !== undefined ? body.is_priority_lead : null,
        id
      ).run();
    }

    return c.json({ success: true, message: `Updated survey response ${id}` });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});


