---
name: nexta-conventions
description: Quy ước bắt buộc khi code NEXTA (BƯỚC TIẾP) — kiến trúc, lệnh, từ ngữ tiếng Việt dễ hiểu (từ cấm → từ thay), dữ liệu thật, an toàn trẻ em, xác thực, test tối thiểu, commit sạch, bẫy Windows. Load trước mọi việc code trong repo này, và dán phần "Luật" vào prompt của mọi subagent.
---

# Quy ước NEXTA

NEXTA giúp **người đồng hành** (tình nguyện viên, cán bộ xã hội) đưa **người đang gặp khó** (lao động đường phố, người không nơi ở, thanh thiếu niên) tới **nơi hỗ trợ đã xác minh**, rồi **hỏi thăm lại** để biết họ có thật sự được giúp không.
Mọi màn hình phải trả lời được: *"Người dùng vào đây để làm xong việc gì?"*

## Kiến trúc & nơi đặt code
| Lớp | Thư mục | Quy tắc |
|---|---|---|
| Luật nghiệp vụ (hàm thuần) | `packages/shared/src/<domain>/` | Không I/O. An toàn trẻ em, kiểm tra an toàn, trạng thái chuyển gửi, tìm nơi phù hợp đều ở đây. Test ở `packages/shared/test/`. |
| Kiểu dữ liệu API | `packages/shared/src/types/api/<domain>.ts` | Web, app và API cùng import từ `@buoc-tiep/shared`. |
| API | `packages/api/src/routes/<domain>.ts` | `authMiddleware` → `scope` → `body(schema)` (zod) → luật shared → D1 → `c.json(data)` (giống `loop.ts`, không bọc thêm lớp). Lỗi: `throw new ApiError(status, 'MA_LOI', 'câu tiếng Việt')` → `app.onError` trả `{ error, code }` (web `lib/api.ts` và app `services/api.ts` đang đọc đúng dạng này). Mã lỗi mới phải thêm câu vi/en vào `apps/web/src/app/errors.ts`. |
| Hạ tầng API | `packages/api/src/lib/{http,validate,session,idempotency,audit}.ts`, `middleware/{auth,scope,rateLimit}.ts` | Dùng lại, không viết lại theo từng route. |
| DB | `packages/database/migrations/00NN_<domain>.sql` | Số lớn nhất hiện có + 1. Không tạo bảng ngoài migration. |
| Web | `apps/web/src/features/<màn-hình>/` | 1 trang = `XxxPage.tsx` chỉ ghép khối; **mỗi khối 1 file**. Hook dữ liệu ở `apps/web/src/lib/queries/<domain>.ts`. UI kit ở `apps/web/src/design/`. |
| App | `apps/app/src/screens/<Màn>Screen.tsx` + `src/components/` | Gọi API qua `src/services/api.ts`. Mọi trạng thái rỗng/lỗi/đang tải dùng `ScreenState`. |
| Chữ | web `apps/web/src/app/strings.ts`, app `apps/app/src/i18n/locales/{vi,en}.ts` | **Tiếng Việt là ngôn ngữ chính**, viết trước; tiếng Anh bổ sung đủ khóa. |

Luồng chuẩn của một khối giao diện: **khối → hook → endpoint → luật shared → bảng D1**. Người dùng làm một hành động thì khối liên quan phải đổi, nhờ invalidate đúng query.

## Lệnh
`npm run typecheck` · `npm test` · `npm run build` · `npm run db:migrate:local` · `npm run dev:api` (8787) · `npm run dev:web` (3000) · `npm run dev:app` (8081) · `node scripts/dev/smoke.mjs`

## Luật (dán vào prompt subagent)
1. **Tính năng thật.** Không gõ cứng số hay tên người trên giao diện ("Cô Lan", "30 ca"…). Dữ liệu demo **chỉ đưa vào qua API thật** (seed script), không có mảng mock trong UI và không dùng dữ liệu giả khi API lỗi.
2. **Không giả thành công.** API lỗi thì báo lỗi kèm nút thử lại. Lưu offline thì ghi "Đã lưu trên máy, sẽ gửi khi có mạng", không ghi "Đã lưu". Không bao giờ hiện "Đã gọi 111" nếu chưa thật sự mở cuộc gọi.
3. **An toàn trẻ em là luật cứng.**
   - Người dưới 18 tuổi, hoặc **chưa rõ tuổi**, **không** được đưa vào việc làm hay học nghề có lao động. Chỉ kiểm tra bằng `assertNotMinorForLivelihood` trong shared, ở **mọi** đường ghi.
   - Trẻ em luôn hiển thị bằng mã `CHILD-2026-XXXX`; ẩn số điện thoại và CCCD.
   - Màn hình nào có tình huống khẩn cấp cũng phải có nút gọi **111** (1 chạm, `tel:111`).
