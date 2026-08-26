# Project Context — CRM FCVN

Backend CRM (NestJS + PostgreSQL + TypeORM + Redis). Mọi thông báo lỗi/API description đều viết bằng **tiếng Việt**.

## Tech Stack

| Concern                    | Technology                                                                     |
| -------------------------- | ------------------------------------------------------------------------------ |
| Framework                  | NestJS 11 (`@nestjs/core` ^11), TypeScript 5.7, Express                        |
| Containerization           | Docker (Multi-stage build) + Docker Compose (App + PostgreSQL 16 + Redis 7)    |
| ORM / DB                   | TypeORM + PostgreSQL (`pg`)                                                    |
| Validation / Serialization | **Zod v4** via **`nestjs-zod`** (không dùng class-validator/class-transformer) |
| Auth & Security            | `@nestjs/jwt`, `bcrypt`, `@nestjs/throttler`, `helmet`                         |
| Cache                      | `@nestjs/cache-manager` + `keyv` + `@keyv/redis`                               |
| Logging                    | `nestjs-pino` + `pino-http`                                                    |
| API docs                   | `@nestjs/swagger` + `cleanupOpenApiDoc` (nestjs-zod)                           |

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
├── initScript/                 # Seed scripts (create-role, create-department, create-user, create-customer, seed-all)
└── src/
    ├── main.ts                 # bootstrap: URI versioning v1, Swagger /api, pino logger, helmet, cors
    ├── app.module.ts           # global wiring (APP_* providers, guards, middleware, modules)
    ├── config/swagger.config.ts# Swagger setup & cleanupOpenApiDoc
    ├── database/               # database.module/providers, datasource-cli, migrations/
    ├── docs/                   # migration.md, setup-report.md (link, đừng duplicate)
    ├── modules/                # Feature modules (auth, customers, departments, profile, purchase-order, purchase-request, roles, supplier, supplier-group, users, ...)
    └── shared/                 # Cross-cutting infra (constants, decorators, DTOs, guards, interceptors, pipes, repositories, services, utils)
