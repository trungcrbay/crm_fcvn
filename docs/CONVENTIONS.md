# Quy ước Code — CRM FCVN Backend

> Tài liệu tham chiếu bắt buộc đọc trước khi viết hoặc sửa bất kỳ file nào trong `src/`.
> Tổng quan kiến trúc xem thêm: [BE_ARCHITECTURE.md](BE_ARCHITECTURE.md), tóm tắt nhanh xem [AGENTS.md](../AGENTS.md).

---

## 0. Nguyên tắc chung

- **Mọi message / exception / API summary / description đều viết bằng tiếng Việt.**
- **Validation bằng Zod v4** qua `nestjs-zod` — **KHÔNG dùng** `class-validator` / `class-transformer`.
- **ORM là TypeORM + PostgreSQL** (`synchronize: false` — mọi thay đổi schema bắt buộc qua migration).
- **URI versioning tự động** (`/v1/...`) do `main.ts` cấu hình — controller **không** tự khai báo version.
- Mỗi feature module có đủ bộ file: `entity` → `model` → `dto` → `repository` → `service` → `controller` → `module`.
- **Module chuẩn mẫu:**
  - CRUD chuẩn + Soft delete: `src/modules/customers/*`
  - State Machine & Workflow phê duyệt: `src/modules/purchase-request/*`
  - Database Transaction & Idempotency chống duplicate: `src/modules/purchase-order/*`

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

> ⚠️ Thư mục / controller / repository / service:
>
> - Tên route controller luôn là **kebab-case số nhiều**: `@Controller('customers')`, `@Controller('departments')`, `@Controller('suppliers')`, `@Controller('supplier-groups')`, `@Controller('purchase-orders')`, `@Controller('purchase-requests')`, `@Controller('users')`, `@Controller('roles')`.
> - Ngoại lệ route đơn lẻ: `@Controller('auth')`, `@Controller('profile')`.
> - Tên thư mục: `supplier` (số ít), `supplier-group`, `purchase-order`, `purchase-order-item`, `purchase-request`, `refresh-token`.

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
  CUSTOMER_UPDATE = 'customer.update',
  CUSTOMER_DELETE = 'customer.delete',
  CUSTOMER_MANAGE = 'customer.manage',
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

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;
}
```

**Quy tắc entity:**

- Mọi entity `extends BaseEntity` (`src/shared/entities/base.entity.ts`) — tự có audit trail + soft delete:
  `createdAt/createdById/createdBy`, `updatedAt/updatedById/updatedBy`, `deletedAt/deletedById/deletedBy`.
- `BaseEntity` **không** định nghĩa `id` — mỗi entity tự khai `@PrimaryGeneratedColumn('increment') id: number`.
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
  @Column({
    type: 'varchar',
    length: 30,
    enum: PurchaseRequestStatus,
    default: PurchaseRequestStatus.DRAFT,
  })
  status: PurchaseRequestStatus;
  ```

---

## 4. Model — file `.model.ts` (Zod schema)

> **Quy tắc vàng:** `.model.ts` là nguồn sự thật duy nhất của contract dữ liệu. DTO chỉ là wrapper mỏng. **KHÔNG** khai báo class trong file này.

```typescript
import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';
import { z } from 'zod';

// ── Schema cơ bản (shape của entity khi serialize trả về)
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
});

// ── Body tạo mới: .strict() — chặn field lạ
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
      .min(1, 'Tên khách hàng không được để trống')
      .max(100, 'Tên khách hàng không được vượt quá 100 ký tự'),
    phone: z
      .string({ error: 'Số điện thoại không được để trống' })
      .trim()
      .regex(/^(0|\+84|84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ'),
    address: z
      .string({ error: 'Địa chỉ không được để trống' })
      .trim()
      .max(500, 'Địa chỉ không được vượt quá 500 ký tự'),
    customerCode: z
      .string({ error: 'Mã khách hàng không được để trống' })
      .trim()
      .min(1, 'Mã khách hàng không được để trống')
      .max(50, 'Mã khách hàng không được vượt quá 50 ký tự'),
  })
  .strict();

// ── Body cập nhật: partial + strict
export const UpdateCustomerBodySchema =
  CreateCustomerBodySchema.partial().strict();

// ── Luôn export Type kèm Schema qua z.infer
export type CustomerType = z.infer<typeof CustomerSchema>;
export type GetCustomersResType = z.infer<typeof GetCustomersResSchema>;
export type GetCustomerQueryType = z.infer<typeof GetCustomersQuerySchema>;
export type CreateCustomerBodyType = z.infer<typeof CreateCustomerBodySchema>;
export type UpdateCustomerBodyType = z.infer<typeof UpdateCustomerBodySchema>;
```

