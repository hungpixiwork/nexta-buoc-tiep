import { z } from 'zod';

export type VerificationMethod =
  | 'field_visit'
  | 'phone_call'
  | 'official_document'
  | 'cross_partner_audit';

export type ResourceVerificationStatus =
  | 'verified'
  | 'unverified'
  | 'rejected'
  | 'stale_expired';

export interface VerificationRecord {
  id: string;
  resourceId: string;
  verifiedByUserId: string;
  verifiedByName: string;
  verificationMethod: VerificationMethod;
  status: ResourceVerificationStatus;
  verifiedAt: string; // ISO string
  validUntil: string; // ISO string
  notes?: string;
  evidencePhotoUrls?: string[];
}

export const VerificationRecordSchema = z.object({
  id: z.string().min(1, 'ID xác minh không được để trống'),
  resourceId: z.string().min(1, 'Mã nguồn lực không được để trống'),
  verifiedByUserId: z.string().min(1, 'Mã cán bộ/tình nguyện viên kiểm định'),
  verifiedByName: z.string().min(2, 'Tên người thực hiện xác minh'),
  verificationMethod: z.enum([
    'field_visit',
    'phone_call',
    'official_document',
    'cross_partner_audit',
  ]),
  status: z.enum(['verified', 'unverified', 'rejected', 'stale_expired']),
  verifiedAt: z.string(),
  validUntil: z.string(),
  notes: z.string().optional(),
  evidencePhotoUrls: z.array(z.string()).optional().default([]),
});

export const CreateVerificationRecordSchema = VerificationRecordSchema.omit({
  id: true,
});

export type CreateVerificationRecordInput = z.infer<
  typeof CreateVerificationRecordSchema
>;

/**
 * Kiểm tra xem hồ sơ kiểm định có hợp lệ và còn trong thời hạn bảo chứng hay không.
 */
export function isVerificationValid(
  record?: Partial<VerificationRecord> | null,
  referenceDate: Date = new Date()
): boolean {
  if (!record) return false;
  if (record.status !== 'verified') return false;
  if (!record.validUntil) return true; // Nếu không ghi ngày hết hạn thì coi như tin cậy mặc định

  const validUntilTime = new Date(record.validUntil).getTime();
  if (isNaN(validUntilTime)) return false;

  return validUntilTime >= referenceDate.getTime();
}

/**
 * Kiểm tra xem hồ sơ kiểm định có bị hết hạn (stale/expired) hay chưa.
 * Tiêu chuẩn: Quá ngày validUntil hoặc quá 90 ngày kể từ lần verifiedAt gần nhất.
 */
export function isVerificationStale(
  record?: Partial<VerificationRecord> | null,
  maxDaysValid = 90,
  referenceDate: Date = new Date()
): boolean {
  if (!record || record.status === 'unverified' || record.status === 'stale_expired') {
    return true;
  }
  if (record.validUntil) {
    const validUntilTime = new Date(record.validUntil).getTime();
    if (!isNaN(validUntilTime) && validUntilTime < referenceDate.getTime()) {
      return true;
    }
  }
  if (record.verifiedAt) {
    const verifiedTime = new Date(record.verifiedAt).getTime();
    if (!isNaN(verifiedTime)) {
      const diffDays = (referenceDate.getTime() - verifiedTime) / (1000 * 60 * 60 * 24);
      if (diffDays > maxDaysValid) {
        return true;
      }
    }
  }
  return false;
}
