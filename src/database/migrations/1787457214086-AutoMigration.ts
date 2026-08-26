import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1787457214086 implements MigrationInterface {
  name = 'AutoMigration1787457214086';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "purchase_request_histories" ("id" SERIAL NOT NULL, "purchaseRequestId" integer NOT NULL, "fromStatus" character varying(30), "toStatus" character varying(30) NOT NULL, "action" character varying(50) NOT NULL, "reason" text, "changedById" integer NOT NULL, "changedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5bc6f44aaefb893d92279efe176" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5031380f4b2011e1e251aadc30" ON "purchase_request_histories"  ("purchaseRequestId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "purchase_request_items" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedById" integer, "deletedAt" TIMESTAMP, "deletedById" integer, "id" SERIAL NOT NULL, "purchaseRequestId" integer NOT NULL, "itemName" character varying(255) NOT NULL, "unit" character varying(50), "quantity" integer NOT NULL, "price" numeric(18,2) NOT NULL DEFAULT '0', "amount" numeric(18,2) NOT NULL DEFAULT '0', "note" text, CONSTRAINT "PK_beecbb6cca527e5c67903520e1e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_83da4409c201190609b6ec95c6" ON "purchase_request_items"  ("purchaseRequestId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "purchase_requests" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedById" integer, "deletedAt" TIMESTAMP, "deletedById" integer, "id" SERIAL NOT NULL, "code" character varying(50) NOT NULL, "title" character varying(255) NOT NULL, "description" text, "departmentId" integer, "status" character varying(30) NOT NULL DEFAULT 'DRAFT', "totalAmount" numeric(18,2) NOT NULL DEFAULT '0', "submittedAt" TIMESTAMP, "approvedAt" TIMESTAMP, "rejectedAt" TIMESTAMP, "rejectReason" text, CONSTRAINT "UQ_ae8fe1370a3f5fc0571d99a99ff" UNIQUE ("code"), CONSTRAINT "PK_f3c5a8ff7bd4338f4c860925c8f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2aa861a71cc9e625083eac3b79" ON "purchase_requests"  ("createdById") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a80c8a32c5c2a1b4601c80e0ed" ON "purchase_requests"  ("departmentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8d9e9dabf824fdafdf4a205e42" ON "purchase_requests"  ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ae8fe1370a3f5fc0571d99a99f" ON "purchase_requests"  ("code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "departments" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedById" integer, "deletedAt" TIMESTAMP, "deletedById" integer, "id" SERIAL NOT NULL, "departmentCode" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "managerId" integer, "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "UQ_fbdfd846268b04adc118772d5c5" UNIQUE ("departmentCode"), CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fbdfd846268b04adc118772d5c" ON "departments"  ("departmentCode") `,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "departmentId" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_554d853741f2083faaa5794d2a" ON "users"  ("departmentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_554d853741f2083faaa5794d2ae" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_request_histories" ADD CONSTRAINT "FK_5031380f4b2011e1e251aadc305" FOREIGN KEY ("purchaseRequestId") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_request_items" ADD CONSTRAINT "FK_558ba060e1813469fc0ef73c2ab" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_request_items" ADD CONSTRAINT "FK_8749b0bd354e7bb142e770e8acc" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_request_items" ADD CONSTRAINT "FK_cd5e9b67a12204693e83cf35cef" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_request_items" ADD CONSTRAINT "FK_83da4409c201190609b6ec95c6e" FOREIGN KEY ("purchaseRequestId") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_requests" ADD CONSTRAINT "FK_2aa861a71cc9e625083eac3b793" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_requests" ADD CONSTRAINT "FK_beb058705860298c886000c4042" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_requests" ADD CONSTRAINT "FK_df12fdcfd6a8f5b15c7a2061a16" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_requests" ADD CONSTRAINT "FK_a80c8a32c5c2a1b4601c80e0ed9" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "FK_c1b17f81897928e1475896f35fc" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "FK_fa5c0f030a143534283fe5e9fc4" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "FK_ca958ab230848ec4b6f479b20aa" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "FK_f6414ec030ca08823b25e03cd9d" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "FK_f6414ec030ca08823b25e03cd9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "FK_ca958ab230848ec4b6f479b20aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "FK_fa5c0f030a143534283fe5e9fc4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "FK_c1b17f81897928e1475896f35fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_requests" DROP CONSTRAINT "FK_a80c8a32c5c2a1b4601c80e0ed9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_requests" DROP CONSTRAINT "FK_df12fdcfd6a8f5b15c7a2061a16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_requests" DROP CONSTRAINT "FK_beb058705860298c886000c4042"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_requests" DROP CONSTRAINT "FK_2aa861a71cc9e625083eac3b793"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_request_items" DROP CONSTRAINT "FK_83da4409c201190609b6ec95c6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_request_items" DROP CONSTRAINT "FK_cd5e9b67a12204693e83cf35cef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_request_items" DROP CONSTRAINT "FK_8749b0bd354e7bb142e770e8acc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_request_items" DROP CONSTRAINT "FK_558ba060e1813469fc0ef73c2ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_request_histories" DROP CONSTRAINT "FK_5031380f4b2011e1e251aadc305"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_554d853741f2083faaa5794d2ae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_554d853741f2083faaa5794d2a"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "departmentId"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fbdfd846268b04adc118772d5c"`,
    );
    await queryRunner.query(`DROP TABLE "departments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ae8fe1370a3f5fc0571d99a99f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8d9e9dabf824fdafdf4a205e42"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a80c8a32c5c2a1b4601c80e0ed"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2aa861a71cc9e625083eac3b79"`,
    );
    await queryRunner.query(`DROP TABLE "purchase_requests"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_83da4409c201190609b6ec95c6"`,
    );
    await queryRunner.query(`DROP TABLE "purchase_request_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5031380f4b2011e1e251aadc30"`,
    );
    await queryRunner.query(`DROP TABLE "purchase_request_histories"`);
  }
}
