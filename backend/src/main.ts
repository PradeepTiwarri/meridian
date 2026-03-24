import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

// =============================================================================
// Meridian Backend — Bootstrap
// =============================================================================

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // -------------------------------------------------------------------------
  // Global Validation Pipe
  // Ensures all incoming payloads are strictly validated against DTOs
  // -------------------------------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Strip properties not in the DTO
      forbidNonWhitelisted: true, // Throw if unknown properties are sent
      transform: true,        // Auto-transform payloads to DTO instances
    }),
  );

  // -------------------------------------------------------------------------
  // CORS — Allow the Next.js frontend
  // -------------------------------------------------------------------------
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`🚀 Meridian Backend running on http://localhost:${port}`);
}

bootstrap();
