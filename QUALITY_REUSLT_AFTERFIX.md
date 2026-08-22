# Báo cáo Đánh giá Chất lượng Source Code Sau Đợt Fix - CRM FCVN

> **Ngày đánh giá lại:** 2026-08-22  
> **Phạm vi quét:** Toàn bộ `src/`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, migrations, scripts và cấu hình dự án  
> **Trạng thái thực thi:** `npm run typecheck` (PASS), `npm test` (PASS 7/7 tests), `npm run build` (PASS), `npm run lint` (PASS)

---

## 1. Bảng Điểm Tổng Hợp & So Sánh Tiến Trình

| #     | Tiêu chí đánh giá             | Trọng số | Điểm ban đầu  | Điểm sau fix đợt 1 |  Điểm hiện tại  | Điểm có trọng số | Đánh giá trạng thái                              |
| ----- | ----------------------------- | :------: | :-----------: | :----------------: | :-------------: | :--------------: | ------------------------------------------------ |
| **1** | Kiến trúc & Tổ chức Project   |   20%    |      70       |         80         |     **82**      |       16.4       | Rõ ràng, nhất quán hơn giữa các entity           |
| **2** | Bảo mật & Authentication/RBAC |   25%    |      45       |         76         |     **82**      |       20.5       | Đã chặn password leak, throttle, pinned HS256    |
| **3** | Hiệu năng & Tối ưu Database   |   25%    |      50       |         66         |     **78**      |       19.5       | Atomic `SET NX` đã bật, fix OneToMany pagination |
| **4** | Chất lượng Code & Clean Code  |   10%    |      60       |         66         |     **72**      |       7.2        | Strict typecheck pass; còn nới lỏng ESLint       |
| **5** | Xử lý Lỗi & Validation        |   10%    |      55       |         80         |     **85**      |       8.5        | ParseIntPipe, Zod 422, limit max(100) chuẩn      |
| **6** | Unit Testing & Testability    |   10%    |      30       |         35         |     **40**      |       4.0        | Test hiện có chạy 100% PASS; coverage vẫn thấp   |
|       | **TỔNG ĐIỂM**                 | **100%** | **~52 / 100** |   **~70 / 100**    | **~76.1 / 100** |  **~76 / 100**   | **Xếp loại: KHÁ+ (Tiệm cận Production-Ready)**   |

---

## 2. Tổng Quan Những Điểm Đã Được Khắc Phục Rất Tốt

1. **Idempotency Lock Atomic trên Redis:** `CacheService.setIfNotExists` đã chuyển sang gọi trực tiếp `client.set(key, value, { NX: true, PX: ttl })`, xử lý dứt điểm race condition khi có concurrent requests cùng key.
2. **Khắc phục OneToMany Pagination:** `PurchaseOrderService.findAll()` đã tách độc lập query header không join `items` trong `findAndCount`, tránh nhân bản dòng và sai số phân trang.
3. **Response Serialization cho Users:** `UsersController` đã trang bị `@ZodSerializerDto(UserPublicDTO)` / `UserDetailDTO` trên các endpoint `create`, `update`, `findOne`.
4. **Chuẩn hóa ID TypeORM Entity:** `Customer.entity.ts`, `Role.entity.ts`, `User.entity.ts` đã khai báo đúng kiểu `id: number` đồng bộ với `@PrimaryGeneratedColumn('increment')`.
5. **Cố định thuật toán JWT:** `TokenService` đã chỉ định rõ `algorithm: 'HS256'` khi ký và `algorithms: ['HS256']` khi verify token.
6. **Limit Cap đồng bộ:** Cả `SharedQuerySchema` và `PaginationQuerySchema` đều đã áp dụng `.max(100)` chặn DoS amplifier.
7. **Bảo mật Logging:** `PurchaseOrderService` đã log lỗi Idempotency qua `nestjs-pino` Logger thay vì nuốt lỗi âm thầm bằng empty catch.
8. **Kiểm tra kiểu dữ liệu:** `tsconfig.json` đã bật `"strict": true`, `"strictNullChecks": true`. Lệnh `npm run typecheck` và `npm run build` hoàn thành không lỗi.

