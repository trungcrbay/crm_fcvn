import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1786957168302 implements MigrationInterface {
  name = 'AutoMigration1786957168302';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "suppliers" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "supplierCode" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255), "phone" character varying(20), "address" text, "supplierGroupId" integer, CONSTRAINT "UQ_ed36b87b45ecba92cd52378eb79" UNIQUE ("supplierCode"), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e7a726ae4d37902c45669e01a" ON "suppliers"  ("supplierGroupId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "supplier_groups" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "description" text, CONSTRAINT "UQ_ddd28b2e81762818846a99ea407" UNIQUE ("code"), CONSTRAINT "PK_9bca109206fc7c524db10dc7427" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "roles" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD CONSTRAINT "FK_3e7a726ae4d37902c45669e01af" FOREIGN KEY ("supplierGroupId") REFERENCES "supplier_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP CONSTRAINT "FK_3e7a726ae4d37902c45669e01af"`,
    );
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`DROP TABLE "supplier_groups"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e7a726ae4d37902c45669e01a"`,
    );
    await queryRunner.query(`DROP TABLE "suppliers"`);
  }
}
