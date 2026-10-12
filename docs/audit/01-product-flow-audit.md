# 01 — Audit sản phẩm và luồng người dùng

> Nguồn: audit chỉ-đọc `apps/web` và `apps/app` (subagent 1 và 2), đối chiếu với route API.
> Mức ưu tiên: **P0** = bắt buộc cho pilot · **P1** = quan trọng · **P2** = có thì tốt · **P3** = ẩn hoặc bỏ khỏi MVP.

## 1. Vai trò
| Vai trò | Client | Cách xác định | Bằng chứng |
|---|---|---|---|
| Người đồng hành | web + app | `volunteer` → web `navigator`, app `volunteer` | `apps/web/src/lib/api.ts:24-42`, `LoginScreen.tsx:24-28` |
| Đơn vị hỗ trợ | web | `partner` / `partner_staff` | như trên |
| Điều phối viên | web (app gọi là "leader") | `admin` / `coordinator` / `social_worker` | như trên |
| Quản trị đơn vị chủ quản | web | `host_admin`: có menu điều phối viên nhưng **không** xem xét an toàn trong hành trình được | `RiskPanel.tsx:31` |
| Quan sát viên | web | `observer`: chỉ xem số liệu tổng | `loop.ts:45` |
| Người nộp đơn | web | Tài khoản mã email chưa được duyệt | `lib/api.ts` |

**Vấn đề:**
- Khi chưa đăng nhập, web **tự đăng nhập bằng tài khoản demo mà không báo**, kể cả ở trang chủ (`api.ts:128-137`).
- App không dùng vai trò để quyết định hiển thị: ai cũng thấy mọi màn, kể cả màn Xem xét an toàn mà server từ chối volunteer (`cases.ts:1120`).

## 2. Bản đồ màn hình

### 2a. Web — portal mới (dữ liệu thật, không mock)
| Màn | Vai trò | Việc | Nút chính | API | Ưu tiên |
|---|---|---|---|---|---|
| Hôm nay `/navigator` | người đồng hành | Giúp ai tiếp | Mở hành trình | `loop/cases`, `loop/follow-ups` | **P0** |
| Hành trình `/journeys` | tất cả | Danh sách | Hành trình mới | `loop/cases` | **P0** |
| Hành trình mới | người đồng hành | Tiếp nhận | Tiếp: sự đồng ý | `POST loop/cases` | **P0** |
| Hành trình chi tiết (5 khối bước) | người đồng hành, điều phối viên | Toàn bộ vòng khép kín | Theo từng bước | `loop/cases/:id/*`, `next-steps`, `referrals`, `follow-ups` | **P0** |
| Hỏi thăm | người đồng hành | Hỏi thăm 48 giờ | Ghi kết quả | `loop/follow-ups` | **P0** |
| Hộp yêu cầu `/partner` | đơn vị hỗ trợ | Nhận hoặc từ chối trong hạn | Nhận / Cần thêm / Từ chối | `loop/referrals` | **P0** |
| Kiểm tra an toàn | điều phối viên | Các hành trình đang bị giữ lại | Cho tiếp tục / xử lý | `loop/escalations`, `risk-review` | **P0** |
| Nơi hỗ trợ `/directory` | tất cả | Danh mục đã xác minh | Xác minh / thêm | `loop/directory` | **P0** |
| Menu gọi hỗ trợ | tất cả | Gọi 111 / 113 / 115 | `tel:` | tĩnh | **P0** |
| Lịch hẹn / kết quả (đơn vị hỗ trợ) | đơn vị hỗ trợ | Ghi kết quả | Lưu | `loop/referrals` | P1 (trùng với hộp yêu cầu) |
| Nơi hỗ trợ của tôi | đơn vị hỗ trợ | Sức chứa | Bật / tắt | `loop/directory` | P1 |
| Điều phối `/coordinator` | điều phối viên | Hàng đợi quyết định | Phân bổ / xem xét | 5 endpoint loop | P1 |
| Match `/coordinator/match` | điều phối viên | Gửi chuyển gửi | Gửi | loop | P1 (đường chuyển gửi thứ 2, kiểm tra lỏng hơn) |
| Tập huấn, Đăng ký, Đăng nhập, Trạng thái | người mới | Tham gia | Gửi / nhập mã | `onboarding`, `auth/otp` | P1 |
| Duyệt đăng ký | điều phối viên | Xét đơn | Quyết định | `admin/applications` | P1 |
| Quyền dữ liệu | công khai | Yêu cầu về dữ liệu cá nhân | Gửi | `onboarding/privacy` | P1 |
| Báo cáo | điều phối viên, quan sát viên | Phễu, hạn phản hồi | (chỉ có link) | `loop/reports` | P2 |
| Trang chủ | công khai | Giới thiệu | Bắt đầu | `loop/metrics` | P2 |
| Living Lab | tất cả | Trang pitch cho cuộc thi | Nút "Thử" tạo hành trình **thật** | `loop/metrics` | **P3** |
| Campaigns / Missions | tất cả | Sự kiện tình nguyện | Tham gia | `v1/campaigns`, `v1/missions` | **P3** (nhiệm vụ không có bước kết thúc) |
| Finance / Transparency | điều phối viên / công khai | Sổ quỹ | Thêm | `admin/ledger` | P3 / P2 |

