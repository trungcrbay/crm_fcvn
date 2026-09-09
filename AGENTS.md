# Project Context — CRM FCVN

Backend CRM (NestJS + PostgreSQL + TypeORM + Redis). Mọi thông báo lỗi/API description đều viết bằng **tiếng Việt**.

## Tech Stack

| Concern                    | Technology                                                                  |
| -------------------------- | --------------------------------------------------------------------------- |
| Framework                  | NestJS 11 (`@nestjs/core` ^11), TypeScript 5.7, Express                     |
| Containerization           | Docker (Multi-stage build) + Docker Compose (App + PostgreSQL 16 + Redis 7) |
| ORM / DB                   | TypeORM ^1.1.0 + PostgreSQL (`pg` ^8.23.0)                                  |
| Validation / Serialization | **Zod v4** via **`nestjs-zod`**                                             |
| Auth & Security            | `@nestjs/jwt`, `bcrypt`, `@nestjs/throttler`, `helmet`                      |
| Cache                      | `@nestjs/cache-manager` + `keyv` + `@keyv/redis`                            |
| Logging                    | `nestjs-pino` + `pino-http`                                                 |
| API docs                   | `@nestjs/swagger` + `cleanupOpenApiDoc` (nestjs-zod)                        |

## Commands

### 🐳 Chạy với Docker (Khuyến nghị)

```bash
docker compose up -d                  # Khởi động toàn bộ cụm services (App, Postgres, Redis) với hot-reload
docker compose up -d --build          # Rebuild image khi cài thêm package mới vào package.json
docker compose exec app npm run migration:init-db  # Chạy migration + seed toàn bộ DB trong container
docker compose logs -f app            # Xem logs realtime của NestJS app
docker compose ps                     # Xem trạng thái containers (healthy/running)
docker compose down                   # Dừng containers (dữ liệu volume vẫn bảo toàn)
docker compose down -v                # Xóa sạch containers và reset volumes dữ liệu DB
```

### 💻 Chạy thủ công trên máy host

```bash
npm run start:dev        # dev server (watch)
npm run build            # nest build
npm run start:prod       # node dist/main
npm run lint             # eslint --fix trên src/apps/libs/test
npm run typecheck        # tsc --noEmit
npm test                 # jest (unit)
npm run test:cov         # coverage
npm run test:e2e         # e2e (config ./test/jest-e2e.json)

# Migrations (synchronize luôn false)
npm run migration:generate   # generate từ diff entity <-> DB
npm run migration:run
npm run migration:revert

# Setup nhanh DB từ đầu (chạy migration + seed toàn bộ)
npm run migration:init-db
# hoặc: npm run db:setup

# Seed dữ liệu mẫu (chạy từ project root, sau khi migration:run)
npm run db:seed
# hoặc chạy từng script lẻ:
# npx ts-node initScript/create-role.ts
# npx ts-node initScript/create-department.ts
# npx ts-node initScript/create-user.ts
# npx ts-node initScript/create-customer.ts
```

Jest config nằm inline trong `package.json`: `rootDir: "src"`, `testRegex: ".*\\.spec\\.ts$"`, `moduleNameMapper: { "^src/(.*)$": "<rootDir>/$1" }` → import `src/...` hoạt động cả trong test.

## Project Structure

```
.
├── Dockerfile                  # Multi-stage Docker build (base, development, build, production)
├── docker-compose.yml          # Orchestration: App (:8000->3000), Postgres (:5432), Redis (:6379)
├── docker-compose.prod.yml     # Production override
├── .dockerignore               # Loại trừ node_modules, dist, .git, .env khỏi Docker context
├── docs/                       # BE_ARCHITECTURE.md, CONVENTIONS.md, migration.md, setup-report.md
├── initScript/                 # Seed scripts (create-role, create-department, create-user, create-customer, seed-all)
└── src/
    ├── main.ts                 # bootstrap: URI versioning v1, Swagger /api, pino logger, helmet, cors
    ├── app.module.ts           # global wiring (APP_* providers, guards, middleware, modules)
    ├── config/swagger.config.ts# Swagger setup & cleanupOpenApiDoc
    ├── database/               # database.provider.ts, datasource-cli.ts, migrations/
    ├── modules/                # Feature modules (auth, cache, customers, departments, profile, purchase-order, purchase-order-item, purchase-request, refresh-token, roles, supplier, supplier-group, users)
    └── shared/                 # Cross-cutting infra (constants, decorators, DTOs, entities, filter, guard, helpers, interceptor, middleware, model, pipe, repositories, services, types, utils)
```

