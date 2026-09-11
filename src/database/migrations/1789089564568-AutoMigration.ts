import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1789089564568 implements MigrationInterface {
  name = 'AutoMigration1789089564568';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."customer_requests_actiontype_enum" AS ENUM('edit', 'delete')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customer_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_requests" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedById" integer, "deletedAt" TIMESTAMP, "deletedById" integer, "id" SERIAL NOT NULL, "code" character varying(50) NOT NULL, "customerId" integer NOT NULL, "actionType" "public"."customer_requests_actiontype_enum" NOT NULL, "proposedData" jsonb, "reason" text, "status" "public"."customer_requests_status_enum" NOT NULL DEFAULT 'pending', "approvedById" integer, "approvedAt" TIMESTAMP, "rejectReason" text, CONSTRAINT "UQ_a4426665483d21f637adf4bb4bf" UNIQUE ("code"), CONSTRAINT "PK_45ef185f553e792da9b83fa2464" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a4426665483d21f637adf4bb4b" ON "customer_requests"  ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a0e21a05b234b351e6d1e0ca2" ON "customer_requests"  ("actionType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_931fa72a8f4eac27c53645bbb2" ON "customer_requests"  ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d8be9631777a6f334b6312f57" ON "customer_requests"  ("customerId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customer_appointments_activitytype_enum" AS ENUM('direct', 'call', 'online_meeting', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customer_appointments_status_enum" AS ENUM('scheduled', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_appointments" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedById" integer, "deletedAt" TIMESTAMP, "deletedById" integer, "id" SERIAL NOT NULL, "customerId" integer NOT NULL, "saleOwnerId" integer NOT NULL, "appointmentDate" TIMESTAMP NOT NULL, "activityType" "public"."customer_appointments_activitytype_enum" NOT NULL DEFAULT 'direct', "status" "public"."customer_appointments_status_enum" NOT NULL DEFAULT 'scheduled', "location" character varying(255), "note" text, CONSTRAINT "PK_6da242ca20c68d3a7adfffc03b0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d60a1c6874844c31ce15e7ddc3" ON "customer_appointments"  ("appointmentDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3973d35049faaf956ab7201a85" ON "customer_appointments"  ("saleOwnerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b6afed7c4acdba35a8926ed079" ON "customer_appointments"  ("customerId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_accountants" ("customerId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_7e9e3ff199393414acf30cf92fd" PRIMARY KEY ("customerId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e45cb3e33809e716e12184010e" ON "customer_accountants"  ("customerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb3a7e66b66201756a738a2807" ON "customer_accountants"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_bookers" ("customerId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_7a3195736be6255ec9ce8f78814" PRIMARY KEY ("customerId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f7c3c1378d0c2dd22271eec659" ON "customer_bookers"  ("customerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_21709ac8291949c1bd135a431f" ON "customer_bookers"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customers_customertype_enum" AS ENUM('individual', 'corporate', 'representative')`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "customerType" "public"."customers_customertype_enum" NOT NULL DEFAULT 'individual'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customers_grouptype_enum" AS ENUM('vip', 'normal', 'other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "groupType" "public"."customers_grouptype_enum" NOT NULL DEFAULT 'normal'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customers_status_enum" AS ENUM('active', 'inactive', 'approaching')`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "status" "public"."customers_status_enum" NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customers_identitytype_enum" AS ENUM('passport', 'cccd', 'cmnd')`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "identityType" "public"."customers_identitytype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "identityNumber" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD CONSTRAINT "UQ_24bfb810cd0698d349a475e02d4" UNIQUE ("identityNumber")`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "identityIssueDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "identityExpiryDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "identityIssueAt" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "customers" ADD "dob" date`);
    await queryRunner.query(`ALTER TABLE "customers" ADD "note" text`);
    await queryRunner.query(`ALTER TABLE "customers" ADD "detail" text`);
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "creditLimit" numeric(15,2) DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "taxCode" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "agencyCode" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "organizationName" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "organizationEmail" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "organizationPhone" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "representativeName" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "representativeTitle" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "representativePosition" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "customerPosition" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "source" character varying(50)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customers_gender_enum" AS ENUM('male', 'female')`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "gender" "public"."customers_gender_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "otherContacts" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "saleOwnerId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "averageRevenue" numeric(15,2) DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "implementationPolicy" character varying(255)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_24bfb810cd0698d349a475e02d" ON "customers"  ("identityNumber") `,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_requests" ADD CONSTRAINT "FK_985e53d3517f0cef0885a8751f6" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_requests" ADD CONSTRAINT "FK_7992940ad2165718dbcf2a6063b" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_requests" ADD CONSTRAINT "FK_82c2868ca3b4409498f57c180c0" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_requests" ADD CONSTRAINT "FK_6d8be9631777a6f334b6312f57c" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_requests" ADD CONSTRAINT "FK_fe5956f0595f6c3d5c7253017ee" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD CONSTRAINT "FK_1697f776e2a75d8f6d6c210dabd" FOREIGN KEY ("saleOwnerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_appointments" ADD CONSTRAINT "FK_1f6acf23891c4d1ed8e169328b8" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_appointments" ADD CONSTRAINT "FK_69e035e452186fa4a6b3be37104" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_appointments" ADD CONSTRAINT "FK_90b265bc42d915caf04a8fb87b2" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_appointments" ADD CONSTRAINT "FK_b6afed7c4acdba35a8926ed0798" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_appointments" ADD CONSTRAINT "FK_3973d35049faaf956ab7201a85e" FOREIGN KEY ("saleOwnerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_accountants" ADD CONSTRAINT "FK_e45cb3e33809e716e12184010e6" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_accountants" ADD CONSTRAINT "FK_cb3a7e66b66201756a738a2807c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_bookers" ADD CONSTRAINT "FK_f7c3c1378d0c2dd22271eec6599" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_bookers" ADD CONSTRAINT "FK_21709ac8291949c1bd135a431f8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer_bookers" DROP CONSTRAINT "FK_21709ac8291949c1bd135a431f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_bookers" DROP CONSTRAINT "FK_f7c3c1378d0c2dd22271eec6599"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_accountants" DROP CONSTRAINT "FK_cb3a7e66b66201756a738a2807c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_accountants" DROP CONSTRAINT "FK_e45cb3e33809e716e12184010e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_appointments" DROP CONSTRAINT "FK_3973d35049faaf956ab7201a85e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_appointments" DROP CONSTRAINT "FK_b6afed7c4acdba35a8926ed0798"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_appointments" DROP CONSTRAINT "FK_90b265bc42d915caf04a8fb87b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_appointments" DROP CONSTRAINT "FK_69e035e452186fa4a6b3be37104"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_appointments" DROP CONSTRAINT "FK_1f6acf23891c4d1ed8e169328b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP CONSTRAINT "FK_1697f776e2a75d8f6d6c210dabd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_requests" DROP CONSTRAINT "FK_fe5956f0595f6c3d5c7253017ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_requests" DROP CONSTRAINT "FK_6d8be9631777a6f334b6312f57c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_requests" DROP CONSTRAINT "FK_82c2868ca3b4409498f57c180c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_requests" DROP CONSTRAINT "FK_7992940ad2165718dbcf2a6063b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_requests" DROP CONSTRAINT "FK_985e53d3517f0cef0885a8751f6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_24bfb810cd0698d349a475e02d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "implementationPolicy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "averageRevenue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "saleOwnerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "otherContacts"`,
    );
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "gender"`);
    await queryRunner.query(`DROP TYPE "public"."customers_gender_enum"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "source"`);
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "customerPosition"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "representativePosition"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "representativeTitle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "representativeName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "organizationPhone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "organizationEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "organizationName"`,
    );
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "agencyCode"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "taxCode"`);
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "creditLimit"`,
    );
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "detail"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "note"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "dob"`);
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "identityIssueAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "identityExpiryDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "identityIssueDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP CONSTRAINT "UQ_24bfb810cd0698d349a475e02d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "identityNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "identityType"`,
    );
    await queryRunner.query(`DROP TYPE "public"."customers_identitytype_enum"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."customers_status_enum"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "groupType"`);
    await queryRunner.query(`DROP TYPE "public"."customers_grouptype_enum"`);
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN "customerType"`,
    );
    await queryRunner.query(`DROP TYPE "public"."customers_customertype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_21709ac8291949c1bd135a431f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f7c3c1378d0c2dd22271eec659"`,
    );
    await queryRunner.query(`DROP TABLE "customer_bookers"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb3a7e66b66201756a738a2807"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e45cb3e33809e716e12184010e"`,
    );
    await queryRunner.query(`DROP TABLE "customer_accountants"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b6afed7c4acdba35a8926ed079"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3973d35049faaf956ab7201a85"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d60a1c6874844c31ce15e7ddc3"`,
    );
    await queryRunner.query(`DROP TABLE "customer_appointments"`);
    await queryRunner.query(
      `DROP TYPE "public"."customer_appointments_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."customer_appointments_activitytype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d8be9631777a6f334b6312f57"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_931fa72a8f4eac27c53645bbb2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2a0e21a05b234b351e6d1e0ca2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a4426665483d21f637adf4bb4b"`,
    );
    await queryRunner.query(`DROP TABLE "customer_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."customer_requests_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."customer_requests_actiontype_enum"`,
    );
  }
}
