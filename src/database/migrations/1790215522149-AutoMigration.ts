import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1790215522149 implements MigrationInterface {
  name = 'AutoMigration1790215522149';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_actionById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_notification_recipients_notificationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_notification_recipients_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_refModel_targetId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_actionById"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_createdAt"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_createdAt"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notification_recipients_userId_isRead"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notification_recipients_notificationId"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs"  ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a020ef5c7162bfd8f74e111c9f" ON "audit_logs"  ("actionById") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_083d5d0bf75382980517fef059" ON "audit_logs"  ("refModel", "targetId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_831a5a06f879fb0bebf8965871" ON "notifications"  ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_234adaa36f97dd1b2bd3a22d65" ON "notification_recipients"  ("notificationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a48dde5de5c645e6dd11eddc9f" ON "notification_recipients"  ("userId", "isRead") `,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_f21950835fdbd146d6fbd8c7313" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_893573d9f4553d10f80706705c9" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_7aa45ed8f0fc3279275daf23a7e" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_a020ef5c7162bfd8f74e111c9f8" FOREIGN KEY ("actionById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_fcce8c50a375466676d82dcbadd" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_8444fb385082135e530e9f62f16" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_c1855b8bde9dcddbb7f5608ec92" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" ADD CONSTRAINT "FK_b84cc8a89f50a42f450a3da0d82" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" ADD CONSTRAINT "FK_4033c11086b5adfd02a0e024306" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" ADD CONSTRAINT "FK_287ed061d583dc22c791a6c8fe3" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" ADD CONSTRAINT "FK_234adaa36f97dd1b2bd3a22d65b" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" ADD CONSTRAINT "FK_452385a8220b8053ab65317ffa6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_452385a8220b8053ab65317ffa6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_234adaa36f97dd1b2bd3a22d65b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_287ed061d583dc22c791a6c8fe3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_4033c11086b5adfd02a0e024306"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_b84cc8a89f50a42f450a3da0d82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_c1855b8bde9dcddbb7f5608ec92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_8444fb385082135e530e9f62f16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_fcce8c50a375466676d82dcbadd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_a020ef5c7162bfd8f74e111c9f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_7aa45ed8f0fc3279275daf23a7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_893573d9f4553d10f80706705c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_f21950835fdbd146d6fbd8c7313"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a48dde5de5c645e6dd11eddc9f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_234adaa36f97dd1b2bd3a22d65"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_831a5a06f879fb0bebf8965871"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_083d5d0bf75382980517fef059"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a020ef5c7162bfd8f74e111c9f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_recipients_notificationId" ON "notification_recipients" USING btree ("notificationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_recipients_userId_isRead" ON "notification_recipients" USING btree ("isRead", "userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_createdAt" ON "notifications" USING btree ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_createdAt" ON "audit_logs" USING btree ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_actionById" ON "audit_logs" USING btree ("actionById") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_refModel_targetId" ON "audit_logs" USING btree ("refModel", "targetId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" ADD CONSTRAINT "FK_notification_recipients_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" ADD CONSTRAINT "FK_notification_recipients_notificationId" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_actionById" FOREIGN KEY ("actionById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