## Architecture & Request Lifecycle

`main.ts` bật **URI versioning** với `defaultVersion: '1'` → mọi route phục vụ dưới `/v1/...`. Controller **không** tự khai báo version.

Global wiring trong `src/app.module.ts`:

| Token             | Class                      | File                                          |
| ----------------- | -------------------------- | --------------------------------------------- |
| `APP_PIPE`        | `CustomZodValidationPipe`  | `shared/pipe/custom-zod-validation.pipe.ts`   |
| `APP_GUARD`       | `AuthGuard`                | `shared/guard/auth.guard.ts`                  |
| `APP_GUARD`       | `ThrottlerGuard`           | `@nestjs/throttler` (mặc định 5 req/60s)      |
| `APP_FILTER`      | `HttpExceptionFilter`      | `shared/filter/http-exception.filter.ts`      |
| `APP_INTERCEPTOR` | `LoggingInterceptor`       | `shared/interceptor/logging.interceptor.ts`   |
| `APP_INTERCEPTOR` | `TransformInterceptor`     | `shared/interceptor/transform.interceptor.ts` |
| `APP_INTERCEPTOR` | `ZodSerializerInterceptor` | từ `nestjs-zod`                               |

Middleware: `RequestIdMiddleware` áp dụng `forRoutes('*')` (X-Request-ID propagation).

Thứ tự guard: `AuthGuard` (global) → `ThrottlerGuard` (global) → `PermissionGuard` (per-controller `@UseGuards(PermissionGuard)`).
Thứ tự interceptor: `LoggingInterceptor` → `TransformInterceptor` → `Idempotency` (theo route/service) → `ZodSerializerInterceptor`.

### Response shape (chuẩn hóa bởi `TransformInterceptor`)

- Thường: `{ data, statusCode }`
- Phân trang (payload có `data` là array **và** có `meta`): `{ data, meta, statusCode }`
  - Shape của meta: `{ page: number, limit: number, total: number, totalPages: number }`

### Error shape (chuẩn hóa bởi `HttpExceptionFilter`)

```ts
{
  statusCode: number,
  error: string,
  message: string | FieldError[] // FieldError: { field: string, message: string }
}
```

- Validation pipe (`CustomZodValidationPipe` kết hợp `HttpExceptionFilter`): trả **422** (`UnprocessableEntityException`), `message` được format thành mảng các đối tượng `{ field: 'items.0.price', message: '...' }`.
- `ZodError` phát sinh độc lập → 400 Bad Request.
- `ZodSerializationException` → 500 Internal Server Error.

## Layer Conventions

Mỗi feature module có bộ file tương tự:

| File                | Vai trò                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `*.entity.ts`       | TypeORM entity class (`extends BaseEntity`)                           |
| `*.model.ts`        | Zod schemas + `z.infer` types (KHÔNG có class)                        |
| `*.dto.ts`          | `createZodDto(Schema)` class dùng cho controller validation + Swagger |
| `*.repository.ts`   | `XRepository extends BaseRepository<Entity>`                          |
| `*.service.ts`      | logic nghiệp vụ                                                       |
| `*.controller.ts`   | routes + Swagger metadata + Permissions                               |
| `*.module.ts`       | wiring TypeORM & providers                                            |
| `*.service.spec.ts` | unit test                                                             |

### Entities

- Mọi entity `extends BaseEntity` (`src/shared/entities/base.entity.ts`) — cung cấp `createdAt/createdById/createdBy`, `updatedAt/updatedById/updatedBy`, `deletedAt/deletedById/deletedBy` (audit + soft delete).
- `BaseEntity` **không** định nghĩa `id` — mỗi entity tự khai `@PrimaryGeneratedColumn('increment') id: number`.
- `@Entity('snake_case_plural')`:
  - `users`, `roles`, `departments`
  - `customers`
  - `suppliers`, `supplier_groups`
  - `purchase_orders`, `purchase_order_items`
  - `purchase_requests`, `purchase_request_items`, `purchase_request_histories`
  - `refresh_tokens`
- Column luôn khai báo explicit (`@Column({ type: 'varchar', length: N, nullable: true })`).
- Unique khai báo cả hai: `@Index({ unique: true })` + `unique: true` trong `@Column`.
- FK dùng pattern: scalar column `departmentId?` + relation `@ManyToOne(...) @JoinColumn({ name: 'departmentId' })`.
- Enum lưu dạng `varchar` tham chiếu TS enum trong `src/shared/constant/*.constant.ts`.

