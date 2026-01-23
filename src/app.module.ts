import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RegisterUserUseCase } from './application/use-cases/auth/register-user.use-case';
import { LoginUseCase } from './application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.use-case';
import {
  drizzleClientProvider,
  userRepositoryProvider,
  passwordHasherProvider,
  idGeneratorProvider,
  jwtConfigProvider,
  jwtTokenGeneratorProvider,
  refreshTokenRepositoryProvider,
} from './interfaces/providers';
import { AuthController } from './interfaces/http/controllers/auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    // Database
    drizzleClientProvider,
    // Repositories
    userRepositoryProvider,
    refreshTokenRepositoryProvider,
    // Configuration
    jwtConfigProvider,
    // Services
    passwordHasherProvider,
    idGeneratorProvider,
    jwtTokenGeneratorProvider,
    // Use Cases
    RegisterUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
  ],
})
export class AppModule {}
