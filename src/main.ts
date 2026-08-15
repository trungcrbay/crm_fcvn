import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureSwaggerUI } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureSwaggerUI(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
