---
name: nexta-screen
description: Làm (hoặc làm lại) MỘT màn hình NEXTA từ đầu đến cuối theo luồng thật — ghi chú màn hình human-centric, backend → hook → khối UI, seed qua API thật, kiểm tra tối đa 3 vòng ở 390/1024/1440px, smoke, typecheck/test/build, commit. Use khi được yêu cầu làm/sửa/tối ưu màn hình W1..W11 hoặc A1..A7 trong screens.md, hoặc "/nexta-screen <mã>".
---

# nexta-screen — làm từng màn hình, chắc chắn chạy thật

Đầu vào là mã màn hình (vd `W4`, `A3`). Tham chiếu: [screens.md](screens.md) (người dùng, việc cần làm, khối, dữ liệu) và `docs/audit/07-pilot-mvp.md`.
Đọc trước `.claude/skills/nexta-conventions/SKILL.md` (luật, bảng từ, an toàn trẻ em).

## Luật riêng
1. **Một màn hình, một việc chính.** Nếu màn hình có hơn 1 nút chính, hoặc có khối không dẫn tới hành động nào, thì gộp lại hoặc bỏ đi.
2. **Luồng thật:** khối → hook → endpoint → luật shared → D1. Nhập mới thì màn hình phải đổi.
3. **Không phá luồng đang chạy.** Code cũ còn dùng được thì chuyển sang khối mới. Chỉ xóa file khi không còn chỗ nào import.
4. **Không đọc lan man.** Chỉ mở các file ghi trong screens.md hoặc trong ghi chú màn hình.

## Quy trình
1. **Ghi chú màn hình** `.agents/screens/<mã>-<slug>.md` (≤ 40 dòng):
   - 5 câu human-centric (ai, để làm gì, nút chính, thông tin tối thiểu, bớt bước nào);
   - bố cục mobile trước (390px) rồi desktop;
   - bảng `khối → hook → endpoint → luật → bảng`;
   - các trạng thái: đang tải / rỗng / lỗi / không có quyền / trẻ em;
   - hành động nào làm đổi khối nào.
2. **Backend:** migration (nếu cần) → luật shared (hàm thuần + 1–2 test) → route (`body(schema)`, scope, `ok()`) → kiểu API trong shared.
   - Ghi quan trọng phải có `Idempotency-Key` và audit.
3. **Frontend web:** hook trong `lib/queries/<domain>.ts` (khóa query ở `keys.ts`) → mỗi khối 1 file trong `features/<màn>/` → `XxxPage.tsx` chỉ ghép khối → chữ trong `strings.ts` (vi trước).
   - **Frontend app:** method trong `services/api.ts` → khối trong `components/` → screen ghép lại → `i18n/locales/vi.ts`.
4. **Dữ liệu demo:** thêm 1 hàm vào `scripts/seed-demo.mjs` (chỉ gọi API thật, chạy lại nhiều lần vẫn ra cùng kết quả). Mỗi hàm dọn phần của mình rồi ghi lại.
5. **Kiểm tra giao diện, tối đa 3 vòng:**
   - Chụp ở 390 và 1440 → đọc ảnh → liệt kê lệch theo thứ tự: không làm được việc chính → thiếu trạng thái → tràn / vỡ bố cục → chữ khó hiểu hoặc từ cấm → khoảng cách / màu.
   - Sửa hết trong 1 lượt rồi mới sang vòng sau. Vòng 2 không còn lệch quan trọng thì dừng.
   - Web dùng `agent-browser`; kiểm tra breakpoint thật bằng `playwright-cli` với `setViewportSize` (không dùng `resizeTo`).
6. **Kiểm tra nhanh (1 lượt):**
   - `node scripts/dev/smoke.mjs --routes <route> --widths 390,1024,1440`.
   - Tự làm hành động chính trên trình duyệt và xác nhận dữ liệu đổi.
   - Thử với tài khoản rỗng: không lỗi, có hướng dẫn bước đầu.
   - Thử với trẻ em: bị chặn đúng chỗ, có nút 111.
7. **Cổng và commit:**
   - `npm run typecheck && npm test && npm run build`.
   - Commit `feat(<mã>): <tên màn hình> — <việc chính> chạy thật` + trailer.
   - Chỉ stage file của mình, ghi chú màn hình và ảnh vòng cuối. Đánh ✅ dòng của mình trong `.agents/screens/README.md`.

## Tiêu chí xong (DoD)
- Việc chính làm được từ đầu đến cuối: UI → API → luật → D1 → phản hồi cho người dùng.
- Quyền đúng: người ngoài tổ chức nhận 403, và có test.
- Kiểm tra đầu vào đúng: lỗi hiện bằng câu tiếng Việt dễ hiểu.
- Có đủ trạng thái đang tải / rỗng / lỗi.
- Không có số gõ cứng; seed chỉ qua API.
- Không tràn ngang ở 320/390/1024/1440; không có từ cấm.
- typecheck / test / build xanh, đã commit.

## Báo cáo (≤ 200 từ)
Nêu: commit; các khối; endpoint, bảng, luật mới; số vòng kiểm tra và chỗ còn lệch; ảnh cuối; điểm nào trong skill làm chậm (để sửa skill ngay).
