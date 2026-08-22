import z from 'zod';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import type { StringValue } from 'ms';

config({
  path: '.env',
});

if (!fs.existsSync(path.resolve('.env'))) {
  console.log('Không tìm thấy file .env');
  process.exit(1);
}

const configSchema = z.object({
  DB_DATABASE: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(1),
  ACCESS_TOKEN_EXPIRES_IN: z.string().min(1) as z.ZodType<StringValue>,
  REFRESH_TOKEN_SECRET: z.string().min(1),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1) as z.ZodType<StringValue>,
  DB_HOST: z.string().min(1),
  PORT: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  IDEMPOTENCY_KEY: z.string().min(1),
});

const configServer = configSchema.safeParse(process.env);

if (!configServer.success) {
  console.log('Các giá trị khai báo trong file .env không hợp lệ');
  const errorArray = configServer.error.issues.map((eItem) => {
    const property = String(eItem.path[0]);

    return {
      property,
      constraints: eItem.message,
      value: process.env[property],
    };
  });
  console.log(errorArray);
  process.exit(1);
}

const envConfig = configServer.data;

export default envConfig;