### 2b. Web — `/legacy/*` (portal cũ, vẫn truy cập công khai được)
- **Dữ liệu mock khi API lỗi** (`LegacyApp.tsx:428-460`). Chèn ảnh stock và tọa độ GPS vào hành trình thật (`:416-421`).
- **Tài khoản gõ cứng** `socialworker@buoctiep.vn` / `123456`, và tự đăng ký làm admin (`:365-389`).
- **Báo "đã kích hoạt 111" giả** (`AnonymousCaseModal.tsx:59`, `SafeguardingTab.tsx:37`, `CaseModals.tsx:232`).
- **Có bộ sinh Mẫu 07 `.docx` duy nhất trong repo** (`documents/referral/*`) → chuyển sang portal mới trước, sau đó xóa phần còn lại (P3).

### 2c. App Expo (dùng API cũ)
| Màn | Việc | Nút chính | API | Dữ liệu | Ưu tiên |
|---|---|---|---|---|---|
| Đăng nhập | Vào app | Đăng nhập / demo | `auth/login`, `register` | Thật; mật khẩu demo `123456` gõ cứng | **P0** |
| Chụp ảnh tiếp nhận | Tạo hành trình 1 chạm | Gửi | `POST /api/cases` | Ghi thật; **không có sự đồng ý**; bỏ qua `isMinor` | **P0** |
| Hỏi thăm | Hỏi thăm 48 giờ | Lưu | `POST /api/followups` | Thật | **P0** |
| Nơi hỗ trợ | Tìm và chuyển gửi | Chuyển gửi | `POST /api/resources/referrals` | Ghi thật nhưng **không tới được đơn vị hỗ trợ** | **P0** |
| Xem xét an toàn | Xác nhận cờ | Xác nhận / Bỏ / 111 | `cases/safeguarding/*` | Thật; trả 403 cho phần lớn người dùng | **P0** |
| Ghi âm | Kể chuyện → tạo hành trình | Xác nhận | `POST /api/cases` | Ghi thật; chuyển giọng nói thành chữ chỉ chạy trên web | P1 |
| Hôm nay | Kế hoạch trong ngày | Bắt đầu | `auth/me`, `journeys/today`, `cases` | **Lẫn dữ liệu giả** "Cô Lan" | P1 |
| Thêm | Cài đặt | nhiều | — | Công tắc giả; số hotline giả | P1 |
| Giao việc / Đội nhóm / Hồ sơ / Trước khi đi / Chọn ưu tiên | — | — | — | Đội nhóm có **mock + báo thành công giả** | P2 |
| Hộ chiếu sinh kế | Kỹ năng + QR | Kết nối việc làm | id sai nên 404 | **Mock**, QR giả | **P3** |
| Tác động | Số liệu | Tiếp tục | lấy về rồi bỏ | **Gõ cứng** | **P3** |
| Thẻ thông tin xác minh | Chia sẻ | Chia sẻ | không có | **Gõ cứng** | **P3** |
| MIL | Chống lừa đảo | Báo cáo | `POST mil/incidents` | Ghi thật; quiz tĩnh | P3 |

