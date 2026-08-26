import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1787371115137 implements MigrationInterface {
  name = 'AutoMigration1787371115137';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_1de7eb246940b05765d2c99a7e" ON "purchase_order_items"  ("purchaseOrderId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0c3ff892a9f2ed16f59d31ccca" ON "purchase_orders"  ("supplierId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_368e146b785b574f42ae9e53d5" ON "users"  ("roleId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens"  ("userId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_610102b60fea1455310ccd299d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_368e146b785b574f42ae9e53d5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0c3ff892a9f2ed16f59d31ccca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1de7eb246940b05765d2c99a7e"`,
    );
  }
}
