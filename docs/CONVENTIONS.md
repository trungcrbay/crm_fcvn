# Quy ước Code — CRM FCVN Backend

> Tài liệu tham chiếu bắt buộc đọc trước khi viết hoặc sửa bất kỳ file nào trong `src/`.
> Tổng quan kiến trúc xem thêm: [AGENTS.md](../AGENTS.md).

---

## 0. Nguyên tắc chung

- **Mọi message/exception/API summary viết bằng tiếng Việt.**
- **Validation bằng Zod v4** qua `nestjs-zod` — **KHÔNG dùng** class-validator/class-transformer.
- **ORM là TypeORM + PostgreSQL** (`synchronize: false` — mọi thay đổi schema qua migration).
- URI versioning tự động (`/v1/...`) — controller **không** khai báo version.
- Mỗi feature module có đủ bộ file: `entity` → `model` → `dto` → `repository` → `service` → `controller` → `module`.
- Module chuẩn mẫu để copy pattern: `src/modules/customers/*`.

---

## 1. Đặt tên file & thư mục

| Loại           | Convention                          | Ví dụ                         |
| -------------- | ----------------------------------- | ----------------------------- |
| Thư mục module | `src/modules/<feature>/` kebab-case | `src/modules/supplier-group/` |
| Entity         | `[feature].entity.ts`               | `customer.entity.ts`          |
| Zod schema     | `[feature].model.ts`                | `customer.model.ts`           |
| DTO class      | `[feature].dto.ts`                  | `customer.dto.ts`             |
| Repository     | `[feature].repository.ts`           | `customers.repository.ts`     |
| Service        | `[feature].service.ts`              | `customers.service.ts`        |
| Controller     | `[feature].controller.ts`           | `customers.controller.ts`     |
| Module         | `[feature].module.ts`               | `customers.module.ts`         |
| Unit test      | `[feature].service.spec.ts`         | `customers.service.spec.ts`   |

> ⚠️ Nếu module có entity số ít (`Customer`) thì thư mục/controller/repository/service thường dùng **số nhiều** (`customers.*`). Ngoại lệ có sẵn: `supplier` (số ít), `purchase-order`, `supplier-group`, `refresh-token`.

---

## 2. Đặt tên identifier

```typescript
// Class → PascalCase
export class CustomersService {}
export class GetCustomersResDTO {}

// Method / biến / tham số → camelCase
async findOne(id: string) {}
const updatedBy = userId;

// Enum → UPPER_SNAKE_CASE (giá trị lowercase theo {resource}.{action})
export enum Permission {
  CUSTOMER_READ = 'customer.read',
  CUSTOMER_CREATE = 'customer.create',
}

// Zod Schema → PascalCase + "Schema"
export const CreateCustomerBodySchema = z.object({ ... });

// Zod inferred Type → PascalCase + "Type"
export type CreateCustomerBodyType = z.infer<typeof CreateCustomerBodySchema>;

// DTO class → PascalCase + "DTO"
export class CreateCustomerBodyDTO extends createZodDto(CreateCustomerBodySchema) {}
```

---

## 3. Entity — file `.entity.ts`

```typescript
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('customers') // snake_case số nhiều
export class Customer extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  customerCode: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;
}
```

**Quy tắc entity:**

- Mọi entity `extends BaseEntity` (`src/shared/entities/base.entity.ts`) — tự có audit + soft delete:
  `createdAt/createdById/createdBy`, `updatedAt/updatedById/updatedBy`, `deletedAt/deletedById/deletedBy`.
