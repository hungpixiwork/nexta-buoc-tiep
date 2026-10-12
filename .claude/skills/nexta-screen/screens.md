# Màn hình pilot NEXTA — người dùng, việc chính, khối, dữ liệu

Nguồn: `docs/audit/01..07`. Thứ tự làm và phụ thuộc xem ở `docs/audit/08-implementation-plan.md`.
Nhân vật demo dùng chung cho mọi màn:
- **Chị Mai** — người đồng hành, Hóc Môn.
- **Anh Tùng** — 34 tuổi, bán vé số, cần việc làm ổn định.
- **Bé Na** — `CHILD-2026-…`, 15 tuổi, dùng để thử luật trẻ em.
- **Trung tâm DVVL Hóc Môn** — đơn vị hỗ trợ.
- **Anh Khoa** — điều phối viên.

Toàn bộ dữ liệu demo tạo qua `scripts/seed-demo.mjs` gọi API thật.

## Web (`apps/web`) — backend `/api/v1/loop`, `/api/v1/onboarding`, `/api/v1/admin`

| Mã | Màn hình | Route | Thư mục | Người dùng | Việc chính (1 nút) |
|---|---|---|---|---|---|
| W1 | Hôm nay | `/navigator` | `features/navigator/today/` | Người đồng hành | Mở hành trình cần làm tiếp |
| W2 | Hành trình của tôi | `/journeys` | `features/navigator/journeys/` | Người đồng hành, điều phối viên | Tìm và mở một hành trình |
| W3 | Gặp người mới | `/journeys/new` | `features/navigator/new-journey/` | Người đồng hành | Ghi sự đồng ý **rồi mới** ghi quan sát |
| W4 | Hành trình (chi tiết) | `/journeys/:id` | `features/navigator/journey/` | Người đồng hành | Làm bước tiếp theo của hành trình |
| W5 | Hỏi thăm | `/navigator/follow-ups` | `features/navigator/follow-ups/` | Người đồng hành | Ghi kết quả hỏi thăm |
| W6 | Yêu cầu chuyển gửi | `/partner` | `features/partner/inbox/` | Đơn vị hỗ trợ | Nhận / cần thêm thông tin / từ chối |
| W7 | Kiểm tra an toàn | `/coordinator/safety` | `features/coordinator/safety/` | Điều phối viên | Xem xét và quyết định |
| W8 | Nơi hỗ trợ | `/directory` | `features/directory/` | Mọi vai trò | Xác minh lại / thêm nơi hỗ trợ |
| W9 | Điều phối | `/coordinator` | `features/coordinator/overview/` | Điều phối viên | Xử lý việc quá hạn đầu tiên |
| W10 | Đăng nhập & đăng ký tham gia | `/login`, `/join` | `features/onboarding/` | Người mới | Nhận mã email, vào đúng trang theo vai trò |
| W11 | Duyệt đăng ký | `/admin/approvals` | `features/onboarding/approvals/` | Điều phối viên | Duyệt / cần thêm / từ chối |

### W1 Hôm nay
- **Khối:**
  - `StatusStrip`: số việc quá hạn / hôm nay / đang chờ đơn vị. Mỗi ô là link lọc; khi đang tải hiện "—".
  - `NextActionList`: mỗi dòng gồm việc cần làm tiếp + vì sao + nút.
  - `DueFollowUps`.
- **Dữ liệu:** `GET loop/cases?status=OPEN`, `GET loop/follow-ups`.
- **Luật:** `lib/caseSignals.ts`. Chuyển gửi bị **từ chối** phải quay lại danh sách "Cần tìm nơi khác" (lỗi I-08).
- **Bỏ:** mẹo gõ cứng (`TodayPage.tsx:54-60`) và 2 nút cùng dẫn tới 1 chỗ.

### W3 Gặp người mới
- **Luồng mới:**
  1. Biệt danh + ô xác nhận "Người này đồng ý cho ghi lại" (bắt buộc) + chia sẻ với ai.
  2. Quan sát ngắn / từ khóa.
- **Dữ liệu:** `POST loop/cases` nhận luôn `consent`. Chưa có sự đồng ý thì chỉ lưu biệt danh (lỗi I-15).
- **Bỏ:** tab chụp ảnh (không lưu gì) và nhãn khảo sát.

