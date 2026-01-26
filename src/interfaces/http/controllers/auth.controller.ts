// src/interfaces/http/controllers/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/register-user.use-case';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginDto } from '../dto/login.dto';
import { LoginUseCase } from 'src/application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/refresh-token.use-case';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

/**
 * DECISIÓN ARQUITECTÓNICA:
 * - What: HTTP controller for authentication endpoints
 * - Why: Exposes auth functionality to the outside world (HTTP)
 * - Responsibilities: Receive requests, validate DTOs, call use cases, handle HTTP errors
 *
 * CLEAN ARCHITECTURE:
 * - Is in Interfaces layer (outermost layer)
 * - Is THIN: only orchestrates, no business logic
 * - Transforms HTTP DTOs to use case inputs
 * - Handles errors and converts them to appropriate HTTP responses
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  /**
   * Endpoint to register a new user
   * POST /auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterUserDto) {
    try {
      // Transform HTTP DTO to use case input
      const result = await this.registerUserUseCase.execute({
        email: dto.email,
        password: dto.password,
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // Handle use case errors and convert them to HTTP responses
      if ((error as Error).message === 'User with this email already exists') {
        throw new ConflictException('User with this email already exists');
      }
      if (
        (error as Error).message === 'Invalid email format' ||
        (error as Error).message ===
          'Password must be at least 6 characters long'
      ) {
        throw new BadRequestException((error as Error).message);
      }

      // Unexpected error
      throw new BadRequestException('Failed to register user');
    }
  }

  /**
   * Endpoint to login a user
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    try {
      const result = await this.loginUseCase.execute(dto);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (
        (error as Error).message === 'Invalid email format' ||
        (error as Error).message ===
          'Password must be at least 6 characters long'
      ) {
        throw new BadRequestException((error as Error).message);
      }
      throw new BadRequestException('Failed to login user');
    }
  }

  /**
   * Endpoint to refresh JWT token
   * POST /auth/refresh
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    try {
      const result = await this.refreshTokenUseCase.execute({
        refreshToken: dto.refreshToken,
      });
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (
        (error as Error).message === 'Invalid refresh token' ||
        (error as Error).message === 'Invalid or expired refresh token'
      ) {
        throw new BadRequestException((error as Error).message);
      }
      if ((error as Error).message === 'User not found') {
        throw new BadRequestException('User not found');
      }
      throw new BadRequestException('Failed to refresh token');
    }
  }
}
