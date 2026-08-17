import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1786957539080 implements MigrationInterface {
  name = 'AutoMigration1786957539080';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD "status" character varying(20) NOT NULL DEFAULT 'active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "status"`);
  }
}
