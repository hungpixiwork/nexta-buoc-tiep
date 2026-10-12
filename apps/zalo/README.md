# BƯỚC TIẾP — Zalo Mini App (`apps/zalo`)

App di động cho **Người đồng hành** và **Điều phối viên**, mở ngay trong Zalo, không cần tải app.
Mini App dùng chung backend `packages/api` (`/api/v1/loop`, `/api/v1/auth`) với bản web.
Nó thay app Expo cũ `apps/app`: app cũ **ngừng phát triển**, chỉ giữ lại đến khi Mini App chạy ổn.

| Mã | Màn | File |
|---|---|---|
| A1 | Đăng nhập (Zalo → gắn qua mã email lần đầu) | `src/pages/login.tsx` |
| A2 | Hôm nay | `src/pages/today.tsx` |
| A3 | Gặp người mới (đồng ý → ghi nhu cầu → gửi; lưu trên máy khi mất mạng) | `src/pages/new-person.tsx` |
| — | Hành trình: tìm hiểu → kiểm tra an toàn → tìm nơi phù hợp → chuyển gửi → hỏi thăm | `src/pages/journey/*` |
| A4 | Hỏi thăm | `src/pages/check-ins.tsx` |
| A5 | Nơi hỗ trợ (ẩn việc làm trừ khi đã rõ ≥ 18 tuổi) | `src/pages/directory.tsx` |
| — | Chào mừng (dùng thử 1 chạm / đăng ký) | `src/pages/welcome.tsx` |
| — | Đăng ký người đồng hành + bài học | `src/pages/join.tsx` |
| A7 | Thêm (bản nháp, ngôn ngữ, bản web, đăng xuất) | `src/pages/more.tsx` |

- Lớp bọc zmp-sdk nằm ở `src/lib/platform.ts`:
  - `openPhone`: gọi 111 và gọi các nơi hỗ trợ.
  - `openWebview`: mở link ngoài.
  - `nativeStorage`: lưu phiên và bản nháp.
  - `getAccessToken`: lấy token Zalo.
- Khi chạy trên trình duyệt dev, mỗi hàm tự dùng cách thay thế của web.
- Luật hiển thị thuần được dùng chung với web qua alias `@web/lib/*` (`apps/web/src/lib`: `types`, `pathway`, `caseSignals`, `format`, `supportContacts`).

## Luồng người dùng mới (showcase)
1. Đăng nhập bằng Zalo, hoặc nhập email rồi nhập mã 6 số.
2. Màn **Chào mừng** có 2 lựa chọn:
   - **Trải nghiệm ngay** (1 chạm):
     - vào sandbox riêng `trial-<accountId>`, có sẵn 2 người mẫu;
     - dùng được đủ tính năng người đồng hành (gặp người mới → chuyển gửi → hỏi thăm);
     - chuyển gửi **không** tới đơn vị hỗ trợ thật;
     - dữ liệu sandbox bị loại khỏi danh sách của điều phối viên, hộp chuyển gửi và số liệu.
   - **Đăng ký làm người đồng hành**:
     - điền form 3 bước trong app;
     - điều phối viên duyệt trên web (`/admin/approvals`);
     - sau khi duyệt, học 4 bài ngắn ngay trong app;
     - bấm "Bắt đầu đồng hành thật" để nhận vai thật.
3. Điều phối viên, tổ chức và đơn vị hỗ trợ làm việc trên web; Mini App chỉ hướng họ sang web.

## Chạy local

```bash
# 1. API (cổng 8787) — cần ZALO_APP_SECRET trong packages/api/.dev.vars để thử đăng nhập Zalo
npm run dev:api
# 2. Mini App trên trình duyệt (cổng 3002), trỏ vào API local
cd apps/zalo && VITE_API_URL=http://localhost:8787 npm run dev
```

Ngoài Zalo thì dùng **mã qua email** — môi trường dev trả luôn mã trong màn nhập (`devCode`).

## Deploy lên Zalo

Thông tin Mini App:
- App ID: `3017031064059341064` (App ID cũ: `3854208485796744593`).
- Dashboard thống kê & quản lý: https://miniapp.zaloplatforms.com/miniapp/3017031064059341064/statistic/overview
- File `apps/zalo/.env` giữ `APP_ID` (đã có trong `.gitignore`).
- App ID và App Secret đã lưu thành GitHub secret `ZALO_APP_ID` / `ZALO_APP_SECRET`.
- Workflow deploy tự đưa `ZALO_APP_SECRET` vào Worker.

```bash
cd apps/zalo
npm run login -- --app-id 3017031064059341064   # quét QR bằng Zalo (tài khoản quản trị Mini App)
npm run deploy:testing                           # = zmp deploy --testing → build www/ và in QR bản Testing
```

Quét QR bằng Zalo trên điện thoại để mở bản Testing. Muốn phát hành thật thì chạy `npm run deploy`, rồi gửi duyệt trên console.

### Cấu hình bắt buộc trên Zalo Mini App console (https://mini.zalo.me)
1. **Whitelist domain API**: `buoc-tiep-api.ppnh10092002.workers.dev`. Thiếu bước này thì mọi `fetch` đều lỗi.
2. **Quyền**: không cần xin quyền đặc biệt.
   - `getAccessToken` chỉ lấy Zalo ID, được phép sẵn từ SDK 2.35.
   - App không dùng vị trí, số điện thoại, tên hay ảnh đại diện Zalo.
3. **Backend**: bảng `nx_accounts` cần cột `zalo_id` (migration `0010_zalo_login.sql`).
   - Áp dụng lên D1 production: `npm run db:migrate:prod`, hoặc `wrangler d1 execute buoc-tiep-db --remote --file packages/database/migrations/0010_zalo_login.sql`.
4. **Secret Worker**: `ZALO_APP_SECRET`. Workflow deploy tự đặt; muốn đặt tay thì chạy `wrangler secret put ZALO_APP_SECRET`.

## Giới hạn cần nhớ
- `zmp-cli` không nằm trong dependencies (kéo theo khoảng 1.000 gói, làm chậm `npm ci`); các script gọi nó qua `npx -y zmp-cli@4`.
- Gói build tối đa 10 MB, mỗi file tối đa 3 MB. Bản hiện tại khoảng 0,9 MB.
- Không đưa gói `docx` (Mẫu 07) vào Mini App. Mẫu 07 và báo cáo mở ở bản web qua `openWebview`.
- CSS dùng Tailwind 4, cần WebView đời mới (Android System WebView 111+ hoặc iOS 16.4+).
