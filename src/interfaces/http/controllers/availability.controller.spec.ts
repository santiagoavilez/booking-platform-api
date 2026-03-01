// src/interfaces/http/controllers/availability.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { DefineAvailabilityUseCase } from '../../../application/use-cases/define-availability.use-case';
import { GetProfessionalAvailabilityUseCase } from '../../../application/use-cases/get-professional-availability.use-case';
import { AuthenticatedRequest, JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Role } from '../../../domain/enums/role.enum';
import { DefineAvailabilityDto } from '../dto/define-availability.dto';

const mockJwtGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    req.user = { userId: 'prof-123', role: Role.PROFESSIONAL };
    return true;
  },
};

describe('AvailabilityController', () => {
  let controller: AvailabilityController;
  let mockDefineAvailabilityUseCase: jest.Mocked<DefineAvailabilityUseCase>;
  let mockGetProfessionalAvailabilityUseCase: jest.Mocked<GetProfessionalAvailabilityUseCase>;

  beforeEach(async () => {
    mockDefineAvailabilityUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DefineAvailabilityUseCase>;
    mockGetProfessionalAvailabilityUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProfessionalAvailabilityUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        {
          provide: DefineAvailabilityUseCase,
          useValue: mockDefineAvailabilityUseCase,
        },
        {
          provide: GetProfessionalAvailabilityUseCase,
          useValue: mockGetProfessionalAvailabilityUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
  });

  describe('defineAvailability', () => {
    const validDto = {
      schedule: [
        {
          dayOfWeek: 1,
          enabled: true,
          timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
        },
      ],
    };
    const req = { user: { userId: 'prof-123', role: Role.PROFESSIONAL } };

    it('should throw ForbiddenException when user is not a professional', async () => {
      mockDefineAvailabilityUseCase.execute.mockRejectedValue(
        new Error('User is not a professional'),
      );

      await expect(
        controller.defineAvailability(
          req as AuthenticatedRequest,
          validDto as DefineAvailabilityDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid time format', async () => {
      mockDefineAvailabilityUseCase.execute.mockRejectedValue(
        new Error('Invalid time format: 25:00'),
      );

      await expect(
        controller.defineAvailability(
          req as AuthenticatedRequest,
          validDto as DefineAvailabilityDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for overlapping slots', async () => {
      mockDefineAvailabilityUseCase.execute.mockRejectedValue(
        new Error('Overlapping availability slots on day 1'),
      );

      await expect(
        controller.defineAvailability(
          req as AuthenticatedRequest,
          validDto as DefineAvailabilityDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unexpected errors', async () => {
      mockDefineAvailabilityUseCase.execute.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        controller.defineAvailability(
          req as AuthenticatedRequest,
          validDto as DefineAvailabilityDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyAvailability', () => {
    const req = { user: { userId: 'prof-123', role: Role.PROFESSIONAL } };

    it('should throw NotFoundException when user not found', async () => {
      mockGetProfessionalAvailabilityUseCase.execute.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(
        controller.getMyAvailability(req as AuthenticatedRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a professional', async () => {
      mockGetProfessionalAvailabilityUseCase.execute.mockRejectedValue(
        new Error('User is not a professional'),
      );

      await expect(
        controller.getMyAvailability(req as AuthenticatedRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for unexpected errors', async () => {
      mockGetProfessionalAvailabilityUseCase.execute.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        controller.getMyAvailability(req as AuthenticatedRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfessionalAvailability', () => {
    it('should throw NotFoundException when user not found', async () => {
      mockGetProfessionalAvailabilityUseCase.execute.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(
        controller.getProfessionalAvailability('prof-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is not a professional', async () => {
      mockGetProfessionalAvailabilityUseCase.execute.mockRejectedValue(
        new Error('User is not a professional'),
      );

      await expect(
        controller.getProfessionalAvailability('user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unexpected errors', async () => {
      mockGetProfessionalAvailabilityUseCase.execute.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        controller.getProfessionalAvailability('prof-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
