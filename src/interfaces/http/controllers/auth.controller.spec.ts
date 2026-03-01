// src/interfaces/http/controllers/auth.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/register-user.use-case';
import { LoginUseCase } from '../../../application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/refresh-token.use-case';
import { Role } from '../../../domain/enums/role.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let mockRegisterUseCase: jest.Mocked<RegisterUserUseCase>;
  let mockLoginUseCase: jest.Mocked<LoginUseCase>;
  let mockRefreshTokenUseCase: jest.Mocked<RefreshTokenUseCase>;

  beforeEach(async () => {
    mockRegisterUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RegisterUserUseCase>;
    mockLoginUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<LoginUseCase>;
    mockRefreshTokenUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUserUseCase, useValue: mockRegisterUseCase },
        { provide: LoginUseCase, useValue: mockLoginUseCase },
        { provide: RefreshTokenUseCase, useValue: mockRefreshTokenUseCase },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should throw ConflictException when user already exists', async () => {
      mockRegisterUseCase.execute.mockRejectedValue(
        new Error('User with this email already exists'),
      );

      await expect(
        controller.register({
          email: 'existing@example.com',
          password: 'password123',
          role: Role.CLIENT,
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid email format', async () => {
      mockRegisterUseCase.execute.mockRejectedValue(
        new Error('Invalid email format'),
      );

      await expect(
        controller.register({
          email: 'invalid',
          password: 'password123',
          role: Role.CLIENT,
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for short password', async () => {
      mockRegisterUseCase.execute.mockRejectedValue(
        new Error('Password must be at least 6 characters long'),
      );

      await expect(
        controller.register({
          email: 'user@example.com',
          password: '12345',
          role: Role.CLIENT,
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unexpected errors', async () => {
      mockRegisterUseCase.execute.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        controller.register({
          email: 'user@example.com',
          password: 'password123',
          role: Role.CLIENT,
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should throw BadRequestException for invalid email format', async () => {
      mockLoginUseCase.execute.mockRejectedValue(
        new Error('Invalid email format'),
      );

      await expect(
        controller.login({
          email: 'invalid',
          password: 'password123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for short password', async () => {
      mockLoginUseCase.execute.mockRejectedValue(
        new Error('Password must be at least 6 characters long'),
      );

      await expect(
        controller.login({
          email: 'user@example.com',
          password: '12345',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unexpected errors', async () => {
      mockLoginUseCase.execute.mockRejectedValue(new Error('Unexpected error'));

      await expect(
        controller.login({
          email: 'user@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refresh', () => {
    it('should throw BadRequestException for invalid refresh token', async () => {
      mockRefreshTokenUseCase.execute.mockRejectedValue(
        new Error('Invalid refresh token'),
      );

      await expect(
        controller.refresh({ refreshToken: 'invalid' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired refresh token', async () => {
      mockRefreshTokenUseCase.execute.mockRejectedValue(
        new Error('Invalid or expired refresh token'),
      );

      await expect(
        controller.refresh({ refreshToken: 'expired' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user not found', async () => {
      mockRefreshTokenUseCase.execute.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(
        controller.refresh({ refreshToken: 'valid-but-user-gone' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unexpected errors', async () => {
      mockRefreshTokenUseCase.execute.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        controller.refresh({ refreshToken: 'token' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
