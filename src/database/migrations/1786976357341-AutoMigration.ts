import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1786976357341 implements MigrationInterface {
  name = 'AutoMigration1786976357341';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "createdById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "updatedById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "deletedById" integer`,
    );
    await queryRunner.query(`ALTER TABLE "roles" ADD "createdById" integer`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "updatedById" integer`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deletedById" integer`);
    await queryRunner.query(`ALTER TABLE "users" ADD "createdById" integer`);
    await queryRunner.query(`ALTER TABLE "users" ADD "updatedById" integer`);
    await queryRunner.query(`ALTER TABLE "users" ADD "deletedById" integer`);
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" ADD "createdById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" ADD "updatedById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" ADD "deletedById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD "createdById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD "updatedById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD "deletedById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD CONSTRAINT "FK_aa88a28eac26e514147fc7d2039" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD CONSTRAINT "FK_5ecf24c76197e0f9b4fe1741bb1" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD CONSTRAINT "FK_437ce279f146b9fea39dbd35c18" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_cec119ce18936c7b6c24142be3e" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_5de46381983d514c100aaceb542" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_f66a6e03aa65334c4f40e60e36e" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_51d635f1d983d505fb5a2f44c52" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_52e97c477859f8019f3705abd21" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_e9d50c91bd84f566ce0ac1acf44" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" ADD CONSTRAINT "FK_8b9da28de69bd97d71c376867ef" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" ADD CONSTRAINT "FK_fbe855a3098ef6d7547bd3767d7" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" ADD CONSTRAINT "FK_f0f02f5facd7c0fd7dd6aacdf5b" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD CONSTRAINT "FK_e4d10e6df143ef83689f4f96c1b" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD CONSTRAINT "FK_a514a784909249fe9da16b81d37" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD CONSTRAINT "FK_acb5ba8b2e9f690a370a15e0196" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP CONSTRAINT "FK_acb5ba8b2e9f690a370a15e0196"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP CONSTRAINT "FK_a514a784909249fe9da16b81d37"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP CONSTRAINT "FK_e4d10e6df143ef83689f4f96c1b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" DROP CONSTRAINT "FK_f0f02f5facd7c0fd7dd6aacdf5b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" DROP CONSTRAINT "FK_fbe855a3098ef6d7547bd3767d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" DROP CONSTRAINT "FK_8b9da28de69bd97d71c376867ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_e9d50c91bd84f566ce0ac1acf44"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_52e97c477859f8019f3705abd21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_51d635f1d983d505fb5a2f44c52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_f66a6e03aa65334c4f40e60e36e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_5de46381983d514c100aaceb542"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_cec119ce18936c7b6c24142be3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP CONSTRAINT "FK_437ce279f146b9fea39dbd35c18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP CONSTRAINT "FK_5ecf24c76197e0f9b4fe1741bb1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP CONSTRAINT "FK_aa88a28eac26e514147fc7d2039"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP COLUMN "deletedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP COLUMN "updatedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP COLUMN "createdById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" DROP COLUMN "deletedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" DROP COLUMN "updatedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_groups" DROP COLUMN "createdById"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedById"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedById"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdById"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deletedById"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updatedById"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "createdById"`);
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "deletedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "updatedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "createdById"`,
    );
  }
}
