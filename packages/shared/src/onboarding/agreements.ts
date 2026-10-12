/**
 * Versioned agreements signed electronically during onboarding (Law 20/2023/QH15 on
 * e-transactions: we record text hash, version, time, signer and email-verified identity).
 *
 * TEMPLATE TEXT — reviewed against Law 91/2025/QH15 (personal data), Law 102/2016/QH13
 * (children) and Law 57/2020/QH14 (youth volunteering), but must be reviewed by a lawyer
 * and the hosting organisation before a live pilot.
 */
import type { ApplicationKind } from './ApplicationLifecycle';

export type AgreementCode =
  | 'TERMS'
  | 'PRIVACY_NOTICE'
  | 'PARTNER_MOU'
  | 'DATA_SHARING'
  | 'VOLUNTEER_AGREEMENT'
  | 'CODE_OF_CONDUCT'
  | 'SAFEGUARDING_POLICY'
  | 'HOST_DPA'
  | 'OBSERVER_TERMS';

export interface Agreement {
  code: AgreementCode;
  version: string;
  title: { vi: string; en: string };
  summary: { vi: string; en: string };
  /** Markdown, Vietnamese is the binding language */
  body: string;
}

const V = '2026-09';
const DISCLAIMER = '\n\n---\n_Văn bản mẫu phiên bản ' + V + '. Cần luật sư và đơn vị chủ trì rà soát trước khi áp dụng chính thức._';

