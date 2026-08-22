import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1787368864888 implements MigrationInterface {
  name = 'AutoMigration1787368864888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_88acd889fbe17d0e16cc4bc917" ON "customers"  ("phone") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_88acd889fbe17d0e16cc4bc917"`,
    );
  }
}
