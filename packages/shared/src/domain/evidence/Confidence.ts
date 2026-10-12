import { Result } from '../../shared/Result';

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'verified';

export type EvidenceSourceType =
  | 'ai_voice'
  | 'manual_input'
  | 'document_scan'
  | 'social_worker_verification'
  | 'third_party_referral';

export interface ConfidenceProps {
  score: number; // 0.0 - 1.0
  level: ConfidenceLevel;
  source: EvidenceSourceType;
  details?: string;
}

export class Confidence {
  private readonly _score: number;
  private readonly _level: ConfidenceLevel;
  private readonly _source: EvidenceSourceType;
  private readonly _details?: string;

  private constructor(props: ConfidenceProps) {
    this._score = props.score;
    this._level = props.level;
    this._source = props.source;
    this._details = props.details;
  }

  get score(): number { return this._score; }
  get level(): ConfidenceLevel { return this._level; }
  get source(): EvidenceSourceType { return this._source; }
  get details(): string | undefined { return this._details; }

  public static calculateLevel(score: number): ConfidenceLevel {
    if (score >= 0.9) return 'verified';
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  public static create(
    score: number,
    source: EvidenceSourceType,
    level?: ConfidenceLevel,
    details?: string
  ): Result<Confidence> {
    if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 1) {
      return Result.fail('Confidence score phải nằm trong khoảng từ 0.0 đến 1.0');
    }

    const calculatedLevel = level || Confidence.calculateLevel(score);

    return Result.ok(
      new Confidence({
        score: Math.round(score * 100) / 100,
        level: calculatedLevel,
        source,
        details,
      })
    );
  }

  public isHighOrBetter(): boolean {
    return this._level === 'high' || this._level === 'verified';
  }

  public toJSON(): ConfidenceProps {
    return {
      score: this._score,
      level: this._level,
      source: this._source,
      details: this._details,
    };
  }
}