---

## 3. Chi Tiết Đánh Giá Từng Hạng Mục

### 3.1. Kiến trúc & Tổ chức Project — 82/100

#### Ưu điểm:

- Cấu trúc module NestJS theo feature rất sạch và mạch lạc: `entity`, `model`, `dto`, `repository`, `service`, `controller`, `module`.
- Global lifecycle rõ ràng: `RequestIdMiddleware` (tracking) -> `CustomZodValidationPipe` (422) -> `AuthGuard` -> `ThrottlerGuard` -> `LoggingInterceptor` -> `TransformInterceptor` -> `ZodSerializerInterceptor` -> `HttpExceptionFilter`.
- `main.ts` cấu hình URI versioning v1 tập trung.

#### Vấn đề còn tồn đọng:

- **Lệch chuẩn đặt tên URI Controller:**
  - `@Controller('supplier')` (danh từ số ít)
  - `@Controller('supplier-group')` (kebab số ít)
  - `@Controller('purchase-order')` (kebab số ít)
  - `@Controller('customers')`, `@Controller('users')`, `@Controller('roles')` (danh từ số nhiều).
  - _Khuyến nghị:_ Nên chuẩn hóa toàn bộ thành kebab-case số nhiều (ví dụ: `suppliers`, `supplier-groups`, `purchase-orders`).
- **Thiếu `@ApiBearerAuth()` trên RolesController:** `RolesController` có `@UseGuards(PermissionGuard)` nhưng thiếu decorator `@ApiBearerAuth()`, khiến Swagger UI không hiển thị icon ổ khóa xác thực cho nhóm API này.

---

### 3.2. Bảo mật & Authentication/RBAC — 82/100

#### Ưu điểm:

- Cơ chế bảo vệ mật khẩu đa tầng: `select: false` trên Entity -> strip password trong Service -> Serializer DTO ở Controller -> hash bcrypt salt 10.
- Public routes (`login`, `refresh-token`, `logout`) được mở qua `@Public()`.
- Chống Brute Force: Throttler global + `@Throttle` giới hạn 5 req/phút cho route `/auth/login`.
- Đã cấu hình `helmet()` và `CORS` có kiểm soát nguồn origin.
- Chống User Enumeration: Thông báo lỗi đăng nhập thống nhất `Email hoặc mật khẩu không đúng` cho cả trường hợp sai pass, không tồn tại email, hoặc user bị inactive.
- Tối ưu RBAC: Cache role permissions (TTL 5 phút) và tự động invalidate khi Role thay đổi.

#### Vấn đề còn tồn đọng:

- **Refresh Token lưu dạng Plaintext trong DB (P0):** `RefreshToken.token` được lưu chuỗi gốc trực tiếp vào database. Nếu cơ sở dữ liệu bị truy cập trái phép, kẻ tấn công có thể lấy token này để refresh ra Access Token mới.
  - _Giải pháp:_ Lưu chuỗi SHA-256 hash của refresh token trong DB (`crypto.createHash('sha256').update(token).digest('hex')`) hoặc áp dụng cơ chế token family / jti.
- **`UsersController.findAll` thiếu Serializer DTO (P1):** Endpoint `GET /users` chưa khai báo `@ZodSerializerDto(GetUsersResDTO)`. Mặc dù `select: false` ngăn TypeORM trả password, việc thiếu Serializer DTO ở tầng Controller tiềm ẩn nguy cơ leak trường nhạy cảm nếu sau này service chuyển sang query builder hoặc join relation.
- **`PermissionGuard` fail-open với route không khai decorator `@Permissions` (P2):** Nếu lập trình viên gắn `@UseGuards(PermissionGuard)` lên controller nhưng quên khai báo `@Permissions([...])` ở handler, guard sẽ mặc định cho qua (`return true`). Nên có cơ chế fail-closed hoặc cảnh báo nếu route non-public thiếu permission.

---

### 3.3. Hiệu năng & Tối ưu Database — 78/100

