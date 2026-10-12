import { describe, expect, it } from 'vitest';
import { canCreateEmploymentReferral, canCreateLivelihoodPassport, evaluateSafeguardingRisk } from '../../packages/shared/src/referrals/safeguardingRuleEngine';

const year = new Date().getFullYear();

describe('Luật an toàn trẻ em (safeguardingRuleEngine) — mốc hành vi hiện tại', () => {
  it('trẻ em theo năm sinh → chặn việc làm và hộ chiếu sinh kế', () => {
    const input = { birthYear: year - 15 };
    expect(evaluateSafeguardingRisk(input).isPotentialMinor).toBe(true);
    expect(canCreateEmploymentReferral(input).allowed).toBe(false);
    expect(canCreateLivelihoodPassport(input).allowed).toBe(false);
  });

  it('người lớn → được phép', () => {
    const input = { birthYear: year - 34 };
    expect(canCreateEmploymentReferral(input).allowed).toBe(true);
  });

  it('nguy cơ bóc lột → chặn việc làm kể cả người lớn', () => {
    expect(canCreateEmploymentReferral({ birthYear: year - 30, riskFlags: ['TRAFFICKING_RISK'] }).allowed).toBe(false);
  });

  // Lỗ hổng I-05: chưa rõ tuổi thì hiện đang CHO QUA. P0-06 sẽ đổi test này thành "bị chặn".
  it('chưa rõ tuổi → hiện đang cho qua (sẽ sửa ở P0-06)', () => {
    expect(canCreateEmploymentReferral({}).allowed).toBe(true);
  });
});
