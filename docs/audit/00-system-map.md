# Bản đồ hệ thống NEXTA

> Ngày audit: 2026-09-28 · Commit: `ddbdbbf` · Cách làm: đọc code, không chạy app; chạy `npm run typecheck`.
> NEXTA là tên sản phẩm. Code và các package tên `buoc-tiep` (BƯỚC TIẾP).

## Con số pitch so với code
| Pitch | Đo được | Cách đo |
|---|---|---|
| ~270 commit | **433** | `git log --oneline \| wc -l` |
| ~33.300 dòng TypeScript | **70.459** | mọi file `*.ts` / `*.tsx` được git theo dõi |
| 118 API route | **220 handler**, mỗi router mount cả ở `/api/X` lẫn `/api/v1/X` | grep `Routes.(get\|post\|put\|patch\|delete)(` |
| 16 component mobile | **17** | `apps/app/src/components` |
| 17 file test | **0** | không có `*.test.*` / `*.spec.*`, không có test runner |

`npm run typecheck` pass cả 5 workspace.

## Công nghệ
- Monorepo npm workspaces, TypeScript 5.4, Node ≥ 18 (CI dùng Node 22; máy dev Node 24).
- **Web:** Vite + React 18, React Router, TanStack Query, Tailwind 4 (`apps/web`).
- **Mobile:** Expo React Native, có bản web (`apps/app`). Không dùng thư viện điều hướng; chuyển màn bằng một chuỗi trạng thái.
- **API:** Hono trên Cloudflare Workers (`packages/api`).
- **Dữ liệu và dịch vụ Cloudflare:** D1 qua drizzle-orm và `prepare()` thô (`packages/database`); KV, R2, Vectorize (không dùng), Workers AI, Durable Object `PartnerInboxRoom`.
- **Luật nghiệp vụ dùng chung:** `packages/shared` (TypeScript thuần + zod).

## Cấu trúc repo
```
apps/web          Portal mới theo vai trò + trang công khai + /legacy (portal cũ, vẫn mount)
apps/app          App Expo cho tình nguyện viên (17 màn, 17 component, services/api.ts, storage.ts hàng đợi offline)
apps/landing      rỗng
packages/api      src/index.ts, 27 file route (~12.500 dòng), middleware, services, utils, Durable Object
packages/database drizzle schema, 8 migration (57 bảng), loop/*.sql (21 bảng NGOÀI migration), seed.sql
packages/shared   closed-loop/* (RiskGate, MatchPipeline, ReferralLoop, NoteStructurer, LoopMetrics…),
                  referrals/safeguardingRuleEngine, matching/MatchingPolicy, rbac/RBACMatrix, onboarding/*, validators
.github/workflows ci.yml, deploy.yml
```

## Chạy và triển khai
- **Worker `buoc-tiep-api`:** cấu hình ở `packages/api/wrangler.jsonc`; có 1 cron `handleCronSlaScan`.
- **Pages `buoc-tiep-web` và `buoc-tiep-app`:** `deploy.yml` deploy **mỗi lần push master**, chỉ chặn bởi typecheck.
- **CI (`ci.yml`):** bước lint không làm gì vì không workspace nào có script `lint`.
- **Secret bị commit:** `wrangler.jsonc` `vars` chứa `JWT_SECRET`, `PII_ENCRYPTION_KEY`, `CRON_SECRET` dạng chữ thường.
- **Durable Object** chưa được tạo trên Cloudflare.
- **Bảng loop và onboarding** được tạo bằng script `db:loop:*` chạy tay, không nằm trong migration.

## Vai trò người dùng
Giá trị JWT `role`:
- `volunteer`
- `partner` / `partner_staff` / `partner_admin`
- `admin`, `coordinator`, `social_worker`, `supervisor`, `host_admin`
- `observer`, `applicant`

Có **3 bảng ánh xạ vai trò riêng** và 1 ma trận quyền, không đồng bộ với nhau:
- Web: `apps/web/src/lib/api.ts:24-42` ánh xạ ra navigator / partner / coordinator / host / observer / applicant.
- App: `apps/app/src/screens/LoginScreen.tsx:24-28` ánh xạ ra volunteer / leader.
- Loop: `loop.ts actorOf` ánh xạ ra NAVIGATOR / PARTNER / COORDINATOR.
- Ma trận: `packages/shared/src/rbac/RBACMatrix.ts`; vai trò lạ bị coi là PUBLIC.

## Route giao diện
**Web** (`main.tsx:41-83`):
- **Công khai:** `/`, `/join*`, `/login`, `/status`, `/privacy`, `/legal/:code`, `/transparency`, `/living-lab`.
- **Người đồng hành:** `/navigator`, `/journeys`, `/journeys/new`, `/journeys/:id`, `/navigator/follow-ups`, `/directory`, `/training`.
- **Đơn vị hỗ trợ:** `/partner`, `/partner/schedule`, `/partner/results`, `/partner/resources`.
- **Điều phối viên:** `/coordinator`, `/coordinator/match[/:caseId]`, `/coordinator/safety`, `/coordinator/reports`, `/admin/approvals`, `/admin/finance`.
- **Khác:** `/campaigns*`, `/missions*`, và `/legacy/*` (vẫn truy cập công khai được).

**App:**
- Bắt đầu ở màn đăng nhập.
- 4 tab: Hôm nay, Tác động, Đội nhóm, Thêm.
- Các màn con: BeforeYouGo, PrioritySelection, VoiceListening, PhotoIntake, LivelihoodPassport, CheckIn, ResourceDirectory, TaskAssignment, SafeguardingReview, MIL, VerifiedInfoCard, Profile.