#### Ưu điểm:

- Idempotency Service thực thi lock phân tán bằng lệnh Redis `SET key 1 NX PX ttl` nguyên tử, ngăn chặn hoàn toàn tình trạng duplicate đơn hàng khi tạo đồng thời.
- Transaction an toàn: `PurchaseOrderService` sử dụng `dataSource.transaction()` quản lý rollback toàn vẹn dữ liệu đơn hàng và chi tiết đơn hàng.
- Phân trang an toàn: Bỏ quan hệ OneToMany trong query đếm phân trang.
- Đã tạo migration đánh index cho các trường khóa ngoại (`supplierId`, `roleId`, `userId`, `purchaseOrderId`, `supplierGroupId`).
- Giới hạn limit truy vấn tối đa 100 record để bảo vệ I/O database.

#### Vấn đề còn tồn đọng:

- **Xung đột Unique Constraint với Soft Delete (P1):** Các bảng `users` (`email`, `userCode`), `customers` (`customerCode`, `email`, `phone`), `suppliers` (`supplierCode`), `supplier_groups` (`code`), `roles` (`name`) đang dùng Standard Unique Constraint. Khi một bản ghi bị xóa mềm (`deletedAt != null`), giá trị code/email đó vẫn bị khóa, không thể tạo mới record có cùng thông tin.
  - _Giải pháp:_ Chuyển đổi sang **PostgreSQL Partial Unique Index** (ví dụ: `CREATE UNIQUE INDEX idx_users_email_unique ON users(email) WHERE "deletedAt" IS NULL`).
- **Thiếu Migration Khởi Tạo Bảng Cơ Sở (P1):** Thư mục `src/database/migrations/` chỉ chứa các file `ALTER TABLE` phát sinh. Các bảng ban đầu như `users`, `roles`, `customers`, `refresh_tokens` chưa có migration `CREATE TABLE` gốc. Một môi trường database mới (fresh DB) sẽ không thể khởi chạy thành công chỉ bằng lệnh `npm run migration:run`.
- **Full Scan với tìm kiếm `LIKE '%term%'` (P2):** Các service đang tìm kiếm bằng `Like('%...%')`. Với lượng dữ liệu lớn, kiểu truy vấn này không tận dụng được B-Tree index. Cần bổ sung index `pg_trgm` (trigram) cho các cột name/email/code nếu dữ liệu tăng trưởng.

---

### 3.4. Chất lượng Code & Clean Code — 72/100

#### Ưu điểm:

- TypeScript strict mode được kích hoạt. Toàn bộ mã nguồn biên dịch sạch sẽ không có lỗi type.
- DTO và Model phân tách chuẩn chỉ qua thư viện `nestjs-zod`.
- Tách biệt constants cho Cache, Permissions, Status.

#### Vấn đề còn tồn đọng:

- **Tắt quá nhiều quy tắc an toàn trong `eslint.config.mjs` (P1):**
  Các rule sau đang bị tắt hoàn toàn (`'off'`):
  - `@typescript-eslint/no-explicit-any`
  - `@typescript-eslint/no-floating-promises`
  - `@typescript-eslint/no-unsafe-argument`
  - `@typescript-eslint/no-unsafe-assignment`
  - `@typescript-eslint/no-unsafe-call`
  - `@typescript-eslint/no-unsafe-member-access`
  - `@typescript-eslint/no-unsafe-return`
  - `@typescript-eslint/await-thenable`
  - `@typescript-eslint/require-await`
    _Hệ quả:_ Lập trình viên có thể vô tình để sót unhandled promise rejection hoặc truyền sai type mà linter không cảnh báo.
- **Import sai môi trường trong `BaseRepository.ts` (P1):**
  Dòng 3 file `src/shared/repositories/base.repository.ts` đang import:
  `import { QueryDeepPartialEntity } from 'typeorm/browser';`
  Đây là import từ build browser của TypeORM vào ứng dụng backend Node.js. Nên sửa thành import từ `typeorm` hoặc `typeorm/query-builder/QueryPartialEntity`.
