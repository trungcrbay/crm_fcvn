import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1787368864888 implements MigrationInterface {
  name = 'AutoMigration1787368864888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasIndex = await queryRunner.query(`
      SELECT 1
      FROM pg_indexes
      WHERE indexname = 'IDX_88acd889fbe17d0e16cc4bc917'
    `);

    if (hasIndex.length === 0) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_88acd889fbe17d0e16cc4bc917"
        ON "customers" ("phone")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_88acd889fbe17d0e16cc4bc917"
    `);
  }
}
