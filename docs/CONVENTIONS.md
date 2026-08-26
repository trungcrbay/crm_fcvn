# Quy ước Code — CRM FCVN Backend

> Tài liệu tham chiếu bắt buộc đọc trước khi viết hoặc sửa bất kỳ file nào trong `src/`.
> Tổng quan kiến trúc xem thêm: [BE_ARCHITECTURE.md](BE_ARCHITECTURE.md), tóm tắt nhanh xem [AGENTS.md](../AGENTS.md).

---

## 0. Nguyên tắc chung

- **Mọi message/exception/API summary viết bằng tiếng Việt.**
- **Validation bằng Zod v4** qua `nestjs-zod` — **KHÔNG dùng** class-validator/class-transformer.
- **ORM là TypeORM + PostgreSQL** (`synchronize: false` — mọi thay đổi schema qua migration).
- URI versioning tự động (`/v1/...`) — controller **không** khai báo version.
- Mỗi feature module có đủ bộ file: `entity` → `model` → `dto` → `repository` → `service` → `controller` → `module`.
- Module chuẩn mẫu để copy pattern: `src/modules/customers/*` (CRUD) và `src/modules/purchase-request/*` (State Machine / Workflow).

---

## 1. Đặt tên file & thư mục

| Loại           | Convention                          | Ví dụ                              |
| -------------- | ----------------------------------- | ---------------------------------- |
| Thư mục module | `src/modules/<feature>/` kebab-case | `src/modules/purchase-request/`    |
| Entity         | `[feature].entity.ts`               | `purchase-request.entity.ts`       |
| Zod schema     | `[feature].model.ts`                | `purchase-request.model.ts`        |
| DTO class      | `[feature].dto.ts`                  | `purchase-request.dto.ts`          |
| Repository     | `[feature].repository.ts`           | `customers.repository.ts`          |
| Service        | `[feature].service.ts`              | `purchase-request.service.ts`      |
| Controller     | `[feature].controller.ts`           | `purchase-request.controller.ts`   |
| Module         | `[feature].module.ts`               | `purchase-request.module.ts`       |
| Unit test      | `[feature].service.spec.ts`         | `purchase-request.service.spec.ts` |

> ⚠️ Thư mục/controller/repository/service thường dùng **số nhiều** (`customers.*`, `departments.*`). Ngoại lệ có sẵn: `supplier` (số ít), `purchase-order`, `supplier-group`, `purchase-request`, `refresh-token`.

---

## 2. Đặt tên identifier

