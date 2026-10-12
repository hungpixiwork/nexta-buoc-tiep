import { z } from 'zod';
import { Organisation, OrganisationSchema } from './Organisation';
import { EligibilityRule, EligibilityRuleSchema, evaluateEligibility, EligibilityCandidate } from './EligibilityRule';
import { Availability, AvailabilitySchema, isResourceCurrentlyAvailable, isAvailabilityStale } from './Availability';
import { VerificationRecord, VerificationRecordSchema, isVerificationValid, isVerificationStale } from './VerificationRecord';

export type ResourceCategory = 'medical' | 'legal' | 'shelter' | 'employment' | 'food' | 'general';

export interface SupportResource {
  id: string;
  organisationId?: string;
  organisationName?: string;
  name: string;
  category: ResourceCategory;
  description?: string;
  district: string;
  ward?: string;
  city?: string;
  province?: string;
  address: string;
  phone?: string;
  hotline?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  is24Hours?: boolean;
  is_24_7?: boolean;
  verificationStatus?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  acceptsReferral?: boolean;
  emergencySupport?: boolean;
  eligibility?: EligibilityRule;
  availability?: Availability;
  lastVerification?: VerificationRecord;
  createdAt: string;
  updatedAt?: string;
}

export const SupportResourceSchema = z.object({
  id: z.string().min(1, 'Mã nguồn lực không được để trống'),
  organisationId: z.string().optional(),
  organisationName: z.string().optional(),
  name: z.string().min(2, 'Tên địa điểm nguồn lực không được để trống'),
  category: z.enum(['medical', 'legal', 'shelter', 'employment', 'food', 'general']),
  description: z.string().optional(),
  district: z.string().min(2, 'Quận/Huyện không được để trống'),
  ward: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  address: z.string().min(5, 'Địa chỉ chi tiết không được để trống'),
  phone: z.string().optional(),
  hotline: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  operatingHours: z.string().optional(),
  is24Hours: z.boolean().optional(),
  is_24_7: z.boolean().optional(),
  verificationStatus: z.string().optional(),
  isVerified: z.boolean().default(true),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().optional(),
  acceptsReferral: z.boolean().optional(),
  emergencySupport: z.boolean().optional(),
  eligibility: EligibilityRuleSchema.optional(),
  availability: AvailabilitySchema.optional(),
  lastVerification: VerificationRecordSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateSupportResourceDomainSchema = SupportResourceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateSupportResourceInput = z.infer<typeof CreateSupportResourceDomainSchema>;

export type ResourceFilterOptions = {
  district?: string;
  category?: string;
  isVerifiedOnly?: boolean;
  excludeStale?: boolean;
  maxStaleDays?: number;
  candidate?: EligibilityCandidate;
};

/**
 * 6 Trạng thái Kiểm định & Độ mới của Nguồn lực An sinh (SSOT Canonical Resource Freshness Matrix):
 * - VERIFIED: Đã kiểm định hợp lệ, còn hạn bảo chứng (< 30 ngày) và sẵn sàng tiếp nhận.
 * - EXPIRING: Sắp hết hạn bảo chứng trong vòng 7 ngày (cần lập lịch tái thẩm định).
 * - STALE: Quá hạn kiểm định (> 30 ngày hoặc quá ngày validUntil). CẢNH BÁO: Không tự động match nếu chưa qua thẩm định lại.
 * - UNVERIFIED: Chưa từng được thẩm định thực địa/hồ sơ (isVerified = false hoặc trạng thái unverified/rejected).
 * - UNAVAILABLE: Đã hết chỉ tiêu/hết chỗ (capacityCurrent = 0) hoặc tạm thời/vĩnh viễn đóng cửa.
 * - CAPACITY_UNKNOWN: Đã kiểm định nhưng không có dữ liệu năng lực hoặc dữ liệu sức chứa bị quá hạn (> 72h).
 */
export type ResourceFreshnessStatus =
  | 'VERIFIED'
  | 'EXPIRING'
  | 'STALE'
  | 'UNVERIFIED'
  | 'UNAVAILABLE'
  | 'CAPACITY_UNKNOWN';

export const RESOURCE_FRESHNESS_STATUSES: readonly ResourceFreshnessStatus[] = [
  'VERIFIED',
  'EXPIRING',
  'STALE',
  'UNVERIFIED',
  'UNAVAILABLE',
  'CAPACITY_UNKNOWN',
] as const;

/**
 * Đánh giá chính xác trạng thái độ mới và kiểm định của nguồn lực theo 6 trạng thái chuẩn.
 * Quy tắc quá hạn: 30 ngày kể từ lần kiểm định gần nhất (hoặc theo cấu hình staleThresholdDays).
 */
export function getResourceFreshnessStatus(
  res: SupportResource,
  staleThresholdDays = 30,
  referenceDate: Date = new Date()
): ResourceFreshnessStatus {
  // 1. Kiểm tra tính khả dụng vật lý trước
  if (res.availability && !isResourceCurrentlyAvailable(res.availability)) {
    return 'UNAVAILABLE';
  }

  // 2. Kiểm tra trạng thái xác minh căn bản
  if (!res.isVerified) {
    return 'UNVERIFIED';
  }

  if (res.lastVerification && res.lastVerification.status !== 'verified') {
    return res.lastVerification.status === 'stale_expired' ? 'STALE' : 'UNVERIFIED';
  }

  // 3. Kiểm tra ngày hết hạn kiểm định (validUntil hoặc verifiedAt)
  const nowMs = referenceDate.getTime();
  let isStale = false;
  let isExpiring = false;

  if (res.lastVerification?.validUntil) {
    const validUntilMs = new Date(res.lastVerification.validUntil).getTime();
    if (!isNaN(validUntilMs)) {
      if (validUntilMs < nowMs) {
        isStale = true;
      } else {
        const daysLeft = (validUntilMs - nowMs) / (1000 * 60 * 60 * 24);
        if (daysLeft <= 7) {
          isExpiring = true;
        }
      }
    }
  }

  const verifiedDateStr = res.lastVerification?.verifiedAt || res.verifiedAt;
  if (verifiedDateStr && !isStale) {
    const verifiedMs = new Date(verifiedDateStr).getTime();
    if (!isNaN(verifiedMs)) {
      const elapsedDays = (nowMs - verifiedMs) / (1000 * 60 * 60 * 24);
      if (elapsedDays > staleThresholdDays) {
        isStale = true;
      } else if (elapsedDays >= staleThresholdDays - 7 && !isExpiring) {
        isExpiring = true;
      }
    }
  }

  if (isStale) {
    return 'STALE';
  }

  if (isExpiring) {
    return 'EXPIRING';
  }

  // 4. Kiểm tra dữ liệu sức chứa / năng lực phục vụ thời gian thực
  if (
    !res.availability ||
    res.availability.capacityCurrent === undefined ||
    isAvailabilityStale(res.availability, 72)
  ) {
    return 'CAPACITY_UNKNOWN';
  }

  return 'VERIFIED';
}

/**
 * Kiểm tra xem một nguồn lực có hoạt động và đã kiểm định hợp lệ (chưa bị quá hạn stale) hay không.
 */
export function isResourceOperationalAndVerified(
  res: SupportResource,
  maxStaleDays = 30
): { isValid: boolean; reason?: string } {
  // 1. Kiểm tra trạng thái isVerified căn bản
  if (!res.isVerified) {
    return { isValid: false, reason: 'Nguồn lực chưa được kiểm định (unverified).' };
  }

  // 2. Kiểm tra hồ sơ kiểm định VerificationRecord nếu có
  if (res.lastVerification) {
    if (!isVerificationValid(res.lastVerification)) {
      return { isValid: false, reason: 'Trạng thái kiểm định không hợp lệ hoặc đã bị hủy bỏ.' };
    }
    if (isVerificationStale(res.lastVerification, maxStaleDays)) {
      return { isValid: false, reason: `Thông tin kiểm định đã quá hạn (${maxStaleDays} ngày).` };
    }
  } else if (res.verifiedAt) {
    // Nếu không có object lastVerification nhưng có trường verifiedAt
    const verifiedTime = new Date(res.verifiedAt).getTime();
    if (!isNaN(verifiedTime)) {
      const diffDays = (Date.now() - verifiedTime) / (1000 * 60 * 60 * 24);
      if (diffDays > maxStaleDays) {
        return { isValid: false, reason: `Thời gian kiểm định đã quá hạn (${Math.round(diffDays)} ngày).` };
      }
    }
  }

  // 3. Kiểm tra khả dụng thời gian thực
  if (res.availability && !isResourceCurrentlyAvailable(res.availability)) {
    return { isValid: false, reason: 'Nguồn lực hiện đang hết suất hoặc tạm thời đóng cửa.' };
  }

  return { isValid: true };
}

/**
 * Hàm lọc danh sách nguồn lực an sinh chất lượng cao:
 * - Loại bỏ các nguồn lực unverified hoặc stale (nếu excludeStale = true)
 * - Khớp quận/huyện và danh mục
 * - Đánh giá tiêu chuẩn thụ hưởng (eligibility) cho đối tượng
 */
export function filterVerifiedAndActiveResources(
  resources: SupportResource[],
  options: ResourceFilterOptions = {}
): SupportResource[] {
  const {
    district,
    category,
    isVerifiedOnly = true,
    excludeStale = true,
    maxStaleDays = 30,
    candidate,
  } = options;

  return resources.filter((res) => {
    // Lọc theo quận/huyện
    if (district && district !== 'ALL' && res.district.toLowerCase() !== district.toLowerCase()) {
      return false;
    }

    // Lọc theo danh mục
    if (category && category !== 'ALL' && res.category !== category) {
      return false;
    }

    // Lọc chỉ nguồn đã xác minh
    if (isVerifiedOnly && !res.isVerified) {
      return false;
    }

    // Lọc loại bỏ nguồn lực stale / hết khả dụng
    if (excludeStale) {
      const check = isResourceOperationalAndVerified(res, maxStaleDays);
      if (!check.isValid) {
        return false;
      }
    }

    // Kiểm tra tiêu chuẩn thụ hưởng candidate nếu có
    if (candidate && res.eligibility) {
      const evalRes = evaluateEligibility(res.eligibility, candidate);
      if (!evalRes.eligible) {
        return false;
      }
    }

    return true;
  });
}

