import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RegisterUserUseCase } from './application/use-cases/auth/register-user.use-case';
import { LoginUseCase } from './application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.use-case';
import { DefineAvailabilityUseCase } from './application/use-cases/define-availability.use-case';
import { GetMyAvailabilityUseCase } from './application/use-cases/get-my-availability.use-case';
import {
  drizzleClientProvider,
  userRepositoryProvider,
  passwordHasherProvider,
  idGeneratorProvider,
  jwtConfigProvider,
  jwtTokenGeneratorProvider,
  jwtTokenVerifierProvider,
  refreshTokenRepositoryProvider,
  availabilityRepositoryProvider,
} from './interfaces/providers';
import { AuthController } from './interfaces/http/controllers/auth.controller';
import { AvailabilityController } from './interfaces/http/controllers/availability.controller';
import { JwtAuthGuard } from './interfaces/http/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, AuthController, AvailabilityController],
  providers: [
    AppService,
    // Database
    drizzleClientProvider,
    // Repositories
    userRepositoryProvider,
    refreshTokenRepositoryProvider,
    availabilityRepositoryProvider,
    // Configuration
    jwtConfigProvider,
    // Services
    passwordHasherProvider,
    idGeneratorProvider,
    jwtTokenGeneratorProvider,
    jwtTokenVerifierProvider,
    // Guards
    JwtAuthGuard,
    // Use Cases
    RegisterUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    DefineAvailabilityUseCase,
    GetMyAvailabilityUseCase,
  ],
})
export class AppModule {}
