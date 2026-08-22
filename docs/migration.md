# TypeORM Migration Guide

Tài liệu hướng dẫn tạo, chạy và rollback database migration cho dự án CRM.

---

## 1. Tổng quan

Dự án sử dụng **TypeORM Migration** để quản lý các thay đổi Database Schema.

Không sử dụng:

```ts
synchronize: true;
```

Mọi thay đổi Database Schema phải được thực hiện thông qua Migration.

### Quy trình chuẩn:

Thay đổi Entity
↓
Generate Migration
↓
Review Migration
↓
Commit Migration
↓
Run Migration
↓
Database được cập nhật

### Các lệnh migration

## Generate migration

```ts
npm run migration:generate
```

Ví dụ thay đổi Entity:
@Column({ type: 'text', nullable: true })
country: string;

Sau đó chạy lệnh generate --> TypeORM sẽ tự động so sánh Entity hiện tại với Database và tạo migration.

## Review Migration

Sau khi generate migration, không chạy ngay trên production.

Trước tiên kiểm tra file migration.

## Chạy migration

Sau khi review migration:
npm run migration:run
--> TypeORM sẽ chạy các migration chưa được thực thi.

## Kiểm tra Migration đã chạy

TypeORM lưu lịch sử migration trong Database.

SELECT *
FROM migrations
ORDER BY timestamp DESC;

## Rollback Migration

Để rollback migration gần nhất:
`ts 
npm run migration:revert
`
