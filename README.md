# CRM Project

Backend CRM sử dụng **NestJS + PostgreSQL + TypeORM**.

## Setup

```bash
npm install
npm install pg
```

Tạo database PostgreSQL:

```sql
CREATE DATABASE nestjs_crm;
```

Cấu hình `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nestjs_crm
```

Chạy project:

```bash
npm run start:dev
```

## Swagger

Sau khi chạy server, mở đường dẫn Swagger được cấu hình trong `src/main.ts`.

## Postman

Dùng Postman để test các API của hệ thống.

## Lỗi setup đã xử lý

* Thiếu `pg` → `npm install pg`
* Sai password PostgreSQL → reset/cập nhật `DB_PASSWORD`
* Thiếu database `nestjs_crm` → tạo database
* DBeaver không tạo database → bật `Show all databases` hoặc dùng SQL.

## Database

Quản lý PostgreSQL bằng **DBeaver**.

Database sử dụng:

```text
nestjs_crm
```
