# 05 — Chất lượng, bảo mật và triển khai

## 1. Test
- **Không có file test, không có test runner, không có script lint.** README và pitch ghi "17 file test", nhưng thực tế là **0**.
- Các workflow quan trọng hiện chưa có test nào: đăng nhập, phạm vi tổ chức, chặn trẻ em, chuyển trạng thái chuyển gửi, idempotency, hỏi thăm.
- **Đề xuất (học từ an-tam):**
  - `vitest` ở root.
  - `tests/helpers/sqlite-d1.ts` giả lập D1 bằng `node:sqlite`, chạy thật migrations, trigger và khóa ngoại. Không cần miniflare; máy dev đang dùng Node 24.
  - Test route bằng `app.request()` của Hono, dùng env giả gồm D1 sqlite và secret test.
  - Luật thuần trong `packages/shared` được test trực tiếp.

## 2. Build / typecheck / lint / CI
- `npm run typecheck` pass cả 5 workspace (ngày 2026-09-28).
- `ci.yml`: bước lint không làm gì vì chạy `--if-present` mà không workspace nào có script lint.
- `deploy.yml` deploy production **mỗi lần push master**, chỉ chặn bởi typecheck. Không có test, không có `wrangler deploy --dry-run`.
- **Đề xuất:** thêm job `npm test` và cho deploy chờ job CI xong (`needs`).

## 3. Biến môi trường và secret
| Vấn đề | Bằng chứng | Mức |
|---|---|---|
| `JWT_SECRET`, `PII_ENCRYPTION_KEY`, `CRON_SECRET` ghi thẳng trong `wrangler.jsonc` `vars` và đã commit, nên ai có repo cũng ký được token admin | `packages/api/wrangler.jsonc:68-71` | **P0** |
| Nhiều chỗ fallback về `JWT_SECRET` hoặc chuỗi cố định | `aiModelRouter.ts:109`, `cases.ts:904`, `hermes.ts:54`, `cron.ts:100`, OTP pepper `auth.ts` | P0 |
| `.env` ở root đã được gitignore (đã kiểm tra `git check-ignore`) | — | OK |
| Không có `.dev.vars.example` cho API | — | P1 |
**Việc người dùng phải tự làm:** `wrangler secret put` cho 5 khóa và đổi khóa mới (rotate). Các token cũ sẽ hết hiệu lực. Việc xóa secret khỏi lịch sử git là thao tác phá hủy, chỉ làm khi người dùng đồng ý.

## 4. Bảo mật cơ bản
| Mục | Hiện trạng | Mức |
|---|---|---|
| Xác thực | 3 kho danh tính; Google không kiểm tra `aud`; dev-login cho chọn vai trò và `sub` | P0 |
| Phân quyền theo vai trò | `requireRole` được dùng 0 lần | P1 |
| Quyền trên từng bản ghi | Khoảng 45 handler cũ bị IDOR (xem 03 §3) | P0 |
| Router không cần đăng nhập | `orchestration` ở `/api`; survey dùng khóa admin giả | P0 |
| Kiểm tra đầu vào | Có zod ở loop, onboarding và một phần cases; phần lớn router cũ không có | P1 |
| XSS | HTML export trong `p0Referrals.ts:558-568` không escape | P0 |
| SSRF | `hermes webhook_url` | P0 |
| Giới hạn tần suất | Chỉ có ở OTP | P1 |
| CORS | `*` | P1 |
| Rò lỗi | Khoảng 30 chỗ trả `err.message`; không có `onError` | P1 |
| Rò PII | `password_hash` trong `/api/volunteers`; log ghi `?token=` | P0 / P1 |
| Nhật ký kiểm toán | Thưa; `POST /audit-logs` giả mạo được | P1 |
| Prompt injection | Xem 04 §2 | P1 |

## 5. Runtime Cloudflare
- `compatibility_date` 2026-07-27, `nodejs_compat`: ổn.
- Durable Object `PartnerInboxRoom` chưa được tạo (theo comment trong wrangler); `/api/realtime` không cần đăng nhập vẫn vào được.
- `VECTOR_INDEX` đã bind nhưng không dùng. Có thể bỏ binding để giảm độ phức tạp.
- Các bảng loop và onboarding tạo bằng `db:loop:*` ngoài migration, nên một môi trường mới sẽ thiếu bảng.

## 6. Quan sát hệ thống và khôi phục khi lỗi
- Đã bật `observability`. `hono/logger` ghi cả URL đầy đủ, nên phải che query string.
- Không có `/health/ready` kiểm tra bảng loop.
- Hàng đợi offline của app: lưu dạng chữ thường (không mã hóa), không gắn với người dùng, không khóa đồng bộ, thử lại vô hạn (`storage.ts`).
- Không có cơ chế thử lại an toàn phía server vì idempotency không hoạt động.

## 7. Workflow quan trọng và test cần có (tối thiểu)
| Workflow | Test cần có |
|---|---|
| Đăng nhập (OTP, mật khẩu, demo) | Cùng một dạng phiên; tài khoản bị khóa thì bị từ chối; phiên đăng xuất thì hết hiệu lực |
| Phạm vi tổ chức | Token tổ chức B gọi hành trình của tổ chức A → 403 (cả loop lẫn router cũ) |
| Chặn trẻ em | Trẻ em hoặc chưa rõ tuổi → chuyển gửi việc làm, passport, task job_trial đều bị 403 |
| Kiểm tra an toàn | `EMERGENCY_111` không được hạ mức; `HUMAN_REVIEW` cần vai trò điều phối viên |
| Chuyển gửi | Gửi confirm 2 lần chỉ tạo 1 chuyển gửi; chuyển trạng thái sai → 409 |
| Hỏi thăm | Ghi 2 lần chỉ ra 1 kết quả |
