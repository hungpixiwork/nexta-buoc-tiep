# 08 — Kế hoạch triển khai

> **Kiến trúc đích** (học từ an-tam, xem `.claude/skills/nexta-conventions`):
> luật thuần trong `shared` → route Hono gọn (`body(schema)`, scope, `ApiError`) → D1 qua migration → hook `lib/queries/<domain>.ts` → mỗi khối UI 1 file → trang chỉ ghép khối.
>
> **Làm từng màn hình** bằng skill `nexta-screen`. Mỗi task = 1 commit, và phải xanh `typecheck + test (+ build)`. Chạy tuần tự trừ khi file hoàn toàn tách biệt.
>
> **Quyết định:**
> - Giữ cả 2 client.
> - **D1-A**: app dùng `/api/v1/loop` cho 4 việc lõi (tạo hành trình, sự đồng ý, chuyển gửi, hỏi thăm).
> - Đăng nhập dùng phiên lưu trong D1 (xem `07 §4`).

## Thứ tự
```
F-00 → F-01 → F-02 → P0-01 → P0-02 → P0-03 → P0-04 → P0-05 → P0-06 → P0-07
                                          ↘ P0-08 (web, sau P0-04)
P0-* xong → màn hình: W3 → W4 → W6 → W1 → W5 → W7 → W9 → A1 → A3 → A5 → A4 → A2 → A6 → W8/W10/W11
          → P1 hạ tầng (P1-01…P1-05) → P2 → P3 (ẩn)
```

---
## Phần F — Nền móng (không đổi hành vi)

### F-00 · Bộ test
- **Mục tiêu:** có test thật để mọi task sau chứng minh được là chạy đúng.
- **Người dùng:** dev, CI.
- **Hiện trạng:** 0 test. CI bước lint không làm gì. Deploy không chờ test.
- **File:**
  - thêm `vitest.config.ts` (root);
  - thêm `tests/helpers/sqlite-d1.ts` (port từ an-tam: D1 giả bằng `node:sqlite`, chạy thật `packages/database/migrations/*.sql`);
  - thêm `tests/helpers/env.ts` (env giả + tạo phiên đăng nhập);
  - thêm `tests/shared/*.test.ts`;
  - sửa `package.json` (script `test`, dev dependency `vitest`) và `.github/workflows/{ci,deploy}.yml` (job test; deploy `needs` CI).
- **Test đầu tiên:**
  - `RiskGate`: không hạ được `EMERGENCY_111`; trẻ em → `CHILD_PRESENT`.
  - `ReferralLoop`: chuyển trạng thái hợp lệ và không hợp lệ.
  - `safeguardingRuleEngine`: hành vi hiện tại, dùng làm mốc.
- **Xong khi:** `npm test` xanh ở local và trên CI.
- **Rủi ro rollback:** không có.

### F-01 · Đưa bảng loop và onboarding vào migration
- **Vấn đề:** 21 bảng nằm ở `packages/database/loop/*.sql`, ngoài migration. Môi trường mới sẽ thiếu bảng, và test không tạo được.
- **Thay đổi:**
  - ✅ `git mv` sang `migrations/0008_closed_loop.sql` và `migrations/0009_onboarding.sql` (giữ lịch sử). Chỉ dùng `CREATE TABLE/INDEX IF NOT EXISTS` nên chạy trên DB remote (đã có bảng) vẫn an toàn.
  - ✅ `db:loop:*` → `db:seed:directory:*` (chỉ seed thư mục nơi hỗ trợ).
- **DB:** không đổi schema.
- **Test:** `migrations.test.ts` áp toàn bộ migration lên sqlite, rồi kiểm tra có `loop_cases` và `nx_accounts`.
- **Xong khi:** `wrangler d1 migrations apply --local` trên DB trống tạo đủ mọi bảng.

### F-02 · Hạ tầng API chung
- **Thay đổi:**
  - `packages/api/src/lib/http.ts`: `ApiError(status, code, message)`.
  - `lib/validate.ts`: `body(schema)` bằng zod, lỗi trả `VALIDATION_ERROR`.
  - `app.onError` trả `{ error, code }`. Lỗi 500 trả câu chung tiếng Việt, không trả `err.message`.
  - Logger che `?token=` và `?admin_key=`.