export const AGREEMENTS: Record<AgreementCode, Agreement> = {
  TERMS: {
    code: 'TERMS',
    version: V,
    title: { vi: 'Điều khoản sử dụng NEXTA', en: 'NEXTA Terms of Use' },
    summary: {
      vi: 'NEXTA là công cụ điều hướng hỗ trợ; không thay thế dịch vụ chuyên môn, không thu phí người thụ hưởng.',
      en: 'NEXTA is a support-navigation tool; it does not replace professional services and never charges beneficiaries.',
    },
    body: `# Điều khoản sử dụng NEXTA

1. **Mục đích.** NEXTA giúp Youth Navigator cùng người đang gặp khó khăn thống nhất một Bước tiếp an toàn, kết nối với đơn vị hỗ trợ đã được xác minh và theo dõi tới kết quả.
2. **Không thay thế chuyên môn.** NEXTA không đưa ra chẩn đoán y tế, tư vấn pháp lý hay quyết định hưởng chính sách. Quyết định có hậu quả luôn do con người có thẩm quyền đưa ra.
3. **Miễn phí cho người thụ hưởng.** Không ai được thu tiền, quà hay lợi ích của người thụ hưởng thông qua NEXTA. Vi phạm dẫn tới đình chỉ tài khoản và thông báo cơ quan có thẩm quyền.
4. **Tài khoản.** Mỗi tài khoản gắn với một email đã xác thực và một vai trò được phê duyệt. Không chia sẻ mã đăng nhập.
5. **AI chỉ gợi ý.** Nội dung do máy gợi ý luôn được gắn nhãn và phải được người dùng kiểm tra.
6. **Khẩn cấp.** Trong tình huống nguy hiểm, gọi 113/114/115 hoặc 111 (bảo vệ trẻ em) trước khi dùng NEXTA.
7. **Tạm ngưng.** Điều phối viên có thể tạm ngưng tài khoản khi có dấu hiệu gây hại, lừa đảo hoặc vi phạm quy tắc.
8. **Khiếu nại.** Gửi qua mục Quyền dữ liệu & Khiếu nại trong ứng dụng; phản hồi trong 10 ngày làm việc.${DISCLAIMER}`,
  },
  PRIVACY_NOTICE: {
    code: 'PRIVACY_NOTICE',
    version: V,
    title: { vi: 'Thông báo xử lý dữ liệu cá nhân', en: 'Personal Data Processing Notice' },
    summary: {
      vi: 'Chỉ thu dữ liệu tối thiểu; bí danh thay họ tên; không lưu CCCD, ảnh hay số điện thoại người thụ hưởng.',
      en: 'Minimum data only; aliases instead of names; no ID numbers, photos or beneficiary phone numbers are stored.',
    },
    body: `# Thông báo xử lý dữ liệu cá nhân (theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15)

**Bên kiểm soát dữ liệu:** Đơn vị chủ trì Living Lab tại địa bàn. **Bên xử lý dữ liệu:** nhóm vận hành NEXTA theo thỏa thuận xử lý dữ liệu.

| Nhóm dữ liệu | Mục đích | Thời hạn lưu |
|---|---|---|
| Người thụ hưởng: bí danh, cách xưng hô, nhu cầu, khu vực, tuổi ước lượng, điểm mạnh, ghi chú quan sát | Tìm và theo dõi một Bước tiếp an toàn | Tối đa 12 tháng sau khi khép hành trình, sau đó ẩn danh hóa |
| Dấu hiệu an toàn (có trẻ em, bạo lực, y tế khẩn) — **dữ liệu nhạy cảm** | Bảo vệ con người, chuyển cấp đúng lúc | Như trên; chỉ Điều phối viên được xem |
| Navigator, đối tác, đơn vị chủ trì: họ tên, email, chức danh, tổ chức | Xác thực, phân quyền, trách nhiệm giải trình | Trong thời gian tham gia + 24 tháng |
| Nhật ký hệ thống (ai làm gì, khi nào) | Kiểm toán, an toàn | 24 tháng |

- **Căn cứ:** sự đồng ý rõ ràng, có thể rút lại; bảo vệ tính mạng, sức khỏe trong tình huống khẩn cấp.
- **Không thu:** họ tên đầy đủ, số CCCD, ảnh, số điện thoại của người thụ hưởng; thông tin về trẻ em.
- **Chia sẻ:** chỉ với đối tác nhận chuyển gửi, và chỉ bí danh + nhu cầu + bước tiếp đã thống nhất.
- **Quyền của chủ thể:** được biết, xem, chỉnh sửa, xóa, rút đồng ý, phản đối, khiếu nại — gửi yêu cầu trong ứng dụng; xử lý trong tối đa 10 ngày làm việc.
- **Lưu trữ:** trên hạ tầng đám mây có mã hóa khi truyền; dữ liệu định danh được thiết kế để có thể chuyển về máy chủ tại Việt Nam khi cần.
- **Sự cố:** thông báo cho đơn vị chủ trì và cơ quan có thẩm quyền theo thời hạn luật định.${DISCLAIMER}`,
  },
  PARTNER_MOU: {
    code: 'PARTNER_MOU',
    version: V,
    title: { vi: 'Biên bản ghi nhớ hợp tác Đối tác', en: 'Partner Memorandum of Understanding' },
    summary: {
      vi: 'Đối tác cam kết phản hồi chuyển gửi trong 48 giờ, cập nhật sức chứa hàng tuần, không thu phí trái quy định.',
      en: 'Partners commit to answer referrals within 48h, update capacity weekly and never charge unlawful fees.',
    },
    body: `# Biên bản ghi nhớ hợp tác (Đối tác nhận chuyển gửi)

1. **Phản hồi:** nhận hoặc từ chối (kèm lý do) mọi chuyển gửi trong **48 giờ làm việc**. Không chuyển gửi nào được bỏ im lặng.
2. **Thông tin dịch vụ đúng sự thật:** tên dịch vụ, đối tượng, điều kiện, địa điểm, giờ làm việc, chi phí (nếu có).
3. **Sức chứa:** cập nhật tình trạng tiếp nhận ít nhất **mỗi tuần**; báo ngay khi tạm dừng.
4. **Không thu phí trái quy định** và không đặt điều kiện bất lợi với người được giới thiệu.
5. **Ghi nhận kết quả:** đánh dấu "Đã thực hiện hỗ trợ" và kết quả khi có.
6. **Xác minh:** đồng ý để NEXTA gọi điện/đến kiểm tra định kỳ (90 ngày) và hiển thị ngày xác minh công khai.
7. **Không độc quyền, không tài chính:** biên bản không phát sinh nghĩa vụ thanh toán giữa các bên.
8. **Chấm dứt:** mỗi bên có thể chấm dứt bằng thông báo 15 ngày; các chuyển gửi đang mở vẫn phải được khép lại.${DISCLAIMER}`,
  },
  DATA_SHARING: {
    code: 'DATA_SHARING',
    version: V,
    title: { vi: 'Thỏa thuận chia sẻ dữ liệu tối thiểu', en: 'Minimum Data-Sharing Agreement' },
    summary: {
      vi: 'Đối tác chỉ nhận bí danh, nhu cầu và bước tiếp; không sao chép ra ngoài, xóa khi hết mục đích.',
      en: 'Partners receive alias, need and next step only; no copying out; delete when the purpose ends.',
    },
    body: `# Thỏa thuận chia sẻ dữ liệu tối thiểu

1. Dữ liệu nhận qua NEXTA **chỉ** dùng để cung cấp dịch vụ đã thống nhất cho người được giới thiệu.
2. Không sao chép, bán, công bố hoặc dùng cho mục đích tiếp thị, gây quỹ, truyền thông.
3. Chỉ nhân sự được phân công mới truy cập; mỗi người một tài khoản.
4. Báo sự cố lộ lọt cho Điều phối viên NEXTA **trong 24 giờ** kể từ khi phát hiện.
5. Xóa dữ liệu ngoài hệ thống (nếu có) khi dịch vụ kết thúc hoặc khi người thụ hưởng rút đồng ý.
6. Thông tin liên quan trẻ em hoặc nguy cơ xâm hại: không lưu, không chia sẻ; báo ngay 111 theo Luật Trẻ em 2016.${DISCLAIMER}`,
  },
  VOLUNTEER_AGREEMENT: {
    code: 'VOLUNTEER_AGREEMENT',
    version: V,
    title: { vi: 'Thỏa thuận Tình nguyện viên (Youth Navigator)', en: 'Volunteer Agreement (Youth Navigator)' },
    summary: {
      vi: 'Tình nguyện, không lương; được đào tạo, cấp chứng nhận; hoạt động dưới sự quản lý của đơn vị chủ trì.',
      en: 'Unpaid volunteering; trained and certified; supervised by the host organisation.',
    },
    body: `# Thỏa thuận Tình nguyện viên (theo tinh thần Luật Thanh niên 57/2020/QH14)

1. **Tư cách:** tình nguyện, không hưởng lương; có thể nhận hỗ trợ chi phí đi lại/liên lạc theo quy định của đơn vị chủ trì.
2. **Điều kiện:** đủ **18 tuổi**, hoàn thành 4 học phần đào tạo bắt buộc trước khi tiếp nhận hành trình.
3. **Quản lý:** hoạt động dưới sự điều phối của đơn vị chủ trì và Điều phối viên; tuân thủ Quy tắc ứng xử và Chính sách bảo vệ.
4. **Phạm vi:** lắng nghe, ghi nhận có đồng ý, cùng thống nhất bước tiếp, theo dõi. **Không** tư vấn y tế/pháp lý, không hứa hẹn kết quả, không nhận tiền/quà.
5. **An toàn cá nhân:** không đi một mình vào nơi không an toàn; dừng và báo Điều phối viên khi thấy nguy hiểm.
6. **Bảo hiểm:** đơn vị chủ trì mua bảo hiểm tai nạn cho thời gian hoạt động (nếu thỏa thuận).
7. **Chứng nhận:** được cấp giấy chứng nhận tham gia khi hoàn thành chương trình.
8. **Dừng tham gia:** báo trước 7 ngày và bàn giao các hành trình đang mở.${DISCLAIMER}`,
  },
  CODE_OF_CONDUCT: {
    code: 'CODE_OF_CONDUCT',
    version: V,
    title: { vi: 'Quy tắc ứng xử', en: 'Code of Conduct' },
    summary: { vi: 'Tôn trọng phẩm giá, không phán xét, không lợi dụng, bảo mật.', en: 'Dignity, no judgement, no exploitation, confidentiality.' },
    body: `# Quy tắc ứng xử

- Tôn trọng phẩm giá và lựa chọn của người đối diện; dùng cách xưng hô họ muốn.
- Không phán xét, không ép buộc, không hứa điều không chắc chắn.
- Không nhận tiền, quà, ân huệ; không quan hệ cá nhân/tình cảm với người thụ hưởng.
- Không chụp ảnh, ghi âm, đăng mạng xã hội về người thụ hưởng.
- Giữ bí mật mọi thông tin biết được; chỉ ghi dữ liệu tối thiểu vào NEXTA.
- Không tiếp xúc riêng với trẻ em; mọi dấu hiệu nguy cơ với trẻ phải báo ngay.
- Báo cáo trung thực, kể cả khi bước tiếp không thành công.${DISCLAIMER}`,
  },
  SAFEGUARDING_POLICY: {
    code: 'SAFEGUARDING_POLICY',
    version: V,
    title: { vi: 'Chính sách bảo vệ an toàn', en: 'Safeguarding Policy' },
    summary: { vi: 'An toàn trước tốc độ. Trẻ em không phải đối tượng khách hàng. Gọi 111 khi có nguy cơ.', en: 'Safety before speed. Children are never a customer segment. Call 111 when at risk.' },
    body: `# Chính sách bảo vệ an toàn

1. **An toàn trước tốc độ:** mọi hành trình qua Kiểm tra an toàn (luật cố định) trước khi tìm nguồn lực.
2. **Trẻ em (<18):** không thu thập dữ liệu, không giới thiệu việc làm; chuyển Điều phối viên xem xét và gọi **111** khi có dấu hiệu xâm hại, bóc lột (Luật Trẻ em 102/2016/QH13).
3. **Khẩn cấp:** bạo lực, tự hại, cấp cứu y tế → gọi 113/115/111 ngay, sau đó ghi nhận trong NEXTA.
4. **AI không quyết định:** máy chỉ được thêm cảnh báo, không được gỡ hay hạ mức cảnh báo.
5. **Đầu mối:** mỗi đơn vị chủ trì có một Cán bộ bảo vệ an toàn; sự cố được xử lý trong 24 giờ.
6. **Tố giác an toàn:** người báo cáo sự cố một cách thiện chí được bảo vệ.${DISCLAIMER}`,
  },
  HOST_DPA: {
    code: 'HOST_DPA',
    version: V,
    title: { vi: 'Thỏa thuận Đơn vị chủ trì & xử lý dữ liệu', en: 'Host Organisation & Data Processing Agreement' },
    summary: {
      vi: 'Đơn vị chủ trì là bên kiểm soát dữ liệu tại địa bàn; NEXTA xử lý dữ liệu theo chỉ dẫn; chỉ định đầu mối dữ liệu và an toàn.',
      en: 'The host is the data controller locally; NEXTA processes on its instructions; data and safeguarding leads are named.',
    },
    body: `# Thỏa thuận Đơn vị chủ trì Living Lab & Xử lý dữ liệu

1. **Vai trò:** Đơn vị chủ trì là **bên kiểm soát dữ liệu** cho các hành trình tại địa bàn; nhóm NEXTA là **bên xử lý dữ liệu** và chỉ xử lý theo mục đích tại Thông báo xử lý dữ liệu.
2. **Đầu mối:** chỉ định (a) đầu mối bảo vệ dữ liệu, (b) Cán bộ bảo vệ an toàn.
3. **Tình nguyện viên:** tuyển chọn, duyệt, quản lý Navigator của đơn vị; bảo đảm hoàn thành đào tạo.
4. **Hồ sơ đánh giá tác động** xử lý dữ liệu cá nhân được lập chung trước khi bắt đầu pilot.
5. **Tài chính:** mọi khoản tài trợ, hỗ trợ cho hoạt động đi qua tài khoản của đơn vị chủ trì/đơn vị bảo trợ, công khai định kỳ; NEXTA không thu tiền mặt.
6. **Kết thúc:** dữ liệu được trả lại hoặc xóa/ẩn danh hóa theo yêu cầu của đơn vị chủ trì trong 30 ngày.${DISCLAIMER}`,
  },
  OBSERVER_TERMS: {
    code: 'OBSERVER_TERMS',
    version: V,
    title: { vi: 'Điều khoản Quan sát viên / Nhà tài trợ', en: 'Observer / Funder Terms' },
    summary: { vi: 'Chỉ xem số liệu tổng hợp, không truy cập hồ sơ cá nhân.', en: 'Aggregate figures only, no access to personal records.' },
    body: `# Điều khoản Quan sát viên / Nhà tài trợ

1. Quyền truy cập chỉ gồm **số liệu tổng hợp** (tỉ lệ, số lượng) — không có hồ sơ cá nhân, không có bí danh.
2. Không công bố số liệu nhỏ hơn 5 trường hợp ở một nhóm để tránh nhận diện ngược.
3. Trích dẫn số liệu phải ghi nguồn "NEXTA Living Lab" và thời điểm.
4. Tài trợ (nếu có) được thực hiện qua tài khoản của đơn vị chủ trì/bảo trợ và tuân thủ quy định về viện trợ, vận động đóng góp.${DISCLAIMER}`,
  },
};

export const REQUIRED_AGREEMENTS: Record<ApplicationKind, AgreementCode[]> = {
  PARTNER: ['TERMS', 'PRIVACY_NOTICE', 'PARTNER_MOU', 'DATA_SHARING', 'SAFEGUARDING_POLICY'],
  VOLUNTEER: ['TERMS', 'PRIVACY_NOTICE', 'VOLUNTEER_AGREEMENT', 'CODE_OF_CONDUCT', 'SAFEGUARDING_POLICY'],
  HOST: ['TERMS', 'PRIVACY_NOTICE', 'HOST_DPA', 'SAFEGUARDING_POLICY'],
  OBSERVER: ['TERMS', 'PRIVACY_NOTICE', 'OBSERVER_TERMS'],
};

export function missingAgreements(kind: ApplicationKind, accepted: string[]): AgreementCode[] {
  return REQUIRED_AGREEMENTS[kind].filter((c) => !accepted.includes(c));
}