### W4 Hành trình (chi tiết)
- **Khối:** thanh bước (đủ 7 bước, **có** bước Sự đồng ý) → khối của bước hiện tại → lịch sử.
  - Các khối bước: `ConsentPanel`, `UnderstandPanel`, `RiskPanel`, `MatchStepPanel`, `ConnectedPanel`.
- **Thêm:**
  - Nút **"Tải Mẫu 07"** trong `ConnectedPanel` (chuyển `documents/referral/*` từ legacy sang).
  - Hiện câu hỏi của đơn vị hỗ trợ kèm nút "Trả lời".
- **Luật:** `RiskGate` (con người quyết định), `ReferralLoop` (chuyển trạng thái).
- **Sửa:** nhãn nguồn gốc dữ kiện đang ngược (`UnderstandPanel.tsx:48`).

### W6 Yêu cầu chuyển gửi (đơn vị hỗ trợ)
- **Khối:**
  - Danh sách: biệt danh, nhóm tuổi, quận, hạn phản hồi. Nút hành động **chỉ đặt ở khung chi tiết**.
  - Khung chi tiết: vì sao gửi tới đây (lấy từ `reasonText` của lần tìm nơi phù hợp, không gõ cứng) + Mẫu 07.
- **Dữ liệu:** `GET loop/referrals`, `POST loop/referrals/:id/actions` (có Idempotency-Key).
- **Sửa:** khi không tải được danh mục thì báo lỗi, không hiện "Tạm dừng".

### W7 Kiểm tra an toàn
- Nếu không tải được danh sách hành trình thì **không** hiện nút "Đánh dấu đã xử lý"; hiện lỗi và nút thử lại (lỗi I-15).
- Phân biệt "đang giữ lại chờ xem xét" và "đã báo điều phối viên" bằng `escalation.kind`, không suy từ hành trình.

### W9 Điều phối
- Hàng đợi quyết định: quá hạn phản hồi → bị từ chối cần tìm nơi khác → chờ xem xét an toàn.
- Mỗi ô số phải là link tới đúng danh sách.

## App (`apps/app`, Expo) — backend: 4 việc lõi đi qua `/api/v1/loop` (quyết định D1-A), phần còn lại dùng API cũ đã khóa quyền

| Mã | Màn hình | File | Người dùng | Việc chính |
|---|---|---|---|---|
| A1 | Đăng nhập | `LoginScreen.tsx` | Mọi người | Mã email (chính), mật khẩu (tài khoản pilot), demo (cần mã) |
| A2 | Hôm nay | `HomeScreen.tsx` | Người đồng hành | Mở người cần hỏi thăm tiếp |
| A3 | Gặp người mới | `PhotoIntakeScreen.tsx` + `VoiceListeningScreen.tsx` → 1 màn | Người đồng hành | Có sự đồng ý → ghi nhu cầu → gửi |
| A4 | Hỏi thăm | `CheckInScreen.tsx` | Người đồng hành | Ghi kết quả hỏi thăm |
| A5 | Tìm nơi hỗ trợ | `ResourceDirectoryScreen.tsx` | Người đồng hành | Chuyển gửi tới nơi đã xác minh |
| A6 | Kiểm tra an toàn | `SafeguardingReviewScreen.tsx` | Điều phối viên (vai "leader") | Xác nhận / bỏ cờ, gọi 111 |
| A7 | Thêm | `MoreScreen.tsx` | Mọi người | Đồng bộ dữ liệu, đăng xuất |

- **A3:**
  - Kết quả trả về có `isMinor` → sang màn bảo vệ trẻ em có nút 111; **không** hiện "Kết nối việc làm".
  - Bản nháp offline gắn với `userId`; đăng xuất thì xóa bản nháp.
- **A5:** trẻ em hoặc chưa rõ tuổi thì ẩn nơi hỗ trợ loại `employment`. Chuyển gửi phải tới được hộp W6 của đơn vị hỗ trợ.
- **Ẩn khỏi pilot (P3):** Hộ chiếu sinh kế, Tác động, Đội nhóm, Thẻ thông tin xác minh, câu đố MIL (giữ phần báo cáo lừa đảo).
