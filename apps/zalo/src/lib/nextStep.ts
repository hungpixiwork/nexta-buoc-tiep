/**
 * "Bước tiếp theo" của một hành trình — dùng chung cho Hôm nay và trang Hành trình.
 * Luật đơn giản, giải thích được: việc gấp nhất thắng (giống web W1).
 */
import { dueStatus, stepOfStage } from '@web/lib/caseSignals';
import { pathwayOf } from '@web/lib/pathway';
import type { CaseListItem, FollowUp, LoopCase } from '@web/lib/types';
import type { Copy } from './i18n';

export type Task = 'checkin' | 'safety' | 'connect' | 'understand' | 'waiting' | 'following';

export const TASK_LABEL: Record<Task, Copy> = {
  checkin: { vi: 'Hỏi thăm lại', en: 'Check in' },
  safety: { vi: 'Kiểm tra an toàn', en: 'Safety check' },
  connect: { vi: 'Tìm nơi phù hợp', en: 'Find a place' },
  understand: { vi: 'Tìm hiểu nhu cầu', en: 'Understand the need' },
  waiting: { vi: 'Chờ đơn vị hỗ trợ', en: 'Waiting for the service' },
  following: { vi: 'Đang đi đúng hướng', en: 'On track' },
};

/** 6 bước của hành trình (khớp `stepOfStage`). */
export const JOURNEY_STEPS: Copy[] = [
  { vi: 'Đồng ý', en: 'Consent' },
  { vi: 'Tìm hiểu', en: 'Understand' },
  { vi: 'An toàn', en: 'Safety' },
  { vi: 'Nơi hỗ trợ', en: 'Place' },
  { vi: 'Chuyển gửi', en: 'Referral' },
  { vi: 'Hỏi thăm', en: 'Check-in' },
];

export const stepNumber = (stage: string) => stepOfStage(stage);

export function taskOf(c: CaseListItem, fu: FollowUp | undefined): Task {
  if (fu && dueStatus(fu.dueAt) !== 'on_time') return 'checkin';
  if (c.stage === 'RISK' || c.stage === 'ESCALATED' || c.riskDecision === 'HUMAN_REVIEW' || c.riskDecision === 'EMERGENCY_111' || c.riskDecision === 'ASK_MORE') return 'safety';
  if (c.stage === 'CONSENT' || c.stage === 'UNDERSTAND') return 'understand';
  if ((c.stage === 'MATCH' || c.stage === 'NEXT_STEP') && (!c.referral || c.referral.stage === 'DECLINED')) return 'connect';
  if (c.referral && (c.referral.stage === 'CREATED' || c.referral.stage === 'RECEIVED')) return 'waiting';
  return 'following';
}

/** Câu "vì sao" — hướng dẫn, không trách móc. */
export function whyOf(task: Task, c: Pick<CaseListItem, 'stage' | 'isMinor' | 'age' | 'targetGroup' | 'nextStep' | 'referral'>): Copy {
  switch (task) {
    case 'checkin':
      return { vi: 'Đã tới hẹn hỏi xem họ có thật sự được giúp chưa.', en: 'Time to check whether they were really helped.' };
    case 'safety':
      return pathwayOf(c) === 'child'
        ? { vi: 'Có trẻ em — điều phối viên xem xét trước, bạn ở bên em.', en: 'A child is involved — a coordinator reviews first; stay with them.' }
        : { vi: 'Kiểm tra nhanh vài dấu hiệu an toàn trước khi tìm nơi hỗ trợ.', en: 'A quick safety check before finding support.' };
    case 'connect':
      return c.referral?.stage === 'DECLINED'
        ? { vi: 'Nơi trước chưa nhận được — cùng chọn nơi khác nhé.', en: "The last place couldn't take it — let's choose another." }
        : { vi: 'Đã rõ nhu cầu. Chọn nơi hỗ trợ đã xác minh và hẹn một bước.', en: 'The need is clear. Pick a verified place and agree one step.' };
    case 'understand':
      return c.stage === 'CONSENT'
        ? { vi: 'Hỏi sự đồng ý của họ trước khi ghi thêm.', en: 'Ask for their consent before recording more.' }
        : { vi: 'Hỏi một điều giúp ngày mai của họ dễ hơn.', en: 'Ask what would make tomorrow easier for them.' };
    case 'waiting':
      return { vi: `Chuyển gửi ${c.referral?.code ?? ''} đang chờ đơn vị hỗ trợ nhận. Bạn chưa cần làm gì.`, en: `Referral ${c.referral?.code ?? ''} is waiting for the service. Nothing to do yet.` };
    default:
      return c.nextStep?.action ? { vi: c.nextStep.action, en: c.nextStep.action } : { vi: 'Mọi thứ đang đi đúng hướng.', en: 'Things are on track.' };
  }
}

/** Tên bước tiếp theo trên trang Hành trình (theo trạng thái hành trình). */
export function nextStepLabel(c: Pick<LoopCase, 'stage' | 'status'>): Copy | null {
  if (c.status === 'CLOSED') return null;
  const n = stepOfStage(c.stage);
  return JOURNEY_STEPS[Math.min(n, JOURNEY_STEPS.length) - 1];
}
