import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1787110312807 implements MigrationInterface {
  name = 'AutoMigration1787110312807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_0c3ff892a9f2ed16f59d31cccae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP COLUMN "productId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD "createdById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD "updatedById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD "deletedById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD "itemName" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD "createdById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD "updatedById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD "deletedById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD CONSTRAINT "FK_5a15dfbe467a2b849ac905494a0" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD CONSTRAINT "FK_66782529f046a3aaecaf69c009a" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD CONSTRAINT "FK_3424661db6effdf7d123dee1269" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_15534fccde7e795f19eb3abb2a1" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_e1cf9ecced0620b6834de98af61" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_39b77afad6030024b82fcd3e0f3" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_0c3ff892a9f2ed16f59d31cccae" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_0c3ff892a9f2ed16f59d31cccae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_39b77afad6030024b82fcd3e0f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_e1cf9ecced0620b6834de98af61"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_15534fccde7e795f19eb3abb2a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP CONSTRAINT "FK_3424661db6effdf7d123dee1269"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP CONSTRAINT "FK_66782529f046a3aaecaf69c009a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP CONSTRAINT "FK_5a15dfbe467a2b849ac905494a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN "deletedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN "updatedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN "createdById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP COLUMN "itemName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP COLUMN "deletedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP COLUMN "updatedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP COLUMN "createdById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD "productId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_0c3ff892a9f2ed16f59d31cccae" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
