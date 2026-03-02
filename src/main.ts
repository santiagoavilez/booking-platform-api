import type { Server } from 'http';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS - allows requests from the frontend
  // Note: 'http://localhost:*' is NOT valid - CORS compares exact origin strings.
  // Use comma-separated list in CORS_ORIGIN for production (e.g. https://myapp.railway.app).
  const originsEnv = process.env.CORS_ORIGIN?.trim();
  const origins = originsEnv
    ? originsEnv
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ];

  const corsOptions = {
    origin: origins,
    credentials: true,
  };
  app.enableCors(corsOptions);

  // Log actual CORS config applied (for verification in Railway logs)
  console.log('[CORS] enabled:', true);
  console.log('[CORS] options:', JSON.stringify(corsOptions, null, 2));
  if (process.env.NODE_ENV === 'production' && !originsEnv) {
    console.warn(
      '[CORS] WARNING: CORS_ORIGIN not set in production. Only localhost origins are allowed. Set CORS_ORIGIN to your frontend URL(s).',
    );
  }
  // Enable global DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties not defined in the DTO
      forbidNonWhitelisted: true, // Throw error if there are extra properties
      transform: true, // Transform automatically types
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Booking Platform API')
    .setDescription(
      'API for the booking platform - appointments and availability',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter the JWT token returned by login or register',
        in: 'header',
      },
      'bearer', // name used by @ApiBearerAuth() on protected routes
    )
    .build();
  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  console.log('ENV PORT:', process.env.PORT);
  const server = (await app.listen(
    process.env.PORT ?? 3000,
    '0.0.0.0',
  )) as Server;
  console.log('Listening on:', server.address());
}
void bootstrap();
