import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1789100000000 implements MigrationInterface {
  name = 'CreateAuditLogsTable1789100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audit_logs" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdById" integer,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedById" integer,
        "deletedAt" TIMESTAMP,
        "deletedById" integer,
        "id" SERIAL NOT NULL,
        "actionById" integer NOT NULL,
        "refModel" character varying(50) NOT NULL,
        "targetId" integer,
        "diffs" jsonb NOT NULL DEFAULT '[]',
        "metadata" jsonb,
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_refModel_targetId" ON "audit_logs" ("refModel", "targetId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_actionById" ON "audit_logs" ("actionById")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_createdAt" ON "audit_logs" ("createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_actionById" FOREIGN KEY ("actionById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_actionById"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_createdAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_actionById"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_refModel_targetId"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
