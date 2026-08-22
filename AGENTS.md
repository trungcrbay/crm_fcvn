# Project Context — CRM FCVN

Backend CRM (NestJS + PostgreSQL + TypeORM). Mọi thông báo lỗi/API description đều viết bằng **tiếng Việt**.

## Tech Stack

| Concern                    | Technology                                                                     |
| -------------------------- | ------------------------------------------------------------------------------ |
| Framework                  | NestJS 11 (`@nestjs/core` ^11), TypeScript 5.7, Express                        |
| ORM / DB                   | TypeORM + PostgreSQL (`pg`)                                                    |
| Validation / Serialization | **Zod v4** via **`nestjs-zod`** (không dùng class-validator/class-transformer) |
| Auth                       | `@nestjs/jwt`, `bcrypt`                                                        |
| Cache                      | `@nestjs/cache-manager` + `keyv` + `@keyv/redis`                               |
| Logging                    | `nestjs-pino`                                                                  |
| API docs                   | `@nestjs/swagger` + `cleanupOpenApiDoc` (nestjs-zod)                           |

## Commands

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

# Seed (chạy từ project root, sau khi migration:run)
npx ts-node initScript/create-role.ts
npx ts-node initScript/create-user.ts
npx ts-node initScript/create-customer.ts
```

Jest config nằm inline trong `package.json`: `rootDir: "src"`, `testRegex: ".*\\.spec\\.ts$"`, `moduleNameMapper: { "^src/(.*)$": "<rootDir>/$1" }` → import `src/...` hoạt động cả trong test.

## Project Structure

```
src/
  main.ts                  # bootstrap: URI versioning v1, Swagger /api, pino logger
  app.module.ts            # global wiring (APP_* providers + middleware)
  config/swagger.config.ts
  database/                # database.module/providers, datasource-cli, migrations/
  docs/                    # migration.md, setup-report.md (link, đừng duplicate)
  modules/                 # feature modules (auth, customers, users, roles, ...)
  shared/                  # cross-cutting infra
initScript/                # seed scripts (create-role, create-user, create-customer)
```

## Architecture & Request Lifecycle

`main.ts` bật **URI versioning** với `defaultVersion: '1'` → mọi route phục vụ dưới `/v1/...`. Controller **không** tự khai báo version.

Global wiring trong `src/app.module.ts`:

| Token             | Class                      | File                                          |
| ----------------- | -------------------------- | --------------------------------------------- |
| `APP_PIPE`        | `CustomZodValidationPipe`  | `shared/pipe/custom-zod-validation.pipe.ts`   |
| `APP_GUARD`       | `AuthGuard`                | `shared/guard/auth.guard.ts`                  |
| `APP_FILTER`      | `HttpExceptionFilter`      | `shared/filter/http-exception.filter.ts`      |
| `APP_INTERCEPTOR` | `LoggingInterceptor`       | `shared/interceptor/logging.interceptor.ts`   |
| `APP_INTERCEPTOR` | `TransformInterceptor`     | `shared/interceptor/transform.interceptor.ts` |
| `APP_INTERCEPTOR` | `ZodSerializerInterceptor` | từ `nestjs-zod`                               |

Middleware: `RequestIdMiddleware` áp dụng `forRoutes('*')` (X-Request-ID propagation).

Thứ tự interceptor: `Logging` → `Transform` → `Idempotency` → `ZodSerializer`.

### Response shape (chuẩn hóa bởi `TransformInterceptor`)

- Thường: `{ data, statusCode }`
- Phân trang (payload có `data` là array **và** có `meta`): `{ data, meta, statusCode }`

### Error shape (chuẩn hóa bởi `HttpExceptionFilter`)

```ts
{
  (statusCode, error, message);
} // message là string | string[]
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
| `*.controller.ts`   | routes                                                     |
| `*.module.ts`       | wiring                                                     |
| `*.service.spec.ts` | unit test (chỉ customers, purchase-order có)               |

