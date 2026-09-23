# Hướng dẫn Agent - Dự án CRM FCVN

Tài liệu này là nguồn chỉ dẫn kỹ thuật chính dành cho AI Agent khi làm việc trên codebase CRM FCVN.
Mọi chỉ dẫn dưới đây phải được tuân thủ nghiêm ngặt để đảm bảo chất lượng, tính nhất quán và độ ổn định lâu dài của hệ thống.

---

## 1. Instructions for AI

- **Ký tự cấm**: Tuyệt đối không sử dụng dấu gạch ngang dài (em dash).
  Chỉ sử dụng dấu gạch ngang đơn thông thường (-) trong văn bản và mã nguồn.
- **Khu vực không xâm phạm**: Thư mục `.agents/` là vùng cấu hình riêng của môi trường agent.
  Tuyệt đối không được tạo, sửa, xóa hoặc liên đới file trong `.agents/` khi thực hiện tác vụ sản phẩm.
- **Quy tắc viết tài liệu**: Khi cập nhật file Markdown, mỗi câu trọn vẹn phải nằm trên một dòng vật lý riêng biệt.
  Giữ nguyên cấu trúc Markdown chuẩn và không gộp nhiều câu trên cùng một dòng.
- **Database**: Tuyệt đối không bật `synchronize: true` trong cấu hình TypeORM.
  Mọi thay đổi cấu trúc bảng bắt buộc phải qua migration.
- **Quy trình gỡ lỗi**: Khi xử lý lỗi hoặc viết tính năng mới, luôn tái hiện lỗi bằng kiểm thử trước để bám sát hành vi thực tế của người dùng.
- **Chất lượng kỹ thuật**: Luôn chạy kiểm tra lint và typecheck sau mỗi thay đổi mã nguồn.
  Không bỏ qua bất kỳ cảnh báo hoặc lỗi kiểu dữ liệu nào.
- Trước khi tạo abstraction, utility, decorator, repository hoặc pattern mới, phải kiểm tra xem project đã có implementation tương tự hay chưa.
- **Ưu tiên tái sử dụng implementation và convention hiện có**.
- **Không thay đổi architecture hiện tại nếu không có yêu cầu rõ ràng**.
- **Không sửa các module không liên quan đến task**.

---

## 2. Project Overview

- **Tên dự án**: CRM FCVN.
- **Mục tiêu**: Cung cấp API quản lý quan hệ khách hàng, nhà cung cấp, phòng ban, phân quyền người dùng và luồng duyệt đề nghị/đơn mua hàng.
- **Tech Stack cốt lõi**:
  - Framework: NestJS 11 (`@nestjs/core` ^11), Express, TypeScript 5.7.
  - Cơ sở dữ liệu: PostgreSQL 16 kết hợp TypeORM ^1.1.0 (`pg` ^8.23.0).
  - Schema & DTO Validation: Zod v4 tích hợp qua `nestjs-zod`.
  - Bộ nhớ đệm (Cache): Redis 7 tích hợp qua `@nestjs/cache-manager`, `Keyv` và `@keyv/redis`.
  - Xác thực & Bảo mật: `@nestjs/jwt`, `bcrypt`, `@nestjs/throttler`, `helmet`.
  - Lưu trữ đám mây: AWS S3 qua `@aws-sdk/lib-storage` và `@aws-sdk/s3-request-presigner`.
  - Tài liệu API: `@nestjs/swagger` kết hợp `cleanupOpenApiDoc`.
- **Cấu hình Môi trường & Mạng**:
  - Container NestJS lắng nghe trên cổng `3000`.
  - Docker Compose ánh xạ cổng máy host là `8000` sang container `3000` (`8000:3000`).
  - Địa chỉ gọi API từ máy host luôn có tiền tố: `http://localhost:8000/v1/...`.
- **Lệnh Vận hành**:

