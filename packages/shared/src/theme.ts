/**
 * BƯỚC TIẾP Design System Tokens (Standard Light Theme for React Native & Web)
 * Tuân thủ nghiêm ngặt nguyên tắc:
 * - Nền sáng (Light background: #F6FAFE, #FFFFFF)
 * - Chữ đậm nét (High contrast text: #16375D, #0F172A, #3A5568)
 * - 0% Glassmorphism (Dễ nhìn, rõ ràng, thực tế, WCAG AAA >= 7:1 đến >= 14.5:1)
 * - Touch Target >= 44x44px
 * - Nhịp spacing 4/8px
 */

export const themeColors = {
  // Nền & Mặt phẳng
  background: '#F6FAFE',        // Nền ứng dụng chính (sáng nhẹ, dịu mắt)
  surface: '#FFFFFF',           // Nền card/sheet trắng tinh
  surfaceSubtle: '#E8F4FC',     // Nền thẻ thông tin nhấn nhẹ
  surfaceHover: '#F1F7FD',      // Nền khi hover trên web
  
  // Thương hiệu & Màu chủ đạo
  primary: '#0284C7',           // Xanh dương UNESCO
  primaryDark: '#0369A1',       // Xanh dương đậm khi active
  primaryNavy: '#16375D',       // Xanh chàm đậm thương hiệu Bước Tiếp (WCAG AAA)
  accentBlue: '#2F80ED',        // Xanh rực rỡ cho nút CTA chính
  lightBlueBg: '#DCEBFB',       // Nền icon tròn xanh nhạt
  
  // Trạng thái & Phân loại
  success: '#16A34A',           // Thành công / Đã xác minh
  successBg: '#F0FDF4',         // Nền card thành công
  successBorder: '#BBF7D0',     // Viền card thành công
  successDark: '#15803D',       // Chữ thành công độ tương phản cao
  
  warning: '#D97706',           // Cảnh báo / Quá hạn SLA
  warningBg: '#FFFBEB',         // Nền card cảnh báo
  warningBorder: '#FDE68A',     // Viền card cảnh báo
  warningDark: '#B45309',       // Chữ cảnh báo độ tương phản cao
  
  danger: '#DC2626',            // Khẩn cấp / Nguy hiểm / Cảnh báo MIL
  dangerBg: '#FEF2F2',          // Nền card khẩn cấp
  dangerBorder: '#FECACA',      // Viền card khẩn cấp
  dangerDark: '#B91C1C',        // Chữ khẩn cấp độ tương phản cao
  
  // Chữ & Viền (WCAG AAA High Contrast)
  textPrimary: '#16375D',       // Chữ tiêu đề chàm đậm (#16375D trên #FFFFFF đạt tỉ lệ 11.2:1)
  textBody: '#3A5568',          // Chữ nội dung rõ ràng (#3A5568 trên #FFFFFF đạt tỉ lệ 7.8:1)
  textMuted: '#475569',         // Chữ phụ / Ghi chú (Slate-600 trên #FFFFFF đạt tỉ lệ 7.0:1)
  textLight: '#FFFFFF',        // Chữ trắng khi nằm trên nút/nền đậm (#2F80ED / #16375D)
  
  border: '#E2E8F0',            // Viền phân cách mặc định rõ nét
  borderDark: '#CBD5E1',        // Viền phân cách đậm hơn
  borderFocus: '#2F80ED',       // Viền khi focus ô nhập
};

export const themeTypography = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '800' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  button: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const },
  badge: { fontSize: 12, lineHeight: 16, fontWeight: '800' as const },
};

export const themeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  bottomBarOffset: 84, // Khoảng cách đệm chống che CTA bởi Bottom Navigation Bar
};

export const themeRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 30,
  circle: 9999,
};

export const themeTouchTarget = {
  minWidth: 44,
  minHeight: 44,
  comfortableWidth: 48,
  comfortableHeight: 48,
};

export const themeShadows = {
  sm: {
    shadowColor: '#16375D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#16375D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
};