**Quy tắc model:**

- Email luôn `.trim().toLowerCase()`.
- Message lỗi viết tiếng Việt rõ ràng, dùng cú pháp `{ error: '...' }` cho trường bắt buộc.
- Body cập nhật: `UpdateXxxBodySchema = CreateXxxBodySchema.partial().strict()`.
- Query số từ URL: Dùng `z.coerce.number().int().positive().optional()`.

---

## 5. DTO — file `.dto.ts`

```typescript
// Chỉ import schema từ .model.ts, bọc bằng createZodDto — KHÔNG thêm logic
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
- Response list: `GetXxxResDTO`; chi tiết: `XxxResDTO`
- Ack/Delete: Tái sử dụng `MessageResDTO` (`src/shared/dto/response.dto.ts`)
- Custom: `ChangeStatusXxxBodyDTO`, `AssignSuppliersToGroupBodyDTO`, `RejectPurchaseRequestBodyDTO`, `LoginBodyDTO`, `LoginResDTO`

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

  // Khai báo thêm custom query method phức tạp nếu cần
}
```

**Base `BaseRepository<T>`** (`src/shared/repositories/base.repository.ts`) cung cấp:

- `create(data: DeepPartial<T>)` → `Promise<T>`
- `findAll(options?: QueryOptions)` → `Promise<T[] | PaginatedResult<T>>`
  - Nếu không có option nào: trả về plain array `T[]`.
  - Nếu có `page`, `limit`, `search`, `sortOrder`, hoặc `where`: trả về `{ data: T[], meta: PaginationMeta }`.
