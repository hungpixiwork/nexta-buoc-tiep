import { MILIncidentLog } from '../types';
import { VerifiedInfoCard, MILCategory } from './VerifiedInfoCard';

export interface LearningPolicyRecommendation {
  shouldCreateMILCard: boolean;
  suggestedRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  targetAudience: 'youth' | 'elderly' | 'volunteers' | 'public';
  policyNotes: string[];
}

/**
 * Anonymize sensitive details in text to protect privacy before creating public MIL learning content
 */
export function sanitizeIncidentDescription(text: string): string {
  if (!text) return '';
  return text
    // Mask Vietnamese phone numbers
    .replace(/(0[3|5|7|8|9])+([0-9]{8})\b/g, '09xxxxxxx')
    // Mask credit card / account numbers
    .replace(/\b\d{10,16}\b/g, '[Số tài khoản đã bảo mật]')
    // Mask specific names or addresses
    .replace(/(tên tôi là|tôi tên|anh|chị)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)*)/gi, '$1 [Người dùng]')
    .trim();
}

/**
 * Đánh giá chính sách học tập đảo ngược (MIL Reverse-Learning Policy) từ báo cáo sự cố thực tế
 */
export function evaluateLearningPolicy(
  incidentType: string,
  riskLevel: string
): LearningPolicyRecommendation {
  const policyNotes: string[] = [];
  let shouldCreateMILCard = false;
  let targetAudience: 'youth' | 'elderly' | 'volunteers' | 'public' = 'public';

  if (riskLevel === 'high' || riskLevel === 'critical') {
    shouldCreateMILCard = true;
    policyNotes.push('Sự cố ở mức độ RỦI RO CAO/NGUY CẤP. Ưu tiên chuyển thành Thẻ Cảnh báo MIL giáo dục cộng đồng.');
  } else if (incidentType === 'fake_job_scam' || incidentType === 'cyberbullying') {
    shouldCreateMILCard = true;
    policyNotes.push('Sự cố lừa đảo việc làm / bắt nạt mạng có tần suất lặp lại cao. Nên biên soạn bài học phòng ngừa.');
  }

  if (incidentType === 'fake_job_scam') {
    targetAudience = 'youth';
  } else if (incidentType === 'deepfake') {
    targetAudience = 'elderly';
  } else if (incidentType === 'cyberbullying') {
    targetAudience = 'youth';
  }

  return {
    shouldCreateMILCard,
    suggestedRiskLevel: (riskLevel as any) || 'medium',
    targetAudience,
    policyNotes,
  };
}

/**
 * Tự động chuyển đổi 1 Báo cáo sự cố (MILIncidentLog) thành Thẻ Bài học MIL (VerifiedInfoCard) được ẩn danh hóa 100%
 */
export function convertIncidentToMILCard(
  incident: Partial<Omit<MILIncidentLog, 'incidentType'>> & { incidentType?: string }
): VerifiedInfoCard {
  const sanitizedDesc = sanitizeIncidentDescription(incident.description || '');
  const categoryMap: Record<string, MILCategory> = {
    fake_job_scam: 'fake_job_scam',
    cyberbullying: 'cyberbullying',
    deepfake: 'deepfake',
    misinformation: 'misinformation',
  };

  const category: MILCategory = categoryMap[incident.incidentType || ''] || 'fake_job_scam';
  const cardId = `mil-rev-${incident.id || Date.now()}`;

  let title = 'Bài học An toàn Số từ Sự cố Thực tế';
  if (category === 'fake_job_scam') {
    title = 'Cảnh báo & Bài học: Chiêu trò Lừa đảo Việc làm Mới';
  } else if (category === 'deepfake') {
    title = 'Bài học Nhận diện: Mạo danh Cuộc gọi Video Giả lập';
  } else if (category === 'cyberbullying') {
    title = 'Hướng dẫn Xử lý & Khóa Bảo vệ khi bị Bắt nạt Mạng';
  }

  return {
    id: cardId,
    title,
    category,
    summary: `Thẻ bài học được tổng hợp tự động từ báo cáo sự cố mã #${incident.id || 'N/A'} (Đã ẩn danh hóa 100%).`,
    content: sanitizedDesc,
    warningSigns: [
      'Dấu hiệu được rút ra từ báo cáo thực địa.',
      'Cần kiểm chứng kỹ nguồn gốc thông tin trước khi thực hiện giao dịch hoặc chia sẻ.',
    ],
    actionSteps: [
      'Ngừng mọi giao dịch tài chính hoặc chia sẻ thông tin cá nhân.',
      'Báo cáo sự cố lên hệ thống BƯỚC TIẾP và cơ quan chức năng.',
      'Tham khảo tài liệu hướng dẫn an toàn số UNESCO MIL.',
    ],
    isVerified: true,
    verifiedBy: 'Hệ thống Học tập Đảo ngược BƯỚC TIẾP MIL',
    tags: ['reverse-learning', category, 'incident-converted'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
