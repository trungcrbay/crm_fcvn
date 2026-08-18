### Lợi ích đạt được

- Testability: customers.service.spec.ts giờ chỉ cần mock object implement ICustomersRepository (plain object/interface), không cần mock TypeORM Repository phức tạp.

- Đổi ORM không ảnh hưởng domain/application: nếu sau này chuyển sang Prisma/Mongo, chỉ viết lại infrastructure/persistence/, domain và application không đổi dòng nào.

- Business logic tường minh: CustomerEntity.updateInfo() là nơi duy nhất chứa invariant nghiệp vụ, không lẫn với logic persist.
