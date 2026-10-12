-- Seed Data BƯỚC TIẾP
PRAGMA foreign_keys = OFF;

-- 1. Organizations
INSERT OR REPLACE INTO organizations (id, name, slug) VALUES 
('org-default', 'BƯỚC TIẾP UNESCO', 'buoc-tiep-unesco');

-- 2. Teams
INSERT OR IGNORE INTO teams (id, organization_id, name, district) VALUES 
('team-hoc-mon', 'org-default', 'Đội Công tác Xã hội Hóc Môn', 'Hóc Môn');

-- 3. Users
INSERT OR IGNORE INTO users (id, organization_id, full_name, phone, email, role, is_active) VALUES 
('usr-volunteer-default', 'org-default', 'Lê Thị Bình', '0912345678', 'volunteer@buoctiep.vn', 'volunteer', 1),
('usr-social-worker-default', 'org-default', 'Trần Văn Cường', '0923456789', 'cuong.tran@buoctiep.vn', 'social_worker', 1),
('usr-admin-default', 'org-default', 'Nguyễn Văn An', '0901234567', 'admin@buoctiep.vn', 'admin', 1);

-- 4. Beneficiaries
INSERT OR IGNORE INTO beneficiaries (id, organization_id, alias_name, full_name, birth_year, is_minor, gender, current_area, vulnerability_group, is_sensitive) VALUES 
('ben-lan-01', 'org-default', 'ADULT-2026-8842', 'Nguyễn Thị Lan', 1964, 0, 'female', 'Thị trấn Hóc Môn, TP.HCM', 'street_worker', 0),
('ben-child-02', 'org-default', 'CHILD-2026-1102', 'Trẻ em vị thành niên (Ẩn danh)', 2012, 1, 'male', 'Bình Chánh, TP.HCM (GPS Blurred ~1km)', 'homeless', 1),
('ben-hung-03', 'org-default', 'ADULT-2026-4410', 'Trần Văn Hùng', 1972, 0, 'male', 'Quận 12, TP.HCM', 'street_worker', 0);

-- 5. Cases
INSERT OR IGNORE INTO cases (id, organization_id, team_id, beneficiary_id, assigned_to, status, priority) VALUES 
('case-lan-01', 'org-default', 'team-hoc-mon', 'ben-lan-01', 'usr-social-worker-default', 'in_progress', 'high'),
('case-child-02', 'org-default', 'team-hoc-mon', 'ben-child-02', 'usr-social-worker-default', 'open', 'urgent'),
('case-hung-03', 'org-default', 'team-hoc-mon', 'ben-hung-03', 'usr-social-worker-default', 'closed', 'medium');

-- 6. Livelihood Passports
INSERT OR IGNORE INTO livelihood_passports (id, beneficiary_id, user_id, age_group, skills, work_preference, health_status, location, status) VALUES 
('passport-lan-01', 'ben-lan-01', 'usr-social-worker-default', '60+', '["Nấu ăn", "Bán hàng"]', 'Phụ bếp / Bán hàng nhẹ', 'Ổn định, đau khớp nhẹ', 'Hóc Môn', 'active'),
('passport-hung-03', 'ben-hung-03', 'usr-social-worker-default', '50-60', '["Sửa xe", "Chạy xe"]', 'Chạy xe ôm / Giao hàng', 'Khỏe mạnh', 'Quận 12', 'completed');

