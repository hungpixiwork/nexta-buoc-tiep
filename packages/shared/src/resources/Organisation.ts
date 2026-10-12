import { z } from 'zod';

export type OrganisationType =
  | 'ngo'
  | 'government'
  | 'hospital'
  | 'shelter'
  | 'charity'
  | 'community_group'
  | 'business_csr';

export interface Organisation {
  id: string;
  name: string;
  code: string;
  type: OrganisationType;
  contactPerson: string;
  phone: string;
  email?: string;
  website?: string;
  address: string;
  district: string;
  operatingLicense?: string;
  trustScore: number; // 0 - 100
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const OrganisationSchema = z.object({
  id: z.string().min(1, 'ID tổ chức không được để trống'),
  name: z.string().min(2, 'Tên tổ chức phải có ít nhất 2 ký tự'),
  code: z.string().min(2, 'Mã tổ chức không được để trống'),
  type: z.enum([
    'ngo',
    'government',
    'hospital',
    'shelter',
    'charity',
    'community_group',
    'business_csr',
  ]),
  contactPerson: z.string().min(2, 'Tên người đại diện liên hệ'),
  phone: z.string().min(8, 'Số điện thoại liên hệ không hợp lệ'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  website: z.string().url('URL website không hợp lệ').optional().or(z.literal('')),
  address: z.string().min(5, 'Địa chỉ trụ sở tổ chức'),
  district: z.string().min(2, 'Quận/Huyện tổ chức hoạt động'),
  operatingLicense: z.string().optional(),
  trustScore: z.number().min(0).max(100).default(80),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateOrganisationSchema = OrganisationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateOrganisationInput = z.infer<typeof CreateOrganisationSchema>;

/**
 * Kiểm tra một tổ chức có đáng tin cậy để làm nguồn lực chuyển tuyến hay không.
 * Điều kiện: Đang hoạt động (isActive) và điểm tin cậy (trustScore) >= 60.
 */
export function isTrustedOrganisation(org: Partial<Organisation>): boolean {
  if (org.isActive === false) return false;
  const score = org.trustScore ?? 0;
  return score >= 60;
}
