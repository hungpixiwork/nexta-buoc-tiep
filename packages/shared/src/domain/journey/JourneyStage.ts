export type JourneyStageKey =
  | 'intake'
  | 'emergency_aid'
  | 'capacity_building'
  | 'livelihood_matching'
  | 'sustainable_stabilization';

export type JourneyStageStatus = 'pending' | 'active' | 'completed' | 'skipped';

export interface JourneyStageProps {
  key: JourneyStageKey;
  title: string;
  description: string;
  status: JourneyStageStatus;
  order: number;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export const DEFAULT_JOURNEY_STAGES: Omit<JourneyStageProps, 'status' | 'startedAt' | 'completedAt' | 'notes'>[] = [
  {
    key: 'intake',
    title: 'Khảo sát & Tiếp nhận an sinh',
    description: 'Tiếp cận thực địa, ghi âm voice AI, xác nhận Three-Khong Privacy & Safeguarding.',
    order: 1,
  },
  {
    key: 'emergency_aid',
    title: 'Cứu trợ khẩn cấp & Pháp lý',
    description: 'Hỗ trợ nhu cầu thiết yếu (y tế, chỗ ở khẩn cấp, làm lại CCCD/giấy tờ tùy thân).',
    order: 2,
  },
  {
    key: 'capacity_building',
    title: 'Tăng cường năng lực',
    description: 'Tập huấn kỹ năng thực hành, an toàn MIL (chống lừa đảo mạng) & số hóa sơ yếu lý lịch.',
    order: 3,
  },
  {
    key: 'livelihood_matching',
    title: 'Kết nối sinh kế',
    description: 'Khởi tạo Hộ chiếu Sinh kế số hóa, ghép nối việc làm ngắn hạn / học nghề cộng đồng.',
    order: 4,
  },
  {
    key: 'sustainable_stabilization',
    title: 'Ổn định tự chủ bền vững',
    description: 'Theo dõi định kỳ 30-60-90 ngày, chuyển giao sang trạng thái tự chủ thu nhập.',
    order: 5,
  },
];

export class JourneyStage {
  private readonly _key: JourneyStageKey;
  private readonly _title: string;
  private readonly _description: string;
  private _status: JourneyStageStatus;
  private readonly _order: number;
  private _startedAt?: Date;
  private _completedAt?: Date;
  private _notes?: string;

  constructor(props: JourneyStageProps) {
    this._key = props.key;
    this._title = props.title;
    this._description = props.description;
    this._status = props.status;
    this._order = props.order;
    this._startedAt = props.startedAt;
    this._completedAt = props.completedAt;
    this._notes = props.notes;
  }

  get key(): JourneyStageKey { return this._key; }
  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get status(): JourneyStageStatus { return this._status; }
  get order(): number { return this._order; }
  get startedAt(): Date | undefined { return this._startedAt; }
  get completedAt(): Date | undefined { return this._completedAt; }
  get notes(): string | undefined { return this._notes; }

  public activate(notes?: string): void {
    this._status = 'active';
    this._startedAt = this._startedAt || new Date();
    if (notes) this._notes = notes;
  }

  public complete(notes?: string): void {
    this._status = 'completed';
    this._completedAt = new Date();
    if (notes) this._notes = notes;
  }

  public skip(notes?: string): void {
    this._status = 'skipped';
    if (notes) this._notes = notes;
  }

  public toJSON(): JourneyStageProps {
    return {
      key: this._key,
      title: this._title,
      description: this._description,
      status: this._status,
      order: this._order,
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      notes: this._notes,
    };
  }

  public static createDefaultStages(): JourneyStage[] {
    return DEFAULT_JOURNEY_STAGES.map((s, index) => new JourneyStage({
      ...s,
      status: index === 0 ? 'active' : 'pending',
      startedAt: index === 0 ? new Date() : undefined,
    }));
  }
}