### Model vs DTO

- `*.model.ts`: schema Zod thuần túy, ví dụ `CustomerSchema`, `CreateCustomerBodySchema`, `UpdateCustomerBodySchema = CreateCustomerBodySchema.partial().strict()`, `GetCustomersResSchema`, `GetCustomersQuerySchema = SharedQuerySchema.extend({...})`.
- `*.dto.ts`: `export class CreateCustomerBodyDTO extends createZodDto(CreateCustomerBodySchema) {}`.

Naming convention DTO:

- Body: `CreateXxxBodyDTO`, `UpdateXxxBodyDTO`
- Query: `GetXxxQueryDTO` (khi cần DTO class) / `GetXxxQuerySchema` + `GetXxxQueryType` (dùng ở controller)
- Response: `GetXxxResDTO` (danh sách), `XxxResDTO` (chi tiết đơn lẻ); ack/delete: `MessageResDTO` (`{ message: string }`)
- Custom: `ChangeStatusXxxBodyDTO`, `AssignSuppliersToGroupBodyDTO`, `RejectPurchaseRequestBodyDTO`, `LoginBodyDTO`, `LoginResDTO`, ...

### Repositories

- Base chung: `src/shared/repositories/base.repository.ts` — `class BaseRepository<T extends { id?: EntityId } & SoftDeletableEntity>`.
- Methods: `create`, `findAll(options?)`, `findOne(id, relations?)`, `update(id, data)`, `updateMany(ids, data)`, `findByIds(ids)`, `remove(id, deletedById?)`.
- **`findAll`** trả **plain array** (`T[]`) khi không có options; trả **`{ data, meta }`** (`PaginatedResult<T>`) khi có `page`, `limit`, `search`, `sortOrder`, hoặc `where`.
- `remove`: thực hiện soft delete gán `deletedAt: new Date()` và `deletedById` khi có `deletedById` truyền vào; nếu không có thì gọi `repository.softDelete(id)`.
- Domain repository kế thừa từ `BaseRepository`:
  ```ts
  @Injectable()
  export class CustomersRepository extends BaseRepository<Customer> {
    constructor(@InjectRepository(Customer) repository: Repository<Customer>) {
      super(repository);
    }
  }
  ```

### Controllers & Swagger Best Practices

- `@Controller('kebab-plural')`:
  - `customers`, `users`, `roles`, `departments`, `suppliers`, `supplier-groups`, `purchase-orders`, `purchase-requests`.
  - Ngoại lệ route: `auth`, `profile`.
- Class decorators: `@ApiTags('Xxx')`, `@ApiBearerAuth()`, `@UseGuards(PermissionGuard)`, `@SkipThrottle()` (trừ `auth`).
- CRUD chuẩn: `@Post()` create, `@Get()` findAll, `@Get(':id')` findOne, `@Put(':id')` update, `@Delete(':id')` remove.
- Custom actions:
  - Supplier / Supplier Group: `@Put('deactivate/:id')`, `@Put('/change-status/:id')`, `@Put(':id/assign-suppliers')`
  - Purchase Request: `@Post(':id/submit')`, `@Post(':id/approve')`, `@Post(':id/reject')`, `@Get(':id/history')`
  - Purchase Order: `@Post('/reproduce')` (chỉ bật ở `NODE_ENV=development`)
- Handler permissions: `@Permissions([Permission.X_MANAGE, Permission.X_ACTION])` (OR semantics).
- Param decorators:
  - Body: `@Body() dto: CreateXxxBodyDTO` (dùng DTO class).
  - Query: `@Query(new ZodValidationPipe(GetXxxQuerySchema)) query: GetXxxQueryType` (luôn dùng **TS type** suy luận từ `z.infer`, **KHÔNG dùng class DTO ở `@Query()`**).
  - Param: `@Param('id', ParseIntPipe) id: number`.
  - Active User: `@ActiveUser('userId') userId: number`, `@ActiveUser('departmentId') departmentId: number`, `@ActiveUserPermissions() permissions: Permission[]`.
