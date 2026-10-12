---
name: dev-env
description: Khởi động / khởi động lại môi trường dev NEXTA an toàn (API 8787, web 3000, app 8081), migrate D1 local, seed demo qua API thật, đăng nhập agent-browser và smoke test. Use khi cần chạy app, sau khi merge, khi .dev.vars đổi, hoặc trước buổi demo.
---

# Môi trường dev NEXTA

## 1. Kiểm tra dịch vụ nào đang chạy
```bash
curl -s localhost:8787/health | head -c 80; curl -s -o /dev/null -w " web:%{http_code}\n" localhost:3000
```
Chỉ khởi động dịch vụ đang tắt, luôn dùng `run_in_background`:
- API: `npm run dev:api`
- Web: `npm run dev:web`
- App (Expo web): `npm run dev:app`

## 2. Secrets local
- Đặt tại `packages/api/.dev.vars` (gitignore), theo mẫu `packages/api/.dev.vars.example`.
- Cần có: `JWT_SECRET`, `PII_ENCRYPTION_KEY`, `CRON_SECRET`, `OTP_PEPPER`, `DEMO_ACCESS_CODE`.
- Production đặt bằng `npx wrangler secret put <TÊN>` trong `packages/api`. **Không bao giờ** ghi secret vào `wrangler.jsonc`.
- Sau khi đổi `.dev.vars`, khởi động lại API. Chỉ tắt đúng tiến trình đang giữ cổng 8787:
```powershell
Get-NetTCPConnection -LocalPort 8787 -State Listen -EA SilentlyContinue | % { Stop-Process -Id $_.OwningProcess -Force }
```

## 3. Dữ liệu
```bash
npm run db:migrate:local          # sau mỗi lần có migration mới
node scripts/seed-demo.mjs        # seed qua API thật; chạy lại nhiều lần vẫn ra cùng kết quả; in dòng tóm tắt
```

## 4. Đăng nhập agent-browser
```bash
agent-browser open http://localhost:3000/login && agent-browser snapshot -i -c
```
- **Tài khoản demo** dùng mã demo trong `.dev.vars`.
- **Tài khoản pilot** dùng mã email. Ở local, API trả `devCode` khi chưa cấu hình dịch vụ gửi mail.

## 5. Smoke test
```bash
node scripts/dev/smoke.mjs                                  # mọi route pilot, 1440px
node scripts/dev/smoke.mjs --widths 390,1024,1440 --routes /navigator,/partner
```
Báo ✓/✗ cho từng mục: chưa đăng nhập · có thông báo lỗi · tràn ngang (kèm phần tử gây tràn) · có từ cấm (xem bảng trong `nexta-conventions`).
