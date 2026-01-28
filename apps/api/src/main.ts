import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const logger = new Logger('Bootstrap');

  // Request ID middleware
  app.use(new RequestIdMiddleware().use);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || '*';
  app.enableCors({
    origin: corsOrigins === '*' ? true : corsOrigins,
    credentials: true,
  });

  // Helmet
  app.use(helmet());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Feature Flag Service API')
    .setDescription('Mini LaunchDarkly - Feature Flag Management and Runtime API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-env-key',
        in: 'header',
        description: 'Runtime API Key for environment',
      },
      'runtime-api-key'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();
