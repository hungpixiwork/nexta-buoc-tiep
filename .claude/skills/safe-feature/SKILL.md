---
name: safe-feature
description: Thêm tính năng vào một màn hình NEXTA đã hoàn thiện mà KHÔNG phá bố cục hay luồng chính — chỉ gắn vào chỗ có sẵn (1 dòng trong khối, link mở hộp thoại, menu ⋯, bước riêng), chụp trước/sau để chứng minh không đổi. Use khi người dùng yêu cầu thêm tính năng/nội dung vào màn đã xong, hoặc nói "đừng phá UI".
---

# Thêm tính năng không phá màn hình

Người đồng hành dùng app ngoài đường, trên điện thoại cũ, giữa lúc đang nói chuyện với người cần giúp. Thêm một khối nghĩa là họ phải cuộn thêm và dễ bấm nhầm hơn. Vì vậy, màn hình nào đã ✅ trong `.agents/screens/README.md` thì **không thêm hàng hay khối mới**.

## Chỗ được phép gắn (theo thứ tự ưu tiên)
1. **Một dòng chữ nhỏ** trong khối có sẵn (dưới số chính, dưới trạng thái). Dùng lại style chữ phụ của khối.
2. **Link ở đầu khối** ("Xem Mẫu 07 →") để mở **hộp thoại** chứa phần đầy đủ và nút hành động.
3. **Menu ⋯** của dòng hoặc khối, dùng cho hành động phụ.
4. **Bước hay màn riêng** ngoài màn chính, ví dụ màn con `/journeys/:id/mau-07`.

**Không được:**
- thêm nút chính thứ hai,
- đẩy nút chính xuống dưới màn hình đầu tiên ở độ rộng 390px,
- đổi thứ tự **TRẠNG THÁI → VIỆC TIẾP → VÌ SAO → NÚT**,
- đổi chiều cao khối quá 10px ở trạng thái mặc định.

## Quy trình
1. **Chụp trước** ở 390 và 1440: `agent-browser screenshot --full ./.agents/screens/shots/<mã>-before.png`.
2. **Chọn chỗ gắn** cho từng thông tin mới theo danh sách trên. Ghi 3–5 dòng lý do vào mô tả commit.
3. **Viết luật và endpoint riêng.** Luật thuần đặt ở shared, endpoint tách riêng, không nhét thêm vào endpoint danh sách cho nặng. Các giả định số liệu gom vào **1 hằng số** được export.
4. **Hành động ghi:** có `Idempotency-Key` + audit, và invalidate đúng query để các khối liên quan cập nhật.
5. **Chụp sau** cùng khung hình. Đọc cả 2 ảnh và so vị trí từng khối. Nếu lệch thì sửa tới khi khớp.
6. **Chạy smoke:** `node scripts/dev/smoke.mjs --widths 390,1024,1440 --routes <route>`.
7. **Chỉ commit ảnh "sau".**