- Response: `@ZodSerializerDto(GetXxxResDTO)` cho list, `@ZodSerializerDto(MessageResDTO)` cho delete/action ack.
- Swagger Decorators:
  - Phân trang: Dùng `@ApiPaginationQuery()` (`page`, `limit`, `search`, `sortOrder`).
  - Query filters: Dùng `@ApiQuery({ name: 'field', required: false, type: String/Number/enum })`.
  - **⚠️ QUY TẮC BẮT BUỘC:** Tuyệt đối **KHÔNG** truyền class Zod DTO vào `@ApiQuery()` (như `@ApiQuery(PaginationQueryDTO)`). Việc này sẽ làm Swagger serialize các hàm nội bộ của Zod (`function () { [native code] }`) vào file `swagger-ui-init.js`, gây crash Swagger UI.

### Services

- `@Injectable()`, constructor injection repository + shared services.
- Method naming: `create`, `findAll`, `findOne`, `update`, `remove` (+ domain: `submit`, `approve`, `reject`, `getHistory`, `deactivate`, `changeStatus`, `assignSuppliers`, `purchaseOrder`, `login`, `refreshToken`, `logout`).
- Audit context: `create(dto, userId)` / `update(id, dto, userId)` set `createdById`/`updatedById`; email luôn được `.trim().toLowerCase()`.
- `remove` trả `{ message: 'Xóa ... thành công' }`.
- Error handling: try/catch + `isUniqueConstraintError(error)` (`src/shared/helpers.ts`) → `ConflictException`; `NotFoundException` khi thiếu record.

## Modules

| Module                | Trách nhiệm                                                                         | Ghi chú                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `auth`                | Login, refresh-token rotation, logout, rate limiting (5 req/60s)                    | Dùng `User` + `RefreshToken`. `AuthRepository` standalone (không kế thừa `BaseRepository`).                  |
| `cache`               | `@Global` Redis cache abstraction qua `Keyv` + `@keyv/redis`                        | `CacheService`: `get`, `set`, `delete`, `clear`.                                                             |
| `customers`           | Customer CRUD + soft delete                                                         | **Module chuẩn mẫu CRUD** để tham chiếu. Route `customers`.                                                  |
| `departments`         | Department CRUD (mã, tên, mô tả, trạng thái `ACTIVE`/`INACTIVE`)                    | `DepartmentsRepository`, `DepartmentsService`, `DepartmentsController`. Exports service & repo.              |
| `profile`             | Trả profile user hiện tại (kèm role + permissions)                                  | Không có repo riêng; tái sử dụng `UsersRepository`. Route `profile`.                                         |
| `purchase-order`      | Quản lý và tạo PO với Idempotency + Transaction                                     | Dùng `DataSource` transaction trực tiếp; không repo riêng; route `purchase-orders`.                          |
| `purchase-order-item` | Line item của PO                                                                    | Chỉ có entity + model; không controller/service riêng.                                                       |
| `purchase-request`    | Quy trình Đề nghị mua hàng (`DRAFT` -> `PENDING_APPROVAL` -> `APPROVED`/`REJECTED`) | **Module chuẩn mẫu Workflow & State Machine**. Dùng `DataSource` transaction, lưu lịch sử chuyển trạng thái. |
| `refresh-token`       | Lưu trữ và quản lý refresh token (`expiresAt`, SHA-256 hashed token)                | `RefreshTokenRepository extends BaseRepository<RefreshToken>`, không controller.                             |
| `roles`               | Role CRUD (permissions mảng simple-array), cache Redis                              | Exports `RolesService` + `RolesRepository` (`AuthGuard` dùng để cache & load permissions).                   |
| `supplier`            | Supplier CRUD + deactivate (`SupplierStatus.ACTIVE`/`INACTIVE`)                     | Route `suppliers` (controller là `suppliers`, thư mục là `supplier`).                                        |
| `supplier-group`      | Supplier Group CRUD + changeStatus + assignSuppliers                                | Tái sử dụng `SuppliersRepository` từ `supplier`. Route `supplier-groups`.                                    |
| `users`               | User CRUD, hash password (bcrypt), gán role, liên kết department                    | Exports `UsersService` + `UsersRepository`. Route `users`.                                                   |

Cross-module: `SharedModule` (`@Global`) exports `HashingService`, `TokenService`, `IdempotencyService`; `AppCacheModule` (`@Global`) exports `CacheService`.

## Shared Infrastructure (`src/shared/`)

