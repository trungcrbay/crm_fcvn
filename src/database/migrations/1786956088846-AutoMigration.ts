import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1786956088846 implements MigrationInterface {
  name = 'AutoMigration1786956088846';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5029e0ca955a46e2066e8c0c4f" ON "customers"  ("customerCode") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5029e0ca955a46e2066e8c0c4f"`,
    );
  }
}