```bash
# Docker
docker compose up -d                  # Khởi chạy cụm service App (:8000), Postgres (:5432), Redis (:6379)
docker compose up -d --build          # Rebuild khi cập nhật dependencies
docker compose exec app npm run migration:init-db  # Chạy migration và seed dữ liệu trong container
docker compose logs -f app            # Theo dõi log ứng dụng thời gian thực
docker compose down                   # Dừng container và bảo toàn volume dữ liệu

# Máy Host
npm run start:dev        # Khởi động dev server với cơ chế hot reload
npm run build            # Biên dịch TypeScript sang dist/
npm run lint             # Quét và tự động sửa lỗi ESLint
npm run typecheck        # Kiểm tra kiểu TypeScript (tsc --noEmit)
npm test                 # Chạy unit test với Jest (rootDir: src, regex: *.spec.ts)
npx jest --config test/jest-e2e.json --no-coverage  # Chạy E2E test trong thư mục test/
```

---

## 3. Architecture

- **URI Versioning**:
  - Mặc định sử dụng URI versioning v1 (`defaultVersion: '1'`).
  - Mọi endpoint tự động có tiền tố `/v1/...`.
  - Controller tuyệt đối không tự gắn version trong decorator.
- **Global Providers & Request Lifecycle**:
  - `RequestIdMiddleware`: Tự động tạo UUID v4 hoặc lan truyền header `X-Request-ID` cho mọi request.
  - `AuthGuard` (Global): Xác thực JWT access token, trích xuất payload và nạp quyền từ Redis cache.
  - `ThrottlerGuard` (Global): Giới hạn tần suất gọi API (mặc định 5 request/60 giây đối với route được bảo vệ).
  - `PermissionGuard` (Per-controller): Kiểm tra quyền hạn chi tiết dựa trên metadata `@Permissions()`.
  - `LoggingInterceptor`: Đo lường thời gian thực thi của từng request và ghi nhận log.
  - `TransformInterceptor`: Đóng gói dữ liệu trả về theo format chuẩn của dự án.
  - `IdempotencyInterceptor`: Khóa phân tán trên Redis chống việc thực thi trùng lặp request.
  - `ZodSerializerInterceptor`: Serialize response payload theo đúng schema Zod quy định.
  - `HttpExceptionFilter`: Bắt toàn bộ ngoại lệ và chuẩn hóa cấu trúc JSON lỗi trả về cho client.

---

## 4. Coding Conventions

- **Cấu trúc Thư mục Module Chuẩn**:
  - `*.entity.ts`: Định nghĩa bảng cơ sở dữ liệu TypeORM.
  - `*.model.ts`: Định nghĩa schema Zod và TypeScript types suy luận qua `z.infer`.
  - `*.dto.ts`: Định nghĩa class DTO kế thừa từ `createZodDto(Schema)`.
  - `*.repository.ts`: Repository tương tác cơ sở dữ liệu, kế thừa từ `BaseRepository<T>`.
  - `*.service.ts`: Xử lý toàn bộ nghiệp vụ lõi và giao dịch dữ liệu.
  - `*.controller.ts`: Tiếp nhận HTTP request, gắn Swagger metadata và phân quyền.
  - `*.module.ts`: Khai báo liên kết providers, controllers và TypeORM entities.
- **Quy chuẩn Entity**:
  - Mọi entity bắt buộc kế thừa `BaseEntity` (`src/shared/entities/base.entity.ts`).
  - `BaseEntity` cung cấp sẵn các trường audit: `createdAt`, `createdById`, `updatedAt`, `updatedById`, `deletedAt`, `deletedById`.
  - Mỗi entity con phải tự định nghĩa khóa chính: `@PrimaryGeneratedColumn('increment') id: number`.
  - Đặt tên bảng theo danh từ số nhiều snake_case (ví dụ: `@Entity('customers')`, `@Entity('purchase_orders')`).
  - Khóa ngoại luôn tách biệt giữa trường scalar id và quan hệ relation (ví dụ: `departmentId` và `@ManyToOne() @JoinColumn({ name: 'departmentId' })`).
- **Quy chuẩn Model & DTO**:
  - File `*.model.ts` chỉ chứa Zod schema và TS type, tuyệt đối không tạo class trong file này.
  - File `*.dto.ts` chỉ tạo class DTO thông qua cú pháp `createZodDto`.
  - Đặt tên DTO nhất quán: `CreateXxxBodyDTO`, `UpdateXxxBodyDTO`, `GetXxxResDTO`, `MessageResDTO`.
