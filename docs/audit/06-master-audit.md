# 06 — Tổng hợp audit NEXTA

> Nguồn: 01 (luồng sản phẩm), 02 (frontend/UX), 03 (backend/API/DB), 04 (AI/an toàn), 05 (chất lượng/bảo mật/triển khai), đã đối chiếu chéo với nhau.
> Ngày 2026-09-28 · commit `ddbdbbf`.

# Tóm tắt

## 1. NEXTA đã hoàn thiện tới đâu?
- **Hai sản phẩm nằm trong một repo:**
  - **Web portal mới** chạy trên `/api/v1/loop`. Đây là phần xây tốt nhất: có kiểm tra quyền theo tổ chức, kiểm tra an toàn bằng luật cố định, AI chỉ gợi ý, và vòng khép kín chạy được từ đầu đến cuối.
  - **App Expo** chạy trên stack API cũ (`/api/cases`, `/resources`, `/followups`). Stack này có lỗ hổng quyền, thiếu bước ghi sự đồng ý, và để trẻ em đi tới đường việc làm.
- **Hai bên không dùng chung dữ liệu.** Hành trình tạo trong app không hiện với điều phối viên và đơn vị hỗ trợ trên web.
- **Bảo mật nền chưa đạt:**
  - secret đã bị commit, ai có repo cũng ký được token admin;
  - router orchestration không cần đăng nhập;
  - có 3 kho danh tính khác nhau;
  - không có test nào.
- **Kết luận:** chưa sẵn sàng cho pilot thật. Có đủ nền móng để tới được đó mà **không cần viết lại**: giữ `loop` + `shared/closed-loop` làm lõi, vá bảo mật, rồi làm lại từng màn hình.

**Đối chiếu con số pitch với code:**

| Pitch | Thực tế |
|---|---|
| ~270 commit | 433 |
| ~33,3k dòng TypeScript | 70,5k dòng TypeScript |
| 118 API route | 220 handler, mỗi handler mount 2 lần |
| 16 component mobile | 17 |
| 17 file test | **0** |

## 2. Luồng chạy thật từ đầu đến cuối
Nghĩa là có đủ UI → API → luật → lưu D1 → phản hồi cho người dùng.

1. **Web — người đồng hành:**
   - mở hành trình → ghi sự đồng ý → ghi nhu cầu (AI gợi ý) → kiểm tra an toàn → tìm nơi phù hợp;
   - xác nhận bước tiếp theo → tạo chuyển gửi và lịch hỏi thăm 48 giờ;
   - đơn vị hỗ trợ nhận hoặc từ chối → người đồng hành hỏi thăm → đóng hành trình.
2. **Web — đăng ký tham gia:** mã email → nộp đơn → hệ thống tự sàng lọc → điều phối viên duyệt → học tập huấn → kích hoạt.
3. **Web — nơi hỗ trợ:** xác minh nơi hỗ trợ và cập nhật sức chứa.
4. **App — tiếp nhận:** ảnh hoặc giọng nói → `POST /api/cases` (lưu thật, có batch).
5. **App — hỏi thăm:** `POST /api/followups`.
6. **App — an toàn và báo lừa đảo:** xem xét cờ an toàn (chỉ tài khoản admin hoặc social_worker làm được); báo lừa đảo (MIL incident).

## 3. Chỉ có giao diện hoặc dữ liệu giả
- **App:**
  - Hôm nay, Tác động, Đội nhóm: dữ liệu "Cô Lan" gõ cứng.
  - Hộ chiếu sinh kế: QR giả, id sai nên luôn 404.
  - Thẻ thông tin xác minh.
  - Nút "Yêu cầu hỗ trợ" trong Đội nhóm báo thành công nhưng không gọi API.
- **Web `/legacy`:**
  - dữ liệu mock khi API lỗi;
  - báo "đã lưu" dù không lưu;
  - **báo "đã kích hoạt 111" nhưng không gọi cuộc nào**;
  - InteractiveDemoPortal, PublicImpactDashboard: 100% gõ cứng.

## 4. Chỉ có backend, không màn hình nào dùng
- Khoảng 30 handler "PDR" trong `cases.ts:1460-2094`.
- Toàn bộ `safeguarding.ts`, `partner.ts`, `signals.ts`, `opportunities`.
- `analytics`, `/public`, các endpoint đọc của orchestration.
- `cron` outbox: không có gì ghi vào hàng đợi.
- `passports` history và timeline.

## 5. Giả hoặc mock phía backend
- `hermes`: câu trả lời soạn sẵn, 0.99 "trích dẫn", có lỗ SSRF.
- `a2a`: trả cứng "VERIFIED 0.98".
- `impact` / `analytics`: dùng hệ số nhân và công tắc demo toàn cục.
- `journeys/today`: bịa ra hành trình.
- `passports/:id`: fixture Lan.
- `volunteers`: `settings` báo đã lưu mà không lưu; trả danh sách giả khi rỗng.
- `orchestration /reports`: fallback về 30/22/20/18/11.

