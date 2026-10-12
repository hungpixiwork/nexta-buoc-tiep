# 02 — Audit frontend, UX và responsive

> Phạm vi: `apps/web` và `apps/app`. Chỉ đọc code, chưa mở giao diện. Kiểm tra breakpoint bằng `playwright-cli setViewportSize` sẽ làm ở phase kiểm tra.

## 1. Kiến trúc component
**Web mới:**
- UI kit ở `design/ui.tsx`, `design/dashboard.tsx`, `design/widgets.tsx`.
- Khung trang ở `app/AppShell.tsx`.
- Các trang ở `features/*`.
- Hook dữ liệu gom trong **một file** `lib/hooks.ts`; nên tách theo domain vào `lib/queries/<domain>.ts` như an-tam.
- Nhiều trang dài 300–500 dòng, có hộp thoại viết ngay bên trong trang (`PartnerInboxPage.tsx` 467 dòng, `FollowUpsPage.tsx` 414 dòng) → tách mỗi khối ra 1 file.

**Web `/legacy`:** cây component riêng, API client riêng, i18n riêng, `data/mockData.ts` → xóa sau khi chuyển Mẫu 07.

**App:**
- Không có nút Back trên Android (không dùng `BackHandler`).
- Nhiều thứ bị làm trùng:
  - `QRCodeView` (giả) và `QrCode` (thật nhưng không dùng);
  - 3 cách làm nút 111;
  - `COORDINATOR_ROLES` định nghĩa 2 lần;
  - `handleDownloadDocx` có ở 2 nơi;
  - `PrimaryButton` / `SecondaryButton` không được dùng;
  - base URL của API khai báo 2 lần.
- Token màu chỉ được import ở 2 file; các chỗ khác gõ thẳng mã hex.

## 2. Responsive (từ 320px tới desktop)
**Web:**
- **Dưới `lg`, không vào được các mục trong "Thêm".** Thanh dưới chỉ có tối đa 4 mục (`AppShell.tsx:323`), và bảng tài khoản trên mobile không có điều hướng (`:230-268`).
- **Bố cục 3 cột bị bóp ở 1280px:** `FollowUpsPage.tsx:166`, `MatchPage.tsx:148`, `PartnerSchedulePage.tsx:79`. Cột giữa chỉ còn khoảng 320–390px, trong khi `DataTable` có min-width 640px (`design/dashboard.tsx:306`), nên bảng phải cuộn ngang.
- **Hộp yêu cầu:** cột nút rộng cố định `md:w-[168px]` + lưới 5 cột (`PartnerInboxPage.tsx:180,251`), chật trong khoảng từ `md` tới `xl`.
- **`ReportsPage.tsx:116`:** bảng không có khung cuộn ngang.
- **`MissionDetailPage.tsx:116-118`:** phần tử `absolute` nằm trong `<li>` không có `relative`.

**App:**
- `SafeAreaView` của React Native không có tác dụng trên Android, và chưa cài `react-native-safe-area-context`.
- `BottomNav` cố định `paddingBottom:20`; mọi màn phải chèn `paddingBottom:140` để không bị che.
- `KeyboardAvoidingView` chỉ có ở màn Đăng nhập.
- Ở 320px:
  - thanh trên cùng của màn Chụp ảnh có 3 phần tử không co lại được;
  - vòng camera có kích thước cố định 174/150px;
  - QR 190px.

## 3. Trợ năng và độ tương phản (mục tiêu AAA ≥ 7:1; chữ phụ tối thiểu `#475569`)
| Chỗ | Vấn đề |
|---|---|
| `ReportsPage.tsx:18,82` | Chữ trắng 12px trên nền `#FBBF24` / `#34D399` / `#38BDF8`, trượt cả mức AA |
| `AppShell.tsx:177` | Chữ trắng trên `#0284C7` cỡ 12px, khoảng 4,1:1 |
| `AppShell.tsx:158,177,218` | Dùng `slate-500` / `slate-400` |
| Nút chính của app | Chữ trắng trên `#2F80ED`, khoảng 3,9:1 |
| App: `#7A8B9A`, `#94A3B8` | Dưới 4,5:1 |
| App | 6 chỗ cỡ chữ ≤ 11 |
| `/legacy` | Khoảng 90 chỗ chữ quá nhạt |

**Glassmorphism:** không có, chỉ có vài nền trong mờ nhẹ, chấp nhận được.

