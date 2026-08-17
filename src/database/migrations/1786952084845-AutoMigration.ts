import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1786952084845 implements MigrationInterface {
  name = 'AutoMigration1786952084845';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customers" ADD "country" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "country"`);
  }
}
