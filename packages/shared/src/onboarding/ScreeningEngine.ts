/**
 * ScreeningEngine — automatic, deterministic checks on every application.
 * It never approves anything: it orders the review queue and tells a human
 * exactly what to look at (PASS / WARN / FAIL with evidence).
 */
import { foldVietnamese } from '../closed-loop/RiskGate';
import { normalizeDistrict } from '../closed-loop/MatchPipeline';
import { detectScamRiskInText } from '../learning/VerifiedInfoCard';
import type { ApplicationKind } from './ApplicationLifecycle';
import { missingAgreements } from './agreements';
import type { HostPayload, ObserverPayload, PartnerPayload, VolunteerPayload } from './payloads';

export type CheckResult = 'PASS' | 'WARN' | 'FAIL';

export type ScreeningCheckCode =
  | 'AGREEMENTS_SIGNED'
  | 'IN_PILOT_AREA'
  | 'DUPLICATE_ORG'
  | 'DUPLICATE_CONTACT'
  | 'PUBLIC_SOURCE'
  | 'OFFICIAL_DOMAIN'
  | 'EMAIL_MATCHES_WEBSITE'
  | 'LEGAL_FORM'
  | 'NO_SCAM_LANGUAGE'
  | 'FEE_FREE'
  | 'NO_CHILD_EMPLOYMENT'
  | 'ADULT'
  | 'REFERENCE_GIVEN'
  | 'SAFEGUARDING_DECLARATION'
  | 'MOTIVATION'
  | 'AVAILABILITY'
  | 'DATA_PROTECTION_LEAD'
  | 'SAFEGUARDING_LEAD'
  | 'PURPOSE_STATED';

export interface ScreeningCheck {
  code: ScreeningCheckCode;
  result: CheckResult;
  /** Hard failures route the application to HIGH_RISK regardless of score */
  hard?: boolean;
  evidence?: string;
}

export interface ScreeningResult {
  checks: ScreeningCheck[];
  score: number;
  recommendation: 'FAST_REVIEW' | 'REVIEW' | 'HIGH_RISK';
  missingInfo: string[];
}

export interface ScreeningContext {
  now?: Date;
  /** Districts in the pilot; anything else is WARN, not FAIL */
  pilotAreas?: string[];
  existingOrgs?: Array<{ name: string; website?: string | null }>;
  existingContacts?: Array<{ email?: string | null; phone?: string | null }>;
}

const DEFAULT_PILOT = ['Hóc Môn', 'Quận 12'];
const OFFICIAL_TLDS = ['.gov.vn', '.edu.vn', '.org.vn', '.int', '.org'];
const FREE_MAIL = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'yahoo.com.vn'];

