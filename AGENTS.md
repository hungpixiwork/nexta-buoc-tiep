# 🤖 AGENTS.md — Master Operating Manual for AI Coding Agents

> 🕒 **SSOT Timestamp:** `2026-08-15 18:40 GMT+7` | **Ref:** `buoc-tiep-master-harness`

---

## 🛑 AGENT OPERATING RULES (BẮT BUỘC TUÂN THỦ 100%)

Trước khi chạm vào bất kỳ dòng mã nguồn nào:
1. Đọc kỹ file này (`AGENTS.md`) và `CLAUDE.md`.
2. Xác định rõ component/endpoint nào sở hữu lỗi trước khi sửa. Không sửa lan man.

---

## 🔒 Rule 0: Bảo Vệ Trẻ Em & An Toàn Dữ Liệu Tuyệt Đối (Child Safeguarding & Data Privacy)
- Dữ liệu trẻ em yếu thế (<18 tuổi) **TUYỆT ĐỐI BẢO MẬT**: Mã định danh ẩn danh `CHILD-2026-XXXX`, ẩn số điện thoại và CCCD.
- Không cho phép phân bổ công việc nặng nhọc/nguy hiểm cho người vị thành niên.
- Tích hợp 1-Tap Hotline 111 (Tổng đài Quốc gia Bảo vệ Trẻ em) phản hồi khẩn cấp tức thì.

## 🎯 Rule 1: Quy Tắc Phạm Vi Thay Đổi 1-1 (Change Scope Rule)
- **Mô hình 1-1:**
  $$\text{1 Vấn đề trực quan / API} \longrightarrow \text{1 Nguyên nhân gốc} \longrightarrow \text{1 Component / File} \longrightarrow \text{1 Bản vá} \longrightarrow \text{1 Chu kỳ kiểm thử}$$
- Tuyệt đối KHÔNG kết hợp sửa các lỗi không liên quan trong cùng một lượt.

## ♻️ Rule 2: Tái Sử Dụng Component & Chống Thoái Lui Giao Diện (Component Reuse & No Regression)
- Trước khi tạo UI mới: Luôn tìm token trong `packages/shared/src/theme.ts` hoặc component dùng chung của từng app.
- Nếu component tương đương đã tồn tại: Hãy tái sử dụng hoặc mở rộng props của nó.
- **CẤM TỰ TẠO:** `Button2`, `CustomCardNew`, `ModernTableCopy`...
- Khi sửa component dùng chung, phải kiểm tra tất cả các màn hình đang import component đó để tránh vỡ giao diện.

## 🎨 Rule 3: Giao Diện Sáng Màu & 0% Glassmorphism (Bright UI Standard)
- Toàn bộ hệ thống sử dụng **Light Mode sáng màu** (`#F6FAFE` hoặc `#FFFFFF`), độ tương phản cao (nền sáng chữ đậm, nền đậm chữ sáng).
- **TUYỆT ĐỐI KHÔNG DÙNG Glassmorphism** (backdrop-filter mờ, viền mờ làm chữ khó đọc).
- Đạt chuẩn tương phản **WCAG AAA ($\ge 14.5:1$)**, cỡ chữ dễ nhìn cho cả người lớn tuổi và cộng đồng.

## 📱 Rule 4: Responsive Đa Nền Tảng & Chống Tràn Bố Cục (Layout Integrity)
- **Web (`apps/web`: Landing + Portal):** Không sinh thanh cuộn ngang ngoài ý muốn (`overflow-x: hidden`).
- **Mobile (Expo React Native):** Luôn bọc trong `SafeAreaView` và `ScrollView` / `FlatList`, không hardcode kích thước lớn gây tràn màn hình.
- Kích thước tương tác tối thiểu: **$44 \times 44\text{px}$** cho mọi nút bấm, ô nhập liệu.

