import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1787211184006 implements MigrationInterface {
  name = 'AutoMigration1787211184006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_88acd889fbe17d0e16cc4bc917"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_88acd889fbe17d0e16cc4bc917" ON "customers" USING btree ("phone") `,
    );
  }
}
