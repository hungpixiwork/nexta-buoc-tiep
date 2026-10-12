# 03 — Backend, API và Database

> Phạm vi: `packages/api` (27 file route, khoảng 12.500 dòng), `packages/database`, luật trong `packages/shared`. Chỉ đọc code, không chạy.
> Ký hiệu cột **Auth**: N = không có · J = JWT · F = giả (chỉ kiểm tra có header) · S = khóa chia sẻ · Q = JWT trên query string.
> Ký hiệu cột **Lớp**: A = dùng được cho production · B = đã code nhưng chưa an toàn · C = giả / placeholder · D = không client nào gọi · E = trùng chức năng.

## 1. Nhận xét tổng quát
- **`loop.ts` và `onboarding.ts` được xây tốt nhất.** Cả hai có zod, phạm vi tổ chức (`scopeOf` / `canSeeCase`, `loop.ts:42-100`), máy trạng thái và `db.batch`.
- **Stack cũ** (`cases`, `p0Referrals`, `partner`, `safeguarding`, `passports`, `resources`, `followups`, `orchestration`) có ba vấn đề:
  - khoảng 45 handler `:id` chỉ kiểm tra người gọi đã đăng nhập, không kiểm tra họ có quyền với bản ghi đó;
  - không có handler nào dùng `requireRole`;
  - 4 router cùng ghi vào một bảng `referrals`, mỗi router dùng một bộ từ trạng thái khác nhau.

## 2. Bảng phân loại API (tóm tắt theo router)
| Router (mount) | Auth | Tổng quan | Lớp |
|---|---|---|---|
| `auth` (`/api(/v1)/auth`) | N | `/google` không kiểm tra `aud` và `email_verified` (`auth.ts:35-40`); `/dev-login` cho chọn vai trò, `sub` và tổ chức (`:98-112`); `/login` và `/register` không giới hạn tần suất; `/otp/*` ổn (có giới hạn tần suất và giới hạn số lần thử) | B / A |
| `survey` | F | GET trả tới 500 dòng kèm số điện thoại và email; `?admin_key` với giá trị bất kỳ cũng qua (`survey.ts:174-202`) | B |
| `a2a` | F | Trả cứng "VERIFIED 0.98" (`a2a.ts:113-131`) | C, D |
| `hermes` | N | Câu trả lời soạn sẵn, "trích dẫn" 0.99 cố định, **SSRF** qua `webhook_url` ký bằng `JWT_SECRET` (`hermes.ts:48-64`) | C + B |
| `cron` | S | So khóa bằng `includes()`, fallback sang `JWT_SECRET` (`cron.ts:100`); hàng đợi outbox không có ai ghi vào | B / C |
| `realtime` | Q | Token nào cũng vào được phòng của tổ chức bất kỳ (`realtime.ts:40-53`) | B |
| **`orchestration`** (`/api`, `/api/v1`) | **N** | `/people` quét toàn bảng; `/tasks`, `/follow-ups`, `/outcomes` lấy người thực hiện từ body; `/reports/human-impact` fallback ra 30/22/20/18/11 | B, C |
| `cases` | J | Chỉ `GET /`, `GET /:id` và `encounters` kiểm tra tổ chức. Khoảng 45 handler khác không kiểm tra. `/consent` luôn trả `granted:true` (`:1679`). Khoảng 30 handler "PDR" (`:1460-2094`) không được gọi. `GET /:id/timeline` khai báo 2 lần. `export-docx` khai báo 3 lần | B, C, D, E |
| `p0Referrals` | J | Không kiểm tra tổ chức. Chặn trẻ em chỉ khi `type==='EMPLOYMENT'` (`:97`). **XSS lưu trữ** trong HTML export (`:558-568`). Lỗi ưu tiên toán tử tạo ra `tel:undefined` (`:308`) | B |
| `partner` | J | accept / decline / action không kiểm tra vai trò, tổ chức hay chuyển trạng thái | B, D |
| `safeguarding` | J | Không kiểm tra vai trò hay tổ chức; không client nào gọi | B, D |
| `analytics`, `/public` | J / N | Hệ số nhân cố định, `activeNavigatorsCount: 12`, số liệu gõ cứng | C, D |
| `impact` | J | Số ước lượng; `demo-seed` là công tắc toàn cục mà user nào cũng bật được (`:369,451`) | C, B |
| `passports` | J | Fixture "Lan" (`:104-144`); `PUT` không kiểm tra trẻ em | C, B |
| `resources` | J | Nơi hỗ trợ mới mặc định VERIFIED (`:171-174`); `verifiedBy` lấy từ body; `/referrals` không có `partnerId`, không chặn trẻ em, mặc định `case-lan-hoc-mon` | B |
| `volunteers` | J | **Trả về `password_hash`** (`:28,64`); danh sách giả khi rỗng; `settings` trả lại input mà không lưu gì | B + C |
| `auditLogs` | J | POST cho phép ai cũng ghi audit với userId, tổ chức và IP bất kỳ (`:41-57`) | B |
| `journeys` | J | `/today` bịa ra hành trình (`:54-67`); `/participants` liệt kê user của mọi tổ chức | C, B |
| `mil` | J | `cards` lưu trong bộ nhớ của isolate; `incidents` thật | C / A- |
| `campaigns`, `missions`, `signals` | J | Sửa hoặc duyệt không kiểm tra chủ sở hữu hay vai trò; tranh chấp khi nhiều người giữ chỗ cùng lúc | B |
| **`loop`** | J + scope | zod, phạm vi tổ chức, máy trạng thái, AI chỉ gợi ý | **A / A-** (lỗ hổng xem §4) |
| **`onboarding` / `admin`** | N / J | zod, lưu hash của thỏa thuận, lịch sự kiện | **A** |

