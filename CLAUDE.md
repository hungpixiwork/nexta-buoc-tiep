# 🤖 CLAUDE CODE EXECUTION DIRECTIVES & GUIDELINES (CLAUDE.MD)

> **Workspace**: BƯỚC TIẾP — UNESCO Youth Hackathon 2026  
> **Core Role**: Code Executor & Feature Engineer (Không làm nhiệm vụ planning rườm rà, tập trung 100% vào gõ code thật, vá bug và ship feature).

---

## 📌 QUY TẮC CỐT LÕI (STRICT EXECUTION DIRECTIVES)

### 1. Vai trò Execution-First
- **Tập trung gõ code thật**: Không tạo file placeholder, không dùng stub code 1-2 dòng, không viết comment TODO dở dang.
- **Thực thi đầy đủ**: Viết đầy đủ logic, Zod validation, D1 SQL queries, UI components.

### 2. Giao diện & Design System Rules (Humanitarian Light Theme)
- **Tông màu sáng nhân văn**: Sử dụng nền sáng (`#F8FAFC`, `#EDF3FB`), chữ màu đậm (`#0F172A`, `#1E293B`).
- **TUYỆT ĐỐI KHÔNG GLASSMORPHISM**: Không dùng backdrop-blur hay hiệu ứng kính mờ gây lóa mắt.
- **WCAG AAA Compliance**: Mọi text muted phải có độ tương phản $\ge 7:1$ (tối thiểu `#475569`).
- **Giao diện đơn giản, hữu ích**: Thiết kế để Cán bộ NGO và Tình nguyện viên dùng dễ hơn quy trình giấy/Excel cũ.

### 3. Quy trình Git & Micro-Commits (Rule 14)
- **15-Minute Rule**: Code không quá 15 phút mà không commit. Break task thành từng khối nhỏ chạy được.
- **Verified-First**: Luôn typecheck/test/build pass trước khi commit (`npm run typecheck`, `npm test`, `npm run build`).
- **Conventional Commits**: Dùng `feat:`, `fix:`, `refactor:`, `chore:` kèm mô tả rõ ràng lý do & thay đổi.

### 3b. Skill dự án (load trước khi code)
- `.claude/skills/nexta-conventions` — kiến trúc, luật, bảng từ tiếng Việt, an toàn trẻ em, commit.
- `.claude/skills/nexta-screen` (+ `screens.md`) — làm từng màn hình đầu-cuối; tiến độ ở `.agents/screens/README.md`.
- `.claude/skills/safe-feature` — thêm tính năng vào màn đã xong mà không phá bố cục.
- `.claude/skills/dev-env` — chạy API/web/app, secrets, seed, smoke.
- Audit & kế hoạch: `docs/audit/00..08` (thứ tự task ở `08-implementation-plan.md`).

### 4. Hạ tầng & Monorepo Workspaces
Code runtime nằm trong các workspace dưới đây; ngoài ra có `docs/audit/` (audit & kế hoạch), `tests/` (vitest) và `scripts/` (seed demo, smoke):
- `apps/web`: Vite + React — landing công khai + Dashboard Cán bộ NGO/Admin.
- `apps/zalo`: Zalo Mini App (React + Vite + zmp-sdk/zmp-ui) — app di động cho Người đồng hành & Điều phối viên (A1–A7). Xem `apps/zalo/README.md`.
- `apps/app`: Expo cũ — **ngừng phát triển**, giữ lại đến khi Mini App chạy ổn.
- `packages/api`: Hono Backend Serverless trên Cloudflare Workers + D1 (`buoc-tiep-db`).
- `packages/database`: Drizzle schema + D1 migrations.
- `packages/shared`: Theme tokens, types, zod validators, luật safeguarding/matching dùng chung (`@buoc-tiep/shared`).

### 5. Quy Trình Audit & Thực Thi TODO.md Chuẩn Production (Contract Methodology)
- **Khi làm việc với TODO.md**: Xem `TODO.md` là một **Execution Contract** 8 thành phần (`WHY`, `WHAT EXISTS NOW`, `WHAT IS MISSING`, `WHERE TO LOOK`, `WHAT MUST CHANGE`, `WHAT MUST NOT BREAK`, `HOW TO TEST`, `WHEN DONE`).
- **Tuyệt đối KHÔNG invent file**: Chỉ sửa/tạo các file thực tế dựa trên chứng cứ codebase thật.
- **Bảo toàn Codebase**: `FIX > EXTEND > CONSOLIDATE > REFACTOR > REWRITE`. Tuyệt đối không rewrite code đang hoạt động ổn định.
- **Chỉ tick `[x]` khi**: Code đã được viết đầy đủ, không stub/mock, typecheck + build pass 100%.

---

## 🛠️ LỆNH THƯỜNG DÙNG (POWERSHELL / WIN32)

```powershell
# Typecheck & Lint toàn bộ Monorepo
npm run typecheck

# Khởi chạy Dev Server
npm run dev

# D1 Local Database Migration
npx wrangler d1 migrations apply buoc-tiep-db --local

# Deploy Backend Worker
npm run deploy -w packages/api
```

---

## 🔒 AN TOÀN & BẢO VỆ DỮ LIỆU (SAFEGUARDING)
- Mọi thông tin Trẻ em (<18t) phải dùng Alias (`CHILD-2026-XXXX`).
- 1-Tap gọi Tổng đài 111 luôn sẵn sàng ở mọi màn hình an sinh khẩn cấp.