- `findOne(id: EntityId, relations?: FindOptionsRelations<T>)` → `Promise<T | null>`
- `update(id: EntityId, data: DeepPartial<T>)` → `Promise<T | null>`
- `updateMany(ids: EntityId[], data: DeepPartial<T>)` → `Promise<T[]>`
- `findByIds(ids: EntityId[])` → `Promise<T[]>`
- `remove(id: EntityId, deletedById?: EntityId)` → `Promise<void>`
  - Soft delete: Gán `deletedAt = new Date()`, `deletedById` khi có tham số; nếu không có thì gọi `repository.softDelete(id)`.

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
import { GetCustomerQueryType } from './customer.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async create(dto: CreateCustomerBodyDTO, userId: number): Promise<Customer> {
    try {
      return await this.customersRepository.create({
        ...dto,
        customerCode: dto.customerCode?.trim(),
        name: dto.name?.trim(),
        email: dto.email?.trim().toLowerCase(),
        phone: dto.phone?.trim(),
        address: dto.address?.trim(),
        createdById: userId, // Audit log
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc email khách hàng đã tồn tại');
      }
      throw error;
    }
  }

  async findAll(
    query: GetCustomerQueryType,
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    return this.customersRepository.findAll(query);
  }

  async findOne(id: number): Promise<Customer> {
    const record = await this.customersRepository.findOne(id);
    if (!record) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    return record;
  }

  async update(
    id: number,
    dto: UpdateCustomerBodyDTO,
    userId: number,
  ): Promise<Customer | null> {
    await this.findOne(id);
    return this.customersRepository.update(id, {
      ...dto,
      updatedById: userId,
    });
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.customersRepository.remove(id, userId);
    return { message: 'Xóa khách hàng thành công' };
  }
}
```

---

## 8. Controller — file `.controller.ts` & Swagger Conventions

> ⚠️ **QUY TẮC QUAN TRỌNG VỀ SWAGGER & QUERY:**
> Tuyệt đối **KHÔNG** truyền class Zod DTO vào `@Query()` hoặc `@ApiQuery()` (như `@ApiQuery(PaginationQueryDTO)` hay `@Query() query: GetCustomersQueryDTO`).
> Việc này khiến Swagger cố serialize các prototype functions của Zod (`function () { [native code] }`) vào file `swagger-ui-init.js`, gây crash Swagger UI toàn bộ ứng dụng.
>
> - **Phân trang:** dùng decorator gộp `@ApiPaginationQuery()`.
> - **Filter riêng:** dùng `@ApiQuery({ name: 'field', required: false, type: String/Number/enum })`.
> - **Param Query:** dùng `@Query(new ZodValidationPipe(QuerySchema)) query: QueryType` (luôn dùng TS type từ `z.infer`).

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import { Permission } from 'src/shared/constant/permission.constant';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { ApiPaginationQuery } from 'src/shared/decorator/api-query.decorator';
import { MessageResDTO } from 'src/shared/dto/response.dto';
import { PaginatedResult } from 'src/shared/repositories/base.repository';

import { CustomersService } from './customers.service';
import { Customer } from './customer.entity';
import {
  CreateCustomerBodyDTO,
  GetCustomersResDTO,
  UpdateCustomerBodyDTO,
} from './customer.dto';
import {
  GetCustomersQuerySchema,
  type GetCustomerQueryType,
} from './customer.model';

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
  @ApiCreatedResponse({
    description: 'Tạo mới khách hàng thành công.',
    type: Customer,
  })
  create(
    @Body() dto: CreateCustomerBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<Customer> {
    return this.customersService.create(dto, userId);
  }

  @Get()
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_READ])
  @ZodSerializerDto(GetCustomersResDTO)
  @ApiOperation({ summary: 'Lấy danh sách khách hàng' })
  @ApiPaginationQuery()
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách khách hàng thành công.',
    type: Customer,
    isArray: true,
  })
  findAll(
    @Query(new ZodValidationPipe(GetCustomersQuerySchema))
    query: GetCustomerQueryType,
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_READ])
  @ApiOperation({ summary: 'Lấy thông tin khách hàng' })
  @ApiParam({ name: 'id', description: 'ID của khách hàng', example: '12' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Customer | null> {
    return this.customersService.findOne(id);
  }

  @Put(':id')
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_UPDATE])
  @ApiOperation({ summary: 'Cập nhật thông tin khách hàng' })
  @ApiParam({ name: 'id', description: 'ID của khách hàng', example: '12' })
  @ApiBody({ type: UpdateCustomerBodyDTO })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<Customer | null> {
    return this.customersService.update(id, dto, userId);
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_DELETE])
  @ApiOperation({ summary: 'Xóa khách hàng' })
  @ApiParam({ name: 'id', description: 'ID của khách hàng', example: '12' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ): Promise<{ message: string }> {
    return this.customersService.remove(id, userId);
  }
}
```

---