## 🗄️ Rule 5: CSDL Cloudflare D1 Native Dynamic Binding & Không Data Rác (D1 Database Rule)
- **100% Dynamic Binding `env.DB`:** Sử dụng duy nhất binding `c.env.DB`, không hardcode secret hoặc DB ID.
- **Không dữ liệu rác:** Tuyệt đối không chèn bản ghi test tùy tiện vào database.
- **Tối ưu D1 Batching:** Dùng `db.batch([...])` cho bulk queries/mutations (<20ms).
- **SQLite Upsert:** Dùng `ON CONFLICT(...) DO UPDATE SET ...`, cấm dùng `INSERT OR REPLACE`.

## 🧪 Rule 6: "Build Pass Là Chưa Xong" & Kiểm Tra Giá Trị Thực Tế (Input/Output Reality)
- Typecheck/build pass exit code 0 chỉ là bước đầu (repo không còn test suite). **Bắt buộc kiểm tra logic nghiệp vụ**: Dữ liệu đầu vào và kết quả đầu ra có đúng thực tế an sinh xã hội không? Có mang lại giá trị hữu ích thay thế cách làm cũ kém hiệu quả không?
- Chạy app thật (agent-browser / playwright-cli) để xác nhận trước khi báo cáo hoàn tất.

## 🏷️ Rule 7: Đặt Tên Biến Tường Minh 100% (Explicit Variable Naming SSOT)
- Tuyệt đối **KHÔNG** dùng tên biến 1 ký tự viết tắt mơ hồ (`u`, `b`, `r`, `s`) trong các hàm xử lý dữ liệu.
- Đặt tên theo đúng domain: `beneficiary`, `surveyResponse`, `volunteer`, `resourceItem`.

## ⏱️ Rule 8: Quy Trình Micro-Commit 15 Phút & Triển Khai Cloudflare (15-Minute Rule)
- Không viết code quá 15 phút mà không verify và commit local.
- Sau khi kiểm tra `npm run typecheck` thành công $\rightarrow$ Commit ngay: `git add .` & `git commit -m "feat/fix(...) : <nội dung>"`.
- Deploy Serverless Worker/Pages qua Cloudflare với 1 lệnh duy nhất.

## 🌿 Rule 9: Quy Chuẩn Phối Hợp Git & Collaborators (Git Collaboration SSOT)
- Phân chia 3 vai trò:
  - **Hưng (`@26730023-PhamPhuNguyenHung`)**: Core / D1 Schema / API Contracts / Review & Merge `main`.
  - **Quỳnh (`@syuu-wq`)**: UI/UX Design System / `packages/shared/src/theme.ts` / Layout & Styling.
  - **Bình Minh (`@vbm162`)**: Feature / Form Validation / Survey / App Services & Logic.
- Bắt buộc dùng branch prefix: `ui/*`, `feat/*`, `core/*`, `fix/*`. Cấm code trực tiếp trên `main`.
- Tạo PR qua GitHub CLI `gh pr create`, squash-merge bởi Hưng.

---

## 🌐 DANH SÁCH TÊN MIỀN LIVE HỆ SINH THÁI BƯỚC TIẾP (SSOT URLs)

| Ứng Dụng | URL Production | Workspace | Mô Tả & Tính Năng |
|---|---|---|---|
| **Khảo Sát Thực Địa** | [survey-buoctiep-unesco2026.pages.dev](https://survey-buoctiep-unesco2026.pages.dev) | _(ngoài repo)_ | Site khảo sát vẫn chạy trên Pages; mã nguồn đã rời monorepo. |
| **Expo Mobile App** | [buoc-tiep-app.pages.dev](https://buoc-tiep-app.pages.dev) | `apps/app` | Ứng dụng Expo Mobile 14 Màn hình (Voice AI, Hộ chiếu sinh kế, Check-in GPS). |
| **Web (Landing + Portal)** | [buoc-tiep-web.pages.dev](https://buoc-tiep-web.pages.dev) | `apps/web` | Trang chủ công khai + bảng điều hành Cán bộ NGO & Danh bạ Nguồn lực an sinh. |
| **Backend D1 API** | [buoc-tiep-api.ppnh10092002.workers.dev](https://buoc-tiep-api.ppnh10092002.workers.dev) | `packages/api` | D1 Backend API Serverless (`buoc-tiep-db`). |