- **Sử dụng `console.log` trong Interceptor & Config (P2):**
  `LoggingInterceptor.ts` vẫn dùng `console.log('Before...')` và `console.log('After... ms')` thay vì dùng `nestjs-pino` Logger để đồng bộ format log JSON/RequestId.
- **Chữ ký hàm Controller dư thừa `null` (P3):**
  Tại `UsersController` và `RolesController`, các hàm `findOne` và `update` khai báo kiểu trả về `Promise<User | null>` hoặc `Promise<Role | null>` dù Service luôn throw `NotFoundException` và chắc chắn trả về object nếu thành công.

---

### 3.5. Xử lý Lỗi & Validation — 85/100

#### Ưu điểm:

- Toàn bộ `:id` trên URL param được kiểm soát bởi `ParseIntPipe`, chặn ngay lập tức các giá trị chữ/ký tự lạ trả về 400 Bad Request.
- `CustomZodValidationPipe` trả về mã HTTP 422 Unprocessable Entity với danh sách lỗi chi tiết theo từng field (`path` dạng dot-notation).
- Bắt lỗi xung đột dữ liệu (mã PostgreSQL 23505) và chuyển đổi chính xác thành HTTP 409 ConflictException.
- Cấu hình validate môi trường nghiêm ngặt tại `src/shared/config.ts` với Zod `.min(1)`.

#### Vấn đề còn tồn đọng:

- **Thiếu Try/Catch Unique Violation trên hàm `update()` (P1):**
  Trong các service: `customers.service.ts`, `users.service.ts`, `suppliers.service.ts`, `supplier-group.service.ts`, hàm `create()` có bọc `try/catch` với `isUniqueConstraintError`, nhưng hàm `update()` lại gọi thẳng `repository.update()` không có try/catch. Khi người dùng update trùng `email`/`code` với bản ghi khác, server sẽ quăng lỗi 500 Uncaught Exception thay vì trả về 409 Conflict.
- **Type mismatch trong Interface `ErrorResponseBody` của `HttpExceptionFilter` (P2):**
  Interface khai báo `message: string | string[]`, tuy nhiên khi gặp lỗi Zod validation thì filter format lại thành mảng object `FieldError[]` (`[{ field: string, message: string }]`). Cần mở rộng type trong interface thành `message: string | string[] | FieldError[]` để chuẩn hóa TypeScript type.

---

### 3.6. Unit Testing & Testability — 40/100

#### Ưu điểm:

- Test suite hiện có (`customers.service.spec.ts`, `purchase-order.service.spec.ts`) đạt chất lượng cao: test đầy đủ kịch bản thành công, lỗi unique constraint, lỗi transaction rollback, và cơ chế cache hit/miss của idempotency.
- Chạy `npm test` đạt **100% PASS** (7/7 tests).

#### Vấn đề còn tồn đọng:

- **Coverage còn rất thấp (P1):** Mới chỉ có 2 file unit test trên tổng số 11 modules. Hoàn toàn chưa có test cho:
  - `AuthService` (login, refresh token rotation, logout, token verification).
  - `UsersService`, `RolesService`, `SupplierService`, `SupplierGroupService`, `ProfileService`.
  - `AuthGuard`, `PermissionGuard`, `HttpExceptionFilter`, `CustomZodValidationPipe`.
  - `TokenService`, `HashingService`, `IdempotencyService`, `CacheService`.
- **Script `test:e2e` bị hỏng (P2):** `package.json` khai báo `"test:e2e": "jest --config ./test/jest-e2e.json"` nhưng dự án chưa có thư mục `test/` hay file cấu hình này, chạy lệnh sẽ báo lỗi đường dẫn.
- **Chưa cấu hình `coverageThreshold` (P2):** Cần thiết lập ngưỡng coverage tối thiểu (ví dụ: 60-70%) trong `package.json` để ngăn ngừa việc commit code mới mà không kèm test.

---

## 4. Bảng Kế Hoạch Cải Thiện — Thứ Tự Ưu Tiên Từ Cao Xuống Thấp