## 9. Module — file `.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  controllers: [CustomersController],
  providers: [CustomersRepository, CustomersService],
  exports: [CustomersService, CustomersRepository],
})
export class CustomersModule {}
```

---

## 10. Xử lý lỗi & HTTP Exceptions

**Error shape chuẩn hóa** (do `HttpExceptionFilter` — `src/shared/filter/http-exception.filter.ts`):

```jsonc
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Không tìm thấy khách hàng",
}
```

Đối với lỗi validation đầu vào (status 422):

```jsonc
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": [
    {
      "field": "items.0.price",
      "message": "Đơn giá phải lớn hơn hoặc bằng 0",
    },
  ],
}
```

**Bảng chọn exception:**

| Tình huống                                          | Exception                      | Status  |
| --------------------------------------------------- | ------------------------------ | ------- |
| Validation body / query (`CustomZodValidationPipe`) | `UnprocessableEntityException` | **422** |
| Zod validation độc lập                              | `ZodError` → filter chuyển     | 400     |
| Bản ghi không tồn tại                               | `NotFoundException`            | 404     |
| Vi phạm unique constraint / conflict logic          | `ConflictException`            | 409     |
| Chưa đăng nhập / Token không hợp lệ hoặc hết hạn    | `UnauthorizedException`        | 401     |
| Không đủ quyền thực hiện hành động                  | `ForbiddenException`           | 403     |
| Lỗi serialize Zod schema                            | `ZodSerializationException`    | 500     |

---

## 11. Auth & RBAC

- **`AuthGuard`** (global `APP_GUARD`):
  - Xác thực Bearer JWT token; route công khai dùng decorator `@Public()`.
  - Giải mã token → đọc `roleId` → lấy quyền từ Redis cache (`CACHE_TTL_ROLE_PERMISSIONS = 5 phút`) hoặc nạp từ DB fallback nếu cache miss.
  - Gán `request[REQUEST_USER_KEY]` (payload) và `request[REQUEST_ROLE_PERMISSIONS]` (`Permission[]`).
- **`ThrottlerGuard`** (global `APP_GUARD`):
  - Giới hạn tần suất 5 req/60s. Các controller nghiệp vụ CRUD khai báo `@SkipThrottle()` để bypass.
- **`PermissionGuard`** (per-controller `@UseGuards(PermissionGuard)`):
  - Kiểm tra quyền từ `@Permissions([...])` theo ngữ nghĩa **OR**.
  - Quyền `*.manage` ngụ ý toàn bộ action con (định nghĩa tại `MANAGE_PERMISSIONS` trong `permission.constant.ts`).
- **Decorators tiện ích:**
  - `@ActiveUser('userId')`: Lấy trực tiếp ID người dùng đăng nhập.
  - `@ActiveUser('departmentId')`: Lấy ID phòng ban của người dùng đăng nhập.
  - `@ActiveUserPermissions()`: Lấy toàn bộ mảng `Permission[]` của user.

---

## 12. Danh sách Gotchas & Lưu ý quan trọng

1. **422 chứ không phải 400** cho lỗi validation (`CustomZodValidationPipe` ném `UnprocessableEntityException`).
2. `BaseRepository.findAll` thay đổi kiểu dữ liệu trả về:
   - Không truyền options → trả plain array `T[]`.
   - Có options (`page`, `limit`, `search`, `sortOrder`, `where`) → trả `{ data: T[], meta: PaginationMeta }`.
3. `@Permissions` mang ngữ nghĩa **OR**; `*.manage` bao hàm toàn bộ thao tác CRUD của module.
4. `AuthGuard` luôn chạy trước `PermissionGuard` và nạp thông tin user/permissions vào request.
5. **Swagger UI Syntax Error:** Tuyệt đối không truyền class DTO vào `@Query()` hoặc `@ApiQuery()`. Luôn dùng `@ApiPaginationQuery()` cho phân trang và `@Query(new ZodValidationPipe(Schema)) query: Type`.
6. **Docker Port Mapping:** Port bên ngoài Host là `8000`, forward vào port `3000` của container (`0.0.0.0:8000 -> 3000`).
7. Không có module/service `RequestContext` — không tham chiếu dead code.
8. File `.env` được validate nghiêm ngặt qua Zod khi khởi động — thiếu biến bắt buộc sẽ dừng app (`process.exit(1)`).
9. Mọi message lỗi, API summary, thông báo phản hồi bắt buộc viết bằng **tiếng Việt**.

---

## Related Docs

- [BE_ARCHITECTURE.md](BE_ARCHITECTURE.md) — Kiến trúc tổng thể, sequence diagrams và data flows.
- [AGENTS.md](../AGENTS.md) — Tóm tắt ngữ cảnh dự án, Docker commands và module inventory.
- [migration.md](migration.md) — Quy trình tạo và vận hành TypeORM migration.
- [setup-report.md](setup-report.md) — Các lỗi setup thường gặp và cách xử lý.
- [README.md](../README.md) — Hướng dẫn cài đặt và chạy ứng dụng.
