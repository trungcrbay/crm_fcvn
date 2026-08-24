import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialTables1786900000000 implements MigrationInterface {
  name = 'InitialTables1786900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Bảng roles (vai trò & quyền)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "permissions" text NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
      )
    `);

    // 2. Bảng users (tài khoản người dùng)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL NOT NULL,
        "userCode" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "roleId" integer,
        "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
        "email" character varying(255) NOT NULL,
        "phone" character varying(255),
        "address" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_userCode" UNIQUE ("userCode"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_roleId" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // 3. Bảng customers (khách hàng)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" SERIAL NOT NULL,
        "customerCode" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone" character varying(15) NOT NULL,
        "address" character varying(500) NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customers_id" PRIMARY KEY ("id")
      )
    `);

    // 4. Bảng refresh_tokens (quản lý refresh token)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "token" character varying(500) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "isRevoked" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
  }
}