### Mức độ P0 — Bắt buộc xử lý trước khi ra Production (Critical)

|  STT  | Hạng mục công việc                    | Vị trí file liên quan                                                                                                                                                                                                                                | Lý do & Giải pháp kỹ thuật                                                                                                                                                                             |
| :---: | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | **Hash Refresh Token trong Database** | [auth.service.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/auth/auth.service.ts)<br>[auth.repository.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/auth/auth.repository.ts) | Tránh rò rỉ token khi DB bị dump. Khi lưu refresh token, tính `crypto.createHash('sha256').update(token).digest('hex')` và lưu hash. Khi refresh/logout, hash token gửi lên rồi mới truy vấn tìm kiếm. |

---

### Mức độ P1 — Quan trọng, ảnh hưởng trực tiếp đến độ ổn định & bảo mật (High)

|  STT  | Hạng mục công việc                                                | Vị trí file liên quan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Lý do & Giải pháp kỹ thuật                                                                                                                                                                                          |
| :---: | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2** | **Bổ sung Try/Catch Unique Violation cho hàm `update()`**         | [users.service.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/users/users.service.ts)<br>[customers.service.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/customers/customers.service.ts)<br>[suppliers.service.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/supplier/suppliers.service.ts)<br>[supplier-group.service.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/supplier-group/supplier-group.service.ts) | Khi cập nhật dữ liệu bị trùng unique field (email, userCode, code), server hiện tại throw uncaught DB error (500). Cần bọc `try/catch` và dùng `isUniqueConstraintError(error)` để throw `ConflictException` (409). |
| **3** | **Chuyển Unique Constraint sang PostgreSQL Partial Unique Index** | `src/database/migrations/`<br>Tất cả `*.entity.ts` có `@Index({ unique: true })`                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Khi xóa mềm (`deletedAt != null`), standard unique constraint vẫn giữ khóa, không cho phép tái tạo record với email/code cũ. Cần viết migration chuyển sang partial unique index `WHERE "deletedAt" IS NULL`.       |
| **4** | **Thêm Serializer DTO cho `UsersController.findAll`**             | [users.controller.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/users/users.controller.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                 | Thêm `@ZodSerializerDto(GetUsersResDTO)` vào method `findAll` để chốt chặt contract response ở tầng HTTP, ngăn chặn rò rỉ dữ liệu ngoài ý muốn.                                                                     |
| **5** | **Sửa import `typeorm/browser` trong `BaseRepository`**           | [base.repository.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/shared/repositories/base.repository.ts)                                                                                                                                                                                                                                                                                                                                                                                                                             | Đổi `import { QueryDeepPartialEntity } from 'typeorm/browser'` thành import chuẩn backend từ `typeorm` để tránh lỗi đóng gói bundle hoặc chạy sai context.                                                          |
| **6** | **Tạo Migration Khởi Tạo Cơ Sở (Baseline Migration)**             | [datasource-cli.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/database/datasource-cli.ts)<br>`src/database/migrations/`                                                                                                                                                                                                                                                                                                                                                                                                            | Tạo migration schema đầy đủ (init baseline) để một môi trường staging/production mới có thể bootstrap từ zero bằng `migration:run`.                                                                                 |
| **7** | **Bật lại dần các quy tắc an toàn của TypeScript ESLint**         | [eslint.config.mjs](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/eslint.config.mjs)                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Bật lại `@typescript-eslint/no-floating-promises`, `@typescript-eslint/await-thenable` và giảm thiểu ép kiểu `any` trong toàn bộ project.                                                                           |

---

### Mức độ P2 — Nâng cao chất lượng & Hoàn thiện hệ thống (Medium)

|  STT   | Hạng mục công việc                                                | Vị trí file liên quan                                                                                                                     | Lý do & Giải pháp kỹ thuật                                                                                                                      |
| :----: | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **8**  | **Viết Unit Test cho Auth, Users, Roles & Guards**                | `src/modules/auth/`<br>`src/modules/users/`<br>`src/modules/roles/`<br>`src/shared/guard/`                                                | Nâng độ phủ test (coverage) lên mức tối thiểu 60-70%, đảm bảo các luồng phân quyền và luồng xác thực token hoạt động chính xác khi có refactor. |
| **9**  | **Đổi `console.log` trong Interceptor sang Nest Pino Logger**     | [logging.interceptor.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/shared/interceptor/logging.interceptor.ts) | Tiêm `Logger` từ `nestjs-pino` để log request execution time kèm theo `reqId`, method, URL và timestamp chuẩn cấu trúc.                         |
| **10** | **Bổ sung `@ApiBearerAuth()` cho RolesController**                | [roles.controller.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/roles/roles.controller.ts)            | Bổ sung decorator để Swagger UI hiển thị đúng yêu cầu xác thực Bearer token cho module Roles.                                                   |
| **11** | **Xử lý / Dọn dẹp script `test:e2e`**                             | [package.json](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/package.json)                                            | Tạo thư mục `test/` kèm file `jest-e2e.json` cấu hình test e2e thật hoặc gỡ bỏ script để tránh lỗi khi chạy CI pipeline.                        |
| **12** | **Cập nhật Interface `ErrorResponseBody` trong Exception Filter** | [http-exception.filter.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/shared/filter/http-exception.filter.ts)  | Mở rộng kiểu dữ liệu `message: string                                                                                                           | string[] | FieldError[]` đồng bộ với runtime data khi validate lỗi bằng Zod. |

---

### Mức độ P3 — Làm đẹp Code & Chuẩn hóa Naming (Low)

|  STT   | Hạng mục công việc                                     | Vị trí file liên quan                                                                                                                                                                                                                                                                                                                                                                                                                                               | Lý do & Giải pháp kỹ thuật                                                                                                                                           |
| :----: | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **13** | **Chuẩn hóa URI Controller Route theo Kebab-Plural**   | [suppliers.controller.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/supplier/suppliers.controller.ts)<br>[supplier-group.controller.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/supplier-group/supplier-group.controller.ts)<br>[purchase-order.controller.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/purchase-order/purchase-order.controller.ts) | Đổi `@Controller('supplier')` -> `'suppliers'`, `'supplier-group'` -> `'supplier-groups'`, `'purchase-order'` -> `'purchase-orders'` để nhất quán chuẩn RESTful API. |
| **14** | **Dọn dẹp Return Type Signature trên Controller**      | [users.controller.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/users/users.controller.ts)<br>[roles.controller.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/modules/roles/roles.controller.ts)                                                                                                                                                                                                    | Bỏ `                                                                                                                                                                 | null`trong chữ ký hàm controller (ví dụ:`Promise<User>`thay vì`Promise<User | null>`) vì Service luôn trả object hoặc throw Exception. |
| **15** | **Đồng bộ Default Database Name trong Provider & CLI** | [database.provider.ts](file:///c:/Users/Admin/Downloads/fcvietnam-full/crm-test/crm_fcvn/src/database/database.provider.ts)                                                                                                                                                                                                                                                                                                                                         | Đổi fallback DB name từ `'test'` sang `'nestjs_crm'` đồng bộ với `datasource-cli.ts`.                                                                                |

---

## 5. Kết Luận

So với thang điểm ban đầu (~52/100) và lần đánh giá trước (~70/100), source code hiện tại đã đạt **~76/100 (Khá+)**.

Các lỗ hổng nghiêm trọng nhất về an ninh (rò rỉ hash mật khẩu, unthrottled brute force, thiếu CORS/Helmet, ID param bypass) và hiệu năng (AuthGuard query DB liên tục, OneToMany duplicate pagination, non-atomic idempotency lock) **đều đã được giải quyết triệt để**.

Dự án hiện đã có nền tảng vững chắc. Để đạt mức **Xuất Sắc (90-95/100 - Production-Grade)**, bạn chỉ cần hoàn thiện nốt danh sách ưu tiên trên: **bảo vệ refresh token bằng SHA-256 hash (P0)**, **bổ sung try/catch unique error trên update & partial unique index (P1)**, và **mở rộng độ phủ unit test (P2)**.
