---
name: security-checklist
description: >-
  Security verification checklist and audit procedures for the CRM FCVN backend (NestJS 11, PostgreSQL 16, Redis 7, Zod v4, AWS S3).
  Use this skill when auditing code changes for vulnerabilities, checking authentication and RBAC permissions, verifying IDOR protection,
  evaluating concurrency and idempotency, assessing S3 upload safety, or performing pre-release security sign-offs.
---

# Security Checklist & Audit Guide - CRM FCVN

Tài liệu này cung cấp quy trình và bảng kiểm tra bảo mật chi tiết cho toàn bộ hệ thống backend CRM FCVN.
Mỗi hạng mục trong checklist được thiết kế bám sát các rủi ro thực tế của NestJS 11, TypeORM, PostgreSQL 16, Redis và AWS S3.

---

## 1. Threat Model & Ma trận Rủi ro

| Module                   | Mức rủi ro  | Trọng tâm kiểm toán bảo mật                                                                      |
| ------------------------ | :---------: | ------------------------------------------------------------------------------------------------ |
| `auth` & `refresh-token` | 🔴 Critical | Brute-force, lộ JWT secret, token rotation, lưu hash SHA-256 cho refresh token.                  |
| `purchase-order`         | 🔴 Critical | Double submission, race condition tồn kho và công nợ, thiếu Idempotency hoặc Transaction.        |
| `purchase-request`       | 🔴 Critical | Bypass workflow duyệt (`DRAFT` -> `PENDING` -> `APPROVED`), can thiệp trái thẩm quyền phòng ban. |
| `customers`              |   🟠 High   | Lỗ hổng IDOR/BOLA giữa các Sales, rò rỉ thông tin định danh cá nhân (PII) và mã số thuế.         |
| `users` & `roles`        |   🟠 High   | Leo thang đặc quyền (Privilege Escalation), tự gán quyền `*.manage`, rò rỉ hash mật khẩu.        |
| `media`                  |  🟡 Medium  | File upload độc hại (MIME spoofing), cạn kiệt ổ đĩa file tạm, lộ cấu hình AWS S3 Bucket.         |

---

## 2. Quy trình Thực hiện Kiểm toán Bảo mật

Khi thực hiện kiểm toán bảo mật cho một module hoặc trước khi release, agent thực hiện tuần tự theo 6 bước:

### Bước 1: Rà soát Xác thực & Quản lý Phiên (Authentication)

- [ ] **Mật khẩu & Hashing**:
  - Mật khẩu lưu trữ bắt buộc được băm qua `HashingService` bằng `bcrypt` với salt rounds tối thiểu là 10.
  - Tuyệt đối không ghi nhận mật khẩu thô vào logs hoặc trả về trong response DTO.
- [ ] **JWT Access Token**:
  - Thời hạn token ngắn hạn (15-60 phút), ký bằng thuật toán HS256 với secret trong biến môi trường.
  - Token payload chứa tối thiểu: `userId`, `roleId`, `departmentId` và `uuid`.
- [ ] **Refresh Token Rotation**:
  - Refresh token lưu trong DB bắt buộc phải băm qua `hashToken()` (SHA-256), không lưu plain text.
  - Khi cấp token mới, refresh token cũ phải bị thu hồi hoặc xóa bỏ ngay lập tức.
- [ ] **Rate Limiting (Chống Brute-force)**:
  - Route `/v1/auth/login` tuyệt đối **KHÔNG** được gắn `@SkipThrottle()`.
  - Tần suất mặc định bảo vệ bởi `ThrottlerGuard` là 5 requests / 60 giây.

### Bước 2: Rà soát Phân quyền & Chống Lỗ hổng IDOR/BOLA (Authorization)

- [ ] **Bảo vệ Route Handler**:
  - Mọi controller phải được gắn `@UseGuards(PermissionGuard)` và `@ApiBearerAuth()`.
  - Chỉ các endpoint thực sự công khai mới được gắn decorator `@Public()`.
- [ ] **Ngữ nghĩa Permissions**:
  - Khai báo `@Permissions([Permission.X_MANAGE, Permission.X_VIEW])` có ngữ nghĩa **OR**.
  - Người dùng có quyền `*.manage` tự động kế thừa các quyền thao tác thành phần (`view`, `create`, `update`, `delete`).
- [ ] **Kiểm soát Truy cập Ngang (IDOR / BOLA)**:
  - Khi thao tác trên bản ghi đơn lẻ (`GET /:id`, `PUT /:id`, `DELETE /:id`), kiểm tra quyền sở hữu hoặc phạm vi phòng ban.
  - Sales của phòng ban A không được chỉnh sửa hoặc xem dữ liệu của phòng ban B nếu không có quyền quản lý toàn cục.
  - Sử dụng `@ActiveUser('userId')` và `@ActiveUser('departmentId')` để đối chiếu phạm vi dữ liệu trong tầng Service.

### Bước 3: Rà soát Dữ liệu Đầu vào & Chống Injection (Input Validation)

- [ ] **Xác thực Schema Zod v4**:
  - Toàn bộ Request Body phải đi qua DTO kế thừa từ `createZodDto(Schema)`.
  - Toàn bộ Schema Zod phải bật `.strict()` để chặn thuộc tính thừa (Mass Assignment).
  - Lỗi validate dữ liệu đầu vào bắt buộc trả về mã HTTP **422** (`UnprocessableEntityException`).
