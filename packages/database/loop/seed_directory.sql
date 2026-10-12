-- NEXTA Verified Resource Directory — pilot area Hóc Môn + Quận 12 (TP.HCM)
-- Source: public official pages researched 2026-09-26 (URL per row).
-- Every row starts as NEEDS_RECHECK: it is sourced but NOT yet confirmed by a person.
-- A Navigator must call / visit and press "Verify" in NEXTA to move it to VERIFIED.
-- Coordinates are approximate (geocoded from the address) and must be confirmed on verification.
-- Addresses follow the 2025 two-tier administrative map (xã/phường directly under TP.HCM).
-- Idempotent: INSERT OR IGNORE never overwrites a verification done in the app.

INSERT OR IGNORE INTO directory_resources
  (id, organisation_name, service_name, category, description, target_group, eligibility_json, service_area_json,
   district, ward, address, latitude, longitude, phone, website, contact_method, availability_json, accepts_referral,
   capacity_status, verification_status, verification_method, verification_source_url, verification_notes, keywords)
VALUES
('dir-ttyt-hocmon', 'Trung tâm Y tế khu vực Hóc Môn', 'Khám bệnh, tiêm chủng, tư vấn sức khỏe ban đầu', 'health',
 'Phòng khám đa khoa và dịch vụ y tế dự phòng cho người dân khu vực Hóc Môn.', 'any', '{}', '["Hóc Môn"]',
 'Hóc Môn', 'Xã Hóc Môn', '75 Bà Triệu, Ấp 24, xã Hóc Môn, TP.HCM', 10.8870, 106.5930,
 '028 3710 9912', 'https://trungtamytehocmon.medinet.gov.vn/Contact.aspx', 'Đến trực tiếp phòng khám hoặc gọi điện giờ hành chính',
 '{"days":["mon","tue","wed","thu","fri"],"hours":"07:00-16:30"}', 1,
 'UNKNOWN', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://trungtamytehocmon.medinet.gov.vn/Contact.aspx',
 'Nguồn công khai. Cần gọi xác nhận đầu mối tiếp nhận chuyển gửi.', 'khám bệnh y tế tiêm chủng sức khỏe'),

('dir-bv-hocmon', 'Bệnh viện Đa khoa khu vực Hóc Môn', 'Khám chữa bệnh, cấp cứu 24/24', 'health',
 'Bệnh viện hạng II trực thuộc Sở Y tế TP.HCM, 20 chuyên khoa, cấp cứu 24/24.', 'any', '{}', '["Hóc Môn","Quận 12","Củ Chi"]',
 'Hóc Môn', 'Xã Hóc Môn', '79 Bà Triệu, xã Hóc Môn, TP.HCM', 10.8876, 106.5926,
 '028 3710 1445', 'https://bvdkhocmon.vn/Home/Contact', 'Cấp cứu: gọi số trực 24/24 hoặc 115',
 '{"days":["mon","tue","wed","thu","fri","sat","sun"],"hours":"00:00-23:59"}', 1,
 'UNKNOWN', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://bvdkhocmon.vn/Home/Contact',
 'Nguồn công khai. Số cấp cứu 24/24; cần xác nhận đầu mối công tác xã hội của bệnh viện.', 'bệnh viện cấp cứu khám bệnh'),

('dir-ttyt-q12', 'Trung tâm Y tế khu vực Quận 12', 'Khám bệnh, y tế dự phòng, tư vấn sức khỏe', 'health',
 'Trung tâm y tế phục vụ người dân khu vực Quận 12 cũ.', 'any', '{}', '["Quận 12"]',
 'Quận 12', 'Phường Tân Thới Hiệp', '495 Dương Thị Mười, TP.HCM', 10.8765, 106.6360,
 '028 6250 9184', 'https://trungtamytequan12.medinet.gov.vn/Contact.aspx', 'Gọi điện hoặc đến trực tiếp giờ hành chính',
 '{"days":["mon","tue","wed","thu","fri"],"hours":"07:00-16:30"}', 1,
 'UNKNOWN', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://trungtamytequan12.medinet.gov.vn/Contact.aspx',
 'Nguồn công khai (địa chỉ ghi theo phường cũ Hiệp Thành). Cần xác nhận phường mới.', 'khám bệnh y tế sức khỏe'),

