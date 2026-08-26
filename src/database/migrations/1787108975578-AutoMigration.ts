import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1787108975578 implements MigrationInterface {
  name = 'AutoMigration1787108975578';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "purchase_orders" ("id" SERIAL NOT NULL, "code" character varying(50) NOT NULL, "supplierId" integer NOT NULL, "totalAmount" numeric(18,2) NOT NULL DEFAULT '0', "idempotencyKey" character varying(100) NOT NULL, CONSTRAINT "UQ_f96c29600a09115dd4f136ab41a" UNIQUE ("code"), CONSTRAINT "UQ_8a54a108fecdc7dc6d5b9818d50" UNIQUE ("idempotencyKey"), CONSTRAINT "PK_05148947415204a897e8beb2553" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "purchase_order_items" ("id" SERIAL NOT NULL, "purchaseOrderId" integer NOT NULL, "productId" integer NOT NULL, "quantity" numeric(18,2) NOT NULL, "price" numeric(18,2) NOT NULL, "amount" numeric(18,2) NOT NULL, CONSTRAINT "PK_e8b7568d25c41e3290db596b312" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_0c3ff892a9f2ed16f59d31cccae" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" ADD CONSTRAINT "FK_1de7eb246940b05765d2c99a7ec" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_order_items" DROP CONSTRAINT "FK_1de7eb246940b05765d2c99a7ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_0c3ff892a9f2ed16f59d31cccae"`,
    );
    await queryRunner.query(`DROP TABLE "purchase_order_items"`);
    await queryRunner.query(`DROP TABLE "purchase_orders"`);
  }
}