- `BaseEntity` **không** định nghĩa `id` — entity tự khai `@PrimaryGeneratedColumn('increment') id`.
- `@Entity('snake_case_plural')`: `customers`, `users`, `roles`, `suppliers`, `supplier_groups`, `purchase_orders`, `purchase_order_items`, `refresh_tokens`.
- Column luôn khai báo **explicit** `@Column({ type, length, nullable })`.
- Unique khai **cả hai**: `@Index({ unique: true })` + `unique: true` trong `@Column`.
- FK dùng pattern: **scalar column** + **relation object**:
  ```typescript
  @Index()
  @Column({ type: 'int', nullable: true })
  supplierGroupId?: number;

  @ManyToOne(() => SupplierGroup, (g) => g.suppliers, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplierGroupId' })
  supplierGroup?: SupplierGroup;
  ```
- Chiều ngược: `@OneToMany(() => Supplier, (s) => s.supplierGroup)`.
- Enum lưu dạng **`varchar`** tham chiếu TS enum trong `src/shared/constant/*.constant.ts`:
  ```typescript
  @Column({ type: 'varchar', length: 20, enum: SupplierStatus, default: SupplierStatus.ACTIVE })
  status: SupplierStatus;
  ```

> ⚠️ Quirk có sẵn (đừng nhân rộng): `Customer.entity.ts` / `Role.entity.ts` khai `id: string` nhưng dùng `@PrimaryGeneratedColumn('increment')` — lẽ ra là `number`.

---

## 4. Model — file `.model.ts` (Zod schema)

> **Quy tắc vàng:** `.model.ts` là nguồn sự thật của contract API. DTO chỉ là wrapper. KHÔNG có class trong file này.

```typescript
import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';
import { z } from 'zod';

// ── Schema cơ bản (shape của entity khi trả về)
export const CustomerSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  phone: z.string().min(9).max(15),
  address: z.string().max(500),
  customerCode: z.string().min(1).max(50),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ── Response list: { data: [], meta: PaginationResSchema }
export const GetCustomersResSchema = z.object({
  data: z.array(CustomerSchema),
  meta: PaginationResSchema,
});

// ── Query: mở rộng SharedQuerySchema (page/limit/search/sortOrder/where)
export const GetCustomersQuerySchema = SharedQuerySchema.extend({
  name: z.string().optional(),
  email: z.string().optional(),
  roleId: z.coerce.number().int().positive().optional(), // coerce query string → number
});

// ── Body tạo mới: .strict() — không cho field lạ
export const CreateCustomerBodySchema = z
  .object({
    email: z
      .string({ error: 'Email không được để trống' })
      .trim()
      .toLowerCase()
      .email('Email không hợp lệ'),
    name: z
      .string({ error: 'Tên khách hàng không được để trống' })
      .trim()
      .min(1)
      .max(100),
    phone: z
      .string({ error: 'Số điện thoại không được để trống' })
      .trim()
      .regex(/^(0|\+84|84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ'),
    address: z.string().trim().max(500),
    customerCode: z
      .string({ error: 'Mã khách hàng không được để trống' })
      .trim()
      .min(1)
      .max(50),
  })
  .strict();

// ── Body cập nhật: partial + strict
export const UpdateCustomerBodySchema =
  CreateCustomerBodySchema.partial().strict();

// ── Luôn export Type kèm Schema
export type GetCustomersResType = z.infer<typeof GetCustomersResSchema>;
export type GetCustomerQueryType = z.infer<typeof GetCustomersQuerySchema>;
export type CreateCustomerBodyType = z.infer<typeof CreateCustomerBodySchema>;
export type UpdateCustomerBodyType = z.infer<typeof UpdateCustomerBodySchema>;
```

**Quy tắc model:**

- Email luôn `.trim().toLowerCase()`.
- Message lỗi viết tiếng Việt (dùng `{ error: '...' }` cho field required).
- `UpdateXxxBodySchema = CreateXxxBodySchema.partial().strict()`.
- Query coerce: `z.coerce.number()` cho param từ URL.

---

## 5. DTO — file `.dto.ts`

