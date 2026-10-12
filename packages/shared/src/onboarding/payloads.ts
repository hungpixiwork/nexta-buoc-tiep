import { z } from 'zod';
import { NEED_CATEGORIES } from '../closed-loop/MatchPipeline';

export const LEGAL_FORMS = [
  'PUBLIC_UNIT', // đơn vị sự nghiệp công lập / cơ quan nhà nước
  'MASS_ORG', // Đoàn, Hội LHPN, Hội CTĐ, MTTQ…
  'NGO', // tổ chức phi chính phủ / hội / quỹ đã đăng ký
  'UNIVERSITY',
  'SOCIAL_ENTERPRISE',
  'RELIGIOUS',
  'ENTERPRISE_CSR',
  'INFORMAL_GROUP',
] as const;
export type LegalForm = (typeof LEGAL_FORMS)[number];

const phone = z.string().trim().regex(/^(\+?84|0)[\d\s.-]{8,13}$/, 'Invalid Vietnamese phone number');
const url = z.string().trim().url();
const email = z.string().trim().toLowerCase().email();
const agreementsSchema = z.array(z.string()).default([]);

export const PartnerServiceSchema = z.object({
  serviceName: z.string().trim().min(3).max(200),
  category: z.enum(NEED_CATEGORIES),
  description: z.string().trim().min(10).max(1500),
  serviceArea: z.array(z.string().trim().min(2)).min(1),
  address: z.string().trim().max(300).optional().nullable(),
  hours: z.string().trim().max(60).optional().nullable(),
  days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).default(['mon', 'tue', 'wed', 'thu', 'fri']),
  minAge: z.number().int().min(0).max(120).optional().nullable(),
  maxAge: z.number().int().min(0).max(120).optional().nullable(),
  targetGroups: z.array(z.string()).default([]),
  requiresIdentityDoc: z.boolean().default(false),
  acceptsReferral: z.boolean().default(true),
  capacityPerWeek: z.number().int().min(0).max(10000).optional().nullable(),
  feeFree: z.boolean().default(true),
});

export const PartnerPayloadSchema = z.object({
  org: z.object({
    legalName: z.string().trim().min(3).max(200),
    shortName: z.string().trim().max(80).optional().nullable(),
    legalForm: z.enum(LEGAL_FORMS),
    registrationRef: z.string().trim().max(120).optional().nullable(),
    district: z.string().trim().min(2).max(60),
    address: z.string().trim().min(5).max(300),
    website: url.optional().nullable(),
    publicSourceUrl: url.optional().nullable(),
  }),
  contact: z.object({ fullName: z.string().trim().min(2).max(80), title: z.string().trim().min(2).max(80), email, phone }),
  services: z.array(PartnerServiceSchema).min(1).max(10),
  agreements: agreementsSchema,
});

export const VolunteerPayloadSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  birthYear: z.number().int().min(1940).max(2020),
  phone: phone.optional().nullable(),
  district: z.string().trim().min(2).max(60),
  ward: z.string().trim().max(60).optional().nullable(),
  hostOrgId: z.string().optional().nullable(),
  availability: z.object({ weekdays: z.boolean(), weekends: z.boolean(), hoursPerWeek: z.number().int().min(1).max(40) }),
  languages: z.array(z.string()).default(['vi']),
  motivation: z.string().trim().min(30).max(1500),
  experience: z.string().trim().max(1500).optional().nullable(),
  reference: z.object({ name: z.string().trim().min(2).max(80), relation: z.string().trim().min(2).max(80), contact: z.string().trim().min(5).max(120) }),
  safeguardingDeclaration: z.object({ priorConcern: z.boolean(), details: z.string().max(1000).optional().nullable() }),
  agreements: agreementsSchema,
});

export const HostPayloadSchema = z.object({
  org: z.object({
    legalName: z.string().trim().min(3).max(200),
    legalForm: z.enum(LEGAL_FORMS),
    registrationRef: z.string().trim().max(120).optional().nullable(),
    district: z.string().trim().min(2).max(60),
    address: z.string().trim().min(5).max(300),
    website: url.optional().nullable(),
    publicSourceUrl: url.optional().nullable(),
  }),
  representative: z.object({ fullName: z.string().trim().min(2).max(80), title: z.string().trim().min(2).max(80), email }),
  dpoContact: z.object({ fullName: z.string().trim().min(2).max(80), email }),
  safeguardingContact: z.object({ fullName: z.string().trim().min(2).max(80), email, phone }),
  pilot: z.object({ areas: z.array(z.string()).min(1), expectedNavigators: z.number().int().min(1).max(500), startMonth: z.string().regex(/^\d{4}-\d{2}$/) }),
  agreements: agreementsSchema,
});

export const ObserverPayloadSchema = z.object({
  org: z.object({ legalName: z.string().trim().min(2).max(200), website: url.optional().nullable() }),
  contact: z.object({ fullName: z.string().trim().min(2).max(80), title: z.string().trim().min(2).max(80), email }),
  purpose: z.string().trim().min(20).max(1000),
  agreements: agreementsSchema,
});

export type PartnerPayload = z.infer<typeof PartnerPayloadSchema>;
export type VolunteerPayload = z.infer<typeof VolunteerPayloadSchema>;
export type HostPayload = z.infer<typeof HostPayloadSchema>;
export type ObserverPayload = z.infer<typeof ObserverPayloadSchema>;

export const PAYLOAD_SCHEMAS = {
  PARTNER: PartnerPayloadSchema,
  VOLUNTEER: VolunteerPayloadSchema,
  HOST: HostPayloadSchema,
  OBSERVER: ObserverPayloadSchema,
} as const;