## 3. Luồng chính và chỗ bị gãy
**Web — người đồng hành** (chạy từ đầu đến cuối). Các chỗ gãy:
- Quan sát **được lưu trước khi có sự đồng ý** (`NewJourneyPage.tsx:39-41`).
- Không có bước "xác minh dữ kiện". Nhãn nguồn gốc bị ngược (`UnderstandPanel.tsx:48`).
- Không có Mẫu 07 trong vòng lõi.
- **Chuyển gửi bị từ chối biến mất khỏi mọi hàng đợi** (`loop.ts:289`; `CoordinatorPage.tsx:44`, `MatchPage.tsx:32`, `TodayPage.tsx:46`).
- Câu hỏi của đơn vị hỗ trợ không bao giờ tới người đồng hành (`widgets.tsx:245`).

**App — tình nguyện viên.** Các chỗ gãy:
- Không có bước ghi sự đồng ý.
- **Trẻ em tới được nút "Kết nối việc làm"** (`App.tsx:175`; tuổi giả 50 ở `LivelihoodPassportScreen.tsx:543`).
- Chuyển gửi không có `partnerId`.
- Không có danh sách hành trình.

**Dữ liệu tách rời:** hành trình tạo từ app nằm ở bảng `cases`; web chỉ đọc bảng `loop_*`.

## 4. Tính năng trùng
- **Gửi chuyển gửi:** 3 đường trên web, 4 bộ ghi ở backend + loop.
- **Danh sách hành trình:** 6 màn trên web.
- **Xem xét an toàn:** 2 nơi, câu chữ khác nhau.
- **Ghi hỏi thăm:** 3 nơi.
- **Số liệu:** 6 nơi.
- **Hạ tầng web:** 2 API client, 2 hệ i18n, 2 hàm chọn trang chủ.
- **Ánh xạ vai trò:** 3 bảng.

## 5. Ngõ cụt
- Câu hỏi của đơn vị hỗ trợ không tới người đồng hành.
- Nhiệm vụ dừng ở "đã nộp bằng chứng" (`MissionDetailPage.tsx:63`).
- Tab chụp ảnh trên web không lưu gì.
- Chọn "đơn vị hỗ trợ chủ động liên hệ" nhưng đơn vị không có kênh liên lạc nào.
- App:
  - QR không mở được;
  - DOCX luôn 401;
  - nút "Yêu cầu hỗ trợ" báo thành công giả;
  - nút "Tiếp tục" dẫn tới một hành trình gõ cứng.

## 6. Nhập lại dữ liệu không cần thiết
- Sự đồng ý và thông tin người được hỗ trợ được nhập riêng ở app và ở web, không dùng chung.
- App hỏi nhu cầu 2 lần (màn Chọn ưu tiên + màn Chụp ảnh).
- Trang Match của điều phối viên bắt tick lại ô đồng ý dù đã ghi nhận trước đó.

## 7. Màn có số liệu nhưng không có hành động
- **Hôm nay:** 2/4 ô số không có link.
- **Hộp yêu cầu:** 3/4 ô không có link. **Lịch hẹn:** 4/4 ô không có link.
- **Điều phối:** ô "quá hạn" và dòng hoạt động không có link.
- **Báo cáo:** các thanh không bấm được.
- **Living Lab:** tĩnh.
- **Tác động (app):** tĩnh.

## 8. Tổng hợp ưu tiên
- **P0:**
  - vòng khép kín trên web (sau khi sửa);
  - hộp yêu cầu;
  - kiểm tra an toàn;
  - xác minh nơi hỗ trợ;
  - app: tiếp nhận + sự đồng ý + chặn trẻ em, hỏi thăm, xem xét an toàn (theo vai trò), danh sách hành trình;
  - đăng nhập thống nhất.
- **P3 (ẩn):** Living Lab, Campaigns, Missions, Finance, `/legacy`; app: Hộ chiếu, Tác động, Thẻ xác minh, quiz MIL.