### Entities

- Mọi entity `extends BaseEntity` (`src/shared/entities/base.entity.ts`) — cung cấp `createdAt/createdById/createdBy`, `updatedAt/updatedById/updatedBy`, `deletedAt/deletedById/deletedBy` (audit + soft delete).
- `BaseEntity` **không** định nghĩa `id` — mỗi entity tự khai `@PrimaryGeneratedColumn('increment') id`.
- `@Entity('snake_case_plural')`: `customers`, `users`, `roles`, `suppliers`, `supplier_groups`, `purchase_orders`, `purchase_order_items`, `refresh_tokens`.
- Column luôn khai báo explicit (`@Column({ type: 'varchar', length: N, nullable: true })`).
- FK dùng pattern: scalar column `supplierGroupId?` + relation `@ManyToOne(...) @JoinColumn({ name: 'supplierGroupId' })`.
- Enum lưu dạng `varchar` tham chiếu TS enum trong `src/shared/constant/*.constant.ts`.

### Model vs DTO

- `*.model.ts`: schema Zod, ví dụ `CustomerSchema`, `CreateCustomerBodySchema`, `UpdateCustomerBodySchema = CreateCustomerBodySchema.partial().strict()`, `GetCustomersResSchema`, `GetCustomersQuerySchema = SharedQuerySchema.extend({...})`.
- `*.dto.ts`: `export class CreateCustomerBodyDTO extends createZodDto(CreateCustomerBodySchema) {}`.

Naming convention DTO:

- Body: `CreateXxxBodyDTO`, `UpdateXxxBodyDTO`
- Query: `GetXxxQueryDTO` (dùng chung `PaginationQueryDTO`)
- Response list: `GetXxxResDTO`; ack/delete: `MessageResDTO` (`{ message: string }`)
- Custom: `ChangeStatusXxxBodyDTO`, `AssignSuppliersToGroupBodyDTO`, `LoginBodyDTO`, `LoginResDTO`, ...

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

### Controllers

- `@Controller('kebab-plural')`: `customers`, `users`, `roles`, `supplier-group`, `purchase-order` (ngoại lệ: `supplier` số ít).
- Class decorator: `@ApiTags('Xxx')`, `@ApiBearerAuth()`, `@UseGuards(PermissionGuard)` (ngoại trừ `auth` dùng `@Public()`).
- CRUD chuẩn: `@Post()` create, `@Get()` findAll, `@Get(':id')` findOne, `@Put(':id')` update, `@Delete(':id')` remove. Custom action: `@Put('deactivate/:id')`, `@Put('/change-status/:id')`.
- Mỗi handler: `@Permissions([Permission.X_MANAGE, Permission.X_ACTION])` (OR semantics).
- Param decorators: `@Body() dto`, `@Query(new ZodValidationPipe(PaginationQuerySchema))`, `@Param('id') id: string`, `@ActiveUser('userId') userId: number`.
- Response: `@ZodSerializerDto(GetXxxResDTO)` cho list, `@ZodSerializerDto(MessageResDTO)` cho delete.
- Swagger: `@ApiOperation({ summary: '...' })` (tiếng Việt) + `@ApiBody`, `@ApiCreatedResponse`, `@ApiResponse`, `@ApiPaginationQuery()`, ...

### Services

- `@Injectable()`, constructor injection repository + shared services.
- Method naming: `create`, `findAll`, `findOne`, `update`, `remove` (+ domain: `deactivate`, `changeStatus`, `assignSuppliers`, `login`, `refreshToken`, `logout`).
- `create(dto, userId)` / `update(id, dto, userId)` set `createdById`/`updatedById`; trim + `toLowerCase()` email.
- `remove` trả `{ message: 'Xóa ... thành công' }`.
- Error handling: try/catch + `isUniqueConstraintError(error)` (`src/shared/helpers.ts`) → `ConflictException`; `NotFoundException` khi thiếu record.

