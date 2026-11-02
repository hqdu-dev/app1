bổ sung mật khẩu đã mã hóa vào bảng users
ALTER TABLE users
ADD COLUMN password_hash VARCHAR(255);