- **Không được phá:** dạng dữ liệu trả về khi thành công của mọi route. Lỗi vẫn giữ dạng `{ error, code }` mà client đang đọc.
- **Test:** route ném lỗi → 500 với câu chung; zod lỗi → 400 `VALIDATION_ERROR`.

---
## Phần P0 — Dữ liệu, xác thực, bảo mật

### P0-01 · Secret
- **Vấn đề:** `wrangler.jsonc:68-71` commit `JWT_SECRET`, `PII_ENCRYPTION_KEY`, `CRON_SECRET`.
- **Thay đổi:**
  - Xóa các khóa đó khỏi `vars`.
  - Thêm `packages/api/.dev.vars.example`.
  - Bỏ mọi fallback về `JWT_SECRET` hoặc chuỗi cố định: `aiModelRouter.ts:109`, `cases.ts:904`, `hermes.ts:54`, `cron.ts:100`, OTP pepper.
  - Cron dùng so sánh hằng thời gian (`safeEqual`) và chỉ đọc header `X-Cron-Secret`.
- **Người dùng phải tự làm:** `npx wrangler secret put` × 5 và đổi khóa mới (rotate). Xóa khỏi lịch sử git **chỉ khi người dùng đồng ý**.
- **Test:** thiếu secret → 500 kèm câu cấu hình; cron sai khóa → 401.
- **Rủi ro:** token cũ hết hiệu lực (sẽ đằng nào cũng xảy ra ở P0-03).

### P0-02 · Khóa các router đang mở
- **Thay đổi:**
  - `index.ts`: `authMiddleware` cho mọi đường dẫn của orchestration (`/api(/v1)/{people,organisations,gateways,tasks,follow-ups,outcomes,operations,reports}`).
  - `orchestration.ts`: người thực hiện lấy từ `c.get('user')`, bỏ mặc định `usr-coordinator-01`.
  - `survey.ts`: GET, PUT, DELETE cần phiên với vai trò admin hoặc coordinator; bỏ `X-Admin-Secret` và `?admin_key`.
- **Test:** không có token → 401; volunteer gọi survey GET → 403.
- **Rủi ro:** trang khảo sát bên ngoài phải dùng tài khoản thật.

### P0-03 · Đăng nhập thống nhất (phiên D1)
- **Mục tiêu:** một luồng đăng nhập hoàn chỉnh, đơn giản (xem `07 §4`).
- **DB:** `0010_sessions.sql`
  - bảng `sessions(token_hash PK, account_id, created_at, expires_at, user_agent)`;
  - thêm `nx_accounts.password_hash`;
  - backfill `nx_accounts` từ `users` (giữ nguyên id);
  - tạo `org-demo` và các tài khoản demo theo vai trò.
- **File:**
  - mới `lib/session.ts` (`createSession`, `readSession`, `destroySession`);
  - sửa `middleware/auth.ts` (tra phiên ⋈ `nx_accounts`, không còn `org-default`);
  - sửa `routes/auth.ts`: `login`, `register`, `otp/verify`, `google` (kiểm tra `aud` + `email_verified`), `dev-login` (đăng nhập bằng tài khoản demo có sẵn, cần mã), `logout`, `me`;
  - sửa `routes/onboarding.ts`: `/session` trả `me`, không ký token nữa;
  - sửa `realtime.ts`: dùng phiên và bắt buộc cùng tổ chức;
  - bảo đảm mỗi `nx_accounts` có bản sao `users` cùng id.
- **API:** body `{ token, account }` giữ nguyên dạng; token giờ là chuỗi ngẫu nhiên. Client không phải đổi code gửi header.
- **Test:**
  - mọi cách đăng nhập đều trả cùng dạng `me`;
  - tài khoản bị khóa → 401;
  - sau khi đăng xuất, token cũ → 401;
  - Google sai `aud` → 401;
  - đổi vai trò trong DB thì request kế tiếp thấy vai trò mới.
- **Rủi ro:** mọi người đăng nhập lại 1 lần.