## Modules

| Module                | Trách nhiệm                                                      | Ghi chú                                                                                             |
| --------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `auth`                | Login, refresh-token rotation, logout                            | Không có entity riêng; dùng `User` + `RefreshToken`. Repo standalone (không extend BaseRepository). |
| `cache`               | `@Global` Redis cache abstraction                                | `CacheService`: `get/set/delete/clear`.                                                             |
| `customers`           | Customer CRUD + soft delete                                      | **Module chuẩn mẫu** để tham chiếu.                                                                 |
| `profile`             | Trả profile user hiện tại (kèm role + permissions)               | Không có repo riêng; dùng `UsersRepository`.                                                        |
| `purchase-order`      | Tạo PO với idempotency + transaction                             | **Không dùng repository** — dùng `DataSource.transaction()` trực tiếp.                              |
| `purchase-order-item` | Line item của PO                                                 | Không controller/service; chỉ entity + model.                                                       |
| `refresh-token`       | Lưu refresh token                                                | Không controller, không exports.                                                                    |
| `roles`               | Role CRUD (permissions dạng simple-array), list được Redis-cache | Exports `RolesService` + `RolesRepository` (AuthGuard dùng).                                        |
| `supplier`            | Supplier CRUD + deactivate                                       | Route `supplier` (số ít).                                                                           |
| `supplier-group`      | Supplier group CRUD + changeStatus + assignSuppliers             | Tái sử dụng `SuppliersRepository` từ `../supplier`.                                                 |
| `users`               | User CRUD, hash password, gán role                               | Exports `UsersService` + `UsersRepository`.                                                         |

Cross-module: không có layering chặt — nhiều module tự `TypeOrmModule.forFeature([...entity])` lại thay vì import module khác (vd `AuthModule` import `forFeature([User, RefreshToken])` trực tiếp).

Global modules: `SharedModule` (`@Global`) exports `HashingService`, `TokenService`, `IdempotencyService`; `AppCacheModule` (`@Global`) exports `CacheService`.

## Shared Infrastructure (`src/shared/`)

- **Guards**
  - `AuthGuard` (global): JWT xác thực. Route public dùng `@Public()`. Đọc Bearer token → `tokenService.verifyAccessToken` → gán `request['user']` (payload) + `request['role_permissions']` (`Permission[]`). Thất bại → `UnauthorizedException` (tiếng Việt).
  - `PermissionGuard` (per-controller `@UseGuards`): RBAC OR-based từ `@Permissions(...)`. `*.manage` ngụ ý toàn bộ CRUD (xem `MANAGE_PERMISSIONS`).
- **Decorators**: `@Public()`, `@Permissions([...])`, `@ActiveUser('field')`, `@ApiPaginationQuery()`.
- **Interceptors**
  - `TransformInterceptor`: chuẩn hóa response (xem phần Response shape).
  - `LoggingInterceptor`: log `Before... / After... <ms>` ra console.
- **Filter**: `HttpExceptionFilter` (xem Error shape).
- **Pipe**: `CustomZodValidationPipe` (422).
- **Middleware**: `RequestIdMiddleware` (X-Request-ID).
- **Context** (`shared/context/`): `AsyncLocalStorage` request context — **chưa được import/wire vào đâu** (dead code). Đừng dùng `RequestContextService`.
- **Services** (`shared/services/`): `HashingService` (bcrypt, salt 10), `TokenService` (sign/verify JWT HS256, kèm `uuid` claim), `IdempotencyService` (Redis response cache + lock, TTL 24h/30s/10s/200ms).
- **Repositories**: `BaseRepository<T>`.
- **Constants** (`shared/constant/`): `auth.constant.ts` (request/metadata keys), `permission.constant.ts` (`enum Permission` + `MANAGE_PERMISSIONS` + helpers), `customer/supplier/supplier-group/user.constant.ts` (enums status/type).
- **Helpers** (`shared/helpers.ts`): `isPostgresError`, `isUniqueConstraintError` (23505), `isForeignKeyConstraintError` (23503), `isNotNullConstraintError` (23502).
- **Utils** (`shared/utils.ts`): `generateUserCode()` (`FCVN_` + 7 ký tự), `generatePurchaseCode()` (`PO-YYYYMMDD` + 6 số).
- **Config** (`shared/config.ts`): load `.env` + validate bằng Zod; thiếu `.env` hoặc invalid → `process.exit(1)`.

