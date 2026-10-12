# 04 — AI, tự động hóa và an toàn

> Mục đích: không coi "có gọi LLM" là "có tính năng AI". Mỗi tính năng AI được soi theo chuỗi:
> **ĐẦU VÀO → NGỮ CẢNH → LUẬT / MÔ HÌNH → GỢI Ý → NGƯỜI XEM XÉT → HÀNH ĐỘNG → AUDIT**

## 1. Bảng tính năng AI

| Tính năng | File | Đầu vào | Mô hình / luật | Người xem xét | Audit | Nhận định |
|---|---|---|---|---|---|---|
| Gợi ý cấu trúc ghi chú (loop) | `loop.ts:542-590`, `shared/closed-loop/NoteStructurer.ts` | Ghi chú của người đồng hành (≤ 4.000 ký tự) | Luật `suggestFromNote`, sau đó thêm llama-3.1-8b để gợi ý tối đa 3 câu nên hỏi thêm; timeout 4 giây, lỗi thì bỏ qua | Người đồng hành tự chọn có dùng hay không; kết quả gắn `authority: 'SUGGEST_ONLY'` | Dữ kiện lưu kèm `source` | **Tốt — giữ.** Lỗi riêng: nhãn nguồn gốc ở UI bị ngược (`UnderstandPanel.tsx:48`) |
| Kiểm tra an toàn (loop) | `loop.ts:594-665`, `shared/closed-loop/RiskGate.ts` | Tuổi, cờ trẻ em, sự đồng ý, nhu cầu, cờ do người đồng hành chọn, cờ AI (chỉ là đầu vào) | **Luật cố định**: `PROCEED` / `ASK_MORE` / `HUMAN_REVIEW` / `EMERGENCY_111` | `risk-review` chỉ điều phối viên làm được; `EMERGENCY_111` không được hạ mức | Tạo escalation | **Tốt — giữ.** Bản ghi tìm-nơi-phù-hợp cũ không bị xóa khi dữ kiện đổi (`loop.ts:509-524`) |
| Tìm nơi phù hợp | `shared/closed-loop/MatchPipeline.ts` | Nhu cầu, quận, tuổi, độ mới của lần xác minh, sức chứa | Luật cố định 6 bước + `reasonText` giải thích | Người đồng hành xác nhận "đã gọi cho nơi hỗ trợ" | Có sự kiện | **Tốt.** Không nên hiện "Độ phù hợp %" vì điểm là cộng dồn rồi chặn trần 100 |
| Định tuyến AI khi tiếp nhận (stack cũ) | `utils/aiModelRouter.ts`, gọi từ `cases.ts:214,426` | Bản ghi âm (Whisper), transcript, họ tên, điện thoại | qwen3-30b trả JSON, sau đó Gemini 2.5 Flash | Chỉ bật cờ "cần người xem xét", không chặn gì | Không có | **Chưa an toàn** — xem §2 |
| Hermes chat | `routes/hermes.ts` | Prompt (không cần đăng nhập) | **Không có mô hình**: câu trả lời soạn sẵn; "trích dẫn" là 3 dòng đầu bảng `resources` với độ tin cậy 0.99 | — | — | **Giả + SSRF → gỡ khỏi MVP** |
| A2A task | `routes/a2a.ts` | JSON-RPC | Trả cứng `VERIFIED 0.98` | — | — | **Giả → gỡ** |
| "Voice AI" trong app | `VoiceListeningScreen.tsx` | Micro | Web Speech API của trình duyệt (chỉ chạy trên web); nhận diện lừa đảo bằng 7 từ khóa | — | — | Không phải AI; phải ghi đúng là "ghi âm thành chữ" |

## 2. Rủi ro trong `processAIModelRouting`
1. **Bịa độ tin cậy.**
   - Mặc định 0.82 khi mô hình lỗi.
   - Khi không có khóa Gemini thì tự nâng lên ≥ 0.78 (`aiModelRouter.ts:314`).
   - Độ tin cậy do chính LLM tự báo.
   - **Cách sửa:** `confidence: null` + `model: 'unavailable'`; UI ghi "Chưa có gợi ý".
