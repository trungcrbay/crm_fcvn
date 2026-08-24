import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1787458002578 implements MigrationInterface {
  name = 'AutoMigration1787458002578';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "FK_f6414ec030ca08823b25e03cd9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" DROP COLUMN "managerId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" ADD "managerId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "FK_f6414ec030ca08823b25e03cd9d" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
