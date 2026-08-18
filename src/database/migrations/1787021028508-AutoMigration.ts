import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1787021028508 implements MigrationInterface {
  name = 'AutoMigration1787021028508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "status"`);
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" ADD "status" character varying(20) NOT NULL DEFAULT 'active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD "status" character varying(20) NOT NULL DEFAULT 'active'`,
    );
  }
}