2. **Không kiểm tra `category` theo danh sách cho phép** (`:246,306`). **Cách sửa:** zod enum; giá trị lạ thì dùng giá trị người dùng đã chọn.
3. **Gửi dữ liệu cá nhân ra ngoài.**
   - Transcript thô có thể chứa tên và số điện thoại, được gửi tới Gemini mà không kiểm tra sự đồng ý.
   - Khóa API nằm trên URL.
   - Fallback dùng nhầm `GOOGLE_CLIENT_SECRET` (`:274-277`).
   - **Cách sửa:** che PII trước khi gửi (dùng lại ý tưởng `maskSummary`); đặt khóa ở header; bỏ fallback; chỉ gọi Gemini khi đã có sự đồng ý.
4. **Prompt injection.** Transcript được chèn thẳng vào prompt. Vì kết quả AI chỉ là gợi ý nên rủi ro thấp, nhưng vẫn phải kiểm tra output bằng zod và **không** để output quyết định trẻ em hay khẩn cấp. Hiện luật trẻ em đã chạy trước và độc lập với AI (`:159-170`); cần giữ nguyên như vậy.
5. **Mã `CHILD-2026-XXXX` có thể trùng.** Mã sinh bằng `Math.random` với 4 chữ số (`:169`). **Cách sửa:** sinh từ bảng đếm, hoặc có unique index và thử lại khi trùng.
6. **Không có audit** cho kết quả AI. **Cách sửa:** ghi `ai_suggested` kèm tên mô hình và phiên bản prompt (không ghi PII).

## 3. Việc nào dùng luật cố định, việc nào để AI hỗ trợ, việc nào bắt buộc con người
| Luật cố định | AI hỗ trợ (chỉ gợi ý) | Bắt buộc con người |
|---|---|---|
| Quyền truy cập, phạm vi tổ chức | Gợi ý cấu trúc ghi chú, câu nên hỏi thêm | Ghi nhận sự đồng ý |
| Trẻ em / chưa rõ tuổi → chặn đường sinh kế | Tóm tắt lịch sử hành trình cho đơn vị hỗ trợ (sau này) | Xem xét an toàn (`HUMAN_REVIEW`), gọi 111 |
| Chuyển trạng thái hành trình / chuyển gửi (`ReferralLoop`) | Giải thích vì sao nơi hỗ trợ này phù hợp (`reasonText` — đã là luật) | Xác nhận đã liên hệ nơi hỗ trợ |
| Hạn phản hồi, hạn hỏi thăm 48 giờ | Sắp thứ tự việc cần làm hôm nay (sau này) | Nhận / từ chối chuyển gửi |
| Độ mới của lần xác minh nơi hỗ trợ (> 30 ngày = chưa xác minh lại) | Phát hiện hành trình trùng (hiện đã có `clientGeneratedId`) | Đóng hành trình, ghi kết quả |

## 4. Cơ hội AI có giá trị thật (không phải chatbot)
1. **Hỏi thăm thông minh.** Luật chọn ra những hành trình quá hạn; AI chỉ viết nháp câu hỏi thăm; người đồng hành sửa rồi gửi.
2. **Phát hiện trùng khi tiếp nhận.** Luật so biệt danh, quận và ngày; AI chỉ giải thích vì sao nghi trùng; người đồng hành quyết định gộp hay không.
3. **Tóm tắt cho đơn vị hỗ trợ.** Tóm tắt ≤ 3 dòng chỉ từ các dữ kiện đã được người đồng hành xác nhận và đã có sự đồng ý chia sẻ; có nhãn "Gợi ý".
Cả 3 việc trên đều theo khuôn: **ý định → dữ liệu có cấu trúc → luật → AI → đề xuất → người xác nhận → hành động → audit**.

## 5. Kết luận
- Phần AI **đáng giữ** là phần AI hỗ trợ có kiểm soát trong `loop` (gợi ý) và các luật cố định trong `shared/closed-loop`.
- **Gỡ** Hermes và A2A.
- **Sửa** `aiModelRouter` theo §2. Đây là việc P1, vì sau D1-A thì tiếp nhận từ app sẽ đi qua `loop`, và router này chỉ còn dùng cho dữ liệu cũ.