-- 7. Resources (Bản đồ Điểm Cứu trợ Thực tế TP.HCM)
INSERT OR REPLACE INTO resources (
  id, name, category, district, ward, city, province, address, phone, hotline, email, website,
  latitude, longitude, operating_hours, is_24_hours, verification_status, verified_at, verified_by,
  capacity_status, is_verified, accepts_referral, emergency_support, description
) VALUES 
('res-medical-01', 'Trạm Y tế Thị trấn Hóc Môn', 'medical', 'Hóc Môn', 'Thị trấn Hóc Môn', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '12 Lý Thường Kiệt, Thị trấn Hóc Môn, Huyện Hóc Môn', '028 3891 0111', '115', 'tyt.hocmon@tphcm.gov.vn', 'https://medinet.gov.vn', 10.8872, 106.5925, '24/7 (Cấp cứu trực liên tục)', 1, 'VERIFIED', '2026-08-01 08:00:00', 'usr-social-worker-default', 'AVAILABLE', 1, 1, 1, 'Điểm sơ cấp cứu, khám chữa bệnh ban đầu miễn phí và phát thuốc thiết yếu cho người yếu thế.'),
('res-medical-02', 'Bệnh viện Đa khoa Khu vực Hóc Môn', 'medical', 'Hóc Môn', 'Tân Xuân', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '65/2B Bà Triệu, Xã Tân Xuân, Huyện Hóc Môn', '028 3891 4208', '115', 'bv.hocmon@tphcm.gov.vn', 'https://bvhocmon.vn', 10.8841, 106.5978, '24/7 (Cấp cứu & Hồi sức)', 1, 'VERIFIED', '2026-08-01 09:00:00', 'usr-admin-default', 'AVAILABLE', 1, 1, 1, 'Bệnh viện tuyến quận huyện có khoa Cấp cứu, tiếp nhận chuyển tuyến Form 07 có BHYT hỗ trợ.'),
('res-shelter-01', 'Mái ấm Ánh Sáng Quận 12', 'shelter', 'Quận 12', 'Phường Tân Thới Nhất', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '45 Phan Văn Hớn, Phường Tân Thới Nhất, Quận 12', '028 3891 0222', '0908 112 334', 'maiam.anhsang@buoctiep.vn', NULL, 10.8415, 106.6342, '08:00 - 20:00 (Lưu trú 24/24)', 1, 'VERIFIED', '2026-08-05 14:00:00', 'usr-social-worker-default', 'AVAILABLE', 1, 1, 1, 'Nơi tạm trú an toàn cho trẻ em cơ nhỡ, hỗ trợ ăn ở, học văn hóa và tư vấn tâm lý.'),
('res-food-01', 'Bếp ăn Từ thiện Lá Xanh Hóc Môn', 'food', 'Hóc Môn', 'Trung Mỹ Tây', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '88 Tô Ký, Huyện Hóc Môn', '0901 234 567', NULL, 'bepanlaxanh@gmail.com', NULL, 10.8654, 106.6021, '10:30 - 13:30 & 16:30 - 18:30', 0, 'VERIFIED', '2026-08-10 10:00:00', 'usr-volunteer-default', 'AVAILABLE', 1, 1, 0, 'Cung cấp 300+ suất cơm nóng miễn phí mỗi ngày cho lao động nghèo và người bán vé số.'),
('res-shelter-02', 'Trung tâm Bảo trợ Xã hội Bình Chánh', 'shelter', 'Bình Chánh', 'Xã Vĩnh Lộc B', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '45 Đường số 3, Xã Vĩnh Lộc B, Huyện Bình Chánh', '028 3760 1122', '1022', 'btxh.binhchanh@tphcm.gov.vn', NULL, 10.7412, 106.5724, '24/7', 1, 'VERIFIED', '2026-08-02 11:30:00', 'usr-admin-default', 'AVAILABLE', 1, 1, 1, 'Tiếp nhận người già neo đơn không nơi nương tựa, bảo trợ y tế và sinh hoạt toàn phần.'),
('res-legal-01', 'Trung tâm Trợ giúp Pháp lý Nhà nước TP.HCM (Chi nhánh Hóc Môn)', 'legal', 'Hóc Môn', 'Thị trấn Hóc Môn', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '24 Quang Trung, Thị trấn Hóc Môn', '028 3891 3344', '028 3820 9999', 'phaply.hcm@moj.gov.vn', 'https://trogiupphaply.gov.vn', 10.8812, 106.5891, '07:30 - 11:30 & 13:00 - 17:00 (Thứ 2 - Thứ 6)', 0, 'VERIFIED', '2026-08-03 08:30:00', 'usr-social-worker-default', 'AVAILABLE', 1, 1, 0, 'Tư vấn pháp lý miễn phí, hỗ trợ làm CCCD, giấy khai sinh cho trẻ em và giải quyết tranh chấp lao động.'),
('res-job-01', 'Trung tâm Dịch vụ Việc làm Hóc Môn & Đào tạo Nghề', 'employment', 'Hóc Môn', 'Xã Thới Tam Thôn', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '12 Nguyễn Ảnh Thủ, Huyện Hóc Môn', '028 3883 1100', '0903 889 911', 'vieclam.hocmon@tphcm.gov.vn', 'https://vieclamhcm.net', 10.8790, 106.5910, '08:00 - 17:00 (Thứ 2 - Thứ 7)', 0, 'VERIFIED', '2026-08-04 15:00:00', 'usr-admin-default', 'AVAILABLE', 1, 1, 0, 'Kết nối việc làm phổ thông (phụ bếp, bảo vệ, may mặc), đào tạo nghề ngắn hạn 100% miễn phí.'),
('res-child-01', 'Tổng đài Quốc gia Bảo vệ Trẻ em 111 (Điểm Tiếp nhận Phía Nam)', 'shelter', 'Quận 1', 'Bến Nghé', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '35 Pasteur, Phường Bến Nghé, Quận 1', '111', '111', 'tongdai111@molisa.gov.vn', 'https://tongdai111.vn', 10.7769, 106.6953, '24/7 (Phản ứng nhanh P0)', 1, 'VERIFIED', '2026-08-01 00:00:00', 'usr-admin-default', 'AVAILABLE', 1, 1, 1, 'Đường dây nóng khẩn cấp quốc gia tiếp nhận can thiệp bảo vệ trẻ em bị xâm hại, bạo lực, bóc lột.'),
('res-food-02', 'Quán cơm Nụ Cười 3 (Suất ăn 2.000đ Quỹ Bông Sen)', 'food', 'Quận 5', 'Phường 1', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '127 Huỳnh Mẫn Đạt, Phường 1, Quận 5', '0938 123 456', NULL, 'nucuoi3@bongsen.org.vn', 'https://quybongsen.org', 10.7650, 106.6820, '11:00 - 13:00 (Thứ 2 - Thứ 7)', 0, 'VERIFIED', '2026-08-08 09:00:00', 'usr-volunteer-default', 'AVAILABLE', 1, 1, 0, 'Phục vụ suất cơm dinh dưỡng chỉ 2.000đ dành riêng cho người lao động nghèo và người có hoàn cảnh khó khăn.'),
('res-shelter-03', 'Nhà Tạm lánh Nữ & Trẻ em Vùng Tây', 'shelter', 'Bình Tân', 'An Lạc', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '82 Kinh Dương Vương, Phường An Lạc, Quận Bình Tân', '028 3752 4455', '0919 445 667', 'tamlanh.tay@buoctiep.vn', NULL, 10.7610, 106.6015, '24/7 (Bảo mật vị trí an toàn)', 1, 'VERIFIED', '2026-08-06 16:00:00', 'usr-social-worker-default', 'AVAILABLE', 1, 1, 1, 'Nơi trú ẩn khẩn cấp bảo mật cho phụ nữ và trẻ em là nạn nhân bạo lực gia đình hoặc mua bán người.'),
('res-medical-03', 'Trạm Y tế Xã Vĩnh Lộc B', 'medical', 'Bình Chánh', 'Xã Vĩnh Lộc B', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Ấp 1, Xã Vĩnh Lộc B, Huyện Bình Chánh', '028 3765 8901', '115', 'tyt.vinhlocb@tphcm.gov.vn', NULL, 10.7815, 106.5540, '24/7 (Trực cấp cứu)', 1, 'VERIFIED', '2026-08-07 10:00:00', 'usr-volunteer-default', 'AVAILABLE', 1, 1, 1, 'Khám chữa bệnh, tiêm chủng và phát thuốc miễn phí cho người lao động ngoại tỉnh chưa có sổ hộ khẩu.'),
('res-job-02', 'Trung tâm Hỗ trợ Thanh niên Khởi nghiệp & Sinh kế BƯỚC TIẾP', 'employment', 'Quận 1', 'Bến Thành', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '145 Nguyễn Du, Phường Bến Thành, Quận 1', '028 3822 5100', '0908 998 877', 'livelihood@buoctiep.vn', 'https://buoctiep.vn', 10.7820, 106.6980, '08:00 - 17:30 (Thứ 2 - Thứ 6)', 0, 'VERIFIED', '2026-08-09 14:00:00', 'usr-admin-default', 'AVAILABLE', 1, 1, 0, 'Cấp Hộ chiếu Sinh kế số, kết nối học bổng nghề và quỹ vi mô tạo việc làm bền vững cho thanh niên.'),
('res-shelter-04', 'Làng Trẻ em SOS Gò Vấp', 'shelter', 'Gò Vấp', 'Phường 17', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '697 Quang Trung, Phường 17, Quận Gò Vấp', '028 3895 8503', '028 3895 8504', 'sos.govap@sosvietnam.org', 'https://sosvietnam.org', 10.8350, 106.6670, '24/7', 1, 'VERIFIED', '2026-08-01 10:00:00', 'usr-social-worker-default', 'AVAILABLE', 1, 1, 1, 'Nuôi dưỡng và chăm sóc lâu dài cho trẻ em mồ côi, bị bỏ rơi theo mô hình gia đình thay thế.'),
('res-food-03', 'Bếp ăn Tình thương Chợ Cầu Quận 12', 'food', 'Quận 12', 'Tân Chánh Hiệp', 'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', '210 Tô Ký, Phường Tân Chánh Hiệp, Quận 12', '0918 223 344', NULL, 'bepanchocau@gmail.com', NULL, 10.8522, 106.6267, '10:00 - 14:00 (Hàng ngày)', 0, 'VERIFIED', '2026-08-11 11:00:00', 'usr-volunteer-default', 'AVAILABLE', 1, 1, 0, 'Phát cơm trưa và nước uống tinh khiết miễn phí cho người già neo đơn và công nhân thất nghiệp.');

-- 8. Referrals
INSERT OR IGNORE INTO referrals (id, case_id, resource_id, referred_by, status, notes) VALUES 
('ref-lan-01', 'case-lan-01', 'res-food-01', 'usr-social-worker-default', 'service_reached', 'Kết nối nhận cơm trưa miễn phí hàng ngày');

-- 9. Opportunities
INSERT OR IGNORE INTO opportunities (id, title, organization_name, description, category, required_skills, contact_info) VALUES 
('opp-001', 'Phụ bếp ca sáng tiệm cơm Hóc Môn', 'Tiệm Cơm Quê', 'Cần người phụ nhặt rau, chuẩn bị bàn ăn ca sáng từ 6h-10h.', 'short_term_job', '["Chăm chỉ"]', '0909123456'),
('opp-002', 'Học nghề may gia dụng miễn phí', 'Trung tâm KTTH Hóc Môn', 'Khóa học 3 tháng hỗ trợ nguyên liệu học tập.', 'training', '[]', '02838910333');

-- 10. Impact Metrics
INSERT OR IGNORE INTO impact_metrics (id, organization_id, total_encounters, active_cases, successful_referrals, safeguarding_actions) VALUES 
('imp-default', 'org-default', 142, 3, 64, 3);

-- 11. Referral Channel Configs
INSERT OR IGNORE INTO referral_channel_configs (id, code, organization_name, channel_type, phone, email, url, jurisdiction, verification_status, verified_at, verification_source, enabled) VALUES
('rcc-111', 'HELPLINE_111', 'Tổng đài Quốc gia Bảo vệ Trẻ em 111', 'PHONE', '111', '111@tongdai111.vn', 'https://tongdai111.vn', 'VN', 'VERIFIED', '2026-08-05', 'Cục Trẻ em - Bộ LĐ-TB&XH', 1),
('rcc-1022', 'CIVIC_1022', 'Cổng Thông tin Phản ánh 1022 TP.HCM', 'WEBSITE', '1022', '1022@tphcm.gov.vn', 'https://1022.tphcm.gov.vn', 'HCM', 'VERIFIED', '2026-08-05', 'Sở Thông tin & Truyền thông TP.HCM', 1),
('rcc-mau07', 'DVC_MAU_07', 'UBND Phường/Xã — Bộ phận VH-XH (Mẫu số 07)', 'PRINT', NULL, NULL, 'https://dichvucong.gov.vn', 'VN', 'VERIFIED', '2026-08-05', 'Nghị định 20/2021/NĐ-CP', 1),
('rcc-ttdvvl', 'TT_DVVL_HCM', 'Trung tâm Dịch vụ Việc làm TP.HCM', 'EMAIL', '02835106180', 'vieclam@vieclamhcm.net', 'https://vieclamhcm.net', 'HCM', 'VERIFIED', '2026-08-05', 'Sở LĐ-TB&XH TP.HCM', 1);

PRAGMA foreign_keys = ON;


