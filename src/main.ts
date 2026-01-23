import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS - permite requests desde el frontend
  const origins = process.env.CORS_ORIGIN?.split(',') ?? [
    'http://localhost:5173',
  ];
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Enable global DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties not defined in the DTO
      forbidNonWhitelisted: true, // Throw error if there are extra properties
      transform: true, // Transform automatically types
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
