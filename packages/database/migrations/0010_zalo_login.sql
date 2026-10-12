-- 0010: Đăng nhập bằng Zalo trong Zalo Mini App.
-- Tài khoản Zalo chỉ được gắn vào tài khoản email sau khi nhập đúng mã OTP;
-- đăng nhập Zalo không tự tạo tài khoản — vai trò vẫn đi qua luồng đăng ký tham gia.
ALTER TABLE nx_accounts ADD COLUMN zalo_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS nx_accounts_zalo_id_idx ON nx_accounts(zalo_id);
