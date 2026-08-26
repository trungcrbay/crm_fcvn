# CRM Project

Hệ thống Backend CRM xây dựng trên **NestJS 11 + PostgreSQL + TypeORM + Redis**.

---

## 🐳 Khởi chạy nhanh với Docker (Khuyến nghị)

Chỉ cần cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/) và thực hiện theo các bước sau:

### 1. Chuẩn bị file môi trường

Tạo file `.env` từ `.env.example` (nếu chưa có):

```bash
cp .env.example .env
```

### 2. Khởi động toàn bộ cụm dịch vụ (NestJS App + PostgreSQL + Redis)

```bash
# Môi trường Development (tự động hot-reload khi sửa code)
docker compose up -d

# Hoặc môi trường Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 3. Khởi tạo Database & Seed dữ liệu mẫu (Chỉ cần chạy 1 lần đầu)

```bash
docker compose exec app npm run migration:init-db
```

### 4. Truy cập ứng dụng & Tài liệu API

- **API Base URL:** `http://localhost:8000/v1`
- **Swagger Documentation:** `http://localhost:8000/api`

---

## 🔄 Quy trình làm việc khi Dev Backend hàng ngày

- **Tự động nhận code mới (Hot-Reload):** Nhờ cơ chế mount volume `.:/app`, mỗi khi bạn chỉnh sửa file `.ts` trong `src/` và bấm **Save (Ctrl + S)**, NestJS bên trong container sẽ **tự động biên dịch và cập nhật ngay lập tức** mà không cần khởi động lại Docker.
- **Dữ liệu Database được bảo toàn:** Dữ liệu PostgreSQL và Redis được lưu an toàn trong Docker Volumes (`crm_postgres_data`, `crm_redis_data`). Khi bạn tắt máy hoặc chạy `docker compose down`, **dữ liệu vẫn còn nguyên**, bạn **KHÔNG cần phải seed lại DB** mỗi lần bật máy.

---

## 🛠️ Hướng dẫn xử lý các trường hợp thực tế (Edge Cases)

| Tình huống / Trường hợp                                                | Lệnh thực hiện                                                                                            | Giải thích & Lưu ý                                                                                                                        |
| :--------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Bắt đầu làm việc hàng ngày**                                         | `docker compose up -d`                                                                                    | Bật lại cụm services, dữ liệu cũ giữ nguyên, code tự hot-reload.                                                                          |
| **Cài thêm package / thư viện mới** _(thay đổi `package.json`)_        | `docker compose up -d --build`                                                                            | Thêm cờ `--build` để Docker nạp `package.json` mới và cài đặt `node_modules` vào image.                                                   |
| **Sửa Entity / Tạo bảng mới** _(thay đổi cấu trúc DB)_                 | `docker compose exec app npm run migration:generate`<br>`docker compose exec app npm run migration:run`   | Tự động so sánh Entity với Database để tạo file migration mới và áp dụng vào DB.                                                          |
| **Rollback migration gần nhất**                                        | `docker compose exec app npm run migration:revert`                                                        | Hủy thay đổi schema DB gần nhất nếu có lỗi.                                                                                               |
| **Muốn xoá trắng dữ liệu để test lại từ đầu (Reset DB)**               | `docker compose down -v`<br>`docker compose up -d`<br>`docker compose exec app npm run migration:init-db` | Cờ `-v` sẽ xóa sạch các volume dữ liệu cũ, sau đó tạo mới DB và nạp lại dữ liệu mẫu sạch sẽ.                                              |
| **Chạy seed script riêng lẻ**                                          | `docker compose exec app npx ts-node initScript/create-customer.ts`                                       | Hỗ trợ chạy từng script seed lẻ: `create-role.ts`, `create-department.ts`, `create-user.ts`, `create-customer.ts`.                        |
| **Lỗi trùng cổng** _(Port already in use / `ports are not available`)_ | Tắt process local hoặc đổi `PORT` trong `.env`                                                            | Nếu port `8000` bị chiếm (do có terminal chạy `npm run start:dev` ngoài máy host), hãy tắt terminal đó hoặc đổi `PORT=8080` trong `.env`. |
| **Kiểm tra TypeScript & Chạy Unit Test trong container**               | `docker compose exec app npm run typecheck`<br>`docker compose exec app npm test`                         | Chạy typecheck và Jest unit tests trực tiếp trong môi trường container.                                                                   |
| **Truy cập vào terminal bên trong container**                          | `docker compose exec -it app sh`                                                                          | Mở terminal Linux bên trong container để debug hoặc kiểm tra file hệ thống.                                                               |
| **Xem log realtime của ứng dụng**                                      | `docker compose logs -f app`                                                                              | Xem log NestJS Pino và SQL queries thời gian thực.                                                                                        |
| **Kết thúc làm việc**                                                  | `docker compose down`                                                                                     | Dừng và hạ các containers, không làm mất dữ liệu trong database.                                                                          |

---

## 💻 Cài đặt thủ công (Không dùng Docker)

Dành cho trường hợp muốn chạy trực tiếp trên máy host với PostgreSQL & Redis đã cài sẵn:

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Tạo database PostgreSQL

```sql
CREATE DATABASE nestjs_crm;
```

### 3. Cấu hình `.env`

```env
PORT=8000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_DATABASE=nestjs_crm
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
IDEMPOTENCY_KEY=crm_idempotency_key
NODE_ENV=development
```

### 4. Chạy Migration & Seed DB

```bash
npm run migration:init-db
```

### 5. Khởi chạy dev server

```bash
npm run start:dev
```

---

## 🗄️ Kết nối Database & Tools ngoài

Khi cụm Docker đang chạy, bạn có thể dùng **DBeaver**, **TablePlus** hoặc **Postico** kết nối trực tiếp vào Database trên máy host:

- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `nestjs_crm`
- **Username:** `postgres`
- **Password:** `123456` (hoặc giá trị trong file `.env`)
