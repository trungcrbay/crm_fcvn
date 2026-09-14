---
name: crm-fcvn-e2e-testing
description: >-
  Field guide and procedures for running, creating, and debugging E2E and API tests
  for the CRM FCVN backend (NestJS, PostgreSQL, Redis, Jest, Supertest).
  Use this skill when the user asks to reproduce a bug in an E2E context, verify API workflows,
  write E2E tests, or validate HTTP status codes, error shapes, and permissions.
---

# E2E Testing CRM FCVN Backend via Jest & Supertest

CRM FCVN là ứng dụng Backend NestJS 11 (REST API) chạy trên Node.js/Docker, kết nối PostgreSQL, Redis và TypeORM.
Kiểm thử E2E (End-to-End) được thực hiện bằng cách khởi chạy NestJS testing application module và gửi HTTP request thực tế qua **Supertest / Jest**.
Sử dụng skill này làm quy trình chuẩn khi tái hiện lỗi, kiểm tra luồng nghiệp vụ API (Auth, Workflow phê duyệt, State Machine, Idempotency) và xác thực HTTP status code / Response payload.

---

## 1. Mục tiêu và phạm vi Manual / API E2E

- **Tái hiện bug**: Luôn bắt đầu bằng việc tái hiện lỗi trong ngữ cảnh E2E sát nhất với cách client/người dùng gọi API thực tế.
- **Xác định rõ ràng trước khi test**:
  - Một hành vi API / lỗi cụ thể cần kiểm chứng (endpoint `/v1/...`, method, headers, auth token, payload).
  - Trạng thái dữ liệu tối thiểu cần có (role, user, phòng ban, bản ghi liên quan trong DB).
- **Phạm vi kiểm thử**: Giới hạn phạm vi hẹp cho đúng tính năng hoặc luồng đang xử lý, tránh quét tràn lan trừ khi có yêu cầu kiểm thử hồi quy toàn bộ hệ thống.
- **Tự động hóa**: Các hành vi và kịch bản nghiệp vụ lặp đi lặp lại bắt buộc phải được viết thành automated tests thay vì chỉ test thủ công một lần.

---

## 2. Phân loại tầng kiểm thử

### Unit Test (`*.spec.ts` colocated trong `src/modules/<feature>/`)

- Dành cho pure logic, service methods, validation schema Zod (`*.model.ts`), hashing, token generation và mock repository/services.
- Chạy: `npm test` hoặc `npm test -- src/modules/<feature>/<feature>.service.spec.ts`.

### E2E Test (`test/` hoặc `npm run test:e2e`)

- Dành cho các kịch bản cần full pipeline:
  - Global guards (`AuthGuard`, `ThrottlerGuard`, `PermissionGuard`).
  - Interceptors (`TransformInterceptor`, `LoggingInterceptor`, `ZodSerializerInterceptor`).
  - Validation pipe (`CustomZodValidationPipe` trả mã 422 với định dạng `FieldError[]`: `{ field, message }`).
  - Database transactions TypeORM, quan hệ khóa ngoại và Redis lock / Cache / Idempotency.
- Chạy: `npm run test:e2e`.

---

## 3. Quy chuẩn Response và Error khi Assert trong E2E

### Response Shape chuẩn (`TransformInterceptor`)

- **Thường**: `{ data: any, statusCode: number }`
- **Phân trang**: `{ data: any[], meta: { page: number, limit: number, total: number, totalPages: number }, statusCode: number }`

### Error Shape chuẩn (`HttpExceptionFilter`)

- Cấu trúc chung:
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Thông báo lỗi bằng tiếng Việt"
  }
  ```
- **Lỗi Validation (422 Unprocessable Entity)**:
  - Ném từ `CustomZodValidationPipe` khi sai body/query.
  - Cấu trúc:
    ```json
    {
      "statusCode": 422,
      "error": "Unprocessable Entity",
      "message": [{ "field": "name", "message": "Tên không được để trống" }]
    }
    ```

---

## 4. Dữ liệu môi trường và Tài khoản kiểm thử

- **Cơ sở dữ liệu & Redis**: Sử dụng database/redis thông qua Docker Compose:
  ```bash
  docker compose up -d
  docker compose exec app npm run migration:init-db
  # Hoặc chạy trên máy host:
  npm run db:setup
  ```
- **Tài khoản mẫu từ seed scripts (`initScript/`)**:
  - Admin: `admin@fcvn.com` (mật khẩu cấu hình qua biến môi trường `DB_ADMIN_PASSWORD_TEST`).
  - Sales: `sales@fcvn.com` (mật khẩu cấu hình qua biến môi trường `DB_SALES_PASSWORD_TEST`).
- **Lấy JWT Token để test API cần xác thực**:
  - Gửi request `POST /v1/auth/login` với email và password.
  - Trích xuất `accessToken` từ response `{ data: { accessToken, ... } }`.
  - Gửi kèm header `Authorization: Bearer <accessToken>` trong các request kế tiếp.
- **Bảo mật**: Tuyệt đối không ghi cứng credentials, secret keys hoặc dữ liệu nhạy cảm của khách hàng thật vào file test, git commits, fixtures hay log outputs.