const hostOf = (u?: string | null) => {
  if (!u) return null;
  try {
    return new URL(u).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
};

const digits = (p?: string | null) => (p ?? '').replace(/\D/g, '').replace(/^84/, '0');

/** Token-set similarity on folded names — catches "TT DVVL Q12" vs "Trung tâm DVVL Quận 12" style duplicates. */
export function nameSimilarity(a: string, b: string): number {
  const stop = new Set(['trung', 'tam', 'tt', 'cua', 'va', 'tp', 'hcm', 'thanh', 'pho', 'ho', 'chi', 'minh', 'the', 'of', 'and']);
  const tok = (s: string) => new Set(foldVietnamese(s).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((t) => t.length > 1 && !stop.has(t)));
  const A = tok(a);
  const B = tok(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / Math.min(A.size, B.size);
}

function inPilot(areas: string[], pilot: string[]): boolean {
  const p = pilot.map(normalizeDistrict);
  return areas.some((a) => {
    const n = normalizeDistrict(a);
    return p.includes(n) || n.includes('toan') || n.includes('tp.hcm') || n.includes('tp hcm');
  });
}

function finalize(checks: ScreeningCheck[], missingInfo: string[]): ScreeningResult {
  const fails = checks.filter((c) => c.result === 'FAIL');
  const warns = checks.filter((c) => c.result === 'WARN');
  const score = Math.max(0, 100 - fails.length * 25 - warns.length * 8);
  const recommendation = fails.some((f) => f.hard) ? 'HIGH_RISK' : fails.length === 0 && score >= 80 ? 'FAST_REVIEW' : 'REVIEW';
  return { checks, score, recommendation, missingInfo };
}

function commonChecks(kind: ApplicationKind, agreements: string[], contacts: Array<{ email?: string | null; phone?: string | null }>, ctx: ScreeningContext): ScreeningCheck[] {
  const checks: ScreeningCheck[] = [];
  const missing = missingAgreements(kind, agreements);
  checks.push(missing.length === 0 ? { code: 'AGREEMENTS_SIGNED', result: 'PASS' } : { code: 'AGREEMENTS_SIGNED', result: 'FAIL', hard: true, evidence: missing.join(', ') });

  const known = ctx.existingContacts ?? [];
  const dup = contacts.find((c) =>
    known.some((k) => (c.email && k.email && c.email.toLowerCase() === k.email.toLowerCase()) || (digits(c.phone) && digits(c.phone) === digits(k.phone))),
  );
  checks.push(dup ? { code: 'DUPLICATE_CONTACT', result: 'WARN', evidence: dup.email ?? dup.phone ?? '' } : { code: 'DUPLICATE_CONTACT', result: 'PASS' });
  return checks;
}

function orgChecks(org: { legalName: string; legalForm?: string; website?: string | null; publicSourceUrl?: string | null }, contactEmail: string, ctx: ScreeningContext): { checks: ScreeningCheck[]; missing: string[] } {
  const checks: ScreeningCheck[] = [];
  const missing: string[] = [];

  const twin = (ctx.existingOrgs ?? []).find((o) => nameSimilarity(o.name, org.legalName) >= 0.8 || (hostOf(o.website) && hostOf(o.website) === hostOf(org.website)));
  checks.push(twin ? { code: 'DUPLICATE_ORG', result: 'WARN', evidence: twin.name } : { code: 'DUPLICATE_ORG', result: 'PASS' });

  const source = org.publicSourceUrl ?? org.website;
  if (!source) {
    checks.push({ code: 'PUBLIC_SOURCE', result: 'WARN', evidence: 'No public page to cross-check' });
    missing.push('publicSourceUrl');
  } else checks.push({ code: 'PUBLIC_SOURCE', result: source.startsWith('https://') ? 'PASS' : 'WARN', evidence: source });

  const host = hostOf(source);
  checks.push(host && OFFICIAL_TLDS.some((t) => host.endsWith(t)) ? { code: 'OFFICIAL_DOMAIN', result: 'PASS', evidence: host } : { code: 'OFFICIAL_DOMAIN', result: 'WARN', evidence: host ?? '—' });

  const mailDomain = contactEmail.split('@')[1]?.toLowerCase() ?? '';
  const site = hostOf(org.website);
  if (site && (mailDomain === site || mailDomain.endsWith(`.${site}`) || site.endsWith(mailDomain))) checks.push({ code: 'EMAIL_MATCHES_WEBSITE', result: 'PASS', evidence: mailDomain });
  else checks.push({ code: 'EMAIL_MATCHES_WEBSITE', result: 'WARN', evidence: FREE_MAIL.includes(mailDomain) ? `Free mailbox (${mailDomain})` : mailDomain });

  if (org.legalForm) {
    checks.push(org.legalForm === 'INFORMAL_GROUP' ? { code: 'LEGAL_FORM', result: 'WARN', evidence: 'Informal group — needs a host or sponsor' } : { code: 'LEGAL_FORM', result: 'PASS', evidence: org.legalForm });
  }
  return { checks, missing };
}

export function screenPartner(p: PartnerPayload, ctx: ScreeningContext = {}): ScreeningResult {
  const checks = commonChecks('PARTNER', p.agreements, [{ email: p.contact.email, phone: p.contact.phone }], ctx);
  const org = orgChecks(p.org, p.contact.email, ctx);
  checks.push(...org.checks);

  const areas = [p.org.district, ...p.services.flatMap((s) => s.serviceArea)];
  checks.push(inPilot(areas, ctx.pilotAreas ?? DEFAULT_PILOT) ? { code: 'IN_PILOT_AREA', result: 'PASS' } : { code: 'IN_PILOT_AREA', result: 'WARN', evidence: areas.join(', ') });

  const text = p.services.map((s) => `${s.serviceName}. ${s.description}`).join(' ');
  const scam = detectScamRiskInText(text);
  checks.push(scam.isRiskDetected ? { code: 'NO_SCAM_LANGUAGE', result: 'FAIL', hard: true, evidence: scam.matchedKeywords.join(', ') } : { code: 'NO_SCAM_LANGUAGE', result: 'PASS' });

  const paid = p.services.filter((s) => !s.feeFree);
  checks.push(paid.length === 0 ? { code: 'FEE_FREE', result: 'PASS' } : { code: 'FEE_FREE', result: 'WARN', evidence: paid.map((s) => s.serviceName).join(', ') });

  const childJobs = p.services.filter((s) => (s.category === 'employment' || s.category === 'training') && ((s.minAge ?? 18) < 18 || s.targetGroups.some((g) => /child|tre em|minor/.test(foldVietnamese(g)))));
  const labourJobs = childJobs.filter((s) => s.category === 'employment');
  checks.push(labourJobs.length === 0 ? { code: 'NO_CHILD_EMPLOYMENT', result: 'PASS' } : { code: 'NO_CHILD_EMPLOYMENT', result: 'FAIL', hard: true, evidence: labourJobs.map((s) => s.serviceName).join(', ') });

  const missing = [...org.missing];
  if (!p.org.registrationRef && p.org.legalForm !== 'INFORMAL_GROUP') missing.push('registrationRef');
  if (p.services.some((s) => s.capacityPerWeek == null)) missing.push('capacityPerWeek');
  return finalize(checks, missing);
}

export function screenVolunteer(v: VolunteerPayload & { email: string }, ctx: ScreeningContext = {}): ScreeningResult {
  const now = ctx.now ?? new Date();
  const checks = commonChecks('VOLUNTEER', v.agreements, [{ email: v.email, phone: v.phone }], ctx);
  // Conservative: someone born this year - 18 may not be 18 yet → WARN, younger → FAIL.
  const ageLow = now.getUTCFullYear() - v.birthYear - 1;
  if (ageLow >= 18) checks.push({ code: 'ADULT', result: 'PASS' });
  else if (ageLow === 17) checks.push({ code: 'ADULT', result: 'WARN', evidence: 'May still be 17 — confirm date of birth' });
  else checks.push({ code: 'ADULT', result: 'FAIL', hard: true, evidence: `Born ${v.birthYear}` });

  checks.push(inPilot([v.district], ctx.pilotAreas ?? DEFAULT_PILOT) ? { code: 'IN_PILOT_AREA', result: 'PASS' } : { code: 'IN_PILOT_AREA', result: 'WARN', evidence: v.district });
  checks.push(v.reference.contact.trim().length >= 5 ? { code: 'REFERENCE_GIVEN', result: 'PASS' } : { code: 'REFERENCE_GIVEN', result: 'FAIL' });
  checks.push(v.safeguardingDeclaration.priorConcern ? { code: 'SAFEGUARDING_DECLARATION', result: 'FAIL', hard: true, evidence: v.safeguardingDeclaration.details ?? 'Declared' } : { code: 'SAFEGUARDING_DECLARATION', result: 'PASS' });
  checks.push(v.motivation.trim().length >= 80 ? { code: 'MOTIVATION', result: 'PASS' } : { code: 'MOTIVATION', result: 'WARN', evidence: 'Short motivation — ask in interview' });
  checks.push(v.availability.hoursPerWeek >= 3 ? { code: 'AVAILABILITY', result: 'PASS' } : { code: 'AVAILABILITY', result: 'WARN', evidence: `${v.availability.hoursPerWeek}h/week` });
  return finalize(checks, v.phone ? [] : ['phone']);
}

export function screenHost(h: HostPayload, ctx: ScreeningContext = {}): ScreeningResult {
  const checks = commonChecks('HOST', h.agreements, [{ email: h.representative.email }], ctx);
  const org = orgChecks(h.org, h.representative.email, ctx);
  checks.push(...org.checks);
  checks.push(h.org.legalForm === 'INFORMAL_GROUP' ? { code: 'LEGAL_FORM', result: 'FAIL', hard: true, evidence: 'A host must be a legal entity' } : { code: 'LEGAL_FORM', result: 'PASS', evidence: h.org.legalForm });
  checks.push(inPilot(h.pilot.areas, ctx.pilotAreas ?? DEFAULT_PILOT) ? { code: 'IN_PILOT_AREA', result: 'PASS' } : { code: 'IN_PILOT_AREA', result: 'WARN', evidence: h.pilot.areas.join(', ') });
  checks.push({ code: 'DATA_PROTECTION_LEAD', result: 'PASS', evidence: h.dpoContact.fullName });
  checks.push(
    h.safeguardingContact.email.toLowerCase() === h.dpoContact.email.toLowerCase()
      ? { code: 'SAFEGUARDING_LEAD', result: 'WARN', evidence: 'Same person as data-protection lead' }
      : { code: 'SAFEGUARDING_LEAD', result: 'PASS', evidence: h.safeguardingContact.fullName },
  );
  // de-duplicate LEGAL_FORM from orgChecks (host rule is stricter)
  const deduped = checks.filter((c, i) => c.code !== 'LEGAL_FORM' || i === checks.map((x) => x.code).lastIndexOf('LEGAL_FORM'));
  return finalize(deduped, [...org.missing, ...(h.org.registrationRef ? [] : ['registrationRef'])]);
}

export function screenObserver(o: ObserverPayload, ctx: ScreeningContext = {}): ScreeningResult {
  const checks = commonChecks('OBSERVER', o.agreements, [{ email: o.contact.email }], ctx);
  const org = orgChecks({ legalName: o.org.legalName, website: o.org.website }, o.contact.email, ctx);
  checks.push(...org.checks.filter((c) => c.code !== 'PUBLIC_SOURCE'));
  checks.push(o.purpose.trim().length >= 40 ? { code: 'PURPOSE_STATED', result: 'PASS' } : { code: 'PURPOSE_STATED', result: 'WARN' });
  return finalize(checks, []);
}