- **Quy chuẩn Service & Audit Context**:
  - Các hàm thêm mới, cập nhật hoặc xóa trong Service phải nhận `userId` để ghi nhận audit trail (`createdById`, `updatedById`, `deletedById`).
  - Toàn bộ thao tác ghi dữ liệu nhạy cảm phải bọc trong try/catch.
  - Sử dụng hàm helper `isUniqueConstraintError(error)` để chuyển lỗi database thành `ConflictException` (409).
- **Quy chuẩn Controller**:
  - Route khai báo danh từ số nhiều kebab-case (ví dụ: `@Controller('customers')`, `@Controller('suppliers')`).
  - Luôn gắn đầy đủ `@ApiTags()`, `@ApiBearerAuth()` và `@SkipThrottle()` (ngoại trừ auth module).
  - Lấy người dùng đăng nhập qua decorator `@ActiveUser('userId')` hoặc `@ActiveUser()`.
  - Lấy quyền của người dùng qua decorator `@ActiveUserPermissions()`

---

## 5. Validation / API

- **Mã HTTP Status Chuẩn**:
  - Thành công thông thường: `200 OK` (hoặc `201 Created` khi tạo mới bản ghi).
  - Lỗi dữ liệu đầu vào (Validation Error): Bắt buộc trả về `422 Unprocessable Entity`.
  - Lỗi xung đột dữ liệu: `409 Conflict`.
  - Lỗi không tìm thấy: `404 Not Found`.
  - Lỗi không có quyền: `401 Unauthorized` hoặc `403 Forbidden`.
- **Cấu trúc Dữ liệu Trả về**:
  - Phản hồi đơn lẻ: `{ data: T, statusCode: number }`.
  - Phản hồi phân trang: `{ data: T[], meta: { page: number, limit: number, total: number, totalPages: number }, statusCode: number }`.
  - Phản hồi lỗi: `{ statusCode: number, error: string, message: string | FieldError[] }`.
- **Lưu ý Khi Làm Việc Với Swagger**:
  - Không bao giờ truyền class Zod DTO vào `@Query()` hoặc `@ApiQuery()`.
  - Hành động này khiến Swagger serialize mã nguồn của Zod thành `function () { [native code] }` và làm crash Swagger UI.
  - Phân trang trên Swagger bắt buộc dùng `@ApiPaginationQuery()`.
  - Query filters dùng `@ApiQuery({ name: 'key', required: false })`.
  - Controller nhận Query Parameters bằng TS type: `@Query(new ZodValidationPipe(QuerySchema)) query: QueryType`.

---

## 6. Database

- **Quy tắc Quản lý Schema**:
  - Cấu hình `synchronize: false` là bắt buộc trên mọi môi trường.
  - Mọi thay đổi schema bảng phải được ghi nhận qua file migration trong `src/database/migrations/`.
- **Lệnh Migration**:
  - Sinh migration tự động từ diff: `npm run migration:generate --name=TenMigration`.
  - Thực thi migration: `npm run migration:run`.
  - Rollback migration: `npm run migration:revert`.
- **Giao dịch (Database Transaction)**:
  - Khi thực hiện tác vụ tác động nhiều bảng đồng thời, bắt buộc dùng transaction qua `DataSource.transaction()`.
  - Các module mẫu sử dụng transaction: `purchase-request` và `purchase-order`.
- **Cơ chế Soft Delete**:
  - Hệ thống sử dụng cơ chế xóa mềm thông qua trường `deletedAt`.
  - Khi gọi hàm `remove` trên `BaseRepository`, hệ thống tự cập nhật `deletedAt` và `deletedById`.

---

## 7. Authorization / Security

- **Cơ chế Xác thực (Authentication)**:
  - Access Token chứa `userId`, `roleId`, `uuid` với thời hạn ngắn.
  - Refresh Token được băm SHA-256 trước khi lưu vào cơ sở dữ liệu để chống lộ thông tin.
  - Route công khai bắt buộc gắn decorator `@Public()`.
- **Phân quyền Dựa trên Vai trò (RBAC)**:
  - Khai báo quyền trên route handler bằng `@Permissions([Permission.X_MANAGE, Permission.X_VIEW])`.
  - Mảng permissions trong decorator mang ngữ nghĩa **OR** (người dùng chỉ cần sở hữu 1 trong các quyền).
  - Quyền quản trị `*.manage` tự động kế thừa và bao hàm toàn bộ quyền con của module tương ứng.
  - Danh sách quyền của role được lưu tạm trong Redis (`roles:permissions:{roleId}`) với thời gian TTL tối ưu.