4. **Con người quyết định, AI chỉ gợi ý.** Kết quả AI gắn nhãn "Gợi ý — chưa xác minh". Không có hành động nào tự chạy từ kết quả AI. Khi mô hình lỗi thì vẫn làm được bằng tay. Không bịa độ tin cậy.
5. **Quyền theo tổ chức.** Mọi `:id` phải qua `requireCaseScope` / `canSeeCase`. Người thực hiện lấy từ phiên đăng nhập, **không bao giờ lấy từ body**. Không có tổ chức mặc định.
6. **Ghi quan trọng** (chuyển gửi, nhận/từ chối, đóng hành trình, duyệt, xác minh nơi hỗ trợ): header `Idempotency-Key` + ghi `audit_log` trong cùng `db.batch`.
7. **Chữ tiếng Việt dễ hiểu**: dùng bảng từ bên dưới, câu ngắn, nói việc cần làm tiếp.
8. **Test tối thiểu**: giữ test cũ xanh. Thêm 1–2 test ngắn cho luật an toàn, quyền truy cập, chuyển trạng thái. Không test giao diện bằng snapshot.
9. **Không đọc lan man, không viết lại** code đang chạy. Thứ tự ưu tiên: sửa > mở rộng > gộp > viết lại.

## Từ ngữ: cấm → dùng (giao diện tiếng Việt)
| Cấm / lẫn lộn | Dùng thống nhất |
|---|---|
| Case, ca, hồ sơ | **Hành trình** |
| Beneficiary, đối tượng | **Người được hỗ trợ**, hoặc gọi bằng tên / biệt danh |
| Navigator, Youth Navigator, TNV | **Người đồng hành** |
| Referral, chuyển tuyến | **Chuyển gửi** (riêng "Mẫu 07" giữ tên chính thức) |
| Partner (trong câu) | **Đơn vị hỗ trợ** |
| Coordinator | **Điều phối viên** |
| Follow-up, Check-in, Theo dõi | **Hỏi thăm** |
| SLA | **Hạn phản hồi**; trễ thì ghi **Quá hạn** |
| Safeguarding, Risk gate | **Kiểm tra an toàn** |
| Escalate, escalation | **Báo điều phối viên** |
| Match, matching | **Tìm nơi phù hợp** |
| Resource | **Nơi hỗ trợ** |
| Consent | **Sự đồng ý** |
| Onboarding | **Đăng ký tham gia** |
| Stale, unverified | **Chưa xác minh lại** |
| Dashboard, KPI | bỏ; ghi thẳng tên chỉ số |

Giữ nguyên các tên riêng: NEXTA, BƯỚC TIẾP, Mẫu 07, Tổng đài 111.

## Câu hỏi bắt buộc cho mỗi màn hình (human-centric)
1. Người dùng là ai?
2. Họ vào để làm gì?
3. Hành động chính là gì? Chỉ **1** nút chính.
4. Thông tin tối thiểu họ cần là gì?
5. Có làm được với ít bước hơn không?

Thứ tự trình bày: **TRẠNG THÁI → VIỆC CẦN LÀM TIẾP → VÌ SAO → NÚT HÀNH ĐỘNG**. Không làm màn chỉ gồm hàng thẻ số và biểu đồ mà không có nút nào.

## Giao diện
- Nền sáng (`#F8FAFC`, `#EDF3FB`), chữ `#0F172A` / `#1E293B`.
- Chữ phụ tối thiểu `#475569`; chữ trắng chỉ đặt trên nền đủ tối.
- **Không** dùng glassmorphism hay backdrop-blur.
- Chạy được ở độ rộng 320px, không tràn ngang.
- Khi đang tải hoặc lỗi thì hiện "—", không hiện số 0.

## Commit
- Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`). Mỗi commit là 1 đơn vị logic.
- Trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Stage theo tên file, không `git add -A`. Không stage `.env`, `.dev.vars`, `package-lock.json` (trừ khi thật sự thêm dependency), hay ảnh chụp trung gian.
- Trước khi commit: `npm run typecheck && npm test`. Nếu đụng tới app thì chạy thêm `npm run build`.

## Bẫy môi trường (Windows)
- **Git Bash đổi đối số bắt đầu bằng `/`** thành đường dẫn Windows. Dùng `MSYS_NO_PATHCONV=1` hoặc script Node.
- **curl gửi tiếng Việt bị hỏng dấu.** Gửi JSON bằng Node `fetch` hoặc `--data-binary @file.json`.
- **agent-browser screenshot:** đường dẫn phải bắt đầu bằng `./`.
- Viết file bằng tool Write/Edit, không dùng heredoc khi nội dung có dấu nháy.
- `wrangler.jsonc` **không** chứa secret. Secret đặt ở `packages/api/.dev.vars` (local) và `wrangler secret put` (production).
