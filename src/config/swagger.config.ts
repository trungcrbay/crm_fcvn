import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

const swaggerDocumentConfig = new DocumentBuilder()
  .setTitle('CRM FCVN API')
  .setDescription('CRM Fcvn API')
  .setVersion('1.0.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
      name: 'Authorization',
      description: 'Paste access token without Bearer prefix',
    },
    'Bearer',
  )
  .build();

const swaggerUiOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customSiteTitle: 'Dummy API Documentation',
};

export function configureSwaggerUI(app: INestApplication) {
  const document = SwaggerModule.createDocument(app, swaggerDocumentConfig);

  const cleanedDocument = cleanupOpenApiDoc(document);

  SwaggerModule.setup('api', app, cleanedDocument, swaggerUiOptions);
}