- **Bảo mật Tải lên File (AWS S3 Presigned URL)**:
  - Khi client thực hiện HTTP PUT đẩy file lên S3 thông qua Presigned URL, chữ ký đã có sẵn trên query parameter.
  - Client bắt buộc phải tắt hoặc loại bỏ header `Authorization: Bearer <token>` khi gọi trực tiếp S3.
  - Nếu gửi kèm header Authorization, AWS S3 sẽ từ chối request với lỗi `InvalidArgument: Only one auth mechanism allowed`.

---

## 8. Important Domain Rules

- **Customers**:
  - Phân loại khách hàng gồm: Cá nhân (`INDIVIDUAL`), Doanh nghiệp (`CORPORATE`), Đại diện (`REPRESENTATIVE`).
  - Mã khách hàng được sinh tự động theo quy tắc chuẩn của doanh nghiệp.
- **Departments**:
  - Quản lý phòng ban theo mã duy nhất và trạng thái `ACTIVE` hoặc `INACTIVE`.
- **Suppliers & Supplier Groups**:
  - Quản lý nhà cung cấp và nhóm nhà cung cấp.
  - Cho phép phân nhóm nhà cung cấp hàng loạt và thay đổi trạng thái kích hoạt.
- **Customer Request (Đề nghị Sửa/Xóa Khách hàng)**:
  - Hoạt động theo State Machine: `PENDING` -> `APPROVED` hoặc `REJECTED`.
  - Chỉ Sale phụ trách (hoặc manager) mới được tạo request cho khách hàng đó.
  - Không cho phép tồn tại 2 request `PENDING` cùng loại (`actionType`) trên cùng một khách hàng.
  - Khi `APPROVE EDIT`: áp dụng `proposedData` vào bảng `customers` trong transaction, ghi diff audit log.
  - Khi `APPROVE DELETE`: soft-delete khách hàng; bị chặn nếu còn lịch hẹn `SCHEDULED`.
  - Khi `REJECT`: khách hàng không bị thay đổi; bắt buộc phải có `rejectReason`.
  - Toàn bộ quyết định (approve/reject) dùng pessimistic write lock để chống race condition.
  - Sau mỗi quyết định, tạo `AuditLog` chi tiết và gửi `Notification` đến người tạo request.
- **Purchase Request (Đề nghị Mua hàng)**:
  - Hoạt động theo mô hình State Machine nghiêm ngặt: `DRAFT` -> `PENDING_APPROVAL` -> `APPROVED` hoặc `REJECTED`.
  - Toàn bộ thao tác chuyển trạng thái phải được ghi nhận vào bảng `purchase_request_histories` để lưu vết kiểm toán.
- **Purchase Order (Đơn Mua hàng)**:
  - Mã đơn hàng sinh tự động theo định dạng `PO-YYYYMMDD` kết hợp chuỗi ngẫu nhiên.
  - Tích hợp kiểm tra Idempotency qua Redis để chống tình trạng tạo trùng lặp đơn hàng khi mạng chập chờn.
- **Media**:
  - Hỗ trợ 2 phương thức tải lên: Direct Upload (qua Multer disk storage rồi đẩy lên S3) và Client Upload (qua Presigned URL).
  - Quá trình upload trực tiếp luôn xóa tệp tạm trên disk (`unlink`) sau khi đã tải lên S3 thành công hoặc khi gặp lỗi.

---

## 9. Module Map