```typescript
// Chỉ import schema từ .model.ts, wrap bằng createZodDto — KHÔNG có logic
import { createZodDto } from 'nestjs-zod';
import {
  CreateCustomerBodySchema,
  GetCustomersQuerySchema,
  GetCustomersResSchema,
  UpdateCustomerBodySchema,
} from './customer.model';

export class GetCustomersResDTO extends createZodDto(GetCustomersResSchema) {}
export class GetCustomersQueryDTO extends createZodDto(
  GetCustomersQuerySchema,
) {}
export class CreateCustomerBodyDTO extends createZodDto(
  CreateCustomerBodySchema,
) {}
export class UpdateCustomerBodyDTO extends createZodDto(
  UpdateCustomerBodySchema,
) {}
```

**Naming convention DTO:**

- Body: `CreateXxxBodyDTO`, `UpdateXxxBodyDTO`
- Query: `GetXxxQueryDTO`
- Response list: `GetXxxResDTO`
- Ack/delete: dùng chung `MessageResDTO` (`src/shared/dto/response.dto.ts`)
- Custom: `ChangeStatusXxxBodyDTO`, `AssignSuppliersToGroupBodyDTO`, `LoginBodyDTO`, `LoginResDTO`, ...

DTO dùng chung trong `src/shared/dto/`: `PaginationQueryDTO`, `EmptyBodyDTO`, `MessageResDTO`.

---

## 6. Repository — file `.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { Customer } from './customer.entity';

@Injectable()
export class CustomersRepository extends BaseRepository<Customer> {
  constructor(@InjectRepository(Customer) repository: Repository<Customer>) {
    super(repository);
  }