### P0-04 · Vai trò chung + guard phạm vi
- **File:**
  - mới `packages/shared/src/rbac/roles.ts` (`toUiRole`, `toActor`, danh sách vai trò chuẩn);
  - mới `packages/api/src/middleware/scope.ts` (chuyển `scopeOf`, `canSeeCase`, `caseScopeSql` từ `loop.ts:67-100`, **không đổi hành vi**), cùng `requireRole` và `requireCaseScope`;
  - `loop.ts` import lại từ `scope.ts`;
  - `apps/web/src/lib/api.ts` và `apps/app/src/screens/LoginScreen.tsx` dùng `toUiRole`.
- **Test:** test phạm vi của loop (tổ chức B → 403) phải xanh cả trước lẫn sau khi chuyển code.

### P0-05 · Khóa quyền stack cũ
- **Thay đổi:**
  - `requireCaseScope` cho `cases.ts` `/:id/*` và `/:caseId/*`, `p0Referrals`, `passports`, `followups`, `resources/referrals`.
  - Ràng buộc id con với case bằng `AND case_id = ?` (`cases.ts:1024,1127,1888`).
  - Bỏ các mặc định `case-lan-hoc-mon`, `usr-volunteer-default`, `res-hoc-mon-01`.
  - Gỡ mount các handler PDR 26-30 không dùng (`cases.ts:1460-2094`) và các route trùng (timeline, export-docx).
- **Test:** tổ chức B → 403 trên mỗi nhóm route.

### P0-06 · Chặn trẻ em ở mọi đường ghi
- **File:**
  - `packages/shared/src/referrals/safeguardingRuleEngine.ts` thêm `assertNotMinorForLivelihood({ age, isMinor, destination, category })`: **chưa rõ tuổi cũng chặn** với việc làm;
  - áp dụng tại `p0Referrals` (theo đích đến, không theo `type`), `resources/referrals`, `PUT passports`, `cases /:id/tasks job_trial`, `orchestration POST /tasks`, `campaigns /:id/participants`;
  - `loop /understanding` xóa bản ghi tìm-nơi-phù-hợp cũ.
- **Test:** mỗi đường ghi có 1 test với trẻ em → 403 `MINOR_PROTECTED`, và 1 test với người lớn → 200.

### P0-07 · Rò rỉ + gỡ chức năng giả
- **Thay đổi:**
  - `volunteers.ts`: chọn cột cụ thể, không có `password_hash`.
  - `p0Referrals` export: escape HTML.
  - Gỡ mount `hermes`, `a2a`, `impact/demo-seed|demo-reset`, `analytics` + `/public`, `mil/cards`.
  - `POST /audit-logs` chỉ gọi được từ server.
  - `journeys/today` trả rỗng khi không có dữ liệu thật.
- **Kiểm tra trước:** grep `apps/web/src` và `apps/app/src` để chắc không còn client nào gọi các route sẽ gỡ.
- **Test:** `/api/volunteers` không trả `password_hash`; export có chuỗi `<script>` bị escape.

### P0-08 · Web: chuyển gửi bị từ chối không được biến mất
- **File:** `apps/web/src/lib/caseSignals.ts` thêm `openReferral()`; dùng ở `CoordinatorPage.tsx:44`, `MatchPage.tsx:32`, `TodayPage.tsx:46`.
- **Test:** unit test cho `caseSignals`: hành trình có chuyển gửi DECLINED → thuộc nhóm "cần tìm nơi khác".

---
## Phần màn hình — mỗi màn một task, làm theo skill `nexta-screen`
Chi tiết khối và dữ liệu ở `.claude/skills/nexta-screen/screens.md`.