## Database & Migrations

- `src/database/database.provider.ts`: postgres, `autoLoadEntities: true`, `synchronize: false` (hardcoded), `logging: true`, entities glob `src/**/*.entity.ts`.
- `src/database/datasource-cli.ts`: DataSource cho TypeORM CLI (`migrations: src/database/migrations/*.ts`).
- Migrations auto-generated (`AutoMigration<N>`), xem `src/database/migrations/`.
- Lưu ý: bảng gốc `users`, `roles`, `customers`, `refresh_tokens` **không** được tạo bởi migration nào (đã tồn tại từ trước).
- Xem thêm: [src/docs/migration.md](src/docs/migration.md).

## Environment Variables

Validate bởi `src/shared/config.ts` (bắt buộc, `z.string()`): `DB_DATABASE`, `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`, `DB_HOST`, `PORT`, `DB_USER`, `DB_PASSWORD`, `IDEMPOTENCY_KEY`.

Đọc trực tiếp từ `process.env` (KHÔNG validate): `DB_PORT` (default 5432), `REDIS_URL` (default `redis://localhost:6379`), `DB_ADMIN_PASSWORD_TEST` / `DB_SALES_PASSWORD_TEST` (seed script).

Lưu ý discrepancies:

1. README ghi `DB_USERNAME` nhưng code dùng **`DB_USER`** (đúng: `.env.example` dùng `DB_USER`).
2. `DB_SYNC` và `REDIS_TTL` xuất hiện trong `.env.example` nhưng **không được đọc** (`synchronize` hardcoded false).
3. `IDEMPOTENCY_KEY` bắt buộc trong config nhưng **thiếu** trong `.env.example` → copy `.env.example` sẽ fail validation.
4. Default DB name khác nhau: provider `'test'` vs datasource-cli/initScript `'nestjs_crm'`.

## Key Files

- `src/main.ts`, `src/app.module.ts` — bootstrap + global wiring.
- `src/shared/config.ts` — env validation (nguồn sự thật của env).
- `src/shared/entities/base.entity.ts` — base entity (audit + soft delete).
- `src/shared/repositories/base.repository.ts` — base repo (CRUD + pagination + soft delete).
- `src/modules/customers/*` — module chuẩn mẫu để copy pattern.
- `src/shared/guard/auth.guard.ts`, `src/shared/guard/permission.guard.ts` — auth/RBAC.
- `src/shared/constant/permission.constant.ts` — `Permission` enum + permission model.
- `src/database/database.provider.ts`, `datasource-cli.ts` — DB config.

## Gotchas

1. **422 chứ không phải 400** cho lỗi validation (CustomZodValidationPipe).
2. `BaseRepository.findAll` đổi return type theo options (array vs `{ data, meta }`).
3. `@Permissions` là **OR**; `*.manage` ngụ ý toàn bộ CRUD của module đó.
4. `AuthGuard` phải chạy trước `PermissionGuard`; nó populate `request['user']` + `request['role_permissions']` cho `@ActiveUser()` và `PermissionGuard`.

## Related Docs (link, không duplicate)

- [src/docs/migration.md](src/docs/migration.md) — quy trình migration TypeORM.
- [src/docs/setup-report.md](src/docs/setup-report.md) — các lỗi setup đã gặp + cách xử lý.
