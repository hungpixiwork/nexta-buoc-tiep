import { ReferralDocumentModel } from './referral-document.types';

/**
 * Transforms various input formats (CaseRecord, Form07Data, ReferralRecord) into the SSOT ReferralDocumentModel
 */
export function buildReferralDocumentModel(
  source: any,
  overrides?: Partial<ReferralDocumentModel>
): ReferralDocumentModel {
  if (!source) {
    source = {};
  }

  // Determine if it's already a Form07Data object
  const isForm07 = 'officialDocNo' in source && 'proposedMeasures' in source;

  const id = source.id || source.referralId || source.caseId || 'case-01';
  const alias = source.aliasName || 'BENEFICIARY';
  const fullName = source.fullName || source.caseName || alias;
  const isMinor = Boolean(source.isMinor || (source.age && Number(source.age) < 18));
  const redactPII = source.redactPII !== undefined ? source.redactPII : isMinor;

  const docNo = source.officialDocNo || `${alias.replace('CASE-', '')}/PCT-BT`;
  const passportId = source.passportId || (source.beneficiaryId ? `BT-${source.beneficiaryId.toUpperCase()}` : `BT-${id.toUpperCase()}`);

  const birthYear = source.birthYear ? Number(source.birthYear) : null;
  const age = source.age || (birthYear ? 2026 - birthYear : (isMinor ? 15 : 62));
  const gender = source.gender || (isMinor ? 'Nam' : 'Nữ');
  const location = source.currentArea || source.location || 'Huyện Hóc Môn, TP.HCM';
  const vulnerabilityGroup = source.vulnerabilityGroup || (isMinor ? 'Trẻ em lang thang / Cần bảo vệ khẩn cấp' : 'Lao động đường phố');

  const emergencyReason = source.emergencyReason || source.note || source.notes || 'Cần tiếp nhận hỗ trợ an sinh và trợ giúp xã hội khẩn cấp.';

  // Determine measures
  let measures: string[] = [];
  if (Array.isArray(source.proposedMeasures) && source.proposedMeasures.length > 0) {
    measures = [...source.proposedMeasures];
  } else {
    if (source.needCategories?.includes('food')) measures.push('Nhu yếu phẩm khẩn cấp & Suất ăn dinh dưỡng');
    if (source.needCategories?.includes('medical')) measures.push('Trợ giúp Y tế, khám chữa bệnh & Cấp thuốc khẩn cấp');
    if (source.needCategories?.includes('shelter_job')) {
      measures.push('Tạm trú khẩn cấp tại Cơ sở Bảo trợ / Mái ấm an sinh');
      measures.push('Đào tạo an toàn số MIL (Media & Info Literacy) & Phòng chống lừa đảo việc làm');
    }
    if (isMinor || source.needCategories?.includes('sos111')) {
      measures.push('Bảo vệ trẻ em khẩn cấp (Tổng đài 111 & Tổ Công tác xã hội địa phương)');
    }
    if (measures.length === 0) {
      measures.push('Nhu yếu phẩm khẩn cấp & Suất ăn dinh dưỡng', 'Trợ giúp Y tế, khám chữa bệnh & Cấp thuốc khẩn cấp');
    }
  }

  const model: ReferralDocumentModel = {
    metadata: {
      formCode: 'MẪU SỐ 07 — NĐ 20/2021/NĐ-CP',
      documentNumber: docNo,
      referenceId: source.referralId || `REF-${id}`,
      passportId,
      generatedAt: source.createdAt || new Date().toISOString(),
      isApproved: source.isApproved !== undefined ? source.isApproved : (source.status === 'referred' || source.status === 'closed' || source.status === 'accepted'),
      redactPII,
    },
    issuer: {
      city: 'ỦY BAN NHÂN DÂN TP. HỒ CHÍ MINH',
      organization: source.issuingDept || 'BAN ĐIỀU HÀNH BƯỚC TIẾP — UNESCO YOUTH HACKATHON 2026',
      officerName: source.issuingOfficer || source.assignedTo || 'Cán bộ CTXH Thực địa',
      signerTitle: 'ĐẠI DIỆN ĐƠN VỊ CHUYỂN TUYẾN',
    },
    recipient: {
      agencyName: source.resourceName || 'PHÒNG LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI HUYỆN HÓC MÔN',
      address: source.address || 'Thị trấn Hóc Môn, Huyện Hóc Môn, TP. Hồ Chí Minh',
    },
    beneficiary: {
      fullName,
      aliasName: alias,
      passportCode: passportId,
      age,
      gender,
      location,
      vulnerabilityGroup,
      isMinor,
    },
    circumstances: {
      summary: emergencyReason,
      fieldAssessment: emergencyReason,
      notes: source.notes || 'Biên bản tiếp nhận và đề xuất biện pháp trợ giúp xã hội chuyển tuyến P0 theo NĐ 20/2021/NĐ-CP.',
    },
    referral: {
      proposedMeasures: measures,
      recommendation: 'Đề nghị cơ quan tiếp nhận ưu tiên bố trí giải pháp an sinh phù hợp.',
    },
  };

  if (overrides) {
    return {
      ...model,
      ...overrides,
      metadata: { ...model.metadata, ...(overrides.metadata || {}) },
      issuer: { ...model.issuer, ...(overrides.issuer || {}) },
      recipient: { ...model.recipient, ...(overrides.recipient || {}) },
      beneficiary: { ...model.beneficiary, ...(overrides.beneficiary || {}) },
      circumstances: { ...model.circumstances, ...(overrides.circumstances || {}) },
      referral: { ...model.referral, ...(overrides.referral || {}) },
    };
  }

  return model;
}
