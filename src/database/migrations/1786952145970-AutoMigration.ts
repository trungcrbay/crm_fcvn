import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1786952145970 implements MigrationInterface {
  name = 'AutoMigration1786952145970';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "country"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customers" ADD "country" text`);
  }
}