```

## Architecture & Request Lifecycle

`main.ts` bật **URI versioning** với `defaultVersion: '1'` → mọi route phục vụ dưới `/v1/...`. Controller **không** tự khai báo version.

Global wiring trong `src/app.module.ts`:

| Token             | Class                      | File                                          |
| ----------------- | -------------------------- | --------------------------------------------- |
| `APP_PIPE`        | `CustomZodValidationPipe`  | `shared/pipe/custom-zod-validation.pipe.ts`   |
| `APP_GUARD`       | `AuthGuard`                | `shared/guard/auth.guard.ts`                  |
| `APP_GUARD`       | `ThrottlerGuard`           | `@nestjs/throttler`                           |
| `APP_FILTER`      | `HttpExceptionFilter`      | `shared/filter/http-exception.filter.ts`      |
| `APP_INTERCEPTOR` | `LoggingInterceptor`       | `shared/interceptor/logging.interceptor.ts`   |
| `APP_INTERCEPTOR` | `TransformInterceptor`     | `shared/interceptor/transform.interceptor.ts` |
| `APP_INTERCEPTOR` | `ZodSerializerInterceptor` | từ `nestjs-zod`                               |

Middleware: `RequestIdMiddleware` áp dụng `forRoutes('*')` (X-Request-ID propagation).

Thứ tự guard: `AuthGuard` → `ThrottlerGuard` → `PermissionGuard` (per-controller).
Thứ tự interceptor: `Logging` → `Transform` → `Idempotency` → `ZodSerializer`.

### Response shape (chuẩn hóa bởi `TransformInterceptor`)

- Thường: `{ data, statusCode }`
- Phân trang (payload có `data` là array **và** có `meta`): `{ data, meta, statusCode }`

### Error shape (chuẩn hóa bởi `HttpExceptionFilter`)

```ts
{
  statusCode: number,
  error: string,
  message: string | string[]
}
```

- `ZodError` → 400; `ZodSerializationException` → 500.
- Validation pipe (`CustomZodValidationPipe`) throw `UnprocessableEntityException` (**422**), với `message` là mảng issues có `path` đã flatten thành `"items.0.price"`.

## Layer Conventions (rất nhất quán giữa các module)

Mỗi feature module có bộ file tương tự:

| File                | Vai trò                                                    |
| ------------------- | ---------------------------------------------------------- |
| `*.entity.ts`       | TypeORM entity class (`extends BaseEntity`)                |
| `*.model.ts`        | Zod schemas + `z.infer` types (KHÔNG có class)             |
| `*.dto.ts`          | `createZodDto(Schema)` class dùng cho controller + Swagger |
| `*.repository.ts`   | `XRepository extends BaseRepository<Entity>`               |
| `*.service.ts`      | logic nghiệp vụ                                            |
| `*.controller.ts`   | routes + Swagger metadata + Permissions                    |
| `*.module.ts`       | wiring TypeORM & providers                                 |
| `*.service.spec.ts` | unit test                                                  |

### Entities

- Mọi entity `extends BaseEntity` (`src/shared/entities/base.entity.ts`) — cung cấp `createdAt/createdById/createdBy`, `updatedAt/updatedById/updatedBy`, `deletedAt/deletedById/deletedBy` (audit + soft delete).
- `BaseEntity` **không** định nghĩa `id` — mỗi entity tự khai `@PrimaryGeneratedColumn('increment') id`.
- `@Entity('snake_case_plural')`:
  - `users`, `roles`, `departments`
  - `customers`
  - `suppliers`, `supplier_groups`
  - `purchase_orders`, `purchase_order_items`
  - `purchase_requests`, `purchase_request_items`, `purchase_request_histories`
  - `refresh_tokens`
- Column luôn khai báo explicit (`@Column({ type: 'varchar', length: N, nullable: true })`).
- FK dùng pattern: scalar column `departmentId?` + relation `@ManyToOne(...) @JoinColumn({ name: 'departmentId' })`.
- Enum lưu dạng `varchar` tham chiếu TS enum trong `src/shared/constant/*.constant.ts`.

### Model vs DTO

- `*.model.ts`: schema Zod, ví dụ `CustomerSchema`, `CreateCustomerBodySchema`, `UpdateCustomerBodySchema = CreateCustomerBodySchema.partial().strict()`, `GetCustomersResSchema`, `GetCustomersQuerySchema = SharedQuerySchema.extend({...})`.
- `*.dto.ts`: `export class CreateCustomerBodyDTO extends createZodDto(CreateCustomerBodySchema) {}`.

Naming convention DTO:

- Body: `CreateXxxBodyDTO`, `UpdateXxxBodyDTO`
- Query: `GetXxxQueryDTO` (dùng chung `PaginationQueryDTO` hoặc `GetXxxQuerySchema`)
- Response list: `GetXxxResDTO`; ack/delete: `MessageResDTO` (`{ message: string }`)
- Custom: `ChangeStatusXxxBodyDTO`, `RejectPurchaseRequestBodyDTO`, `LoginBodyDTO`, `LoginResDTO`, ...

### Repositories

- Base chung: `src/shared/repositories/base.repository.ts` — `class BaseRepository<T extends { id?: EntityId } & SoftDeletableEntity>`.
- Methods: `create`, `findAll(options?)`, `findOne(id)`, `update(id, data)`, `updateMany`, `findByIds`, `remove(id, deletedById?)`.
- **`findAll`** trả **plain array** khi không có options; trả **`{ data, meta }`** khi có `page/limit/search/sortOrder/where`. `remove` soft-delete thủ công khi có `deletedById`, ngược lại gọi `softDelete`.
- Domain repo là subclass mỏng:
  ```ts
  @Injectable()
  export class CustomersRepository extends BaseRepository<Customer> {
    constructor(@InjectRepository(Customer) repository: Repository<Customer>) {
      super(repository);
    }
  }
  ```

### Controllers & Swagger Best Practices

- `@Controller('kebab-plural')`: `customers`, `users`, `roles`, `departments`, `supplier-groups`, `purchase-orders`, `purchase-requests` (ngoại lệ: `supplier` số ít).
- Class decorator: `@ApiTags('Xxx')`, `@ApiBearerAuth()`, `@UseGuards(PermissionGuard)`, `@SkipThrottle()` (trừ Auth).
- CRUD chuẩn: `@Post()` create, `@Get()` findAll, `@Get(':id')` findOne, `@Put(':id')` update, `@Delete(':id')` remove.
- Custom action: `@Post(':id/submit')`, `@Post(':id/approve')`, `@Post(':id/reject')`, `@Get(':id/history')`, `@Put('/change-status/:id')`.
- Mỗi handler: `@Permissions([Permission.X_MANAGE, Permission.X_ACTION])` (OR semantics).
- Param decorators:
  - Body: `@Body() dto: CreateXxxBodyDTO` (dùng DTO class).
  - Query: `@Query(new ZodValidationPipe(GetXxxQuerySchema)) query: GetXxxQueryType` (luôn dùng **TS type** suy luận từ `z.infer`, **KHÔNG dùng class DTO ở `@Query()`**).
  - Param: `@Param('id', ParseIntPipe) id: number`.
  - Active User: `@ActiveUser('userId') userId: number`, `@ActiveUser('departmentId') departmentId: number`, `@ActiveUserPermissions() permissions: Permission[]`.
- Response: `@ZodSerializerDto(GetXxxResDTO)` cho list, `@ZodSerializerDto(MessageResDTO)` cho delete.
- Swagger Decorators:
  - Phân trang: Dùng `@ApiPaginationQuery()`.
  - Query filters: Dùng `@ApiQuery({ name: 'field', required: false, type: String/Number/enum })`.
  - **⚠️ QUY TẮC BẮT BUỘC:** Tuyệt đối **KHÔNG** truyền class Zod DTO vào `@ApiQuery()` (như `@ApiQuery(PaginationQueryDTO)`). Việc này sẽ làm Swagger serialize các hàm nội bộ của Zod (`function () { [native code] }`) vào file `swagger-ui-init.js`, gây crash Swagger UI.

### Services

- `@Injectable()`, constructor injection repository + shared services.
- Method naming: `create`, `findAll`, `findOne`, `update`, `remove` (+ domain: `submit`, `approve`, `reject`, `getHistory`, `deactivate`, `changeStatus`, `assignSuppliers`, `login`, `refreshToken`, `logout`).
- `create(dto, userId)` / `update(id, dto, userId)` set `createdById`/`updatedById`; trim + `toLowerCase()` email.
- `remove` trả `{ message: 'Xóa ... thành công' }`.
- Error handling: try/catch + `isUniqueConstraintError(error)` (`src/shared/helpers.ts`) → `ConflictException`; `NotFoundException` khi thiếu record.

## Modules

| Module                | Trách nhiệm                                                                   | Ghi chú                                                                                             |
| --------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `auth`                | Login, refresh-token rotation, logout, rate limiting (5 req/min)              | Không có entity riêng; dùng `User` + `RefreshToken`. Repo standalone (không extend BaseRepository). |
| `cache`               | `@Global` Redis cache abstraction                                             | `CacheService`: `get/set/delete/clear`.                                                             |
| `customers`           | Customer CRUD + soft delete                                                   | **Module chuẩn mẫu** để tham chiếu.                                                                 |
| `departments`         | Department CRUD (Mã, Tên, Trạng thái, liên kết User & Purchase Request)       | `DepartmentsRepository`, `DepartmentsService`, `DepartmentsController`.                             |
| `profile`             | Trả profile user hiện tại (kèm role + permissions + department)               | Không có repo riêng; dùng `UsersRepository`.                                                        |
| `purchase-order`      | Tạo PO với idempotency + transaction                                          | **Không dùng repository** — dùng `DataSource.transaction()` trực tiếp.                              |
| `purchase-order-item` | Line item của PO                                                              | Không controller/service; chỉ entity + model.                                                       |
| `purchase-request`    | Quy trình Đề nghị mua hàng (DRAFT -> PENDING_APPROVAL -> APPROVED / REJECTED) | Quản lý workflow duyệt theo phòng ban, lưu lịch sử chuyển trạng thái (`PurchaseRequestHistory`).    |
| `refresh-token`       | Lưu refresh token                                                             | Không controller, không exports.                                                                    |
| `roles`               | Role CRUD (permissions dạng simple-array), list được Redis-cache              | Exports `RolesService` + `RolesRepository` (AuthGuard dùng).                                        |
| `supplier`            | Supplier CRUD + deactivate                                                    | Route `supplier` (số ít).                                                                           |
| `supplier-group`      | Supplier group CRUD + changeStatus + assignSuppliers                          | Tái sử dụng `SuppliersRepository` từ `../supplier`.                                                 |
| `users`               | User CRUD, hash password, gán role, liên kết department                       | Exports `UsersService` + `UsersRepository`.                                                         |

Cross-module: không có layering chặt — nhiều module tự `TypeOrmModule.forFeature([...entity])` lại thay vì import module khác (vd `AuthModule` import `forFeature([User, RefreshToken])` trực tiếp).

Global modules: `SharedModule` (`@Global`) exports `HashingService`, `TokenService`, `IdempotencyService`; `AppCacheModule` (`@Global`) exports `CacheService`.

## Shared Infrastructure (`src/shared/`)

- **Guards**
  - `AuthGuard` (global): JWT xác thực. Route public dùng `@Public()`. Đọc Bearer token → `tokenService.verifyAccessToken` → gán `request['user']` (payload) + `request['role_permissions']` (`Permission[]`). Thất bại → `UnauthorizedException` (tiếng Việt).
  - `ThrottlerGuard` (global): Giới hạn tần suất gọi API (mặc định 5 req/60s). Route CRUD dùng `@SkipThrottle()`.
  - `PermissionGuard` (per-controller `@UseGuards`): RBAC OR-based từ `@Permissions(...)`. `*.manage` ngụ ý toàn bộ CRUD (xem `MANAGE_PERMISSIONS`).
- **Decorators**: `@Public()`, `@Permissions([...])`, `@ActiveUser('field')`, `@ActiveUserPermissions()`, `@ApiPaginationQuery()`.
- **Interceptors**
  - `TransformInterceptor`: chuẩn hóa response (xem phần Response shape).
  - `LoggingInterceptor`: log `Before... / After... <ms>` ra console.
- **Filter**: `HttpExceptionFilter` (xem Error shape).
- **Pipe**: `CustomZodValidationPipe` (422).
- **Middleware**: `RequestIdMiddleware` (X-Request-ID).
- **Context** (`shared/context/`): `AsyncLocalStorage` request context — **chưa được import/wire vào đâu** (dead code). Đừng dùng `RequestContextService`.
- **Services** (`shared/services/`): `HashingService` (bcrypt, salt 10), `TokenService` (sign/verify JWT HS256, kèm `uuid` claim), `IdempotencyService` (Redis response cache + lock, TTL 24h/30s/10s/200ms).
- **Repositories**: `BaseRepository<T>`.
- **Constants** (`shared/constant/`):
  - `auth.constant.ts` (request/metadata keys)
  - `permission.constant.ts` (`enum Permission` + `MANAGE_PERMISSIONS` + helpers)
  - `customer.constant.ts`, `department.constant.ts`, `purchase-request.constant.ts`, `supplier.constant.ts`, `supplier-group.constant.ts`, `user.constant.ts` (enums status/action/type).
- **Helpers** (`shared/helpers.ts`): `isPostgresError`, `isUniqueConstraintError` (23505), `isForeignKeyConstraintError` (23503), `isNotNullConstraintError` (23502).
- **Utils** (`shared/utils.ts`): `generateUserCode()` (`FCVN_` + 7 ký tự), `generatePurchaseCode()` (`PO-YYYYMMDD` + 6 số).
- **Config** (`shared/config.ts`): load `.env` + validate bằng Zod; thiếu `.env` hoặc invalid → `process.exit(1)`.

## Database & Migrations

- `src/database/database.provider.ts`: postgres, `autoLoadEntities: true`, `synchronize: false` (hardcoded), `logging: true`, entities glob `src/**/*.entity.ts`.
- `src/database/datasource-cli.ts`: DataSource cho TypeORM CLI (`migrations: src/database/migrations/*.ts`).
- Migrations: Bảng ban đầu `roles`, `users`, `customers`, `refresh_tokens`, `departments`, `suppliers`, `supplier_groups`, `purchase_orders`, `purchase_requests` được quản lý trong `src/database/migrations/*.ts`.
- Xem thêm: [docs/migration.md](docs/migration.md).

## Environment Variables

Validate bởi `src/shared/config.ts` (bắt buộc, `z.string()`): `DB_DATABASE`, `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`, `DB_HOST`, `PORT`, `DB_USER`, `DB_PASSWORD`, `IDEMPOTENCY_KEY`.

Đọc trực tiếp từ `process.env` (KHÔNG validate): `DB_PORT` (default 5432), `REDIS_URL` (default `redis://localhost:6379`), `DB_ADMIN_PASSWORD_TEST` / `DB_SALES_PASSWORD_TEST` (seed script), `CORS_ORIGIN`, `NODE_ENV`.

## Key Files

- `Dockerfile`, `docker-compose.yml` — Docker orchestration (App + Postgres + Redis).
- `src/main.ts`, `src/app.module.ts` — bootstrap + global wiring.
- `src/shared/config.ts` — env validation (nguồn sự thật của env).
- `src/shared/entities/base.entity.ts` — base entity (audit + soft delete).
- `src/shared/repositories/base.repository.ts` — base repo (CRUD + pagination + soft delete).
- `src/modules/customers/*` — module chuẩn mẫu để copy pattern CRUD.
- `src/modules/purchase-request/*` — module chuẩn mẫu cho State Machine & Workflow phê duyệt.
- `src/shared/guard/auth.guard.ts`, `src/shared/guard/permission.guard.ts` — auth/RBAC.
- `src/shared/constant/permission.constant.ts` — `Permission` enum + permission model.
- `src/database/database.provider.ts`, `datasource-cli.ts` — DB config.

## Gotchas & Lưu ý quan trọng

1. **422 chứ không phải 400** cho lỗi validation (`CustomZodValidationPipe`).
2. `BaseRepository.findAll` đổi return type theo options (array vs `{ data, meta }`).
3. `@Permissions` là **OR**; `*.manage` ngụ ý toàn bộ CRUD của module đó.
4. `AuthGuard` phải chạy trước `PermissionGuard`; nó populate `request['user']` + `request['role_permissions']` cho `@ActiveUser()` và `PermissionGuard`.
5. **Swagger UI Syntax Error:** Tuyệt đối không truyền DTO class vào `@Query()` hoặc `@ApiQuery()`. Luôn dùng `@ApiPaginationQuery()` cho phân trang, `@ApiQuery({ name: ... })` cho filters, và `@Query(new ZodValidationPipe(Schema)) query: Type`.
6. **Docker Port Mapping:** Port trên Host là `8000`, forward vào port `3000` của container NestJS (`0.0.0.0:8000 -> 3000`).

## Related Docs (link, không duplicate)

- [src/docs/migration.md](src/docs/migration.md) — quy trình migration TypeORM.
- [src/docs/setup-report.md](src/docs/setup-report.md) — các lỗi setup đã gặp + cách xử lý.
- [README.md](README.md) — hướng dẫn khởi chạy nhanh và các lệnh Docker thông dụng.
