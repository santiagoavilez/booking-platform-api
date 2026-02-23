import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS - permite requests desde el frontend
  const origins = process.env.CORS_ORIGIN?.split(',') ?? [
    'http://localhost:5173',
    // cualquier localhost * que se pueda usar para el frontend
    'http://localhost:*',
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
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
