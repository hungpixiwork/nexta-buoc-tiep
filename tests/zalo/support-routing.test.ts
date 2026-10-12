import { describe, expect, it } from 'vitest';
import { contactsFor, flagsFromReason, isUrgent } from '../../apps/zalo/src/lib/supportRouting';

const numbers = (s: Parameters<typeof contactsFor>[0], line: string | null = null) => contactsFor(s, line).map((r) => r.contact.number);

describe('Gọi hỗ trợ theo tình huống — không phải lúc nào cũng 111', () => {
  it('trẻ em → 111 đứng đầu và được gợi ý', () => {
    const r = contactsFor({ pathway: 'child' }, null);
    expect(r[0].contact.number).toBe('111');
    expect(r[0].recommended).toBe(true);
  });

  it('người cao tuổi cấp cứu → 115 đầu tiên, không có 111', () => {
    const n = numbers({ pathway: 'elderly', flags: ['MEDICAL_EMERGENCY'] });
    expect(n[0]).toBe('115');
    expect(n).not.toContain('111');
  });

  it('người lớn bị lừa việc làm → 156, không có 111', () => {
    const n = numbers({ pathway: 'adult', flags: ['SCAM_PATTERN'] });
    expect(n[0]).toBe('156');
    expect(n).not.toContain('111');
  });

  it('người lớn bị bạo lực → 113 + Ngôi nhà Bình yên, không có 111', () => {
    const n = numbers({ pathway: 'adult', flags: ['VIOLENCE_OR_ABUSE'] });
    expect(n[0]).toBe('113');
    expect(n).toContain('1900969680');
    expect(n).not.toContain('111');
  });

  it('có trẻ đi cùng (cờ CHILD_PRESENT) dù người chính là người lớn → có 111', () => {
    expect(numbers({ pathway: 'adult', flags: ['CHILD_PRESENT'] })[0]).toBe('111');
  });

  it('không dấu hiệu gì + có số điều phối viên → điều phối viên đứng đầu', () => {
    expect(numbers({ pathway: 'adult' }, '0900000000')[0]).toBe('0900000000');
  });

  it('không có ngữ cảnh → đủ danh bạ, không gợi ý số nào', () => {
    const r = contactsFor(undefined, null);
    expect(r.some((x) => x.recommended)).toBe(false);
    expect(r.map((x) => x.contact.number)).toEqual(expect.arrayContaining(['113', '115', '111', '156']));
  });

  it('chỉ khẩn cấp thật mới dùng nút đỏ; đọc cờ từ lý do escalation', () => {
    expect(isUrgent({ pathway: 'adult' })).toBe(false);
    expect(isUrgent({ riskDecision: 'EMERGENCY_111' })).toBe(true);
    expect(flagsFromReason('CHILD_PRESENT Marked as under 18; SCAM_PATTERN phí giữ chỗ')).toEqual(['CHILD_PRESENT', 'SCAM_PATTERN']);
  });
});
