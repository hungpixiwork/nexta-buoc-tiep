/**
 * SSOT Layout & Dimensions Specification for Referral Documents (A4 Standard)
 */

export const TWIPS_PER_INCH = 1440;
export const MM_PER_INCH = 25.4;

/**
 * Chuyển đổi mm sang DXA/Twips (1/20 của 1 point, 1/1440 của 1 inch)
 */
export function mmToTwip(mm: number): number {
  return Math.round((mm / MM_PER_INCH) * TWIPS_PER_INCH);
}

/**
 * Chuyển đổi point sang half-point (dùng cho docx size)
 */
export function ptToHalfPt(pt: number): number {
  return Math.round(pt * 2);
}

export const REFERRAL_DOCUMENT_SPEC = {
  page: {
    size: 'A4' as const,
    widthMm: 210,
    heightMm: 297,
    widthTwips: mmToTwip(210), // 11906 twips
    heightTwips: mmToTwip(297), // 16838 twips
    marginMm: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 25, // Chuẩn văn bản hành chính Việt Nam: Lề trái 25mm để đóng gáy
    },
    marginTwips: {
      top: mmToTwip(20), // 1134 twips
      right: mmToTwip(20), // 1134 twips
      bottom: mmToTwip(20), // 1134 twips
      left: mmToTwip(25), // 1417 twips
    },
  },

  content: {
    // Chiều rộng khả dụng thực tế của nội dung: 210mm - 25mm - 20mm = 165mm
    widthMm: 165,
    widthTwips: mmToTwip(210) - mmToTwip(25) - mmToTwip(20), // 9355 twips

    // Bảng Header 2 cột: 50% / 50%
    headerLeftWidthTwips: Math.round((mmToTwip(210) - mmToTwip(25) - mmToTwip(20)) * 0.5), // 4677 twips
    headerRightWidthTwips: (mmToTwip(210) - mmToTwip(25) - mmToTwip(20)) - Math.round((mmToTwip(210) - mmToTwip(25) - mmToTwip(20)) * 0.5), // 4678 twips

    // Bảng Thông tin Đối tượng: 32% Nhãn / 68% Giá trị
    labelColumnWidthTwips: Math.round((mmToTwip(210) - mmToTwip(25) - mmToTwip(20)) * 0.32), // 2994 twips
    valueColumnWidthTwips: (mmToTwip(210) - mmToTwip(25) - mmToTwip(20)) - Math.round((mmToTwip(210) - mmToTwip(25) - mmToTwip(20)) * 0.32), // 6361 twips

    // Tỷ lệ % tương ứng cho CSS HTML Preview
    labelColPercent: 32,
    valueColPercent: 68,
  },

  typography: {
    fontFamily: "'Times New Roman', Times, serif",
    docTitlePt: 15,
    docSubtitlePt: 11,
    sectionHeadingPt: 12,
    bodyPt: 12,
    smallPt: 10,
    lineHeight: 1.45,
  },

  colors: {
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textNavy: '#16375D',
    textAccent: '#D97706',
    borderLight: '#CBD5E1',
    bgHeader: '#F8FAFC',
    watermarkDraft: 'rgba(239, 68, 68, 0.14)',
    watermarkOfficial: 'rgba(16, 185, 129, 0.12)',
  },
};
