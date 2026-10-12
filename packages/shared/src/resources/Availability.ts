import { z } from 'zod';

export type ResourceAvailabilityStatus =
  | 'available'
  | 'limited'
  | 'full'
  | 'temporarily_closed'
  | 'permanently_closed';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Availability {
  resourceId?: string;
  status: ResourceAvailabilityStatus;
  capacityCurrent?: number; // Số lượng khả dụng thực tế hiện tại (ví dụ: 10 suất ăn, 3 giường)
  capacityMax?: number; // Năng lực phục vụ tối đa
  operatingHours?: string; // Ví dụ: "08:00 - 17:00"
  daysOfWeek?: DayOfWeek[];
  lastCapacityUpdate?: string; // ISO Timestamp
  notice?: string;
}

export const AvailabilitySchema = z.object({
  resourceId: z.string().optional(),
  status: z
    .enum(['available', 'limited', 'full', 'temporarily_closed', 'permanently_closed'])
    .default('available'),
  capacityCurrent: z.number().min(0).optional(),
  capacityMax: z.number().min(0).optional(),
  operatingHours: z.string().optional(),
  daysOfWeek: z
    .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
    .optional()
    .default(['mon', 'tue', 'wed', 'thu', 'fri']),
  lastCapacityUpdate: z.string().optional(),
  notice: z.string().optional(),
});

/**
 * Kiểm tra xem nguồn lực có đang trong trạng thái sẵn sàng phục vụ hay không.
 */
export function isResourceCurrentlyAvailable(avail?: Availability): boolean {
  if (!avail) return true; // Default fallback nếu chưa cấu hình availability
  if (avail.status === 'temporarily_closed' || avail.status === 'permanently_closed' || avail.status === 'full') {
    return false;
  }
  if (avail.capacityCurrent !== undefined && avail.capacityCurrent <= 0) {
    return false;
  }
  return true;
}

/**
 * Kiểm tra dữ liệu tình trạng khả dụng có bị quá hạn (stale) chưa được cập nhật không.
 * Mặc định: 72 giờ không có cập nhật năng lực phục vụ đối với các địa điểm có rủi ro cao.
 */
export function isAvailabilityStale(avail?: Availability, maxStaleHours = 72): boolean {
  if (!avail || !avail.lastCapacityUpdate) return false;
  const updateTime = new Date(avail.lastCapacityUpdate).getTime();
  if (isNaN(updateTime)) return false;
  const now = Date.now();
  const diffHours = (now - updateTime) / (1000 * 60 * 60);
  return diffHours > maxStaleHours;
}
