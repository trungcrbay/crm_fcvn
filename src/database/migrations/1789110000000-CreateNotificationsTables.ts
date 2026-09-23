import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTables1789110000000 implements MigrationInterface {
  name = 'CreateNotificationsTables1789110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notifications" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdById" integer,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedById" integer,
        "deletedAt" TIMESTAMP,
        "deletedById" integer,
        "id" SERIAL NOT NULL,
        "title" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "type" character varying(50) NOT NULL DEFAULT 'system',
        "action" jsonb NOT NULL,
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_createdAt" ON "notifications" ("createdAt")`,
    );

    await queryRunner.query(
      `CREATE TABLE "notification_recipients" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdById" integer,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedById" integer,
        "deletedAt" TIMESTAMP,
        "deletedById" integer,
        "id" SERIAL NOT NULL,
        "notificationId" integer NOT NULL,
        "userId" integer NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "readAt" TIMESTAMP,
        CONSTRAINT "PK_notification_recipients_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_notification_recipients_userId_isRead" ON "notification_recipients" ("userId", "isRead")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_notification_recipients_notificationId" ON "notification_recipients" ("notificationId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "notification_recipients" ADD CONSTRAINT "FK_notification_recipients_notificationId" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "notification_recipients" ADD CONSTRAINT "FK_notification_recipients_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_notification_recipients_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_notification_recipients_notificationId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notification_recipients_notificationId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notification_recipients_userId_isRead"`,
    );
    await queryRunner.query(`DROP TABLE "notification_recipients"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_createdAt"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