| Task | Màn | Việc chính phải chạy thật | Điểm sửa từ audit |
|---|---|---|---|
| S-W3 | Gặp người mới | Sự đồng ý **trước** quan sát | I-15; bỏ tab ảnh không lưu gì |
| S-W4 | Hành trình | Bước tiếp theo, Mẫu 07, trả lời câu hỏi của đơn vị hỗ trợ | I-14; nhãn nguồn gốc bị ngược |
| S-W6 | Yêu cầu chuyển gửi | Nhận / cần thêm / từ chối có Idempotency-Key | Trạng thái "Tạm dừng" sai; nút bị trùng |
| S-W1 | Hôm nay | Mở việc cần làm tiếp | Ô số không có link; ô số hiện 0 khi đang tải |
| S-W5 | Hỏi thăm | Ghi kết quả (chống ghi 2 lần) | Tranh chấp ở `loop.ts:1064` |
| S-W7 | Kiểm tra an toàn | Xem xét và quyết định | Có thể "đánh dấu đã xử lý" khi lỗi tải |
| S-W9 | Điều phối | Xử lý việc quá hạn | Ô số không dẫn tới hành động |
| S-A1 | Đăng nhập app | Mã email + demo có mã | Mật khẩu `123456` gõ cứng |
| S-A3 | Gặp người mới (app) | Sự đồng ý → tạo hành trình qua loop; trẻ em → màn bảo vệ + 111 | I-05, I-07, I-11 |
| S-A5 | Tìm nơi hỗ trợ (app) | Chuyển gửi qua loop, tới được W6 | I-11 |
| S-A4 | Hỏi thăm (app) | Ghi qua loop follow-ups | — |
| S-A2 | Hôm nay (app) | Danh sách việc thật | Dữ liệu "Cô Lan" gõ cứng |
| S-A6 | Kiểm tra an toàn (app) | Chỉ vai điều phối viên | 403 với volunteer |

---
## P1 — Hạ tầng còn lại
- **P1-01 Idempotency thật:**
  - port `lib/idempotency.ts` từ an-tam cùng bảng `idempotency_keys`;
  - áp cho confirm, hành động chuyển gửi, đóng hành trình, duyệt đơn;
  - UPDATE có điều kiện `AND stage = ?` và kiểm tra `meta.changes`;
  - index unique `loop_referrals(next_step_id)`, `encounters(client_generated_id)` (dọn dữ liệu trùng trước).
- **P1-02 Audit append-only:**
  - `lib/audit.ts` (gọn hơn bản an-tam: chưa cần chuỗi hash) ghi cùng `db.batch` cho mọi hành động ghi quan trọng;
  - che PII bằng `maskSummary`.
- **P1-03 AI router:** làm theo `04 §2`: không bịa độ tin cậy, zod cho `category`, che PII, khóa ở header, mã trẻ em không trùng.
- **P1-04 Giới hạn tần suất + CORS:**
  - Workers Rate Limiting cho đăng nhập, dev-login, `privacy/requests`;
  - CORS chỉ cho phép origin của web và app.
- **P1-05 Hàng đợi offline của app:** bản nháp gắn `userId`, có khóa đồng bộ, thử lại tối đa 5 lần, đăng xuất thì xóa.
- **P1-06 Xóa `/legacy`:** làm sau S-W4 (khi Mẫu 07 đã chuyển sang).

## P2 — Dọn dẹp
- Thống nhất từ trạng thái (migration map giá trị cũ; cron bỏ qua hành trình `CLOSED`).
- Hiệu năng: index còn thiếu, bỏ quét toàn bảng, bỏ N+1.
- UX:
  - mục "Thêm" không vào được trên menu mobile web;
  - độ tương phản (`ReportsPage.tsx:82`, nút xanh `#2F80ED` của app);
  - safe area, bàn phím và nút Back trên Android.
- `scripts/dev/smoke.mjs` và `scripts/seed-demo.mjs` (port từ an-tam) — **làm sớm, ngay trước màn hình đầu tiên**.

## P3 — Ẩn khỏi MVP
Gỡ khỏi điều hướng (chưa xóa file):
- Web: Campaigns, Missions, Signals, Living Lab, Finance.
- App: Tác động, Đội nhóm, Thẻ thông tin xác minh, Hộ chiếu sinh kế.

## Kiểm tra (áp cho mọi task)
- `npm run typecheck && npm test`.
- Đụng tới web hoặc app thì chạy thêm `npm run build`.
- Đụng tới API thì chạy thêm `cd packages/api && npx wrangler deploy --dry-run`.
- Kiểm tra giao diện: `agent-browser` cho luồng chính; `playwright-cli setViewportSize` ở 320 / 390 / 1024 / 1440; chỉ chụp 1 ảnh cuối.
- Cuối đợt:
  - `docs/audit/09-final-verification.md` do QA kiểm tra độc lập;
  - `docs/audit/NEXTA-READINESS.md` chỉ ghi các sự thật có bằng chứng.
