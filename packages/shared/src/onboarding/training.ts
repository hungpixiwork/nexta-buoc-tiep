/**
 * Mandatory Navigator training — four short modules, each with a 3-question check.
 * A volunteer becomes an ACTIVE Navigator only after an approved application AND
 * passing every module (all answers correct; retries allowed).
 */

export interface TrainingQuestion {
  id: string;
  prompt: { vi: string; en: string };
  options: Array<{ vi: string; en: string }>;
  correct: number;
}

export interface TrainingModule {
  code: 'SAFEGUARDING_101' | 'CONSENT_MIN_DATA' | 'SAFE_NEXT_STEP' | 'SCAM_AWARENESS';
  version: string;
  title: { vi: string; en: string };
  minutes: number;
  points: Array<{ vi: string; en: string }>;
  quiz: TrainingQuestion[];
}

const V = '2026-09';

export const TRAINING_MODULES: TrainingModule[] = [
  {
    code: 'SAFEGUARDING_101',
    version: V,
    title: { vi: 'An toàn trước tốc độ', en: 'Safety before speed' },
    minutes: 8,
    points: [
      { vi: 'Thấy trẻ em gặp nguy cơ: không tự xử lý, gọi 111 và báo Điều phối viên.', en: 'A child at risk: do not handle it alone — call 111 and alert the coordinator.' },
      { vi: 'Bạo lực, tự hại, cấp cứu: gọi 113/115 trước, ghi nhận sau.', en: 'Violence, self-harm, medical emergency: call 113/115 first, record later.' },
      { vi: 'Máy chỉ thêm cảnh báo; con người quyết định.', en: 'The machine only adds warnings; people decide.' },
      { vi: 'Không đi một mình vào nơi không an toàn.', en: 'Never go alone into an unsafe place.' },
    ],
    quiz: [
      { id: 's1', prompt: { vi: 'Một em 13 tuổi bán vé số lúc 22h kể bị người lớn giữ tiền. Bạn làm gì trước?', en: 'A 13-year-old selling lottery tickets at 10pm says an adult keeps their money. First step?' }, options: [{ vi: 'Tìm việc làm cho em', en: 'Find the child a job' }, { vi: 'Gọi 111 và báo Điều phối viên', en: 'Call 111 and alert the coordinator' }, { vi: 'Chụp ảnh em để làm bằng chứng', en: 'Photograph the child as evidence' }], correct: 1 },
      { id: 's2', prompt: { vi: 'Máy gợi ý "không có rủi ro" nhưng bạn thấy vết thương. Bạn…', en: 'The machine says "no risk" but you see injuries. You…' }, options: [{ vi: 'Tin máy', en: 'Trust the machine' }, { vi: 'Đánh dấu dấu hiệu bạo lực — con người quyết định', en: 'Flag violence — people decide' }, { vi: 'Bỏ qua', en: 'Ignore it' }], correct: 1 },
      { id: 's3', prompt: { vi: 'Được hẹn gặp trong hẻm vắng lúc tối muộn một mình?', en: 'Asked to meet alone in a dark alley late at night?' }, options: [{ vi: 'Đi ngay cho kịp', en: 'Go right away' }, { vi: 'Đổi địa điểm an toàn hoặc đi cùng người khác', en: 'Move to a safe place or bring someone' }], correct: 1 },
    ],
  },
  {
    code: 'CONSENT_MIN_DATA',
    version: V,
    title: { vi: 'Đồng ý & dữ liệu tối thiểu', en: 'Consent & minimum data' },
    minutes: 6,
    points: [
      { vi: 'Hỏi đồng ý trước khi hỏi thêm; họ có thể dừng bất cứ lúc nào.', en: 'Ask consent before asking more; they can stop any time.' },
      { vi: 'Dùng bí danh; không ghi họ tên đầy đủ, CCCD, số điện thoại.', en: 'Use an alias; never record full name, ID number or phone.' },
      { vi: 'Ảnh không được tải lên; chỉ mô tả điều bạn thấy.', en: 'Photos are never uploaded; describe what you see instead.' },
    ],
    quiz: [
      { id: 'c1', prompt: { vi: 'Nên ghi gì vào ô tên?', en: 'What goes in the name field?' }, options: [{ vi: 'Họ tên đầy đủ', en: 'Full legal name' }, { vi: 'Bí danh như "Cô L."', en: 'An alias like "Ms L."' }, { vi: 'Số CCCD', en: 'ID number' }], correct: 1 },
      { id: 'c2', prompt: { vi: 'Người dân không muốn chia sẻ với đối tác. Bạn…', en: 'The person does not want sharing with the partner. You…' }, options: [{ vi: 'Vẫn gửi chuyển gửi', en: 'Send the referral anyway' }, { vi: 'Tôn trọng; tìm bước tiếp họ tự thực hiện', en: 'Respect it; find a step they can take themselves' }], correct: 1 },
      { id: 'c3', prompt: { vi: 'Họ muốn rút lại đồng ý. Bạn…', en: 'They withdraw consent. You…' }, options: [{ vi: 'Tạo yêu cầu rút đồng ý trong NEXTA', en: 'File a consent-withdrawal request in NEXTA' }, { vi: 'Không cần làm gì', en: 'Do nothing' }], correct: 0 },
    ],
  },
  {
    code: 'SAFE_NEXT_STEP',
    version: V,
    title: { vi: 'Một Bước tiếp an toàn', en: 'One Safe Next Step' },
    minutes: 7,
    points: [
      { vi: 'Một hành động · một người chịu trách nhiệm · một nơi · một thời điểm.', en: 'One action · one owner · one place · one time.' },
      { vi: 'Chỉ dùng nguồn lực đã xác minh; "Cần kiểm tra lại" thì gọi xác nhận trước.', en: 'Use verified resources; "needs re-check" means call first.' },
      { vi: 'Không chuyển gửi nào được biến mất trong im lặng — luôn hỏi thăm kết quả.', en: 'No referral disappears silently — always follow up.' },
    ],
    quiz: [
      { id: 'n1', prompt: { vi: 'Bước tiếp nào đúng chuẩn?', en: 'Which is a proper Safe Next Step?' }, options: [{ vi: '"Cô nên tìm việc"', en: '"You should look for work"' }, { vi: '"8:00 thứ Hai, Navigator đi cùng cô đến TT DVVL Q12 đăng ký tư vấn nghề"', en: '"Mon 8:00, Navigator goes with her to the Q12 job centre to register for counselling"' }], correct: 1 },
      { id: 'n2', prompt: { vi: 'Nguồn lực hiện "Cần kiểm tra lại". Bạn…', en: 'The resource shows "Needs re-check". You…' }, options: [{ vi: 'Gọi xác nhận trước khi cam kết', en: 'Call to confirm before committing' }, { vi: 'Hứa chắc chắn sẽ được nhận', en: 'Promise they will be accepted' }], correct: 0 },
      { id: 'n3', prompt: { vi: 'Đối tác từ chối. Tiếp theo?', en: 'The partner declines. Next?' }, options: [{ vi: 'Khép hồ sơ', en: 'Close the case' }, { vi: 'Cùng người dân chọn bước tiếp khác', en: 'Choose another step with the person' }], correct: 1 },
    ],
  },
  {
    code: 'SCAM_AWARENESS',
    version: V,
    title: { vi: 'Nhận diện lừa đảo', en: 'Spotting scams' },
    minutes: 5,
    points: [
      { vi: '"Việc nhẹ lương cao", "đóng phí hồ sơ", "chuyển tiền gấp" là dấu hiệu cảnh báo.', en: '"Easy high-paid job", "file fee", "urgent transfer" are warning signs.' },
      { vi: 'Không chuyển tiền, không giao giấy tờ gốc; kiểm tra qua kênh chính thức.', en: 'No transfers, no original documents; check via official channels.' },
    ],
    quiz: [
      { id: 'm1', prompt: { vi: 'Tin tuyển dụng yêu cầu nộp 500.000đ phí hồ sơ trước. Đây là…', en: 'A job ad asks for a 500k fee upfront. This is…' }, options: [{ vi: 'Bình thường', en: 'Normal' }, { vi: 'Dấu hiệu lừa đảo — kiểm tra qua TT Dịch vụ việc làm', en: 'A scam sign — check with the Employment Service Centre' }], correct: 1 },
      { id: 'm2', prompt: { vi: 'Ai đó xưng "công an" yêu cầu chuyển tiền gấp. Bạn khuyên…', en: 'Someone claiming to be police demands an urgent transfer. You advise…' }, options: [{ vi: 'Không chuyển, gọi số chính thức để kiểm tra', en: 'Do not transfer; call an official number to check' }, { vi: 'Chuyển để tránh rắc rối', en: 'Pay to avoid trouble' }], correct: 0 },
      { id: 'm3', prompt: { vi: 'NEXTA phát hiện lừa đảo bằng cách nào?', en: 'How does NEXTA detect scams?' }, options: [{ vi: 'Nhận diện mẫu ngôn ngữ, kèm thẻ kiểm chứng', en: 'Language patterns plus a verification card' }, { vi: 'Phân tích deepfake video', en: 'Deepfake video forensics' }], correct: 0 },
    ],
  },
];

export function gradeModule(code: TrainingModule['code'], answers: number[]): { score: number; passed: boolean; wrong: string[] } {
  const m = TRAINING_MODULES.find((x) => x.code === code);
  if (!m) return { score: 0, passed: false, wrong: [] };
  const wrong = m.quiz.filter((q, i) => answers[i] !== q.correct).map((q) => q.id);
  const score = Math.round(((m.quiz.length - wrong.length) / m.quiz.length) * 100);
  return { score, passed: wrong.length === 0, wrong };
}

export function trainingComplete(passedCodes: string[]): boolean {
  return TRAINING_MODULES.every((m) => passedCodes.includes(m.code));
}
