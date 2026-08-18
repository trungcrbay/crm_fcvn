import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1787027562899 implements MigrationInterface {
  name = 'AutoMigration1787027562899';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD "status" character varying(20) NOT NULL DEFAULT 'active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "status"`);
  }
}
