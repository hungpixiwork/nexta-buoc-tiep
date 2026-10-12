import { describe, expect, it } from 'vitest';
import { applyHumanReview, evaluateRiskGate } from '../../packages/shared/src/closed-loop/RiskGate';

const adult = { text: 'Anh bán vé số, muốn tìm việc ổn định', age: 34, hasConsent: true, need: 'job', district: 'Hóc Môn' };

describe('Kiểm tra an toàn (RiskGate) — con người quyết định, AI chỉ thêm cờ', () => {
  it('người lớn, đủ thông tin → cho tiếp tục', () => {
    const r = evaluateRiskGate(adult);
    expect(r.decision).toBe('PROCEED');
    expect(r.blocksEmploymentReferral).toBe(false);
  });

  it('dưới 18 tuổi → gắn cờ trẻ em và chặn đường việc làm', () => {
    const r = evaluateRiskGate({ ...adult, age: 15 });
    expect(r.flags.some((f) => f.code === 'CHILD_PRESENT')).toBe(true);
    expect(r.blocksEmploymentReferral).toBe(true);
    expect(r.decision).not.toBe('PROCEED');
  });

  it('tuổi nhắc trong ghi chú ("15 tuổi") cũng tính là trẻ em', () => {
    const r = evaluateRiskGate({ ...adult, age: null, text: 'Em 15 tuoi bán kẹo ở chợ' });
    expect(r.flags.some((f) => f.code === 'CHILD_PRESENT')).toBe(true);
  });

  it('chưa có sự đồng ý → phải hỏi thêm, không được chuyển gửi', () => {
    const r = evaluateRiskGate({ ...adult, hasConsent: false });
    expect(r.decision).toBe('ASK_MORE');
    expect(r.missingContext).toContain('consent');
    expect(r.blocksReferral).toBe(true);
  });

  it('cờ AI chỉ nâng mức, không hạ được quyết định', () => {
    const r = evaluateRiskGate({ ...adult, aiFlags: ['SELF_HARM'] });
    expect(r.decision).not.toBe('PROCEED');
    expect(r.aiAuthority).toBe('SUGGEST_ONLY');
    expect(r.flags.find((f) => f.code === 'SELF_HARM')?.source).toBe('AI_SUGGESTED');
  });

  it('EMERGENCY_111 không được gỡ khi chưa ghi nhận đã báo 111', () => {
    const r = evaluateRiskGate({ ...adult, navigatorFlags: ['MEDICAL_EMERGENCY'] });
    expect(r.decision).toBe('EMERGENCY_111');
    expect(applyHumanReview(r, { approved: true })).toBe('EMERGENCY_111');
    expect(applyHumanReview(r, { approved: true, escalationLogged: true })).toBe('PROCEED');
  });
});
