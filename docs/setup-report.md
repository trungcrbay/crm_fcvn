# Báo cáo nguyên nhân lỗi setup

## Các lỗi gặp phải

- **`Postgres package has not been found installed`**
  - Nguyên nhân: Thiếu PostgreSQL driver `pg`.
  - Xử lý: Chạy `npm install pg`.

- **`password authentication failed for user "postgres"`**
  - Nguyên nhân: Sai hoặc quên mật khẩu PostgreSQL.
  - Xử lý: Reset mật khẩu user `postgres` và cập nhật `.env`.

- **`database "nestjs_crm" does not exist`**
  - Nguyên nhân: Database chưa được tạo.
  - Xử lý: Tạo database `nestjs_crm` trên PostgreSQL/DBeaver.

- **`password authentication failed for user "dev_user"`**
  - Nguyên nhân: DBeaver sử dụng user/password không chính xác.
  - Xử lý: Kiểm tra hoặc cập nhật thông tin đăng nhập.

- **DBeaver không tạo được database**
  - Nguyên nhân: Multi-database mode chưa được bật.
  - Xử lý: Bật `Show all databases` hoặc tạo database bằng SQL.

## Kết quả

Đã xác định và xử lý các lỗi liên quan đến dependency, xác thực PostgreSQL, database và cấu hình DBeaver.

Sau khi cấu hình đúng `.env`, hệ thống có thể kết nối PostgreSQL và tiếp tục khởi chạy.