## 6. Pitch nói quá so với code
| Pitch | Thực tế |
|---|---|
| "Mã hóa AES-256 khi offline" | Bản nháp lưu JSON thường |
| "17 file test" | 0 |
| "Voice AI" | Web Speech API của trình duyệt, chỉ chạy trên web |
| "Check-in GPS" | Không gửi vị trí |
| "QR Hộ chiếu sinh kế" | Hình vẽ giả, không quét được |
| "Mã hóa PII" | Chỉ mã hóa họ tên; số điện thoại bị bỏ; DOCX in ra bản mã hóa |
| "AI không bao giờ quyết định" | Đúng ở `loop`; ở stack cũ thì AI tự báo độ tin cậy và độ tin cậy bị bịa |
| "Mẫu 07" | Chỉ có trong `/legacy`, không nằm trong vòng lõi |

## 7. 10 vấn đề lớn nhất

| # | Mức | Vấn đề | Ai bị ảnh hưởng | Bằng chứng | Nguyên nhân gốc | File | Cách sửa | Phạm vi | Rủi ro hồi quy |
|---|---|---|---|---|---|---|---|---|---|
| 1 | P0 | Secret bị commit nên ai cũng ký được token admin | Tất cả | `wrangler.jsonc:68-71` | Để secret trong `vars` | wrangler.jsonc, auth, cases, cron, hermes, aiModelRouter | Chuyển sang `wrangler secret`, đổi khóa, bỏ các fallback | S | Token cũ hết hạn |
| 2 | P0 | Router `orchestration` không cần đăng nhập (`/api/people`, `/tasks`…) | Người được hỗ trợ, nhân sự | `index.ts:274` | Mount sau các guard | index.ts, orchestration.ts | auth + vai trò; người thực hiện lấy từ phiên | S | App `/api/tasks` phải gửi token (đã gửi) |
| 3 | P0 | Xác thực rời rạc: 3 kho danh tính, token thiếu tổ chức, Google không kiểm tra `aud`, `/me` chỉ đọc `users` | Mọi người đăng nhập | `auth.ts`, `onboarding.ts:254`, `middleware/auth.ts:41` | Mỗi phương thức đăng nhập tự `sign()`; không có nguồn danh tính duy nhất | auth.ts, middleware, lib mới `session.ts` | Phiên DB một kiểu, `nx_accounts` là nguồn chính (xem 07 §4) | M | Mọi người phải đăng nhập lại 1 lần |
| 4 | P0 | IDOR ở khoảng 45 handler cũ | Người được hỗ trợ | 03 §3 | Không có guard dùng chung | cases, p0Referrals, passports, followups, resources… | `requireCaseScope` tách từ `loop.canSeeCase` | M | Luồng demo `org-default` |
| 5 | P0 | Không chặn trẻ em ở 6 đường ghi; chưa rõ tuổi thì cho qua; app đưa trẻ em tới nút "Kết nối việc làm" | Trẻ em | 03 §4; `App.tsx:175,219,233` | Luật đặt rải rác trong từng route, theo sai trường | shared + 6 route + App.tsx | `assertNotMinorForLivelihood` + điều hướng trong app | M | Người lớn chưa ghi tuổi sẽ bị chặn tới khi nhập tuổi |
| 6 | P0 | App không có bước ghi sự đồng ý; endpoint consent luôn trả `granted:true` | Người được hỗ trợ | `cases.ts:1636-1679` | Làm intake như một bản demo 1 chạm | PhotoIntake, Voice, api.ts, cases.ts | Thêm bước đồng ý bắt buộc (qua loop, theo D1-A) | S | Thêm 1 bước khi tiếp nhận |
| 7 | P0 | Dữ liệu app và web tách rời; chuyển gửi từ app không tới đơn vị hỗ trợ | Đơn vị hỗ trợ, điều phối viên | `resources.ts:246`, `partner.ts:40` | 2 stack song song | `apps/app/src/services/api.ts` | D1-A: 4 method lõi của app gọi `/api/v1/loop` | M | Màn app phải map lại field trả về |
| 8 | P0 | Web: chuyển gửi bị từ chối biến mất khỏi mọi hàng đợi | Người được hỗ trợ | `loop.ts:289`; `CoordinatorPage.tsx:44` | UI coi "có chuyển gửi" là "đã xử lý" | `lib/caseSignals.ts` + 3 trang | Thêm helper `openReferral()` | S | Thấp |
| 9 | P0 | Lộ dữ liệu / tấn công được: `password_hash`, XSS khi export, SSRF qua Hermes, 111 giả | Tất cả | `volunteers.ts:28`, `p0Referrals.ts:558`, `hermes.ts:53`, `AnonymousCaseModal.tsx:59` | Chọn cả dòng `select *`; không escape; code demo còn sót | như cột bằng chứng | Chọn cột cụ thể / escape / gỡ mount | S | Thấp |
| 10 | P1 | Idempotency không làm gì; tranh chấp khi confirm và hỏi thăm; 0 test; deploy không chờ test | Tất cả | `idempotency.ts:17`; `loop.ts:780,1064`; `.github/workflows` | Chưa từng có hạ tầng | middleware, loop, migrations, CI | Port idempotency và test harness từ an-tam; UPDATE có điều kiện | M | Index unique cần dọn dữ liệu trùng trước |

