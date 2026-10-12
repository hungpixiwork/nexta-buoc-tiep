#!/usr/bin/env node
/**
 * Seeds realistic BƯỚC TIẾP journeys through the REAL loop API (no direct SQL), so every
 * dashboard has data that obeys the same rules as production: consent first, risk gate,
 * pipeline-only matches, children never matched to employment.
 *
 * Usage (API running locally with ENVIRONMENT=development):
 *   node packages/api/scripts/seed-demo-journeys.mjs [http://127.0.0.1:8787]
 *
 * Names are invented. Children are only ever stored as CHILD-2026-XXXX aliases.
 */
const BASE = (process.argv[2] ?? process.env.API_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '');
const DAY = 86_400_000;
const HOUR = 3_600_000;

async function login(role) {
  const res = await fetch(`${BASE}/api/v1/auth/dev-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
  const json = await res.json();
  if (!json.token) throw new Error(`dev-login(${role}) failed: ${JSON.stringify(json)}`);
  return json.token;
}

const tokens = {};
async function call(role, method, path, body) {
  tokens[role] ??= await login(role);
  const res = await fetch(`${BASE}/api/v1/loop${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens[role]}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status >= 400) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json)}`);
  return json;
}

const iso = (offsetMs) => new Date(Date.now() + offsetMs).toISOString();

/**
 * `until` = how far to push the journey:
 *   understand | risk | match | referral | accepted | action_taken
 * `nextStepAt` offsets the next step; the follow-up lands 1 day after it (server rule).
 */
const PEOPLE = [
  {
    alias: 'Anh Tuấn', obs: 'Anh bán vé số quanh chợ Tân Chánh Hiệp 6 năm, muốn việc ổn định ban ngày', kw: ['bán vé số'],
    u: { priorityStatement: 'Có việc làm ổn định ban ngày, không phải đi bộ cả ngày', need: 'employment', district: 'Quận 12', age: 38, strengths: ['bán hàng', 'quản lý tiền mặt', 'thuộc đường'], constraints: { daytimeOnly: true } },
    until: 'action_taken', nextStepAt: -2 * DAY + 2 * HOUR,
  },
  {
    alias: 'Chị Hồng', obs: 'Chị bán xôi rong buổi sáng ở Bà Điểm, muốn học nấu ăn bài bản', kw: ['bán hàng rong'],
    u: { priorityStatement: 'Học một nghề nấu ăn ngắn hạn để xin vào bếp', need: 'training', district: 'Hóc Môn', age: 45, strengths: ['nấu ăn', 'đóng gói'], constraints: { daytimeOnly: true } },
    until: 'accepted', nextStepAt: 3 * HOUR - DAY,
  },
  {
    alias: 'Anh Phúc', obs: 'Anh giao hàng tự do, bị một "công ty" đòi 2 triệu phí giữ chỗ việc làm', kw: ['giao hàng', 'phí môi giới'],
    u: { priorityStatement: 'Biết cách lấy lại tiền và nhận diện tin tuyển dụng giả', need: 'legal', district: 'Quận 12', age: 29, strengths: ['giao nhận', 'đi xe máy'] },
    until: 'referral', nextStepAt: 2 * DAY,
  },
  {
    alias: 'Chị Mai', obs: 'Chị mất CCCD khi ngủ ở bến xe, không xin được việc', kw: ['mất giấy tờ'],
    u: { priorityStatement: 'Làm lại CCCD để xin việc', need: 'documents', district: 'Quận 12', age: 33, hasIdentityDoc: false, strengths: ['dọn dẹp'] },
    until: 'match',
  },
  {
    alias: 'Cô Lan', obs: 'Cô 67 tuổi bán vé số ở ngã tư Ga, hay chóng mặt, sống một mình', kw: ['bán vé số', 'người cao tuổi'],
    u: { priorityStatement: 'Được khám sức khoẻ và biết có trợ cấp gì cho người già', need: 'health', district: 'Hóc Môn', age: 67, strengths: ['bán hàng'] },
    until: 'action_taken', nextStepAt: -DAY - 3 * HOUR,
  },
  {
    alias: 'Chú Bảy', obs: 'Chú 72 tuổi ngủ ở mái hiên chợ, chân đau, không còn người thân', kw: ['vô gia cư', 'người cao tuổi'],
    u: { priorityStatement: 'Có chỗ ở an toàn và người chăm sóc', need: 'social_assistance', district: 'Quận 12', age: 72, urgency: 'urgent', strengths: [] },
    until: 'referral', nextStepAt: DAY,
  },
  {
    alias: 'Bà Tư', obs: 'Bà 64 tuổi nhặt ve chai, chưa từng có giấy tờ tuỳ thân', kw: ['ve chai'],
    u: { priorityStatement: 'Làm giấy tờ để được hưởng chính sách', need: 'documents', district: 'Hóc Môn', age: 64, hasIdentityDoc: false, strengths: ['phân loại phế liệu'] },
    until: 'understand',
  },
  {
    alias: 'CHILD-2026-0142', obs: 'Em khoảng 13 tuổi bán kẹo đến 22h ở chợ Hóc Môn, có người lớn thu tiền', kw: ['trẻ bán hàng', 'đêm muộn'],
    u: { priorityStatement: 'Được đi học lại và an toàn buổi tối', need: 'training', district: 'Hóc Môn', age: 13, strengths: [] },
    until: 'risk',
  },
  {
    alias: 'CHILD-2026-0157', obs: 'Em 15 tuổi bỏ học lớp 8 để phụ mẹ bán vé số', kw: ['bỏ học'],
    u: { priorityStatement: 'Quay lại trường, có học bổng và đồ dùng học tập', need: 'social_assistance', district: 'Quận 12', age: 15, strengths: [] },
    until: 'accepted', review: 'Đã gặp mẹ em, đồng ý hướng hỗ trợ học tập – không kết nối việc làm', nextStepAt: 4 * HOUR - DAY,
  },
  {
    alias: 'Anh Hải', obs: 'Anh bán trái cây bằng xe đẩy, bị thu xe nhiều lần', kw: ['bán hàng rong'],
    u: { priorityStatement: 'Tìm điểm bán cố định hoặc việc làm có lương', need: 'employment', district: 'Hóc Môn', age: 41, strengths: ['bán hàng', 'giao tiếp khách'] },
    until: 'action_taken', nextStepAt: -3 * DAY,
  },
];

const CONSENT = (p) => ({ verbalConsent: true, allowPhoto: false, allowPhone: !p.alias.startsWith('CHILD-') && p.u.age < 60, allowSharingWithPartner: true, preferredAddress: p.alias.startsWith('CHILD-') ? null : p.alias, minimumDataOnly: true });

async function verifyDirectory() {
  const { resources } = await call('admin', 'GET', '/directory');
  for (const r of resources) {
    if (r.freshness === 'VERIFIED') continue;
    await call('admin', 'POST', `/directory/${r.id}/verify`, { status: 'VERIFIED', method: 'PHONE_CALL', notes: 'Gọi xác nhận còn nhận giới thiệu (seed demo)', capacityStatus: 'AVAILABLE', slotsAvailable: 5 + (r.id.length % 8) });
  }
  return resources.length;
}

async function run(p) {
  const { case: c } = await call('volunteer', 'POST', '/cases', { alias: p.alias, observation: p.obs, keywords: p.kw });
  await call('volunteer', 'PUT', `/cases/${c.id}/consent`, CONSENT(p));
  await call('volunteer', 'PUT', `/cases/${c.id}/understanding`, p.u);
  if (p.until === 'understand') return `${p.alias}: ${c.id} → UNDERSTAND`;

  const { risk } = await call('volunteer', 'POST', `/cases/${c.id}/risk-gate`, {});
  if (p.until === 'risk') return `${p.alias}: ${c.id} → risk ${risk.decision}`;
  if (risk.decision !== 'PROCEED') {
    if (!p.review) return `${p.alias}: ${c.id} → held (${risk.decision})`;
    await call('admin', 'POST', `/cases/${c.id}/risk-review`, { approved: true, note: p.review });
  }

  const { match } = await call('volunteer', 'POST', `/cases/${c.id}/match`);
  if (p.until === 'match' || match.candidates.length === 0) return `${p.alias}: ${c.id} → MATCH (${match.candidates.length} candidates)`;

  const top = match.candidates[0];
  const { nextStep } = await call('volunteer', 'POST', `/cases/${c.id}/next-steps`, {
    resourceId: top.resource.id,
    action: `Đi cùng đến ${top.resource.organisationName} để ${p.u.priorityStatement.toLowerCase()}`,
    ownerName: 'Navigator Lan',
    ownerRole: 'NAVIGATOR',
    place: top.resource.address ?? top.resource.district,
    dueAt: iso(p.nextStepAt ?? DAY),
  });
  const { referralId } = await call('volunteer', 'POST', `/next-steps/${nextStep.id}/confirm`, { beneficiaryAgreed: true, contactConfirmed: true });
  if (p.until === 'referral') return `${p.alias}: ${c.id} → referral CREATED`;

  await call('partner', 'POST', `/referrals/${referralId}/actions`, { action: 'accept' });
  if (p.until === 'accepted') return `${p.alias}: ${c.id} → ACCEPTED`;

  await call('partner', 'POST', `/referrals/${referralId}/actions`, { action: 'mark_action_taken', note: 'Đã tiếp nhận và tư vấn buổi đầu' });
  return `${p.alias}: ${c.id} → ACTION_TAKEN`;
}

const n = await verifyDirectory();
console.log(`Directory: ${n} resources verified`);
for (const p of PEOPLE) {
  try {
    console.log('✓', await run(p));
  } catch (e) {
    console.error('✗', p.alias, e.message);
  }
}