- **Guards**
  - `AuthGuard` (global `APP_GUARD`): Xác thực Bearer JWT token. Route public dùng `@Public()`. Verify access token → load role permissions từ Redis cache (key `roles:permissions:{roleId}`) hoặc DB fallback → gán `request['user']` + `request['role_permissions']`.
  - `ThrottlerGuard` (global `APP_GUARD`): Giới hạn tần suất gọi API (mặc định 5 req/60s). Route CRUD dùng `@SkipThrottle()`, riêng auth có custom rate limit.
  - `PermissionGuard` (per-controller `@UseGuards(PermissionGuard)`): RBAC OR-based từ `@Permissions(...)`. Quyền `*.manage` ngụ ý toàn bộ action con (xem `MANAGE_PERMISSIONS`).
- **Decorators**: `@Public()`, `@Permissions([...])`, `@ActiveUser('field')`, `@ActiveUserPermissions()`, `@ApiPaginationQuery()`.
- **Interceptors**
  - `TransformInterceptor`: Chuẩn hóa response (`{ data, statusCode }` hoặc `{ data, meta, statusCode }`).
  - `LoggingInterceptor`: Log `Before... / After... <ms>` ra console.
  - `ZodSerializerInterceptor`: Serialize response object theo schema Zod.
- **Filter**: `HttpExceptionFilter`: Xử lý ngoại lệ, format Zod issue thành `{ field, message }`, chuẩn hóa response `{ statusCode, error, message }`.
- **Pipe**: `CustomZodValidationPipe`: Validate request payload, ném `UnprocessableEntityException` (422) với format flattened path.
- **Middleware**: `RequestIdMiddleware`: Gán `X-Request-ID` cho mọi request qua UUID v4.
- **Services** (`shared/services/`):
  - `HashingService`: `bcrypt` (salt rounds 10) `hash` & `compare`.
  - `TokenService`: Ký và xác thực access token / refresh token với `@nestjs/jwt` (HS256, claim uuid).
  - `IdempotencyService`: Redis lock + response cache chống duplicate request (TTL 24h, lock 30s).