- [ ] **Chống SQL Injection**:
  - Toàn bộ truy vấn TypeORM phải sử dụng query methods chuẩn (`find`, `findOne`, `create`, `update`) hoặc parameterized queries.
  - Tuyệt đối không nối chuỗi thô vào `createQueryBuilder.where()` hoặc raw SQL `DataSource.query()`.
- [ ] **Quy chuẩn Swagger Query**:
  - Tuyệt đối không truyền class Zod DTO vào `@Query()` hoặc `@ApiQuery()`.
  - Controller nhận Query Parameters qua type: `@Query(new ZodValidationPipe(Schema)) query: Type`.

### Bước 4: Rà soát Toàn vẹn Dữ liệu & Chống Race Condition (Concurrency & Integrity)

- [ ] **Idempotency**:
  - Các thao tác tạo tài chính hoặc đặt hàng (như `POST /v1/purchase-orders`) phải tích hợp `IdempotencyInterceptor` hoặc khóa phân tán Redis.
  - Chống tình trạng tạo đơn trùng lặp khi client gửi liên tiếp nhiều request (double-submit).
- [ ] **Giao dịch Cơ sở Dữ liệu (Database Transaction)**:
  - Khi cập nhật từ 2 bảng liên quan trở lên (như lưu đơn hàng kèm chi tiết đơn, hoặc chuyển trạng thái kèm lịch sử), bắt buộc bọc trong `DataSource.transaction()`.
  - Rollback toàn bộ nếu bất kỳ thao tác con nào thất bại.
- [ ] **Bảo vệ State Machine**:
  - Không cho phép cập nhật trạng thái nhảy cóc (ví dụ: `REJECTED` chuyển thẳng sang `APPROVED`).
  - Toàn bộ thay đổi trạng thái phải ghi nhận log vào bảng audit history (`purchase_request_histories`).

### Bước 5: Rà soát Lưu trữ & Tải tệp lên Cloud (Media & S3 Security)

- [ ] **Giới hạn Dung lượng & Định dạng**:
  - Direct upload giới hạn tối đa 5MB mỗi tệp ảnh.
  - Client presigned upload giới hạn tối đa 1MB mỗi tệp.
- [ ] **Dọn dẹp File Tạm**:
  - Toàn bộ file tải lên disk storage cục bộ qua Multer phải được dọn dẹp bằng `unlink()` ngay sau khi stream lên S3 hoặc khi gặp lỗi.
  - Sử dụng `ParseFilePipeWithUnlink` để tránh rác ổ đĩa khi validate thất bại.
- [ ] **Xung đột Header trên S3 Presigned URL**:
  - Presigned URL đã có chữ ký xác thực trên query parameter (`X-Amz-Signature`).
  - Request client gọi trực tiếp S3 bằng HTTP PUT tuyệt đối **không** được mang theo header `Authorization: Bearer <token>`.

### Bước 6: Rà soát Thông tin Nhạy cảm & Logging (Data Protection)

- [ ] **Bảo vệ Thông tin Định danh (PII)**:
  - Số điện thoại, CCCD/CMND, mã số thuế của khách hàng chỉ được cung cấp cho người có thẩm quyền.
- [ ] **Bảo vệ Biến Môi trường (.env)**:
  - Toàn bộ bí mật (`ACCESS_TOKEN_SECRET`, `S3_SECRET_KEY`, `DB_PASSWORD`) phải được validate nghiêm ngặt qua `src/shared/config.ts`.
  - File `.env` phải luôn nằm trong `.gitignore` và `.dockerignore`.
- [ ] **An toàn Logging**:
  - Không log Authorization headers, refresh tokens hoặc payload chứa thông tin tài chính nhạy cảm vào hệ thống log Pino.

---

## 3. Lệnh Quét Bảo mật Nhanh (Audit Commands)

Agent có thể chạy các lệnh sau để rà soát tự động:

```bash
# 1. Quét lỗ hổng dependency từ npm
npm audit

# 2. Kiểm tra type checking nghiêm ngặt (không còn lỗi any lọt lưới)
npm run typecheck

# 3. Quét vi phạm linting và best practices
npm run lint

# 4. Chạy toàn bộ test suites bảo vệ regression
npm test
npm run test:e2e
```

---

## 4. Bảng Tra cứu Mã Lỗi & HTTP Status Chuẩn Bảo mật

| Tình huống bảo mật                                    | Mã HTTP | Ngoại lệ NestJS tương ứng      |
| ----------------------------------------------------- | :-----: | ------------------------------ |
| Không có access token hoặc token sai/hết hạn          |   401   | `UnauthorizedException`        |
| Token hợp lệ nhưng không đủ quyền hạn RBAC            |   403   | `ForbiddenException`           |
| Bản ghi không tồn tại (tránh leak thông tin)          |   404   | `NotFoundException`            |
| Dữ liệu đầu vào sai định dạng hoặc thừa trường        |   422   | `UnprocessableEntityException` |
| Xung đột dữ liệu duy nhất (email, mã code đã tồn tại) |   409   | `ConflictException`            |
| Gửi request quá tần suất quy định (Brute-force)       |   429   | `ThrottlerException`           |
