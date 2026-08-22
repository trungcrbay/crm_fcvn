import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureSwaggerUI } from './config/swagger.config';
import { VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  if (process.env.NODE_ENV !== 'production') {
    configureSwaggerUI(app);
  }
  app.useLogger(app.get(Logger));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