```typescript
// Class → PascalCase
export class CustomersService {}
export class GetCustomersResDTO {}

// Method / biến / tham số → camelCase
async findOne(id: number) {}
const updatedBy = userId;

// Enum → UPPER_SNAKE_CASE (giá trị lowercase hoặc uppercase theo domain)
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
- `@Entity('snake_case_plural')`:
  - `users`, `roles`, `departments`
  - `customers`
  - `suppliers`, `supplier_groups`
  - `purchase_orders`, `purchase_order_items`
  - `purchase_requests`, `purchase_request_items`, `purchase_request_histories`
  - `refresh_tokens`
- Column luôn khai báo **explicit** `@Column({ type, length, nullable })`.
- Unique khai **cả hai**: `@Index({ unique: true })` + `unique: true` trong `@Column`.
- FK dùng pattern: **scalar column** + **relation object**:
  ```typescript
  @Index()
  @Column({ type: 'int', nullable: true })
  departmentId?: number;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department?: Department;
  ```
- Enum lưu dạng **`varchar`** tham chiếu TS enum trong `src/shared/constant/*.constant.ts`:
  ```typescript
  @Column({ type: 'varchar', length: 30, enum: PurchaseRequestStatus, default: PurchaseRequestStatus.DRAFT })
  status: PurchaseRequestStatus;
  ```

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
  departmentId: z.coerce.number().int().positive().optional(),
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
export type CustomerType = z.infer<typeof CustomerSchema>;
export type GetCustomersResType = z.infer<typeof GetCustomersResSchema>;
export type GetCustomerQueryType = z.infer<typeof GetCustomersQuerySchema>;
export type CreateCustomerBodyType = z.infer<typeof CreateCustomerBodySchema>;
export type UpdateCustomerBodyType = z.infer<typeof UpdateCustomerBodySchema>;
```

**Quy tắc model:**

- Email luôn `.trim().toLowerCase()`.
- Message lỗi viết tiếng Việt (dùng `{ error: '...' }` cho field required).
- `UpdateXxxBodySchema = CreateXxxBodySchema.partial().strict()`.
- Query coerce: `z.coerce.number()` cho param số từ URL query string.

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
- Custom: `ChangeStatusXxxBodyDTO`, `RejectPurchaseRequestBodyDTO`, `LoginBodyDTO`, `LoginResDTO`, ...

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

  // Thêm method query phức tạp nếu cần
}
```

**Base `BaseRepository<T>`** (`src/shared/repositories/base.repository.ts`) cung cấp:

- `create(data)` → `Promise<T>`
- `findAll(options?)` → `T[]` **hoặc** `{ data, meta }` (khi có `page/limit/search/sortOrder/where`)
- `findOne(id)` → `T | null`
- `update(id, data)` → `T | null`
- `updateMany(ids, data)`, `findByIds(ids)`
- `remove(id, deletedById?)` — soft delete (khi có `deletedById` gán `deletedAt/deletedById`, ngược lại gọi `repository.softDelete`)

---

## 7. Service — file `.service.ts`

```typescript
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { CustomersRepository } from './customers.repository';
import { Customer } from './customer.entity';
import { CreateCustomerBodyDTO, UpdateCustomerBodyDTO } from './customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async create(dto: CreateCustomerBodyDTO, userId: number): Promise<Customer> {
    try {
      return await this.customersRepository.create({
        ...dto,
        email: dto.email?.trim().toLowerCase(),
        createdById: userId, // audit
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc email khách hàng đã tồn tại');
      }
      throw error;
    }
  }

  async findAll(query: GetCustomerQueryType) {
    return this.customersRepository.findAll(query);
  }

  async findOne(id: number): Promise<Customer> {
    const record = await this.customersRepository.findOne(id);
    if (!record) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    return record;
  }

  async update(id: number, dto: UpdateCustomerBodyDTO, userId: number) {
    await this.findOne(id);
    return this.customersRepository.update(id, { ...dto, updatedById: userId });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id);
    await this.customersRepository.remove(id, userId);
    return { message: 'Xóa khách hàng thành công' };
  }
}
```

---

## 8. Controller — file `.controller.ts` & Swagger Conventions

> ⚠️ **QUY TẮC QUAN TRỌNG VỀ SWAGGER & QUERY:**
> Tuyệt đối **KHÔNG** truyền class Zod DTO vào `@Query()` hoặc `@ApiQuery()` (như `@ApiQuery(PaginationQueryDTO)` hay `@Query() query: GetQueryDTO`). Việc này làm Swagger serialize các hàm nội bộ của Zod (`function () { [native code] }`) gây crash Swagger UI.
>
> - Phân trang: dùng `@ApiPaginationQuery()`.
> - Filters: dùng `@ApiQuery({ name: 'field', required: false, type: String/Number/enum })`.
> - Param query: dùng `@Query(new ZodValidationPipe(QuerySchema)) query: QueryType`.

```typescript
@SkipThrottle()
@Controller('customers')
@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_CREATE])
  @ApiOperation({ summary: 'Tạo khách hàng mới' })
  @ApiBody({ type: CreateCustomerBodyDTO })
  @ApiResponse({ status: 201, description: 'Tạo khách hàng thành công' })
  create(
    @Body() dto: CreateCustomerBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.customersService.create(dto, userId);
  }

  @Get()
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_READ])
  @ApiOperation({ summary: 'Lấy danh sách khách hàng' })
  @ApiPaginationQuery()
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ZodSerializerDto(GetCustomersResDTO)
  findAll(
    @Query(new ZodValidationPipe(GetCustomersQuerySchema))
    query: GetCustomerQueryType,
  ) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_READ])
  @ApiOperation({ summary: 'Xem chi tiết khách hàng' })
  @ApiParam({ name: 'id', description: 'ID khách hàng' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Put(':id')
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_UPDATE])
  @ApiOperation({ summary: 'Cập nhật thông tin khách hàng' })
  @ApiParam({ name: 'id', description: 'ID khách hàng' })
  @ApiBody({ type: UpdateCustomerBodyDTO })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.customersService.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_DELETE])
  @ApiOperation({ summary: 'Xóa khách hàng' })
  @ApiParam({ name: 'id', description: 'ID khách hàng' })
  @ZodSerializerDto(MessageResDTO)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ) {
    return this.customersService.remove(id, userId);
  }
}
```

---

## 9. Module — file `.module.ts`

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository],
  exports: [CustomersService, CustomersRepository],
})
export class CustomersModule {}
```

---

## 10. Xử lý lỗi & HTTP Exceptions

**Error shape chuẩn** (do `HttpExceptionFilter` — `src/shared/filter/http-exception.filter.ts`):

```jsonc
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Không tìm thấy khách hàng",
}
```

**Bảng chọn exception:**

| Tình huống                                      | Exception                      | Status  |
| ----------------------------------------------- | ------------------------------ | ------- |
| Validation body/query (CustomZodValidationPipe) | `UnprocessableEntityException` | **422** |
| Lỗi Zod schema (nghiệp vụ)                      | `ZodError` → filter chuyển     | 400     |
| Thiếu record                                    | `NotFoundException`            | 404     |
| Duplicate unique                                | `ConflictException`            | 409     |
| Chưa đăng nhập / Token không hợp lệ             | `UnauthorizedException`        | 401     |
| Không đủ quyền                                  | `ForbiddenException`           | 403     |

---

## 11. Auth & RBAC

- `AuthGuard` (**global** `APP_GUARD`): xác thực JWT; route public dùng `@Public()`. Populate `request['user']` (payload) + `request['role_permissions']` (`Permission[]`).
- `ThrottlerGuard` (**global** `APP_GUARD`): Giới hạn tần suất gọi API (mặc định 5 req/phút). Controller CRUD dùng `@SkipThrottle()`.
- `PermissionGuard` (per-controller `@UseGuards`): RBAC từ `@Permissions([...])`, OR-based, `*.manage` ngụ ý CRUD (xem `MANAGE_PERMISSIONS` trong `src/shared/constant/permission.constant.ts`).
- `@ActiveUser('field')`: `@ActiveUser('userId')`, `@ActiveUser('departmentId')`.
- `@ActiveUserPermissions()`: Lấy danh sách permission của user hiện tại.

---

## 12. Các Gotchas & Lưu ý quan trọng

1. **422 chứ không phải 400** cho lỗi validation (`CustomZodValidationPipe`).
2. `BaseRepository.findAll` đổi return type: plain array (không options) vs `{ data, meta }` (có options).
3. `@Permissions` là **OR**; `*.manage` ngụ ý toàn bộ CRUD module đó.
4. `AuthGuard` chạy trước `PermissionGuard`, populate `request['user']` + `request['role_permissions']`.
5. **Swagger UI Syntax Error:** Không truyền class DTO vào `@Query()` hoặc `@ApiQuery()`. Luôn dùng `@ApiPaginationQuery()` và `@Query(new ZodValidationPipe(Schema)) query: Type`.
6. **Docker Port Mapping:** Port ngoài Host là `8000`, forward vào port `3000` của container NestJS (`0.0.0.0:8000 -> 3000`).
7. `RequestContextModule`/`RequestContextService` là dead code — đừng dùng.
8. Config env nghiêm ngặt — thiếu/invalid → `process.exit(1)`.
9. Mọi message/exception/summary hướng người dùng viết bằng **tiếng Việt**.

---

## Related Docs

- [BE_ARCHITECTURE.md](BE_ARCHITECTURE.md) — tài liệu kiến trúc tổng thể.
- [AGENTS.md](../AGENTS.md) — tổng quan ngắn + commands + gotchas.
- [migration.md](migration.md) — quy trình migration TypeORM.
- [README.md](../README.md) — hướng dẫn khởi chạy nhanh Docker và xử lý edge cases.