Đường dẫn trùng: có 220 handler, mỗi router mount ở cả `/api` và `/api/v1` (riêng `loop`, `campaigns`, `missions`, `signals`, `onboarding` chỉ ở `/api/v1`).

## 3. IDOR — kiểm tra quyền trên từng bản ghi
- **Đọc dữ liệu của tổ chức khác:**
  - `cases.ts:548,566,686,783,1343,1401,1620,1685,1750,1794,1841,1966,1978`
  - `safeguarding.ts:75`
  - `passports.ts:18,58,419,432`
  - `p0Referrals.ts:188,440`
  - `resources.ts:239`
  - `followups.ts:10`
  - `journeys.ts:134`
  - `signals.ts:43`
- **Ghi vào dữ liệu của tổ chức khác:**
  - `cases.ts:642,709,823,883,934,1011,1115,1156,1224,1306,1364,1420,1465,1517,1572,1636,1704,1758,1801,1848,1878,1985,2035,2078`
  - `p0Referrals.ts:49,227,272,340,368`
  - `partner.ts:120,154,193,249`
  - `safeguarding.ts:106,173,235`
  - `resources.ts:189,371`
  - `passports.ts:181,445`
  - `campaigns.ts:234-456`
  - `missions.ts:148,169`
- **Id con không bị ràng buộc với case trên URL:** `cases.ts:1024` (analysis), `:1127` (flag), `:1888` (fact), `campaigns.ts:470`.
- **Lộ dữ liệu qua khóa idempotency:** `cases.ts:170-191` trả về encounter của tổ chức khác.
- **`org-default`:** `middleware/auth.ts:41`. User tự đăng ký hoặc đăng nhập Google đều bị đưa vào tổ chức này.
- **Hướng sửa:** tách `scopeOf` / `canSeeCase` từ `loop.ts:67-100` ra `middleware/scope.ts`, rồi dùng `requireCaseScope()` cho mọi route có `/:id/*` và `/:caseId/*`.

## 4. Chặn trẻ em (dưới 18 tuổi)
- **Đã chặn:**
  - `cases.ts:721-732` (passport)
  - `passports.ts:215-231`, nhưng cho qua khi không tìm thấy beneficiary
  - `p0Referrals.ts:97`, chỉ khi `type` là EMPLOYMENT
  - pipeline của `loop` (`blockEmployment`, `loop.ts:688`)
- **Chưa chặn:**
  - `PUT /passports/:id`
  - chuyển gửi `GENERAL` tới kênh việc làm `TT_DVVL_HCM`
  - `POST /resources/referrals`
  - `cases /:id/tasks job_trial` (`:591`)
  - `POST /api/tasks`
  - `POST campaigns/:id/participants`
- **Luật shared cho qua khi không rõ tuổi:** `safeguardingRuleEngine.ts:68-73` chỉ chặn việc làm khi biết chắc tuổi dưới 18.
- **Bản ghi tìm-nơi-phù-hợp cũ vẫn còn dùng được:** `loop /understanding` reset quyết định rủi ro nhưng không xóa bản ghi tìm-nơi-phù-hợp cũ (`loop.ts:509-524`).

## 5. Toàn vẹn dữ liệu
- **Middleware idempotency không làm gì:** `idempotency.ts:17-19` chỉ `c.set` khóa và không ai đọc lại. `encounters.client_generated_id` không có unique index. Bảng `idempotency_keys` được `aiModelRouter.ts:120` đọc nhưng không tồn tại.
- **Tranh chấp khi hai request tới cùng lúc:**
  - `loop.ts:780→792` (confirm tạo 2 chuyển gửi)
  - `:964` (UPDATE thiếu `AND stage=?`)
  - `:1064` (hỏi thăm bị ghi 2 lần)
  - accept / decline trong partner và orchestration
  - `campaigns.ts:367-383` (tràn chỗ)
