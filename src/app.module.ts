import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RegisterUserUseCase } from './application/use-cases/auth/register-user.use-case';
import { LoginUseCase } from './application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.use-case';
import { CreateAppointmentUseCase } from './application/use-cases/create-appointment.use-case';
import { GetMyAppointmentsUseCase } from './application/use-cases/get-my-appointments.use-case';
import { GetAppointmentsByProfessionalAndDateUseCase } from './application/use-cases/get-appointments-by-professional-and-date.use-case';
import { DefineAvailabilityUseCase } from './application/use-cases/define-availability.use-case';
import { EnsureProfessionalExistsUseCase } from './application/use-cases/ensure-professional-exists.use-case';
import { GetProfessionalAvailabilityUseCase } from './application/use-cases/get-professional-availability.use-case';
import { SearchProfessionalsUseCase } from './application/use-cases/search-professionals.use-case';
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
  appointmentRepositoryProvider,
} from './interfaces/providers';
import { AuthController } from './interfaces/http/controllers/auth.controller';
import { AvailabilityController } from './interfaces/http/controllers/availability.controller';
import { AppointmentController } from './interfaces/http/controllers/appointment.controller';
import { ProfessionalController } from './interfaces/http/controllers/professional.controller';
import { JwtAuthGuard } from './interfaces/http/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    AvailabilityController,
    AppointmentController,
    ProfessionalController,
  ],
  providers: [
    AppService,
    // Database
    drizzleClientProvider,
    // Repositories
    userRepositoryProvider,
    refreshTokenRepositoryProvider,
    availabilityRepositoryProvider,
    appointmentRepositoryProvider,
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
    EnsureProfessionalExistsUseCase,
    DefineAvailabilityUseCase,
    GetProfessionalAvailabilityUseCase,
    CreateAppointmentUseCase,
    GetMyAppointmentsUseCase,
    GetAppointmentsByProfessionalAndDateUseCase,
    SearchProfessionalsUseCase,
  ],
})
export class AppModule {}