## 4. Trạng thái đang tải / rỗng / lỗi
**Web:**
- **Ô số hiện `0` khi đang tải hoặc bị lỗi:** `TodayPage.tsx:91-98`, `PartnerInboxPage.tsx:49-54`, `PartnerSchedulePage.tsx:66-71`, `CoordinatorPage.tsx:138-141`. Phải hiện "—".
- **Hộp yêu cầu báo "Tạm dừng" khi tải danh mục lỗi** (`PartnerInboxPage.tsx:44-46,85`).
- **Kiểm tra an toàn hiện nút "Đánh dấu đã xử lý" khi tải hành trình lỗi** (`SafetyPage.tsx:34-35,78,129`). Đây là lỗi an toàn.

**App:**
- Hôm nay: không bao giờ có trạng thái đang tải, và nuốt mất lỗi.
- Tác động: có biến trạng thái tải/lỗi nhưng không hiển thị.
- Đội nhóm: nuốt lỗi rồi hiện danh sách mock.
- Thông báo luôn có ✅, kể cả khi chỉ mới lưu offline.
- Các màn Hỏi thăm, Giao việc, Nơi hỗ trợ, An toàn, Hồ sơ đã dùng `ScreenState` đúng cách.

## 5. Từ ngữ không thống nhất
- Người đồng hành đang được gọi là: "Youth Navigator" / "Người đồng hành" / "Tình nguyện viên" / "TNV".
- Hồ sơ đang được gọi là: "Hành trình" / "ca" / "hồ sơ".
- Chuyển hồ sơ: "Chuyển gửi" / "chuyển tuyến".
- Hỏi thăm: "Hỏi thăm" / "Theo dõi".
- Tên sản phẩm: "NEXTA" / "BƯỚC TIẾP".
- Số bước của vòng không khớp nhau: `STEP_META` có 6 bước và không có bước đồng ý; `PartnerSchedulePage.tsx:24` và `caseSignals.ts:56` đánh số khác nhau.
- Thiếu bản dịch:
  - web: bộ chọn vai trò; `'vi-VN'` gõ cứng;
  - app: màn Tác động không có `t()`; khoảng 22 chuỗi "Cô Lan" / "Hóc Môn" gõ cứng.

**Hướng sửa:** dùng bảng từ trong `.claude/skills/nexta-conventions`.

## 6. Thứ bậc nút và form
- Hộp yêu cầu có bộ 3 nút Nhận / Cần thêm / Từ chối ở cả dòng lẫn khung chi tiết.
- Nút "Hành trình mới" màu xanh lá ở một chỗ, xanh dương ở chỗ khác.
- Ô tick đồng ý trong trang Match bị lẫn giữa các dòng chỉ-đọc.
- Nút "Mở hành trình" dùng icon ⋮, trông như menu.
- Màn Hôm nay có 2 nút dẫn tới cùng một chỗ.

## 7. Màn quá nhiều thông tin mà không có hành động
- **Web:**
  - "Độ phù hợp %" không phải phần trăm thật (điểm cộng dồn rồi chặn trần 100);
  - "Thời gian phản hồi trung bình";
  - nhãn khảo sát;
  - Living Lab xuất hiện ở menu mọi vai trò;
  - bộ lọc 3 cột cho một danh sách 7 ngày.
- **App:** Hôm nay, Tác động và Hộ chiếu nhiều hình minh họa, hiển thị dữ liệu nhân vật cố định.

## 8. Rút bớt bước
- **App:** gộp Chọn ưu tiên vào màn tiếp nhận. Gộp Chụp ảnh và Ghi âm thành 1 màn "Gặp người mới" có bước đồng ý, rồi điều hướng theo `isMinor` do server trả về.
- **Web:** trang Match của điều phối viên chỉ *đề xuất*; người đồng hành xác nhận trong hành trình → chỉ còn 1 đường chuyển gửi.

## 9. Vấn đề frontend lớn nhất
1. **P0** Chuyển gửi bị từ chối biến mất khỏi hàng đợi → helper `openReferral()`.
2. **P0** App không có sự đồng ý; trẻ em đi tới đường việc làm.
3. **P0** `/legacy` có 111 giả, lưu giả, tài khoản admin gõ cứng.
4. **P0** Nút 111 trong `EmergencySupportCard` không hoạt động trên web → gọi thẳng `callHotline111`.
5. **P1** Kiểm tra an toàn có thể "đã xử lý" khi tải lỗi.
6. **P1** Chưa có Mẫu 07 trong vòng lõi.
7. **P1** Tab chính của app dùng dữ liệu gõ cứng; không có danh sách hành trình; DOCX lỗi 401.
8. **P1** Câu hỏi của đơn vị hỗ trợ không tới người đồng hành.
9. **P2** Menu mobile web không vào được mục "Thêm".
10. **P2** Ô số khi đang tải, độ tương phản, thống nhất từ ngữ.