| Module             | Base Route              | Chức năng chính                                            | Ghi chú kiến trúc                                                         |
| ------------------ | ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `audit-log`        | Không có                | Ghi nhận audit trail mọi thao tác ghi dữ liệu              | `@Global()`, inject `AuditLogService` vào bất kỳ module nào cần           |
| `auth`             | `/v1/auth`              | Đăng nhập, đăng xuất, cấp mới access token                 | Tích hợp Throttler và RefreshTokenRepository                              |
| `cache`            | Không có                | Cung cấp CacheService toàn cục qua Redis                   | `@Global()`, sử dụng Keyv                                                 |
| `customer-request` | `/v1/customer-requests` | Luồng đề nghị sửa/xóa khách hàng, duyệt/từ chối            | State Machine PENDING->APPROVED/REJECTED, pessimistic lock, audit, notify |
| `customers`        | `/v1/customers`         | Quản lý danh mục khách hàng và liên hệ                     | Module chuẩn mẫu cho CRUD thông thường                                    |
| `departments`      | `/v1/departments`       | Quản lý cơ cấu phòng ban nội bộ                            | Có export service và repository cho module khác                           |
| `media`            | `/v1/media`             | Upload ảnh S3, phục vụ tệp tĩnh, tạo Presigned URL         | Dọn dẹp tệp tạm tự động, kết nối S3Service                                |
| `notifications`    | `/v1/notifications`     | Tạo, đọc, đánh dấu đã đọc thông báo trong hệ thống         | Bảng `notifications` + `notification_recipients`; hỗ trợ phân trang       |
| `profile`          | `/v1/profile`           | Xem và cập nhật thông tin cá nhân tài khoản đang đăng nhập | Tái sử dụng UsersRepository                                               |
| `purchase-order`   | `/v1/purchase-orders`   | Tạo và quản lý đơn đặt hàng                                | Module chuẩn mẫu về Transaction và Idempotency                            |
| `purchase-request` | `/v1/purchase-requests` | Luồng duyệt và lịch sử phê duyệt đề nghị mua hàng          | Module chuẩn mẫu về State Machine và Audit History                        |
| `refresh-token`    | Không có                | Quản lý vòng đời refresh token                             | Chỉ chứa Entity và Repository, không có Controller                        |
| `roles`            | `/v1/roles`             | Phân quyền vai trò và quản lý quyền hạn                    | Tích hợp cơ chế cache danh sách quyền vào Redis                           |
| `supplier`         | `/v1/suppliers`         | Quản lý nhà cung cấp và đối tác                            | Route số nhiều `suppliers`                                                |
| `supplier-group`   | `/v1/supplier-groups`   | Phân nhóm và phân bổ nhà cung cấp                          | Sử dụng chung dữ liệu với supplier repository                             |
| `users`            | `/v1/users`             | Quản lý tài khoản, mã nhân viên và mật khẩu                | Tự động băm mật khẩu với bcrypt                                           |

---

## 10. Verification Checklist

Trước khi hoàn thành bất kỳ nhiệm vụ nào, Agent bắt buộc phải kiểm tra danh sách sau:

- [ ] Lệnh `npm run typecheck` thực thi thành công không phát sinh lỗi kiểu dữ liệu.
- [ ] Lệnh `npm run lint` hoàn thành mà không còn lỗi vi phạm quy chuẩn code.
- [ ] Không có class Zod DTO nào được đặt trong `@Query()` hoặc `@ApiQuery()`.
- [ ] Mọi endpoint mới đều có đầy đủ Swagger decorator (`@ApiTags()`, `@ApiOperation()`, `@ApiOkResponse()`).
- [ ] Lỗi xác thực đầu vào luôn trả về HTTP 422 (`UnprocessableEntityException`).
- [ ] Các tác vụ ghi dữ liệu vào database đều có truyền thông tin `userId` phục vụ audit trail.
- [ ] Các thao tác duyệt/từ chối/tạo bản ghi quan trọng đều gọi `AuditLogService.log()` với đủ `actionById`, `refModel`, `targetId`, `diffs`, `metadata`.
- [ ] Kết quả duyệt/từ chối quan trọng đều gửi `NotificationService.createNotification()` đến đúng `recipientIds`.
- [ ] Không có file mới nào được tạo hoặc chỉnh sửa bên trong thư mục `.agents/`.
- [ ] Không có dấu gạch ngang dài (em dash) xuất hiện trong các file tài liệu hoặc code vừa chỉnh sửa.

---

## 11. Documentation References

- Tài liệu kiến trúc chuyên sâu: [docs/BE_ARCHITECTURE.md](docs/BE_ARCHITECTURE.md).
- Quy chuẩn code và quy ước đặt tên: [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
- Hướng dẫn vận hành Database Migration: [docs/migration.md](docs/migration.md).
- Báo cáo xử lý sự cố môi trường và triển khai: [docs/setup-report.md](docs/setup-report.md).