  // Thêm method query riêng ở đây (vd UsersRepository.findUniqueIncludeRolePermissions)
}
```

**Base `BaseRepository<T>`** (`src/shared/repositories/base.repository.ts`) cung cấp:

- `create(data)` → `Promise<T>`
- `findAll(options?)` → `T[]` **hoặc** `{ data, meta }` (khi có `page/limit/search/sortOrder/where`)
- `findOne(id)` → `T | null`
- `update(id, data)` → `T | null`
- `updateMany(ids, data)`, `findByIds(ids)`
- `remove(id, deletedById?)` — soft delete (khi có `deletedById` gán `deletedAt/deletedById`, ngược lại gọi `repository.softDelete`)

**Quy tắc repository:**

- Subclass mỏng, KHÔNG chứa logic nghiệp vụ — chỉ thêm method query nếu cần.
- `findOne` trả `null` — repo không throw; service tự quyết định.
- Ngoại lệ có sẵn (đừng copy nếu không cần): `auth.repository.ts` không extend `BaseRepository`; `purchase-order.service.ts` dùng `DataSource.transaction()` trực tiếp.

---

## 7. Service — file `.service.ts`

```typescript
import { ConflictException, Injectable } from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { CustomersRepository } from './customers.repository';
import { Customer } from './customer.entity';
import { CreateCustomerBodyDTO, UpdateCustomerBodyDTO } from './customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async create(
    createCustomerDto: CreateCustomerBodyDTO,
    userId: number,
  ): Promise<Customer> {
    const { customerCode, name, email, phone, address } = createCustomerDto;
    try {
      return await this.customersRepository.create({
        customerCode: customerCode?.trim(),
        name: name?.trim(),
        email: email?.trim().toLowerCase(),
        phone: phone?.trim(),
        address: address?.trim(),
        createdById: userId, // audit
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc email khách hàng đã tồn tại');
      }
      throw error;
    }
  }

  async findAll(query: PaginationQueryType = { page: 1, limit: 10 }) {
    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortOrder: query.sortOrder,
    };
    return this.customersRepository.findAll(options);
  }

  async findOne(id: string): Promise<Customer | null> {
    return this.customersRepository.findOne(id);
  }

  async update(id: string, dto: UpdateCustomerBodyDTO, userId: number) {
    return this.customersRepository.update(id, { ...dto, updatedById: userId });
  }

  async remove(id: string, userId: number) {
    await this.customersRepository.remove(id, userId);
    return { message: 'Xóa khách hàng thành công' };
  }
}
```

**Quy tắc service:**

- Method chuẩn: `create`, `findAll`, `findOne`, `update`, `remove` (+ domain: `deactivate`, `changeStatus`, `assignSuppliers`, `login`, `refreshToken`, `logout`).
- `create(dto, userId)` / `update(id, dto, userId)` set `createdById`/`updatedById`; trim + `toLowerCase()` email.
- `remove` trả `{ message: 'Xóa ... thành công' }`.
- Bắt lỗi DB bằng helper `src/shared/helpers.ts`:
  - `isUniqueConstraintError` (23505) → `ConflictException('... đã tồn tại')`
  - `isForeignKeyConstraintError` (23503), `isNotNullConstraintError` (23502)
- `NotFoundException('Không tìm thấy ...')` khi thiếu record.

---

## 8. Controller — file `.controller.ts`

```typescript
@Controller('customers')
@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_CREATE])
  @ApiOperation({ summary: 'Tạo khách hàng mới' })
  create(
    @Body() dto: CreateCustomerBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.customersService.create(dto, userId);
  }

  @Get()
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_READ])
  @ZodSerializerDto(GetCustomersResDTO)
  @ApiPaginationQuery()
  findAll(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: PaginationQueryType,
  ) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_READ])
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Put(':id')
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_UPDATE])
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.customersService.update(id, dto, userId);
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_DELETE])
  remove(@Param('id') id: string, @ActiveUser('userId') userId: number) {
    return this.customersService.remove(id, userId);
  }
}
```

**Quy tắc controller:**

- KHÔNG logic nghiệp vụ — chỉ extract param, gọi service.
- Route prefix kebab-case số nhiều (`customers`, `supplier-group`, `purchase-order`); ngoại lệ `supplier` số ít.
- Class decorator: `@ApiTags`, `@ApiBearerAuth`, `@UseGuards(PermissionGuard)`. Auth controller (login/refresh/logout) dùng `@Public()` — không cần guard.
- Mỗi handler: `@Permissions([...])` — **OR semantics**, `*.manage` ngụ ý toàn bộ CRUD.
- Param decorators: `@Body() dto`, `@Query(new ZodValidationPipe(PaginationQuerySchema))`, `@Param('id') id: string`, `@ActiveUser('userId') userId: number`.
- Response: `@ZodSerializerDto(GetXxxResDTO)` cho list, `@ZodSerializerDto(MessageResDTO)` cho delete.
- Swagger: `@ApiOperation({ summary: '...' })` (tiếng Việt) + `@ApiBody`, `@ApiCreatedResponse`, `@ApiResponse`, `@ApiNotFoundResponse`, `@ApiConflictResponse`, `@ApiForbiddenResponse`, `@ApiParam`, `@ApiPaginationQuery()`.

---

## 9. Module — file `.module.ts`

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository],
  exports: [CustomersService, CustomersRepository], // export nếu module khác cần
})
export class CustomersModule {}
```

**Quy tắc module:**

- Import `TypeOrmModule.forFeature([...entities])` cho các entity của module.
- Exports: `UsersModule`, `RolesModule`, `CustomersModule` export service + repository.
- Không có layering chặt — module khác có thể tự `forFeature` lại entity thay vì import module (vd `AuthModule` import `forFeature([User, RefreshToken])`).

---

## 10. Xử lý lỗi & HTTP

**Error shape chuẩn** (do `HttpExceptionFilter` — `src/shared/filter/http-exception.filter.ts`):

```jsonc
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Không tìm thấy khách hàng",
}
// message có thể là string | string[]
```

**Bảng chọn exception:**

