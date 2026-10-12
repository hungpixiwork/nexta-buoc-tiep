# 07 — Pilot MVP của NEXTA

Nguyên tắc: không giữ mọi tính năng. Mỗi vai trò chỉ giữ những workflow tạo ra giá trị thật.

Một workflow được coi là **xong** khi chạy đủ chuỗi: giao diện → API → luật → lưu D1 → kết quả → phản hồi cho người dùng. Danh sách màn hình chi tiết: `.claude/skills/nexta-screen/screens.md`.

## 1. Bảng vai trò → việc → màn hình

| Vai trò | Việc cần làm | Workflow | Màn hình | API | Dữ liệu | AI / tự động | Người kiểm tra | Kết quả |
|---|---|---|---|---|---|---|---|---|
| Người đồng hành (web + app) | Gặp người mới một cách an toàn | Ghi sự đồng ý → ghi quan sát | W3 / A3 | `POST loop/cases` (kèm sự đồng ý) | `loop_cases`, `loop_facts`, `loop_case_scope` | Không | Sự đồng ý bằng lời | Hành trình mới |
| Người đồng hành | Hiểu nhu cầu do chính người đó nói ra | Nhu cầu, nơi ở, tuổi, điểm mạnh | W4 (khối Hiểu nhu cầu) | `PUT loop/cases/:id/understanding`, `POST loop/assist/structure` | `loop_facts` | AI gợi ý câu nên hỏi thêm | Người đồng hành chọn dùng hay không | Dữ kiện có ghi nguồn gốc |
| Người đồng hành / điều phối viên | Không đưa ai vào chỗ nguy hiểm | Kiểm tra an toàn | W4 (khối An toàn), W7, A6 | `loop/cases/:id/risk-gate`, `risk-review` | `loop_escalations` | Luật `RiskGate` | Điều phối viên xem xét; 111 | Tiếp tục / giữ lại / gọi 111 |
| Người đồng hành | Đưa tới nơi hỗ trợ **đã xác minh** | Tìm nơi phù hợp → thống nhất bước tiếp → xác nhận đã gọi cho nơi đó | W4 (khối Tìm nơi phù hợp), A5 | `loop/match`, `next-steps`, `confirm` | `loop_matches`, `loop_next_steps`, `loop_referrals`, `loop_follow_ups` | Luật `MatchPipeline` + `reasonText` | "Tôi đã gọi cho nơi hỗ trợ" | Chuyển gửi + hẹn hỏi thăm sau 48 giờ |
| Người đồng hành / đơn vị hỗ trợ | Giao hồ sơ bằng giấy tờ | Mẫu 07 | W4, W6 | Tạo trên client từ dữ liệu đã có sự đồng ý | — | Không | Người đồng hành in hoặc gửi | File `.docx` |
| Đơn vị hỗ trợ | Nhận hoặc từ chối trong hạn | Hộp yêu cầu | W6 | `GET loop/referrals`, `POST …/actions`, `…/questions` | `loop_referrals`, `loop_referral_events` | Luật `ReferralLoop` | Đơn vị hỗ trợ quyết định | Đổi trạng thái + ghi sự kiện |
| Người đồng hành | Biết người đó có thật sự được giúp không | Hỏi thăm 48 giờ | W5, A4, W1, A2 | `loop/follow-ups` | `loop_follow_ups` | Luật hạn hỏi thăm | Người đồng hành ghi kết quả | Tốt hơn / như cũ / khó hơn / không liên lạc được |
| Điều phối viên | Không để hành trình nào bị bỏ rơi | Hàng đợi quyết định | W9 | `loop/cases`, `escalations`, `referrals` | — | Luật hạn phản hồi | Điều phối viên | Xử lý việc quá hạn |
| Người mới | Tham gia đúng vai trò | Mã email → đơn → duyệt → tập huấn | W10, W11, A1 | `auth/otp/*`, `onboarding/*`, `admin/*` | `nx_accounts`, `applications`, `training_completions` | Luật `ScreeningEngine` | Điều phối viên duyệt | Tài khoản có vai trò + tổ chức |

## 2. PHẢI CÓ (MUST SHIP)
- Toàn bộ các dòng trong bảng trên, chạy thật trên cả web lẫn app. App đi qua loop theo **D1-A**.
- Đăng nhập thống nhất (§4).
- Các bản vá bảo mật P0.
- Chặn trẻ em ở mọi đường ghi; nút 111 thật.
- Test cho: phạm vi tổ chức, chặn trẻ em, chuyển trạng thái, đăng nhập.
- Có seed demo chạy qua API thật.

## 3. NÊN CÓ · ĐỂ SAU · ẨN / BỎ
- **NÊN CÓ:** xác minh nơi hỗ trợ và sức chứa (W8), tập huấn (W10), danh sách hành trình trong app (A2), xem xét an toàn trong app (A6, chỉ vai điều phối viên), báo lừa đảo (MIL incident).
- **ĐỂ SAU:** QR credential, Hộ chiếu sinh kế, nhận giọng nói trên native, realtime Durable Object, báo cáo cho nhà tài trợ (Reports), sổ tài chính (Finance).
- **ẨN / BỎ khỏi MVP:**
  - Web: Campaigns, Missions, Signals, Living Lab, `/legacy`.
  - API: số liệu giả `impact` / `analytics` / `/public`; Hermes; A2A; MIL cards.
  - App: các màn Tác động, Đội nhóm, Thẻ thông tin xác minh, Hộ chiếu sinh kế.

## 4. Luồng đăng nhập thống nhất (mục tiêu)

Học từ an-tam: **một phiên, một kiểu token, một chỗ kiểm tra**. Thay JWT ký bằng secret bằng **phiên lưu trong D1**.

```
Đăng nhập (mã email | mật khẩu | demo có mã | Google có kiểm tra aud)
   → tìm hoặc tạo nx_accounts (nguồn danh tính duy nhất; tạo kèm bản sao users cùng id để giữ khóa ngoại cũ)
   → createSession(): tạo token ngẫu nhiên 32 byte; D1 lưu sha256 của token trong bảng sessions (hết hạn sau 30 ngày)
   → client nhận { token, me }   (web lưu localStorage, app lưu AsyncStorage; gửi Authorization: Bearer)
Mỗi request → authMiddleware: tra hash trong sessions ⋈ nx_accounts
   → c.set('user', { userId, role, organizationId, demo })  ← vai trò và tổ chức luôn lấy MỚI từ DB
   → tài khoản SUSPENDED hoặc phiên hết hạn → 401
Đăng xuất → xóa phiên.   Được duyệt / học xong tập huấn → không cần xin lại token, vì vai trò đọc mới mỗi request.
GET /api/auth/me → một dạng dữ liệu cho cả web lẫn app: { account, org, volunteer, trainingPassed }
```

Vì sao đơn giản hơn:
- Bỏ màn nhảy `/onboarding/session` để xin token mới sau khi được duyệt.
- Bỏ 6 chỗ tự `sign()`.
- Bỏ rủi ro lộ `JWT_SECRET`.
- Đăng xuất và khóa tài khoản có hiệu lực ngay.
- Tài khoản demo là tài khoản thật thuộc tổ chức `org-demo`, không còn phạm vi "thấy tất cả".

Vai trò chuẩn nằm ở `packages/shared/src/rbac/roles.ts`: `toUiRole()` và `toActor()` được web, app và API dùng chung.