**Tổng: P0 = 11 · P1 = 9 · P2 ≈ 12 · P3 ≈ 12 tính năng cần ẩn** (danh sách đầy đủ ở `08-implementation-plan.md`).

## 8. Đối chiếu chéo đáng chú ý
- **Backend nói "app dùng loop", mobile nói "app không gọi loop".** Đã kiểm tra `apps/app/src/services/api.ts`: app **không** gọi loop. Mọi lời gọi loop đều từ web.
- **Backend nói có `partner.ts` accept/decline, nhưng không màn hình nào dùng.** Web partner dùng `loop/referrals/:id/actions`. Kết luận: `partner.ts` là endpoint chết.
- **Web gọi `/api/cases/:id/handoff` và `/api/volunteers/:id/approve` nhưng hai route này không tồn tại.** Cả hai chỉ có trong `/legacy`, sẽ bỏ cùng legacy.
- **App gọi `getDocxExportUrl` luôn nhận 401.** API có route, nhưng `Linking.openURL` không gửi header `Authorization`. Lỗi nằm ở chỗ nối app → API, không phải ở API.
- **README ghi "Hard blocking for minors" là IMPLEMENTED.** Thực tế chỉ chặn 4/10 đường ghi, và cho qua khi chưa rõ tuổi.

## Phụ lục — Bản đồ tính năng cũ: dùng lại được gì
| Tính năng cũ | Ở đâu | Thật? | Quyết định |
|---|---|---|---|
| Tiếp nhận ảnh / giọng nói | `cases.ts:156`, app PhotoIntake / Voice | Thật, có batch, zod | **Dùng lại giao diện**; phần ghi chuyển sang loop (D1-A) |
| Encounters | `cases.ts:368` | Thật, có kiểm tra tổ chức | Giữ cho dữ liệu cũ |
| Hỏi thăm `/api/followups` | `followups.ts:17` | Thật; caseId mặc định sai, không có phạm vi | Chuyển sang loop follow-ups; khóa quyền phần cũ |
| Xem xét cờ an toàn | `cases.ts:96,1115` | Thật, có kiểm tra vai trò; chưa kiểm tra tổ chức | Khóa quyền; dần chuyển sang escalations của loop |
| Danh mục `resources` | `resources.ts:23` | Thật; nơi hỗ trợ mới mặc định VERIFIED | App chuyển sang `loop/directory`; phần cũ mặc định UNCONFIRMED |
| Chuyển gửi từ app | `resources.ts:246` | Ghi thật nhưng không tới đơn vị hỗ trợ | **Thay** bằng loop match + next-steps |
| Kênh Mẫu 07 / 111 / 1022 | `p0Referrals.ts` | Thật; chưa có phạm vi; có XSS | Giữ cấu hình kênh + export (có escape) |
| Bộ sinh Mẫu 07 `.docx` | `apps/web/src/documents/referral/*` | **Thật, tốt** | **Chuyển vào W4 / W6**, rồi mới xóa `/legacy` |
| Tasks | `orchestration.ts:200` | Thật; không cần đăng nhập | Khóa quyền; người thực hiện lấy từ phiên |
| QR credential | `cases.ts:883` | HMAC thật nhưng cắt còn 64 bit | Để sau (P2) |
| Passport | `cases.ts:686`, `passports.ts` | Một phần + fixture | **Ẩn** (P3) |
| MIL incident | `mil.ts:92` | Thật | Giữ (P2); bỏ `cards` lưu trong bộ nhớ |
| PDR 26-30 | `cases.ts:1460-2094` | Không dùng; một phần giả | **Gỡ mount** |
| safeguarding / partner / signals / opportunities / analytics / impact demo | — | Không dùng / bịa số | **Gỡ mount** (file vẫn còn trong lịch sử git) |
| `/legacy` web | `LegacyApp.tsx` | Mock | **Xóa** sau khi chuyển Mẫu 07 |