('dir-bv-q12', 'Bệnh viện Quận 12', 'Khám chữa bệnh đa khoa, sản phụ khoa, cấp cứu', 'health',
 'Bệnh viện khu vực Quận 12 cũ.', 'any', '{}', '["Quận 12","Hóc Môn"]',
 'Quận 12', 'Phường Tân Chánh Hiệp', '111 Dương Thị Mười, TP.HCM', 10.8640, 106.6240,
 NULL, 'https://benhvienquan12.vn/', 'Chưa có số tổng đài chính thức — cần xác minh',
 '{"days":["mon","tue","wed","thu","fri"],"hours":"07:00-16:30"}', 1,
 'UNKNOWN', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://benhvienquan12.vn/',
 'Chỉ có địa chỉ từ website bệnh viện; cần gọi để lấy số liên hệ.', 'bệnh viện khám bệnh sản phụ khoa'),

('dir-dvvl-q12', 'Trung tâm Dịch vụ việc làm TP.HCM — điểm tiếp nhận khu vực Quận 12', 'Tư vấn, giới thiệu việc làm; hồ sơ bảo hiểm thất nghiệp', 'employment',
 'Tư vấn nghề, giới thiệu việc làm miễn phí cho người lao động; tiếp nhận hồ sơ trợ cấp thất nghiệp.', 'any', '{"minAge":15}', '["Quận 12","Hóc Môn","Gò Vấp"]',
 'Quận 12', 'Phường Đông Hưng Thuận', '802 Nguyễn Văn Quá, phường Đông Hưng Thuận, TP.HCM', 10.8480, 106.6300,
 NULL, 'https://vieclamhcm.com.vn/', 'Đến trực tiếp giờ hành chính (T2–T6)',
 '{"days":["mon","tue","wed","thu","fri"],"hours":"07:30-17:00"}', 1,
 'UNKNOWN', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://luatvietnam.vn/bao-hiem/bao-hiem-that-nghiep-quan-12-563-91573-article.html',
 'Địa chỉ từ nguồn thứ cấp; số điện thoại cá nhân không được lưu. Ưu tiên xác minh trực tiếp.', 'việc làm tư vấn nghề phụ bếp nấu ăn bán hàng may mặc lao động phổ thông'),

('dir-dvvl-hq', 'Trung tâm Dịch vụ việc làm TP.HCM', 'Tư vấn, giới thiệu việc làm, sàn giao dịch việc làm', 'employment',
 'Đơn vị sự nghiệp công lập tư vấn và giới thiệu việc làm miễn phí, tổ chức sàn giao dịch việc làm định kỳ.', 'any', '{"minAge":15}', '["Toàn TP.HCM"]',
 'Bình Thạnh', NULL, '153 Xô Viết Nghệ Tĩnh, TP.HCM', 10.8058, 106.7110,
 '028 3514 7187', 'https://vieclamhcm.com.vn/', 'Gọi tổng đài hoặc đăng ký trên vieclamhcm.com.vn',
 '{"days":["mon","tue","wed","thu","fri"],"hours":"07:30-17:00"}', 1,
 'UNKNOWN', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://vieclamhcm.com.vn/',
 'Nguồn công khai; cần xác nhận kênh nhận giới thiệu từ tổ chức cộng đồng.', 'việc làm sàn giao dịch tư vấn nghề nấu ăn phụ bếp'),