| Tình huống                                      | Exception                      | Status  |
| ----------------------------------------------- | ------------------------------ | ------- |
| Validation body/query (CustomZodValidationPipe) | `UnprocessableEntityException` | **422** |
| Lỗi Zod schema (nghiệp vụ)                      | `ZodError` → filter chuyển     | 400     |
| Thiếu record                                    | `NotFoundException`            | 404     |
| Duplicate unique                                | `ConflictException`            | 409     |
| Chưa đăng nhập                                  | `UnauthorizedException`        | 401     |
| Không đủ quyền                                  | `ForbiddenException`           | 403     |

> ⚠️ **422 chứ không phải 400** cho lỗi validation (`CustomZodValidationPipe`). Message là mảng issues có `path` flatten thành `"items.0.price"`.

---

## 11. Auth & RBAC

- `AuthGuard` (**global** `APP_GUARD`): xác thực JWT; route public dùng `@Public()`. Populate `request['user']` (payload) + `request['role_permissions']` (`Permission[]`).
- `PermissionGuard` (per-controller `@UseGuards`): RBAC từ `@Permissions([...])`, OR-based, `*.manage` ngụ ý CRUD (xem `MANAGE_PERMISSIONS` trong `src/shared/constant/permission.constant.ts`).
- `@ActiveUser('field')` lấy dữ liệu từ token payload (`userId`, ...).

```typescript
@Public() // cho auth module
@Post('login')
login(@Body() dto: LoginBodyDTO) { ... }
```

---

## 12. Pagination & Response shape

**Query:** `SharedQuerySchema` (`src/shared/model/query.model.ts`) — `page` (default 1), `limit` (default 10), `search`, `sortOrder` ('ASC'|'DESC' default 'ASC'), `where`. Dùng chung `PaginationQuerySchema` (`src/shared/model/request.model.ts`) cho endpoint không cần filter.

**Response:** mọi response được `TransformInterceptor` bọc:

- Thường: `{ data, statusCode }`
- Phân trang (payload có `data` là array + `meta`): `{ data, meta, statusCode }`

`meta` = `PaginationResSchema` (`total`, `page`, `limit`, `totalPages`).

---

## 13. Import path

```typescript
// ✅ Absolute path — dùng 'src/' prefix
import { Permission } from 'src/shared/constant/permission.constant';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { isUniqueConstraintError } from 'src/shared/helpers';

// ✅ Relative path được dùng trong cùng module (một số file hiện tại)
import { BaseRepository } from '../../shared/repositories/base.repository';

// ✅ External
import { z } from 'zod';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';
```

> Cả hai style `src/...` và relative đều tồn tại trong codebase hiện tại; ưu tiên `src/...` cho cross-module/shared.

---

## 14. Các gotchas

1. **422** cho lỗi validation, không phải 400.
2. `BaseRepository.findAll` đổi return type: array (không options) vs `{ data, meta }` (có options).
3. `@Permissions` là **OR**; `*.manage` ngụ ý toàn bộ CRUD module đó.
4. `AuthGuard` chạy trước `PermissionGuard`, populate `request['user']` + `request['role_permissions']`.
5. `RequestContextModule`/`RequestContextService` là dead code — đừng dùng.
7. Config env nghiêm ngặt — thiếu/invalid (gồm `IDEMPOTENCY_KEY`) → `process.exit(1)`.
8. Mọi message/exception/summary hướng người dùng viết bằng **tiếng Việt**.
9. `Customer`/`Role` khai `id: string` với `@PrimaryGeneratedColumn('increment')` — quirk, đừng nhân rộng (nên dùng `number`).
10. `typeorm` trong `package.json` ghi `"^1.1.0"` (bất thường — thực tế 0.3.x).

---

## Related Docs

- [AGENTS.md](../AGENTS.md) — tổng quan kiến trúc + commands + gotchas.
- [migration.md](migration.md) — quy trình migration TypeORM.
- [setup-report.md](setup-report.md) — các lỗi setup đã gặp + cách xử lý.
