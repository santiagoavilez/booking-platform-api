import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RegisterUserUseCase } from './application/use-cases/auth/register-user.use-case';
import {
  drizzleClientProvider,
  userRepositoryProvider,
  passwordHasherProvider,
  idGeneratorProvider,
} from './interfaces/providers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Database
    drizzleClientProvider,
    // Repositories
    userRepositoryProvider,
    // Services
    passwordHasherProvider,
    idGeneratorProvider,
    // Use Cases
    RegisterUserUseCase,
  ],
})
export class AppModule {}