('dir-gdnn-hocmon', 'Trung tâm GDNN – GDTX Hóc Môn', 'Học nghề ngắn hạn (may công nghiệp, tin học văn phòng)', 'training',
 'Khóa nghề ngắn hạn học phí thấp, thời gian linh hoạt cho lao động địa phương.', 'any', '{"minAge":15}', '["Hóc Môn","Quận 12","Củ Chi"]',
 'Hóc Môn', 'Xã Xuân Thới Sơn', '7 Đặng Công Bỉnh, Ấp 73, xã Xuân Thới Sơn, TP.HCM', 10.8750, 106.5680,
 '028 3710 5731', 'https://gdtxhocmon.hcm.edu.vn/', 'Gọi điện hoặc đến đăng ký trực tiếp',
 '{"days":["mon","tue","wed","thu","fri","sat"],"hours":"07:30-17:00"}', 1,
 'UNKNOWN', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://gdtxhocmon.hcm.edu.vn/',
 'Nguồn công khai; cần xác nhận lịch khai giảng và chính sách miễn giảm học phí.', 'học nghề may tin học đào tạo nấu ăn'),

('dir-tgpl-hcm', 'Trung tâm Trợ giúp pháp lý Nhà nước TP.HCM', 'Tư vấn, trợ giúp pháp lý miễn phí', 'legal',
 'Trợ giúp pháp lý miễn phí cho người thuộc diện theo Luật Trợ giúp pháp lý (người nghèo, cận nghèo, người khuyết tật, người cao tuổi...).', 'any', '{}', '["Toàn TP.HCM"]',
 'Quận 3', NULL, '141–143 Pasteur, TP.HCM (điểm tư vấn: 470 Nguyễn Tri Phương)', 10.7810, 106.6930,
 '028 3829 7052', 'https://sotuphap.hochiminhcity.gov.vn/en/trung-tam-tro-giup-phap-ly-nha-nuoc', 'Gọi điện đặt lịch hoặc đến điểm tư vấn giờ hành chính',
 '{"days":["mon","tue","wed","thu","fri"],"hours":"07:30-17:00"}', 1,
 'UNKNOWN', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://sotuphap.hochiminhcity.gov.vn/en/trung-tam-tro-giup-phap-ly-nha-nuoc',
 'Nguồn công khai Sở Tư pháp; cần xác nhận điều kiện diện được trợ giúp.', 'pháp lý luật tư vấn tranh chấp giấy tờ'),

('dir-hcc-hocmon', 'Trung tâm Phục vụ hành chính công xã Hóc Môn', 'Giấy tờ tùy thân, cư trú, hộ tịch, chính sách xã hội', 'documents',
 'Tiếp nhận thủ tục hành chính cấp xã: hộ tịch, cư trú, xác nhận hồ sơ chính sách, trợ cấp xã hội.', 'any', '{}', '["Hóc Môn"]',
 'Hóc Môn', 'Xã Hóc Môn', '01 Lý Thường Kiệt, xã Hóc Môn, TP.HCM', 10.8885, 106.5950,
 NULL, 'https://thuviennhadat.vn/bat-dong-san/dia-chi-trung-tam-hanh-chinh-cong-xa-hoc-mon-moi-o-dau-25788.html', 'Đến trực tiếp giờ hành chính',
 '{"days":["mon","tue","wed","thu","fri","sat"],"hours":"07:30-17:00"}', 1,
 'UNKNOWN', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://thuviennhadat.vn/bat-dong-san/dia-chi-trung-tam-hanh-chinh-cong-xa-hoc-mon-moi-o-dau-25788.html',
 'Nguồn thứ cấp dẫn Thông báo 243/TB-UBND; cần xác nhận địa chỉ và số điện thoại chính thức.', 'giấy tờ căn cước hộ tịch cư trú trợ cấp'),

('dir-hcc-dht', 'Trung tâm Phục vụ hành chính công phường Đông Hưng Thuận', 'Giấy tờ tùy thân, cư trú, hộ tịch, chính sách xã hội', 'documents',
 'Tiếp nhận thủ tục hành chính cấp phường khu vực Quận 12 cũ.', 'any', '{}', '["Quận 12"]',
 'Quận 12', 'Phường Đông Hưng Thuận', '68 đường TTN14, phường Đông Hưng Thuận, TP.HCM', 10.8440, 106.6250,
 NULL, 'https://thuvienphapluat.vn/phap-luat/dia-chi-trung-tam-phuc-vu-hanh-chinh-cong-phuong-dong-hung-thuan-thanh-pho-ho-chi-minh-nam-o-dau-402806-236715.html', 'Đến trực tiếp giờ hành chính',
 '{"days":["mon","tue","wed","thu","fri","sat"],"hours":"07:30-17:00"}', 1,
 'UNKNOWN', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://thuvienphapluat.vn/phap-luat/dia-chi-trung-tam-phuc-vu-hanh-chinh-cong-phuong-dong-hung-thuan-thanh-pho-ho-chi-minh-nam-o-dau-402806-236715.html',
 'Nguồn thứ cấp; cần xác nhận số điện thoại chính thức.', 'giấy tờ căn cước hộ tịch cư trú trợ cấp'),

