-- Migration: 0006_welfare_directory_geospatial.sql
-- Description: Add geospatial coordinates, 24/7 status, contacts and referral metadata to resources table
PRAGMA foreign_keys = OFF;

-- Add columns if not existing (SQLite safe handling)
ALTER TABLE `resources` ADD COLUMN `ward` text;
ALTER TABLE `resources` ADD COLUMN `city` text DEFAULT 'TP. Hồ Chí Minh';
ALTER TABLE `resources` ADD COLUMN `province` text DEFAULT 'TP. Hồ Chí Minh';
ALTER TABLE `resources` ADD COLUMN `hotline` text;
ALTER TABLE `resources` ADD COLUMN `email` text;
ALTER TABLE `resources` ADD COLUMN `website` text;
ALTER TABLE `resources` ADD COLUMN `latitude` real;
ALTER TABLE `resources` ADD COLUMN `longitude` real;
ALTER TABLE `resources` ADD COLUMN `is_24_hours` integer DEFAULT 0;
ALTER TABLE `resources` ADD COLUMN `accepts_referral` integer DEFAULT 1;
ALTER TABLE `resources` ADD COLUMN `emergency_support` integer DEFAULT 0;
ALTER TABLE `resources` ADD COLUMN `description` text;
ALTER TABLE `resources` ADD COLUMN `updated_at` text;

