/**
 * SSOT Types for Referral Document (Mẫu số 07 NĐ 20/2021/NĐ-CP)
 */

export interface ReferralDocumentMetadata {
  formCode: string; // 'MẪU SỐ 07 — NĐ 20/2021/NĐ-CP'
  documentNumber: string; // e.g. '01/PCT-BT/2026' or 'LAN-01/PCT-BT'
  referenceId: string; // e.g. 'REF-case-lan-01'
  passportId: string; // e.g. 'BT-BEN-LAN-01'
  generatedAt: string; // ISO date string
  isApproved: boolean; // true = BẢN CHÍNH THỨC, false = BẢN NHÁP (DRAFT)
  redactPII: boolean; // true = Luật Trẻ em 2016 bảo mật PII
}

export interface ReferralDocumentIssuer {
  city: string; // 'ỦY BAN NHÂN DÂN TP. HỒ CHÍ MINH'
  organization: string; // 'BƯỚC TIẾP — UNESCO YOUTH HACKATHON 2026'
  officerName: string; // 'Cán bộ CTXH Thực địa'
  officerTitle?: string;
  signerTitle?: string; // 'ĐẠI DIỆN ĐƠN VỊ CHUYỂN TUYẾN'
}

export interface ReferralDocumentRecipient {
  agencyName: string; // e.g. 'PHÒNG LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI HUYỆN HÓC MÔN'
  address: string; // e.g. 'Thị trấn Hóc Môn, Huyện Hóc Môn, TP. Hồ Chí Minh'
}

export interface ReferralDocumentBeneficiary {
  fullName: string;
  aliasName: string;
  passportCode: string;
  age: number | string;
  gender: string;
  location: string;
  vulnerabilityGroup: string;
  isMinor: boolean;
}

export interface ReferralDocumentCircumstances {
  summary: string;
  fieldAssessment: string;
  notes?: string;
}

export interface ReferralDocumentReferral {
  proposedMeasures: string[];
  recommendation?: string;
}

export interface ReferralDocumentModel {
  metadata: ReferralDocumentMetadata;
  issuer: ReferralDocumentIssuer;
  recipient: ReferralDocumentRecipient;
  beneficiary: ReferralDocumentBeneficiary;
  circumstances: ReferralDocumentCircumstances;
  referral: ReferralDocumentReferral;
}
