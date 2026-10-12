# Tiến độ làm màn hình pilot

Mỗi màn hình được làm lần lượt bằng skill `.claude/skills/nexta-screen`. Màn nào đạt tiêu chí xong thì mới chuyển sang màn tiếp theo. Thứ tự làm và nền móng cần có trước được ghi trong `docs/audit/08-implementation-plan.md`.

| Mã | Màn hình | Route / file | Trạng thái | Commit |
|---|---|---|---|---|
| W3 | Gặp người mới | `/journeys/new` | ⏳ | |
| W4 | Hành trình (chi tiết) + Mẫu 07 | `/journeys/:id` | ⏳ | |
| W6 | Yêu cầu chuyển gửi (đơn vị hỗ trợ) | `/partner` | ⏳ | |
| W1 | Hôm nay | `/navigator` | ⏳ | |
| W5 | Hỏi thăm | `/navigator/follow-ups` | ⏳ | |
| W7 | Kiểm tra an toàn | `/coordinator/safety` | ⏳ | |
| W9 | Điều phối | `/coordinator` | ⏳ | |
| A1 | Đăng nhập (Zalo Mini App) | `apps/zalo/src/pages/login.tsx` | 🔧 chờ thử trong Zalo | |
| A3 | Gặp người mới (Zalo Mini App) | `apps/zalo/src/pages/new-person.tsx` | 🔧 chờ thử trong Zalo | |
| A5 | Tìm nơi hỗ trợ (Zalo Mini App) | `apps/zalo/src/pages/directory.tsx` | 🔧 chờ thử trong Zalo | |
| A4 | Hỏi thăm (Zalo Mini App) | `apps/zalo/src/pages/check-ins.tsx` | 🔧 chờ thử trong Zalo | |
| A2 | Hôm nay (Zalo Mini App) | `apps/zalo/src/pages/today.tsx` | 🔧 chờ thử trong Zalo | |
| A6 | Kiểm tra an toàn (Zalo Mini App) | `apps/zalo/src/pages/safety.tsx` | 🔧 chờ thử trong Zalo | |
| A7 | Thêm (Zalo Mini App) | `apps/zalo/src/pages/more.tsx` | 🔧 chờ thử trong Zalo | |
| W8 | Nơi hỗ trợ | `/directory` | ⏳ | |
| W10 | Đăng nhập & đăng ký tham gia | `/login`, `/join` | ⏳ | |
| W11 | Duyệt đăng ký | `/admin/approvals` | ⏳ | |

App di động A1–A7 đã chuyển từ Expo (`apps/app`, ngừng phát triển) sang Zalo Mini App (`apps/zalo`); đã chạy trọn luồng trên trình duyệt, còn chờ thử trong Zalo sau `zmp deploy --testing`.

Ký hiệu trạng thái: ⏳ chưa làm · 🔧 đang làm · ✅ xong.
Ghi chú của từng màn nằm ở `.agents/screens/<mã>-<slug>.md`. Ảnh chụp vòng kiểm tra cuối nằm ở `.agents/screens/shots/`.
