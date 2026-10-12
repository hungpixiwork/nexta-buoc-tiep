/**
 * BỘ CHUẨN HÓA TIẾNG LÓNG & TỪ ĐỊA PHƯƠNG VIỆT NAM (VIETNAMESE SLANG & DIALECT MAPPER)
 * Thiết kế siêu nhẹ, 0ms latency, chạy native trên Cloudflare Workers.
 */

export interface SlangNormalizationResult {
  originalText: string;
  normalizedText: string;
  detectedSlangs: Array<{ slang: string; standard: string }>;
}

export const VIETNAMESE_SLANG_DICTIONARY: Record<string, string> = {
  // Từ viết tắt phổ biến
  "ko": "không",
  "k": "không",
  "khg": "không",
  "dc": "được",
  "đc": "được",
  "bt": "bình thường",
  "stt": "trạng thái",
  "sp": "sản phẩm",
  "tphcm": "Thành phố Hồ Chí Minh",
  "sg": "Sài Gòn",
  "hn": "Hà Nội",
  "cty": "công ty",
  "nv": "nhân viên",
  "vt": "vị trí",

  // Slang giới trẻ & MXH
  "xịn xò": "chất lượng cao",
  "xin xo": "chất lượng cao",
  "chốt đơn": "xác nhận đăng ký",
  "chot don": "xác nhận đăng ký",
  "chill": "thư giãn",
  "vibe": "không khí",
  "ét o ét": "cứu hộ khẩn cấp",
  "sos": "cứu hộ khẩn cấp",
  "keo lỳ": "chắc chắn",
  "xỉu up xỉu down": "rất mệt mỏi",
  "hỏng ổn": "không ổn định",
  "hong on": "không ổn định",
  "trộm vía": "may mắn",
  "bất ổn": "gặp khó khăn",
  "gank": "hỗ trợ gánh vác",
  "out trình": "vượt trội",
  "mlem": "rất tốt",

  // Từ lóng / địa phương thanh niên yếu thế & vùng miền
  "mình ên": "một mình",
  "minh en": "một mình",
  "mần": "làm việc",
  "mần ăn": "làm ăn kinh doanh",
  "kiếm cơm": "tìm việc làm thu nhập",
  "bỏ phố về quê": "thất nghiệp về quê",
  "túng thiếu": "khó khăn tài chính",
  "kẹt tiền": "thiếu hụt tài chính",
  "hết nấc": "tối đa",
  "ngon lành": "rất thuận lợi",
  "bể show": "thất bại công việc",
  "vỡ nợ": "khó khăn tài chính nghiêm trọng",
  "đi bụi": "bỏ nhà đi",
  "ngủ bụi": "vô gia cư, tá túc ngoài đường",
  "ngu bui": "vô gia cư, tá túc ngoài đường",
  "cơ nhỡ": "hoàn cảnh đặc biệt khó khăn",
  "bảo trợ": "hỗ trợ an sinh",
  "năm xị": "500.000 VNĐ",
  "nam xi": "500.000 VNĐ",
  "một chai": "1.000.000 VNĐ",
  "mot chai": "1.000.000 VNĐ",
  "chạy vé": "tìm đường thoát hoặc làm giấy tờ khẩn",
  "chay ve": "tìm đường thoát hoặc làm giấy tờ khẩn",
  "giữ giấy": "bị giữ căn cước công dân hoặc giấy tờ tùy thân",
  "giu giay": "bị giữ căn cước công dân hoặc giấy tờ tùy thân",
  "bị lùa": "bị lừa đảo việc làm hoặc bóc lột lao động",
  "bi lua": "bị lừa đảo việc làm hoặc bóc lột lao động",
  "app đen": "ứng dụng tín dụng đen hoặc cho vay lãi nặng",
  "app den": "ứng dụng tín dụng đen hoặc cho vay lãi nặng"
};

/**
 * Chuẩn hóa câu nói tiếng Việt chứa tiếng lóng
 */
export function normalizeVietnameseSlang(text: string): SlangNormalizationResult {
  if (!text || typeof text !== "string") {
    return { originalText: "", normalizedText: "", detectedSlangs: [] };
  }

  let normalized = text;
  const detectedSlangs: Array<{ slang: string; standard: string }> = [];

  // Sắp xếp các từ lóng theo độ dài giảm dần để ưu tiên thay thế cụm từ dài trước
  const sortedSlangs = Object.keys(VIETNAMESE_SLANG_DICTIONARY).sort((a, b) => b.length - a.length);

  for (const slang of sortedSlangs) {
    const replacement = VIETNAMESE_SLANG_DICTIONARY[slang];
    // Regex tìm từ độc lập (word boundary hỗ trợ tiếng Việt)
    const regex = new RegExp(`(?:^|\\s)${escapeRegExp(slang)}(?=\\s|$|[.,!?])`, "gi");

    if (regex.test(normalized)) {
      detectedSlangs.push({ slang, standard: replacement });
      normalized = normalized.replace(regex, (match) => {
        // Giữ lại khoảng trắng đầu nếu có
        const hasLeadingSpace = match.startsWith(" ");
        return (hasLeadingSpace ? " " : "") + replacement;
      });
    }
  }

  return {
    originalText: text,
    normalizedText: normalized.trim(),
    detectedSlangs
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
