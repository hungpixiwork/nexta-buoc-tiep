import { z } from 'zod';

export type MILCategory =
  | 'cyberbullying'
  | 'fake_job_scam'
  | 'deepfake'
  | 'misinformation'
  | 'child_safeguarding'
  | 'digital_identity_safety';

export interface VerifiedInfoCard {
  id: string;
  title: string;
  category: MILCategory;
  summary: string;
  content: string; // Markdown / Plain text hướng dẫn an toàn
  warningSigns: string[]; // Các dấu hiệu nhận biết lừa đảo / rủi ro
  actionSteps: string[]; // Các bước xử lý an toàn (1-Tap Call 111, Báo cáo, Đổi mật khẩu...)
  isVerified: boolean;
  verifiedBy?: string; // Tên tổ chức / Chuyên gia kiểm định (e.g. UNESCO, Cục An toàn thông tin, Tổng đài 111)
  sourceUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const CreateVerifiedInfoCardSchema = z.object({
  title: z.string().min(5, 'Tiêu đề thẻ giáo dục MIL phải có ít nhất 5 ký tự'),
  category: z.enum([
    'cyberbullying',
    'fake_job_scam',
    'deepfake',
    'misinformation',
    'child_safeguarding',
    'digital_identity_safety',
  ]),
  summary: z.string().min(10, 'Tóm tắt nội dung chính thẻ an toàn'),
  content: z.string().min(20, 'Nội dung chi tiết bài học an toàn số MIL'),
  warningSigns: z.array(z.string()).default([]),
  actionSteps: z.array(z.string()).min(1, 'Phải có ít nhất 1 bước hành động hướng dẫn'),
  isVerified: z.boolean().default(true),
  verifiedBy: z.string().optional().default('UNESCO MIL Youth Program & Buoc Tiep Team'),
  sourceUrl: z.string().url('Đường dẫn tham khảo không hợp lệ').optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
});

export type CreateVerifiedInfoCardInput = z.infer<typeof CreateVerifiedInfoCardSchema>;

/**
 * Bộ Thẻ Bài học MIL Mẫu (Preset Verified MIL Cards)
 * Phục vụ người dùng & tình nguyện viên tra cứu chống lừa đảo số & bảo vệ an toàn
 */
export const PRESET_VERIFIED_MIL_CARDS: VerifiedInfoCard[] = [
  {
    id: 'mil-card-01',
    title: 'Nhận biết & Phòng chống Việc làm Giả (Fake Job Scam)',
    category: 'fake_job_scam',
    summary: 'Cảnh báo các thủ đoạn tuyển dụng lừa đảo nhắm vào thanh thiếu niên và người lao động yếu thế.',
    content:
      'Các đối tượng lừa đảo thường lấy danh nghĩa công ty lớn, hứa hẹn "việc nhẹ lương cao", làm việc online tại nhà nhưng yêu cầu nộp cọc tiền giữ chỗ, nạp tiền mua thẻ nạp hoặc mua mã đơn hàng thương mại điện tử. Đây là 100% hình thức lừa đảo tài chính.',
    warningSigns: [
      'Yêu cầu nộp phí hồ sơ, phí cọc thiết bị hoặc chuyển khoản trước khi nhận việc.',
      'Tuyển dụng qua tin nhắn nhắn riêng Zalo/Telegram từ tài khoản ẩn danh, không có hợp đồng lao động.',
      'Hứa hẹn mức thu nhập bất hợp lý 500k - 2 triệu/ngày cho các công việc không yêu cầu kỹ năng.',
    ],
    actionSteps: [
      'Không chuyển tiền cọc hoặc nạp bất kỳ khoản phí nào cho nhà tuyển dụng.',
      'Kiểm tra mã số thuế và trụ sở doanh nghiệp trên cổng thông tin đăng ký kinh doanh quốc gia.',
      'Gọi điện hoặc liên hệ qua email chính thức của doanh nghiệp để xác minh thông tin tuyển dụng.',
      'Báo cáo ngay cho Tình nguyện viên BƯỚC TIẾP hoặc Cục An toàn thông tin (NCSC).',
    ],
    isVerified: true,
    verifiedBy: 'UNESCO Youth Hackathon & Cục ATTT',
    sourceUrl: 'https://khonggianmang.vn',
    tags: ['tuyendung', 'luadao', 'vieclamgia', 'an-toan-tai-chinh'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mil-card-02',
    title: 'Phòng ngừa Lừa đảo Cuộc gọi Video Deepfake (AI Voice & Face)',
    category: 'deepfake',
    summary: 'Kỹ năng nhận diện cuộc gọi mạo danh người thân/cơ quan công an bằng công nghệ AI Deepfake.',
    content:
      'Công nghệ AI cho phép giả mạo khuôn mặt và giọng nói của người thân hoặc cán bộ công an/viện kiểm sát. Đối tượng tạo tình huống khẩn cấp (tai nạn, vi phạm pháp luật) để ép nạn nhân chuyển tiền gấp trong trạng thái hoảng sợ.',
    warningSigns: [
      'Cuộc gọi video ngắn (vài giây) chất lượng mờ giật, hình ảnh chập chờn rồi viện lý do mạng yếu tắt cam.',
      'Yêu cầu chuyển tiền gấp vào khoản ngân hàng tên người lạ, không phải tài khoản chính chủ của người thân.',
      'Xung quanh cuộc gọi có tiếng động lạ, khuôn mặt cử động thiếu tự nhiên hoặc mắt không chớp.',
    ],
    actionSteps: [
      'Tắt máy ngay lập tức và gọi lại cho người thân bằng số điện thoại di động thông thường (SMS/Call di động).',
      'Hỏi các câu hỏi bí mật cá nhân mà chỉ người thân thật mới biết.',
      'Tuyệt đối không chuyển tiền theo yêu cầu khẩn cấp qua cuộc gọi mạng xã hội.',
    ],
    isVerified: true,
    verifiedBy: 'Bộ Thông tin & Truyền thông & Tổng đài 111',
    sourceUrl: 'https://tongdai111.vn',
    tags: ['deepfake', 'ai-scam', 'mao-danh', 'bao-ve-gia-dinh'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mil-card-03',
    title: 'Quy trình Bảo vệ Trẻ em & 1-Tap Call Tổng đài Quốc gia 111',
    category: 'child_safeguarding',
    summary: 'Hướng dẫn can thiệp khẩn cấp khi phát hiện dấu hiệu bạo lực, bóc lột hoặc buôn bán trẻ em.',
    content:
      'Trẻ em dưới 18 tuổi là đối tượng đặc biệt được bảo vệ theo Luật Trẻ em 2016. Khi phát hiện trẻ em có nguy cơ bị xâm hại, bóc lột lao động hoặc dụ dỗ trên mạng, tình nguyện viên và người dân cần kích hoạt luồng hỗ trợ khẩn cấp.',
    warningSigns: [
      'Trẻ em bỏ học, đi làm đêm tại các tụ điểm nguy hiểm hoặc có dấu hiệu thương tích thể xác.',
      'Trẻ bị người lạ nhắn tin dụ dỗ gửi hình ảnh nhạy cảm hoặc hứa hẹn đi xa làm việc thu nhập cao.',
      'Trẻ có biểu hiện hoảng sợ, thu mình hoặc mất kết nối với gia đình.',
    ],
    actionSteps: [
      'Bấm nút "1-Tap Call 111" trên ứng dụng BƯỚC TIẾP để kết nối ngay với Tổng đài Bảo vệ Trẻ em Quốc gia 111.',
      'Ẩn danh vị trí GPS chính xác của trẻ (làm mờ bán kính 500m) để bảo vệ an toàn.',
      'Không tự ý chụp ảnh hay đăng tải thông tin khuôn mặt của trẻ lên mạng xã hội.',
    ],
    isVerified: true,
    verifiedBy: 'Tổng đài Quốc gia Bảo vệ Trẻ em 111',
    sourceUrl: 'https://tongdai111.vn',
    tags: ['tre-em', '111', 'safeguarding', 'khan-cap'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Lọc danh sách thẻ MIL theo danh mục
 */
export function filterCardsByCategory(cards: VerifiedInfoCard[], category?: string): VerifiedInfoCard[] {
  if (!category || category === 'all') return cards;
  return cards.filter(card => card.category === category);
}

/**
 * Tìm kiếm thẻ MIL theo từ khóa
 */
export function searchCardsByKeywords(cards: VerifiedInfoCard[], query: string): VerifiedInfoCard[] {
  if (!query.trim()) return cards;
  const lowerQuery = query.toLowerCase().trim();
  return cards.filter(
    card =>
      card.title.toLowerCase().includes(lowerQuery) ||
      card.summary.toLowerCase().includes(lowerQuery) ||
      card.content.toLowerCase().includes(lowerQuery) ||
      card.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Kiểm tra xem một văn bản (transcript/ghi chú) có chứa các từ khóa dấu hiệu lừa đảo hay không
 */
export function detectScamRiskInText(text: string): {
  isRiskDetected: boolean;
  detectedCategories: MILCategory[];
  matchedKeywords: string[];
} {
  const lowerText = text.toLowerCase();
  const matchedKeywords: string[] = [];
  const detectedCategories: MILCategory[] = [];

  const fakeJobKeywords = ['cọc tiền', 'nạp tiền đơn hàng', 'việc nhẹ lương cao', 'tuyển ctv zalo', 'phí hồ sơ', 'chuyển khoản trước'];
  const deepfakeKeywords = ['chuyển tiền gấp', 'tai nạn khẩn cấp', 'tài khoản công an', 'viện kiểm sát', 'bắt bớ'];
  const childRiskKeywords = ['bỏ học đi làm', 'việc làm ban đêm', 'gửi ảnh nhạy cảm', 'dụ dỗ đi xa', 'lao động trẻ em'];

  fakeJobKeywords.forEach(kw => {
    if (lowerText.includes(kw)) {
      matchedKeywords.push(kw);
      if (!detectedCategories.includes('fake_job_scam')) detectedCategories.push('fake_job_scam');
    }
  });

  deepfakeKeywords.forEach(kw => {
    if (lowerText.includes(kw)) {
      matchedKeywords.push(kw);
      if (!detectedCategories.includes('deepfake')) detectedCategories.push('deepfake');
    }
  });

  childRiskKeywords.forEach(kw => {
    if (lowerText.includes(kw)) {
      matchedKeywords.push(kw);
      if (!detectedCategories.includes('child_safeguarding')) detectedCategories.push('child_safeguarding');
    }
  });

  return {
    isRiskDetected: matchedKeywords.length > 0,
    detectedCategories,
    matchedKeywords,
  };
}
