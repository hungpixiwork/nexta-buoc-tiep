# 📋 KẾ HOẠCH BÀN GIAO & DANH SÁCH TODO (Hẹn 21:50 tiếp tục)

> 🕒 **Thời điểm ghi nhận:** `2026-09-26 20:25 GMT+7`  
> 📌 **Lý do tạm dừng:** Claude Code CLI (PID 26060) chạm quota session limit, tự động mở lại lúc **21:50 GMT+7**.  
> ✅ **Trạng thái Typecheck:** `npm run typecheck` đạt **PASS 100%** trên toàn bộ 5 workspaces (`@buoc-tiep/app`, `@buoc-tiep/web`, `@buoc-tiep/api`, `@buoc-tiep/database`, `@buoc-tiep/shared`).  
> 🏷️ **Commit vừa lưu:** `dda2c03` — `feat(app): add QrCode component and passport api endpoints`

---

## 🎯 CÔNG VIỆC VỪA HOÀN TẤT & ĐÃ COMMIT

1. **Cài đặt & tạo component QR Code thực tế:**
   - Đã thêm `qrcode-generator` vào [apps/app/package.json](file:///d:/07-Competitions-Hackathons/unesco-youth-hackathon-2026/apps/app/package.json).
   - Đã tạo component [apps/app/src/components/QrCode.tsx](file:///d:/07-Competitions-Hackathons/unesco-youth-hackathon-2026/apps/app/src/components/QrCode.tsx) kết hợp `react-native-svg` để vẽ mã QR chuẩn SVG siêu nhẹ, chạy mượt trên cả Web và Native.
2. **Bổ sung API Service Endpoints cho Passport:**
   - Trong [apps/app/src/services/api.ts](file:///d:/07-Competitions-Hackathons/unesco-youth-hackathon-2026/apps/app/src/services/api.ts):
     - `createQrCredential(caseId)`: gọi endpoint backend `/api/cases/:id/qr-credential` để lấy signed 24h credential QR.
     - `getPassportTimeline(passportId)`: gọi `/api/passports/:id/timeline`.
     - Giữ nguyên `recordQrScan(caseId, data)` để tương thích không gây lỗi typecheck.

---

## ⏳ VIỆC CẦN LÀM TIẾP THEO (KHI QUAY LẠI LÚC 21:50)

### 1. [Ưu tiên 1] Hoàn tất màn hình `LivelihoodPassportScreen.tsx`
- **Tập tin:** [apps/app/src/screens/LivelihoodPassportScreen.tsx](file:///d:/07-Competitions-Hackathons/unesco-youth-hackathon-2026/apps/app/src/screens/LivelihoodPassportScreen.tsx)
- **Nội dung:**
  - [ ] Nhúng component `QrCode` từ `apps/app/src/components/QrCode` vào Modal QR của Hộ chiếu sinh kế.
  - [ ] Đổi luồng sinh mã QR: Gọi `apiService.createQrCredential(passport.id)` để lấy `verificationUrl` / `signedQrToken` thật từ backend D1.
  - [ ] **Tuân thủ Rule 0 (Child Safeguarding):** Nếu đối tượng là trẻ em (<18 tuổi), backend từ chối cấp mã QR công khai (`403` / Safeguarding error). Giao diện cần hiển thị banner cảnh báo giải thích rõ thay vì treo/báo lỗi chung chung.
  - [ ] Kết nối `apiService.getPassportTimeline` để hiển thị lịch sử các bước sinh kế thực tế thay vì mock tĩnh.
  - [ ] Chạy `npm run typecheck` và commit: `fix(app): real qr credential and timeline in livelihood passport`.

### 2. [Ưu tiên 2] Rà soát các màn hình còn lại trong Expo App
- [ ] Kiểm tra [apps/app/src/screens/VerifiedInfoCardScreen.tsx](file:///d:/07-Competitions-Hackathons/unesco-youth-hackathon-2026/apps/app/src/screens/VerifiedInfoCardScreen.tsx) — xem xét việc chia sẻ thẻ xác minh & mã QR.
- [ ] Kiểm tra [apps/app/src/screens/HomeScreen.tsx](file:///d:/07-Competitions-Hackathons/unesco-youth-hackathon-2026/apps/app/src/screens/HomeScreen.tsx) & [apps/app/src/screens/ImpactDashboardScreen.tsx](file:///d:/07-Competitions-Hackathons/unesco-youth-hackathon-2026/apps/app/src/screens/ImpactDashboardScreen.tsx) — đảm bảo số liệu sync trực tiếp từ API backend D1.

### 3. [Ưu tiên 3] Kiểm thử tích hợp & Deploy
- [ ] Chạy test luồng trên Expo Web (`npm --workspace=@buoc-tiep/app run dev` hoặc tương đương).
- [ ] Kiểm tra kịch bản Offline Sync (lưu queue và đồng bộ lại khi có mạng).
- [ ] Review lại toàn bộ git diff và chuẩn bị đẩy lên nhánh / PR theo quy chuẩn cộng tác.
