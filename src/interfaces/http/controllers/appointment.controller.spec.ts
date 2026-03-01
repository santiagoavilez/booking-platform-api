// src/interfaces/http/controllers/appointment.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { CreateAppointmentUseCase } from '../../../application/use-cases/create-appointment.use-case';
import { GetMyAppointmentsUseCase } from '../../../application/use-cases/get-my-appointments.use-case';
import { GetAppointmentsByProfessionalAndDateUseCase } from '../../../application/use-cases/get-appointments-by-professional-and-date.use-case';
import { AuthenticatedRequest, JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Role } from '../../../domain/enums/role.enum';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';

const mockAuthenticatedRequest = {
  user: { userId: 'client-123', role: Role.CLIENT },
};

const mockJwtGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    req.user = mockAuthenticatedRequest.user;
    return true;
  },
};

describe('AppointmentController', () => {
  let controller: AppointmentController;
  let mockCreateAppointmentUseCase: jest.Mocked<CreateAppointmentUseCase>;
  let mockGetMyAppointmentsUseCase: jest.Mocked<GetMyAppointmentsUseCase>;
  let mockGetAppointmentsByProfessionalAndDateUseCase: jest.Mocked<GetAppointmentsByProfessionalAndDateUseCase>;

  beforeEach(async () => {
    mockCreateAppointmentUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateAppointmentUseCase>;
    mockGetMyAppointmentsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetMyAppointmentsUseCase>;
    mockGetAppointmentsByProfessionalAndDateUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetAppointmentsByProfessionalAndDateUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        {
          provide: CreateAppointmentUseCase,
          useValue: mockCreateAppointmentUseCase,
        },
        {
          provide: GetMyAppointmentsUseCase,
          useValue: mockGetMyAppointmentsUseCase,
        },
        {
          provide: GetAppointmentsByProfessionalAndDateUseCase,
          useValue: mockGetAppointmentsByProfessionalAndDateUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<AppointmentController>(AppointmentController);
  });

  describe('create', () => {
    const validDto = {
      professionalId: 'prof-123',
      date: '2026-03-15',
      startTime: '09:00',
      endTime: '10:00',
    };
    const req = { user: { userId: 'client-123', role: Role.CLIENT } };

    it('should throw NotFoundException when client not found', async () => {
      mockCreateAppointmentUseCase.execute.mockRejectedValue(
        new Error('Client not found'),
      );

      await expect(
        controller.create(
          req as AuthenticatedRequest,
          validDto as CreateAppointmentDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when professional books with themselves', async () => {
      mockCreateAppointmentUseCase.execute.mockRejectedValue(
        new Error('Professional cannot book an appointment with themselves'),
      );

      await expect(
        controller.create(
          req as AuthenticatedRequest,
          validDto as CreateAppointmentDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for past date', async () => {
      mockCreateAppointmentUseCase.execute.mockRejectedValue(
        new Error('Cannot book appointments in the past'),
      );

      await expect(
        controller.create(
          req as AuthenticatedRequest,
          validDto as CreateAppointmentDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid duration', async () => {
      mockCreateAppointmentUseCase.execute.mockRejectedValue(
        new Error('Invalid appointment duration'),
      );

      await expect(
        controller.create(
          req as AuthenticatedRequest,
          validDto as CreateAppointmentDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when professional not available on day', async () => {
      mockCreateAppointmentUseCase.execute.mockRejectedValue(
        new Error('Professional is not available on this day'),
      );

      await expect(
        controller.create(
          req as AuthenticatedRequest,
          validDto as CreateAppointmentDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when time not within availability', async () => {
      mockCreateAppointmentUseCase.execute.mockRejectedValue(
        new Error('Requested time is not within professional availability'),
      );

      await expect(
        controller.create(
          req as AuthenticatedRequest,
          validDto as CreateAppointmentDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when slot already taken', async () => {
      mockCreateAppointmentUseCase.execute.mockRejectedValue(
        new Error('Professional already has an appointment at this time'),
      );

      await expect(
        controller.create(
          req as AuthenticatedRequest,
          validDto as CreateAppointmentDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when professional not found', async () => {
      mockCreateAppointmentUseCase.execute.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(
        controller.create(
          req as AuthenticatedRequest,
          validDto as CreateAppointmentDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is not a professional', async () => {
      mockCreateAppointmentUseCase.execute.mockRejectedValue(
        new Error('User is not a professional'),
      );

      await expect(
        controller.create(
          req as AuthenticatedRequest,
          validDto as CreateAppointmentDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unexpected errors', async () => {
      mockCreateAppointmentUseCase.execute.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        controller.create(
          req as AuthenticatedRequest,
          validDto as CreateAppointmentDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByProfessionalAndDate', () => {
    it('should throw BadRequestException when date is missing', async () => {
      await expect(
        controller.findByProfessionalAndDate('prof-123', undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when date format is invalid', async () => {
      await expect(
        controller.findByProfessionalAndDate('prof-123', 'invalid-date'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