- **Nhiều lần ghi mà không nằm trong một batch:** `loop.ts:1069-1106` (tới 7 lần ghi), `p0Referrals.ts:140+155`, `orchestration.ts:206+222`, và nhiều chỗ khác.
- **Hai bộ từ trạng thái:** chữ thường (`validators/index.ts:235-243`) và chữ hoa (`cases.ts:1537,1599,1664,2015,2053`). Hệ quả: gọi `PATCH` sau khi ghi trạng thái chữ hoa luôn trả 400; cron vẫn nhắc hành trình đã `CLOSED`.
- **Ba bảng danh tính** `users`, `nx_accounts`, `people`: khóa ngoại trỏ về `users.id`, nhưng tài khoản OTP có id dạng `acc-*`, nên các lệnh ghi vào bảng cũ bị lỗi khóa ngoại.
- **Bảng loop và onboarding nằm ngoài migration** (`database/package.json:13-14`).
- **Thiếu unique:** `encounters.client_generated_id`, `loop_referrals(next_step_id)`, `loop_referrals.code`, `campaign_slots(campaign_id,user_id)`, `training_completions(account_id,module_code)`.
- **Thiếu index:** `loop_follow_ups(case_id)`, `loop_follow_ups(referral_id)`, `loop_referral_events(case_id)`, `loop_escalations(case_id)`, `loop_case_scope(host_org_id)`.
- **Quét toàn bảng rồi lọc bằng JS:** `orchestration.ts:44,86,117,141,190,367-392,423-426`, `resources.ts:55`, `passports.ts:35`, `loop.ts:1363-1370`.
- **N+1:** `p0Referrals.ts:599`, `cron.ts:292-327`, `signals.ts:88-155`.

## 6. Dữ liệu cá nhân (PII)
- `PII_ENCRYPTION_KEY` chỉ mã hóa `fullName` ở `POST /api/cases`:
  - khóa tạo bằng `padEnd('0')`, không dùng KDF;
  - `encryptedPhone` được tính nhưng không lưu;
  - `decryptPII` không được gọi ở đâu, nên file DOCX in ra bản mã hóa của họ tên.
- **Các endpoint lộ PII:**
  - `/api/volunteers`: trả `password_hash`, điện thoại, email.
  - `/api/survey`: điện thoại và email người trả lời.
  - `/api/cases`: `fullName`, `birthYear`.
  - `/api/people` (không cần đăng nhập).
  - `/safeguarding/queue`: `birthYear` của trẻ em.
  - `/journeys/:id/participants`.
- **Lộ qua log:** `hono/logger` ghi cả `?token=` và `?admin_key=`.
- **Audit:**
  - `audit_logs` rất thưa và ai cũng giả mạo được (`auditLogs.ts:41`).
  - Không có audit cho: tạo, đóng, gán hành trình; cấp QR; tạo và sửa passport; xác minh nơi hỗ trợ; dev-login; demo-seed; các lệnh ghi của orchestration.

## 7. Lỗi, log, CORS
- Trả `err.message` thô cho client ở khoảng 30 chỗ.
- Không có `app.onError`.
- CORS `origin: '*'`.
- Không giới hạn tần suất cho `/login`, `/register`, `/dev-login`, `/privacy/requests`, `/hermes`.

## 8. Chức năng giả hoặc không có thật
- **Bịa số liệu:** `impact.ts:131-140,413-438`, `analytics.ts:62-86,193-277`, `orchestration.ts:428-432`.
- **Dữ liệu mẫu gõ cứng:** `passports.ts:104-165`, `volunteers.ts:38-61`, `journeys.ts:54-67`.
- **Báo thành công mà không lưu gì:** `cases.ts:1156-1337` (evidence, journey advance), `volunteers.ts:146-170`.
- **Id gõ cứng dùng làm mặc định:** `usr-volunteer-default` (khoảng 40 chỗ), `case-lan-hoc-mon`, `case-sample-001`.

## 9. Ứng viên gộp
| Nhóm | Giữ lại | Bỏ hoặc đóng băng |
|---|---|---|
| Chuyển gửi | `loop_referrals` + `ReferralLoop` | tạo/duyệt/trạng thái trong `p0Referrals`, `resources/referrals`, `partner/*` (giữ cấu hình kênh và export Mẫu 07) |
| Hỏi thăm | `loop_follow_ups` | `followups.ts` (app vẫn dùng cho tới khi làm xong D1), `orchestration /follow-ups`, `cases /:id/tasks` |
| Hành trình | `loop_cases` | đóng băng `cases.ts`, gỡ mount các phần PDR 26-30 |
| An toàn | risk-gate / escalations của loop | `safeguarding.ts`, `cases /:id/safeguarding` |
| Sự đồng ý | `loop consent` | `cases /privacy-gate`, `/consents`, `/consent` |
| Nơi hỗ trợ | `directory_resources` + nhật ký xác minh | `resources` (app đang dùng), `support_gateways` |
| Số liệu | `loop /metrics`, `/reports`, `onboarding /transparency` | `impact`, `analytics`, `/public`, `orchestration /reports` |
| Danh tính | `nx_accounts` (+ bản sao `users` để giữ khóa ngoại) | `people` (chỉ đọc) |
