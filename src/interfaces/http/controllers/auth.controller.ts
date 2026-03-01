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
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/register-user.use-case';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginDto } from '../dto/login.dto';
import { LoginUseCase } from '../../../application/use-cases/auth/login.use-case';
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
@ApiTags('auth')
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
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user (CLIENT or PROFESSIONAL). Returns user data and tokens.',
  })
  @ApiBody({ type: RegisterUserDto })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or validation error',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
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
  @ApiOperation({
    summary: 'Login',
    description:
      'Authenticates user with email and password. Returns access and refresh tokens.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Login successful, returns tokens' })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials or validation error',
  })
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
  @ApiOperation({
    summary: 'Refresh token',
    description:
      'Exchanges a valid refresh token for new access and refresh tokens.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ description: 'New tokens returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired refresh token' })
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