## Bề mặt API
Chi tiết ở `03-backend-api-db-audit.md`.

| Mount | Router | Auth khi mount |
|---|---|---|
| `/api(/v1)/auth`, `/public`, `/survey` | auth, analytics public, survey | công khai (survey có kiểm tra admin giả bên trong) |
| `/api/a2a`, `/hermes`, `/cron`, `/realtime` | a2a, hermes, cron, realtime | công khai / khóa chia sẻ / JWT trên query |
| `/api(/v1)/{export,passports,cases,followups,opportunities,mil,journeys,resources,impact,referrals,referral-channels,volunteers,audit-logs,partner,safeguarding,analytics}` | router cũ | JWT |
| `/api/v1/{loop,campaigns,missions,signals}` | loop… | JWT |
| `/api/v1/onboarding`, `/api/v1/admin` | onboarding | từng route |
| **`/api(/v1)` (bắt tất cả)** | **orchestration** | **KHÔNG CÓ** |

## Thực thể dữ liệu
- **Stack cũ** (migration 0000-0007): `users`, `organizations`, `people`, `beneficiaries`, `cases`, `encounters`, `case_facts`, `consents` / `case_consents`, `safeguarding_flags`, `escalations`, `referrals`, `referral_events`, `referral_channel_configs`, `follow_ups`, `outcomes`, `timeline_events`, `audit_logs`, `resources`, `livelihood_passports`, `safe_next_steps`, `matches`, `case_tasks`, `support_gateways`, `campaigns`, `campaign_slots`, `missions`, `survey_responses`, `domain_outbox`…
- **Vòng khép kín** (`loop/schema.sql`): `loop_cases`, `loop_facts`, `loop_case_scope`, `loop_matches`, `loop_next_steps`, `loop_referrals`, `loop_referral_events`, `loop_follow_ups`, `loop_escalations`, `directory_resources` (+ bảng xác minh).
- **Đăng ký tham gia** (`loop/onboarding.sql`): `nx_accounts`, `nx_orgs`, `email_otps`, `applications`, `application_events`, `agreement_acceptances`, `volunteer_profiles`, `training_completions`, `ledger`, `privacy_requests`.
- **3 bảng danh tính:** `users`, `nx_accounts`, `people`. Khóa ngoại cũ trỏ về `users.id`.

## Dịch vụ bên ngoài
- Google OAuth.
- Google Gemini 2.5 Flash.
- Dịch vụ gửi email mã OTP. Khi chưa cấu hình, API trả luôn `devCode`.
- Webhook ký gửi ra ngoài (từ Hermes).

## Dịch vụ AI
| Tính năng | Mô hình | File |
|---|---|---|
| Định tuyến khi tiếp nhận (stack cũ) | Whisper-v3 → qwen3-30b → Gemini | `utils/aiModelRouter.ts` |
| Gợi ý ghi chú (loop) | llama-3.1-8b, chỉ gợi ý, timeout 4 giây | `loop.ts:542` |
| Hermes | **không có mô hình** (câu trả lời soạn sẵn) | `hermes.ts` |
| A2A | **không có mô hình** (trả cứng) | `a2a.ts` |

Luật cố định: `RiskGate`, `safeguardingRuleEngine`, `MatchPipeline` / `MatchingPolicy`, `NoteStructurer`, `ScreeningEngine`.

## Xác thực
1. **Mật khẩu** (`/auth/login`, `/register`) trên bảng `users`: token **không có tổ chức**.
2. **Mã email** (`/auth/otp/*`) trên `nx_accounts`: token có vai trò và tổ chức; có giới hạn tần suất.
3. **Google:** không kiểm tra `aud` / `email_verified`; nối tài khoản theo `email OR id`.
4. **Demo** (`/auth/dev-login`): chọn được vai trò, `userId`, tổ chức; token `demo:true` được thấy tất cả trong loop.
5. **`/onboarding/session`:** ký lại token sau khi được duyệt.

Hiện có 6 chỗ tự `sign()`, và `/auth/me` chỉ đọc bảng `users`.

## Phân quyền
- **`authMiddleware`:** mặc định gán `organizationId = 'org-default'`.
- **`requireRole`:** dùng **0 lần**.
- **`loop.ts`:** có middleware phạm vi (`scopeOf` / `canSeeCase`).
- **Router cũ:** chỉ 4 handler kiểm tra tổ chức.

## Workflow chính
1. **Vòng khép kín của người đồng hành trên web** (chạy từ đầu đến cuối).
2. **Đăng ký tham gia trên web** (chạy từ đầu đến cuối).
3. **Tiếp nhận trên app:** `POST /api/cases` → Hộ chiếu (giả) → Nơi hỗ trợ → `POST /api/resources/referrals` (không tới được đơn vị hỗ trợ).
4. **Hỏi thăm trên app** (`/api/followups`).
5. **Xem xét an toàn trên app.**

## Test hiện có
**Không có.**

## TODO / FIXME / stub đã biết
- `TODO.md`: QR và timeline của Hộ chiếu sinh kế.
- Dấu mock hoặc TODO ở các màn app Home, Impact, Passport, Priority, Team; ở `LegacyApp.tsx`; ở `cases.ts`, `cron.ts`, `exportDocx.ts`, `journeys.ts`, `aiModelRouter.ts`.
- Bảng `idempotency_keys` được đọc nhưng không tồn tại.
- Hàng đợi `domain_outbox` không có ai ghi vào.
