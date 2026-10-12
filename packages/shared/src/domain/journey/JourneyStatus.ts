/**
 * Trạng thái của một Support Journey (Hành trình đồng hành an sinh).
 */
export type JourneyStatus = 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

export const VALID_JOURNEY_STATUSES: JourneyStatus[] = [
  'planned',
  'in_progress',
  'paused',
  'completed',
  'cancelled'
];

/**
 * Kiểm tra xem trạng thái có hợp lệ không.
 */
export function isValidJourneyStatus(status: string): status is JourneyStatus {
  return VALID_JOURNEY_STATUSES.includes(status as JourneyStatus);
}

/**
 * Ma trận chuyển đổi trạng thái hợp lệ.
 */
const JOURNEY_STATUS_TRANSITIONS: Record<JourneyStatus, JourneyStatus[]> = {
  planned: ['in_progress', 'cancelled'],
  in_progress: ['paused', 'completed', 'cancelled'],
  paused: ['in_progress', 'cancelled'],
  completed: [], // Trạng thái kết thúc
  cancelled: ['planned'], // Cho phép mở lại hành trình
};

/**
 * Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái.
 */
export function isValidJourneyStatusTransition(from: JourneyStatus, to: JourneyStatus): boolean {
  if (from === to) return true;
  return JOURNEY_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
