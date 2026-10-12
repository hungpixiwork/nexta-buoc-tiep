import { Form07Data } from '../types';
import {
  buildReferralDocumentModel,
  buildReferralDocxBlob,
  downloadReferralDocx,
  ReferralDocumentModel,
} from '../documents/referral';

/**
 * Transforms CaseRecord/Form07Data into Form07Data format using SSOT Model
 */
export function buildForm07DataFromCase(
  caseItem: any,
  overrides: Partial<Form07Data> = {}
): Form07Data {
  const model = buildReferralDocumentModel(caseItem, {
    metadata: {
      formCode: 'MẪU SỐ 07 — NĐ 20/2021/NĐ-CP',
      documentNumber: overrides.officialDocNo || `${(caseItem.aliasName || 'BEN').replace('CASE-', '')}/PCT-BT`,
      referenceId: overrides.referralId || `REF-${caseItem.id || 'case-01'}`,
      passportId: overrides.passportId || (caseItem.beneficiaryId ? `BT-${caseItem.beneficiaryId.toUpperCase()}` : `BT-${(caseItem.id || '01').toUpperCase()}`),
      generatedAt: overrides.createdAt || caseItem.createdAt || new Date().toISOString(),
      isApproved: overrides.isApproved !== undefined ? overrides.isApproved : (caseItem.status === 'referred' || caseItem.status === 'closed'),
      redactPII: overrides.redactPII !== undefined ? overrides.redactPII : Boolean(caseItem.isMinor),
    },
    issuer: {
      city: 'ỦY BAN NHÂN DÂN TP. HỒ CHÍ MINH',
      organization: overrides.issuingDept || 'BAN ĐIỀU HÀNH BƯỚC TIẾP — UNESCO YOUTH HACKATHON 2026',
      officerName: overrides.issuingOfficer || caseItem.assignedTo || 'Cán bộ CTXH Thực địa',
    },
    recipient: {
      agencyName: overrides.resourceName || 'PHÒNG LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI HUYỆN HÓC MÔN',
      address: overrides.address || 'Thị trấn Hóc Môn, Huyện Hóc Môn, TP. Hồ Chí Minh',
    },
    beneficiary: {
      fullName: overrides.fullName || caseItem.fullName || caseItem.aliasName || 'Người thụ hưởng',
      aliasName: overrides.aliasName || caseItem.aliasName || 'BENEFICIARY',
      passportCode: overrides.passportId || `BT-${(caseItem.id || '01').toUpperCase()}`,
      age: overrides.age || caseItem.age || (caseItem.birthYear ? 2026 - caseItem.birthYear : (caseItem.isMinor ? 15 : 62)),
      gender: overrides.gender || caseItem.gender || (caseItem.isMinor ? 'Nam' : 'Nữ'),
      location: overrides.currentArea || caseItem.currentArea || 'Huyện Hóc Môn, TP.HCM',
      vulnerabilityGroup: overrides.vulnerabilityGroup || caseItem.vulnerabilityGroup || (caseItem.isMinor ? 'Trẻ em lang thang' : 'Lao động đường phố'),
      isMinor: Boolean(overrides.isMinor !== undefined ? overrides.isMinor : caseItem.isMinor),
    },
    circumstances: {
      summary: overrides.emergencyReason || caseItem.note || 'Cần hỗ trợ an sinh xã hội khẩn cấp.',
      fieldAssessment: overrides.emergencyReason || caseItem.note || 'Cần hỗ trợ an sinh xã hội khẩn cấp.',
      notes: overrides.notes || 'Biên bản tiếp nhận và đề xuất biện pháp trợ giúp xã hội chuyển tuyến P0 theo NĐ 20/2021/NĐ-CP.',
    },
    referral: {
      proposedMeasures: overrides.proposedMeasures || (caseItem.needCategories?.includes('food') ? ['Nhu yếu phẩm khẩn cấp & Suất ăn dinh dưỡng'] : ['Trợ giúp Y tế ban đầu']),
    },
  });

  return {
    referralId: model.metadata.referenceId,
    officialDocNo: model.metadata.documentNumber,
    caseName: model.beneficiary.fullName,
    aliasName: model.beneficiary.aliasName,
    fullName: model.beneficiary.fullName,
    passportId: model.metadata.passportId,
    age: model.beneficiary.age,
    gender: model.beneficiary.gender,
    currentArea: model.beneficiary.location,
    vulnerabilityGroup: model.beneficiary.vulnerabilityGroup,
    emergencyReason: model.circumstances.fieldAssessment,
    proposedMeasures: model.referral.proposedMeasures,
    resourceName: model.recipient.agencyName,
    address: model.recipient.address,
    isApproved: model.metadata.isApproved,
    isMinor: model.beneficiary.isMinor,
    createdAt: model.metadata.generatedAt,
    notes: model.circumstances.notes || '',
    issuingOfficer: model.issuer.officerName,
    issuingDept: model.issuer.organization,
    redactPII: model.metadata.redactPII,
  };
}

/**
 * Generates DOCX Blob from Form07Data using unified SSOT builder
 */
export async function generateForm07Docx(data: Form07Data): Promise<Blob> {
  const model = buildReferralDocumentModel(data);
  return await buildReferralDocxBlob(model);
}

/**
 * Primary export handler: downloads DOCX conforming 1:1 with UI Preview
 */
export async function handleExportDocx(caseItemOrData: any): Promise<void> {
  const model = buildReferralDocumentModel(caseItemOrData);
  await downloadReferralDocx(model);
}
