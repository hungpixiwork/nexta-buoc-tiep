import { describe, expect, it } from 'vitest';
import { availableLoopActions, normalizeLoopStage, planLoopAction } from '../../packages/shared/src/closed-loop/ReferralLoop';

describe('Chuyển gửi (ReferralLoop) — chuyển trạng thái', () => {
  it('đơn vị hỗ trợ nhận chuyển gửi mới → tự ghi "đã nhận" trước "đã chấp nhận"', () => {
    const plan = planLoopAction('CREATED', 'accept', 'PARTNER');
    expect(plan).toEqual({ ok: true, from: 'CREATED', path: ['RECEIVED', 'ACCEPTED'] });
  });

  it('từ chối phải có lý do', () => {
    const plan = planLoopAction('RECEIVED', 'decline', 'PARTNER', { reason: ' ' });
    expect(plan.ok).toBe(false);
    if (!plan.ok) expect(plan.code).toBe('REASON_REQUIRED');
  });

  it('người đồng hành không được nhận thay đơn vị hỗ trợ', () => {
    const plan = planLoopAction('RECEIVED', 'accept', 'NAVIGATOR');
    expect(plan.ok).toBe(false);
    if (!plan.ok) expect(plan.code).toBe('ACTOR_NOT_ALLOWED');
  });

  it('không nhảy cóc: đã đóng thì không làm gì được nữa', () => {
    expect(planLoopAction('CLOSED', 'accept', 'COORDINATOR').ok).toBe(false);
    expect(availableLoopActions('CLOSED', 'COORDINATOR')).toEqual([]);
  });

  it('trạng thái cũ (chữ thường / từ khác) được quy về giai đoạn chuẩn', () => {
    expect(normalizeLoopStage('rejected')).toBe('DECLINED');
    expect(normalizeLoopStage('proposed')).toBe('CREATED');
    expect(normalizeLoopStage(null)).toBe('CREATED');
  });
});