- **Repositories**: `BaseRepository<T>` (CRUD, phân trang, soft delete, search by name).
- **Constants** (`shared/constant/`):
  - `auth.constant.ts`: Keys request metadata (`user`, `role_permissions`, `isPublic`, `permissions`).
  - `permission.constant.ts`: `enum Permission`, `MANAGE_PERMISSIONS`, priority & normalize helpers.
  - `customer.constant.ts`: `CustomerType` (`INDIVIDUAL`, `CORPORATE`, `REPRESENTATIVE`), `CustomerTypeLabel`.
  - `department.constant.ts`: `DepartmentStatus` (`ACTIVE`, `INACTIVE`).
  - `purchase-request.constant.ts`: `PurchaseRequestStatus` (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`), `PurchaseRequestAction` (`CREATE`, `UPDATE`, `SUBMIT`, `APPROVE`, `REJECT`, `DELETE`).
  - `supplier.constant.ts`: `SupplierStatus` (`active`, `inactive`).
  - `supplier-group.constant.ts`: `SupplierGroupStatus` (`active`, `inactive`).
  - `user.constant.ts`: `UserStatus` (`active`, `inactive`).
  - `cache.constant.ts`: Redis cache keys & TTL (`CACHE_KEY_ROLES_LIST`, `CACHE_TTL_ROLE_PERMISSIONS`).
- **Helpers** (`shared/helpers.ts`): `isPostgresError`, `isUniqueConstraintError` (23505), `isForeignKeyConstraintError` (23503), `isNotNullConstraintError` (23502).
- **Utils** (`shared/utils.ts`): `generateUserCode()` (`FCVN_` + 7 ký tự), `generatePurchaseCode()` (`PO-YYYYMMDD` + 6 số), `generatePurchaseRequestCode()` (`PR-YYYYMMDD` + 6 số), `hashToken()` (SHA-256 hex).
- **Config** (`shared/config.ts`): Load và validate nghiêm ngặt `.env` qua Zod; thiếu biến môi trường bắt buộc sẽ dừng app (`process.exit(1)`).

## Database & Migrations

- `src/database/database.provider.ts`: PostgreSQL, `autoLoadEntities: true`, `synchronize: false` (bắt buộc `false`), `logging: true`, scan `src/**/*.entity.ts`.
- `src/database/datasource-cli.ts`: DataSource cho TypeORM CLI (`entities: ['src/**/*.entity.ts']`, `migrations: ['src/database/migrations/*.ts']`).
- Migrations: Đã có migration khởi tạo `1786900000000-InitialTables.ts` cùng chuỗi các AutoMigration quản lý toàn bộ cấu trúc bảng hiện hành.
- Chi tiết quy trình: Xem [docs/migration.md](docs/migration.md).

## Environment Variables

Validate bắt buộc bởi `src/shared/config.ts` (thiếu sẽ `process.exit(1)`):

- `DB_DATABASE`, `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`, `DB_HOST`, `PORT`, `DB_USER`, `DB_PASSWORD`, `IDEMPOTENCY_KEY`.

Biến đọc bổ sung từ `process.env`:

- `DB_PORT` (mặc định 5432), `REDIS_URL` (mặc định `redis://localhost:6379`), `DB_ADMIN_PASSWORD_TEST` / `DB_SALES_PASSWORD_TEST` (seed script), `CORS_ORIGIN`, `NODE_ENV`.

## Key Files

- `Dockerfile`, `docker-compose.yml` — Multi-stage containerization & orchestration (App + Postgres + Redis).
- `src/main.ts`, `src/app.module.ts` — Bootstrap, versioning, logger pino, helmet, cors, global providers.
- `src/shared/config.ts` — Thẩm định biến môi trường nghiêm ngặt với Zod.
- `src/shared/entities/base.entity.ts` — Entity gốc cung cấp audit trail (`createdById`, `updatedById`, `deletedById`) và soft delete.
- `src/shared/repositories/base.repository.ts` — Repository gốc đa năng (CRUD, phân trang, soft delete).
- `src/modules/customers/*` — Chuẩn mẫu tham khảo cho toàn bộ CRUD thông thường.
- `src/modules/purchase-request/*` — Chuẩn mẫu tham khảo cho State Machine, phân quyền phòng ban & Workflow phê duyệt.
- `src/modules/purchase-order/*` — Chuẩn mẫu tham khảo cho Database Transaction & Idempotency chống duplicate.
- `src/shared/guard/auth.guard.ts`, `src/shared/guard/permission.guard.ts` — JWT authentication và RBAC authorization.

## Gotchas & Lưu ý quan trọng

1. **422 chứ không phải 400** cho lỗi validation đầu vào (`CustomZodValidationPipe` ném `UnprocessableEntityException`, filter trả `{ statusCode: 422, message: [{ field, message }] }`).
2. `BaseRepository.findAll` đổi return type theo options: không options trả plain array `T[]`; có `page/limit/search/sortOrder/where` trả `{ data, meta }`.
3. `@Permissions` mang ngữ nghĩa **OR**; quyền `*.manage` tự động thỏa mãn các quyền thao tác con của module tương ứng.
4. `AuthGuard` chạy trước `PermissionGuard`; nó populate `request['user']` và `request['role_permissions']` cho `@ActiveUser()` và `PermissionGuard`.
5. **Swagger UI Syntax Error:** Tuyệt đối **KHÔNG** truyền class Zod DTO vào `@Query()` hoặc `@ApiQuery()`. Luôn dùng `@ApiPaginationQuery()` cho phân trang, `@ApiQuery({ name: ... })` cho filters, và `@Query(new ZodValidationPipe(Schema)) query: Type`.
6. **Docker Port Mapping:** Port trên Host là `8000`, forward vào port `3000` của container NestJS (`0.0.0.0:8000 -> 3000`).
7. **Controller Route Plural:** Controller nhà cung cấp sử dụng `@Controller('suppliers')` (số nhiều) dù tên thư mục là `supplier/`. Tương tự, `supplier-groups`, `purchase-orders`, `purchase-requests`.
8. Không có thư mục `shared/context/` — toàn bộ request context được truyền minh bạch qua request object (`@ActiveUser()`, `@ActiveUserPermissions()`).

## Related Docs

- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — Chi tiết quy ước code, naming, mẫu model/DTO/service/controller.
- [docs/BE_ARCHITECTURE.md](docs/BE_ARCHITECTURE.md) — Tài liệu kiến trúc tổng quan, sequence diagrams.
- [docs/migration.md](docs/migration.md) — Quy trình tạo, chạy và rollback TypeORM migration.
- [docs/setup-report.md](docs/setup-report.md) — Tổng hợp lỗi setup thường gặp và cách xử lý.
- [README.md](README.md) — Hướng dẫn cài đặt và khởi chạy dự án với Docker & host.