('dir-ctxh-tn', 'Trung tâm Công tác xã hội Thanh niên TP.HCM', 'Tư vấn tâm lý – xã hội, hỗ trợ thanh niên và người lao động', 'social_assistance',
 'Tư vấn tâm lý, xã hội, sức khỏe qua đường dây nóng và tư vấn trực tiếp.', 'any', '{}', '["Toàn TP.HCM"]',
 'Quận 1', NULL, '5 Đinh Tiên Hoàng, TP.HCM', 10.7890, 106.7030,
 '028 3823 9735', 'https://congtacxahoi.vn/', 'Gọi điện hoặc hotline của trung tâm',
 '{"days":["mon","tue","wed","thu","fri"],"hours":"07:30-17:00"}', 1,
 'UNKNOWN', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://congtacxahoi.vn/',
 'Nguồn công khai; cần xác nhận dịch vụ nhận chuyển gửi từ tình nguyện viên.', 'tư vấn tâm lý xã hội thanh niên lao động'),

('dir-1022', 'Cổng thông tin 1022 TP.HCM', 'Tiếp nhận phản ánh, đề nghị hỗ trợ của người dân', 'social_assistance',
 'Kênh tiếp nhận 24/7 (gọi 1022, website, Zalo "1022 TPHCM") kết nối tới chính quyền các cấp.', 'any', '{}', '["Toàn TP.HCM"]',
 'Toàn TP.HCM', NULL, 'Kênh từ xa — gọi 1022 (miễn cước)', NULL, NULL,
 '1022', 'https://tongdai1022.tphcm.gov.vn/', 'Gọi 1022 hoặc gửi phản ánh trên website/Zalo',
 '{"days":["mon","tue","wed","thu","fri","sat","sun"],"hours":"00:00-23:59"}', 0,
 'AVAILABLE', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://chuyendoiso.hochiminhcity.gov.vn/en/-/1022-cong-thong-tin-tiep-nhan-xu-ly-va-phan-hoi-nguoi-dan-doanh-nghiep-cua-tp-hcm',
 'Kênh tự phục vụ — không nhận chuyển gửi có theo dõi, dùng làm phương án dự phòng.', 'phản ánh hỗ trợ khó khăn'),

('dir-111', 'Tổng đài Quốc gia Bảo vệ Trẻ em 111', 'Tiếp nhận tin báo, tư vấn bảo vệ trẻ em 24/7', 'emergency',
 'Miễn phí, 24/7 kể cả lễ Tết. Tiếp nhận tin báo xâm hại, bóc lột trẻ em và tư vấn tâm lý – pháp lý.', 'any', '{}', '["Toàn TP.HCM"]',
 'Toàn TP.HCM', NULL, 'Kênh từ xa — gọi 111 (miễn phí)', NULL, NULL,
 '111', 'https://tongdai111.vn/', 'Gọi 111 ngay — không cần chuyển gửi',
 '{"days":["mon","tue","wed","thu","fri","sat","sun"],"hours":"00:00-23:59"}', 0,
 'AVAILABLE', 'NEEDS_RECHECK', 'OFFICIAL_DOCUMENT', 'https://tongdai111.vn/',
 'Kênh khẩn cấp quốc gia; NEXTA hiển thị nút gọi 111 trên mọi màn hình an sinh.', 'trẻ em bảo vệ khẩn cấp xâm hại');
