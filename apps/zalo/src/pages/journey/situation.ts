import { pathwayOf } from '@web/lib/pathway';
import type { LoopCase } from '@web/lib/types';
import type { Situation } from '../../lib/supportRouting';

/** Tình huống của một hành trình → chọn số gọi hỗ trợ phù hợp (không mặc định 111). */
export function situationOf(c: Pick<LoopCase, 'alias' | 'isMinor' | 'age' | 'targetGroup' | 'risk'>): Situation {
  const child = c.alias.startsWith('CHILD-');
  return {
    pathway: child ? 'child' : pathwayOf(c),
    flags: c.risk?.flags.map((f) => f.code) ?? [],
    riskDecision: c.risk?.decision ?? null,
  };
}