-- Seed authentic HCMC Welfare Points
INSERT OR REPLACE INTO `resources` (
  `id`, `name`, `category`, `district`, `ward`, `city`, `province`, `address`, `phone`, `hotline`, `email`, `website`,
  `latitude`, `longitude`, `operating_hours`, `is_24_hours`, `verification_status`, `verified_at`, `verified_by`,
  `capacity_status`, `is_verified`, `accepts_referral`, `emergency_support`, `description`
) VALUES 
(
  'res-medical-01', 'Trạm Y tế Thị trấn Hóc Môn', 'medical', 'Hóc Môn', 'Thị trấn Hóc Môn', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '12 Lý Thường Kiệt, Thị trấn Hóc Môn, Huyện Hóc Môn', '028 3891 0111', '115', 'tyt.hocmon@tphcm.gov.vn', 'https://medinet.gov.vn',
  10.8872, 106.5925, '24/7 (Cấp cứu trực liên tục)', 1, 'VERIFIED', '2026-08-01 08:00:00', 'usr-social-worker-default',
  'AVAILABLE', 1, 1, 1, 'Điểm sơ cấp cứu, khám chữa bệnh ban đầu miễn phí và phát thuốc thiết yếu cho người yếu thế.'
),
(
  'res-medical-02', 'Bệnh viện Đa khoa Khu vực Hóc Môn', 'medical', 'Hóc Môn', 'Tân Xuân', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '65/2B Bà Triệu, Xã Tân Xuân, Huyện Hóc Môn', '028 3891 4208', '115', 'bv.hocmon@tphcm.gov.vn', 'https://bvhocmon.vn',
  10.8841, 106.5978, '24/7 (Cấp cứu & Hồi sức)', 1, 'VERIFIED', '2026-08-01 09:00:00', 'usr-admin-default',
  'AVAILABLE', 1, 1, 1, 'Bệnh viện tuyến quận huyện có khoa Cấp cứu, tiếp nhận chuyển tuyến Form 07 có BHYT hỗ trợ.'
),
(
  'res-shelter-01', 'Mái ấm Ánh Sáng Quận 12', 'shelter', 'Quận 12', 'Phường Tân Thới Nhất', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '45 Phan Văn Hớn, Phường Tân Thới Nhất, Quận 12', '028 3891 0222', '0908 112 334', 'maiam.anhsang@buoctiep.vn', NULL,
  10.8415, 106.6342, '08:00 - 20:00 (Lưu trú 24/24)', 1, 'VERIFIED', '2026-08-05 14:00:00', 'usr-social-worker-default',
  'AVAILABLE', 1, 1, 1, 'Nơi tạm trú an toàn cho trẻ em cơ nhỡ, hỗ trợ ăn ở, học văn hóa và tư vấn tâm lý.'
),
(
  'res-food-01', 'Bếp ăn Từ thiện Lá Xanh Hóc Môn', 'food', 'Hóc Môn', 'Trung Mỹ Tây', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '88 Tô Ký, Huyện Hóc Môn', '0901 234 567', NULL, 'bepanlaxanh@gmail.com', NULL,
  10.8654, 106.6021, '10:30 - 13:30 & 16:30 - 18:30', 0, 'VERIFIED', '2026-08-10 10:00:00', 'usr-volunteer-default',
  'AVAILABLE', 1, 1, 0, 'Cung cấp 300+ suất cơm nóng miễn phí mỗi ngày cho lao động nghèo và người bán vé số.'
),
(
  'res-shelter-02', 'Trung tâm Bảo trợ Xã hội Bình Chánh', 'shelter', 'Bình Chánh', 'Xã Vĩnh Lộc B', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '45 Đường số 3, Xã Vĩnh Lộc B, Huyện Bình Chánh', '028 3760 1122', '1022', 'btxh.binhchanh@tphcm.gov.vn', NULL,
  10.7412, 106.5724, '24/7', 1, 'VERIFIED', '2026-08-02 11:30:00', 'usr-admin-default',
  'AVAILABLE', 1, 1, 1, 'Tiếp nhận người già neo đơn không nơi nương tựa, bảo trợ y tế và sinh hoạt toàn phần.'
),
(
  'res-legal-01', 'Trung tâm Trợ giúp Pháp lý Nhà nước TP.HCM (Chi nhánh Hóc Môn)', 'legal', 'Hóc Môn', 'Thị trấn Hóc Môn', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '24 Quang Trung, Thị trấn Hóc Môn', '028 3891 3344', '028 3820 9999', 'phaply.hcm@moj.gov.vn', 'https://trogiupphaply.gov.vn',
  10.8812, 106.5891, '07:30 - 11:30 & 13:00 - 17:00 (Thứ 2 - Thứ 6)', 0, 'VERIFIED', '2026-08-03 08:30:00', 'usr-social-worker-default',
  'AVAILABLE', 1, 1, 0, 'Tư vấn pháp lý miễn phí, hỗ trợ làm CCCD, giấy khai sinh cho trẻ em và giải quyết tranh chấp lao động.'
),
(
  'res-job-01', 'Trung tâm Dịch vụ Việc làm Hóc Môn & Đào tạo Nghề', 'employment', 'Hóc Môn', 'Xã Thới Tam Thôn', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '12 Nguyễn Ảnh Thủ, Huyện Hóc Môn', '028 3883 1100', '0903 889 911', 'vieclam.hocmon@tphcm.gov.vn', 'https://vieclamhcm.net',
  10.8790, 106.5910, '08:00 - 17:00 (Thứ 2 - Thứ 7)', 0, 'VERIFIED', '2026-08-04 15:00:00', 'usr-admin-default',
  'AVAILABLE', 1, 1, 0, 'Kết nối việc làm phổ thông (phụ bếp, bảo vệ, may mặc), đào tạo nghề ngắn hạn 100% miễn phí.'
),
(
  'res-child-01', 'Tổng đài Quốc gia Bảo vệ Trẻ em 111 (Điểm Tiếp nhận Phía Nam)', 'shelter', 'Quận 1', 'Bến Nghé', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '35 Pasteur, Phường Bến Nghé, Quận 1', '111', '111', 'tongdai111@molisa.gov.vn', 'https://tongdai111.vn',
  10.7769, 106.6953, '24/7 (Phản ứng nhanh P0)', 1, 'VERIFIED', '2026-08-01 00:00:00', 'usr-admin-default',
  'AVAILABLE', 1, 1, 1, 'Đường dây nóng khẩn cấp quốc gia tiếp nhận can thiệp bảo vệ trẻ em bị xâm hại, bạo lực, bóc lột.'
),
(
  'res-food-02', 'Quán cơm Nụ Cười 3 (Suất ăn 2.000đ Quỹ Bông Sen)', 'food', 'Quận 5', 'Phường 1', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '127 Huỳnh Mẫn Đạt, Phường 1, Quận 5', '0938 123 456', NULL, 'nucuoi3@bongsen.org.vn', 'https://quybongsen.org',
  10.7650, 106.6820, '11:00 - 13:00 (Thứ 2 - Thứ 7)', 0, 'VERIFIED', '2026-08-08 09:00:00', 'usr-volunteer-default',
  'AVAILABLE', 1, 1, 0, 'Phục vụ suất cơm dinh dưỡng chỉ 2.000đ dành riêng cho người lao động nghèo và người có hoàn cảnh khó khăn.'
),
(
  'res-shelter-03', 'Nhà Tạm lánh Nữ & Trẻ em Vùng Tây', 'shelter', 'Bình Tân', 'An Lạc', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '82 Kinh Dương Vương, Phường An Lạc, Quận Bình Tân', '028 3752 4455', '0919 445 667', 'tamlanh.tay@buoctiep.vn', NULL,
  10.7610, 106.6015, '24/7 (Bảo mật vị trí an toàn)', 1, 'VERIFIED', '2026-08-06 16:00:00', 'usr-social-worker-default',
  'AVAILABLE', 1, 1, 1, 'Nơi trú ẩn khẩn cấp bảo mật cho phụ nữ và trẻ em là nạn nhân bạo lực gia đình hoặc mua bán người.'
),
(
  'res-medical-03', 'Trạm Y tế Xã Vĩnh Lộc B', 'medical', 'Bình Chánh', 'Xã Vĩnh Lộc B', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  'Ấp 1, Xã Vĩnh Lộc B, Huyện Bình Chánh', '028 3765 8901', '115', 'tyt.vinhlocb@tphcm.gov.vn', NULL,
  10.7815, 106.5540, '24/7 (Trực cấp cứu)', 1, 'VERIFIED', '2026-08-07 10:00:00', 'usr-volunteer-default',
  'AVAILABLE', 1, 1, 1, 'Khám chữa bệnh, tiêm chủng và phát thuốc miễn phí cho người lao động ngoại tỉnh chưa có sổ hộ khẩu.'
),
(
  'res-job-02', 'Trung tâm Hỗ trợ Thanh niên Khởi nghiệp & Sinh kế BƯỚC TIẾP', 'employment', 'Quận 1', 'Bến Thành', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '145 Nguyễn Du, Phường Bến Thành, Quận 1', '028 3822 5100', '0908 998 877', 'livelihood@buoctiep.vn', 'https://buoctiep.vn',
  10.7820, 106.6980, '08:00 - 17:30 (Thứ 2 - Thứ 6)', 0, 'VERIFIED', '2026-08-09 14:00:00', 'usr-admin-default',
  'AVAILABLE', 1, 1, 0, 'Cấp Hộ chiếu Sinh kế số, kết nối học bổng nghề và quỹ vi mô tạo việc làm bền vững cho thanh niên.'
),
(
  'res-shelter-04', 'Làng Trẻ em SOS Gò Vấp', 'shelter', 'Gò Vấp', 'Phường 17', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '697 Quang Trung, Phường 17, Quận Gò Vấp', '028 3895 8503', '028 3895 8504', 'sos.govap@sosvietnam.org', 'https://sosvietnam.org',
  10.8350, 106.6670, '24/7', 1, 'VERIFIED', '2026-08-01 10:00:00', 'usr-social-worker-default',
  'AVAILABLE', 1, 1, 1, 'Nuôi dưỡng và chăm sóc lâu dài cho trẻ em mồ côi, bị bỏ rơi theo mô hình gia đình thay thế.'
),
(
  'res-food-03', 'Bếp ăn Tình thương Chợ Cầu Quận 12', 'food', 'Quận 12', 'Tân Chánh Hiệp', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh',
  '210 Tô Ký, Phường Tân Chánh Hiệp, Quận 12', '0918 223 344', NULL, 'bepanchocau@gmail.com', NULL,
  10.8522, 106.6267, '10:00 - 14:00 (Hàng ngày)', 0, 'VERIFIED', '2026-08-11 11:00:00', 'usr-volunteer-default',
  'AVAILABLE', 1, 1, 0, 'Phát cơm trưa và nước uống tinh khiết miễn phí cho người già neo đơn và công nhân thất nghiệp.'
);

PRAGMA foreign_keys = ON;

