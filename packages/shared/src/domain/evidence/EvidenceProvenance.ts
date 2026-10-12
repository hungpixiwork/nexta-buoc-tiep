import { Result } from '../../shared/Result';

export type EvidenceCategory = 'voice_note' | 'photo' | 'document' | 'survey' | 'third_party_referral';

export interface GPSLocation {
  latitude: number;
  longitude: number;
}

export interface EvidenceProvenanceProps {
  category: EvidenceCategory;
  collectedBy: string; // User ID của Tình nguyện viên / Cán bộ
  collectorRole: string; // 'volunteer' | 'social_worker' | 'admin'
  gpsLocation?: GPSLocation;
  deviceFingerprint?: string;
  capturedAt: Date;
  hash?: string; // SHA256 integrity checksum
}

export class EvidenceProvenance {
  private readonly _category: EvidenceCategory;
  private readonly _collectedBy: string;
  private readonly _collectorRole: string;
  private readonly _gpsLocation?: GPSLocation;
  private readonly _deviceFingerprint?: string;
  private readonly _capturedAt: Date;
  private readonly _hash?: string;

  private constructor(props: EvidenceProvenanceProps) {
    this._category = props.category;
    this._collectedBy = props.collectedBy;
    this._collectorRole = props.collectorRole;
    this._gpsLocation = props.gpsLocation;
    this._deviceFingerprint = props.deviceFingerprint;
    this._capturedAt = props.capturedAt;
    this._hash = props.hash;
  }

  get category(): EvidenceCategory { return this._category; }
  get collectedBy(): string { return this._collectedBy; }
  get collectorRole(): string { return this._collectorRole; }
  get gpsLocation(): GPSLocation | undefined { return this._gpsLocation; }
  get deviceFingerprint(): string | undefined { return this._deviceFingerprint; }
  get capturedAt(): Date { return this._capturedAt; }
  get hash(): string | undefined { return this._hash; }

  public static create(
    props: Omit<EvidenceProvenanceProps, 'capturedAt'> & { capturedAt?: Date }
  ): Result<EvidenceProvenance> {
    if (!props.collectedBy || props.collectedBy.trim() === '') {
      return Result.fail('collectedBy (người thu thập) không được để trống');
    }
    if (!props.collectorRole || props.collectorRole.trim() === '') {
      return Result.fail('collectorRole không được để trống');
    }

    if (props.gpsLocation) {
      const { latitude, longitude } = props.gpsLocation;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return Result.fail('Tọa độ GPS không hợp lệ');
      }
    }

    return Result.ok(
      new EvidenceProvenance({
        ...props,
        capturedAt: props.capturedAt || new Date(),
      })
    );
  }

  public verifyIntegrity(expectedHash: string): boolean {
    if (!this._hash) return false;
    return this._hash === expectedHash;
  }

  public toJSON(): Record<string, any> {
    return {
      category: this._category,
      collectedBy: this._collectedBy,
      collectorRole: this._collectorRole,
      gpsLocation: this._gpsLocation,
      deviceFingerprint: this._deviceFingerprint,
      capturedAt: this._capturedAt.toISOString(),
      hash: this._hash,
    };
  }
}
