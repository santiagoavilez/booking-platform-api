// src/interfaces/http/controllers/availability.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiOkResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DefineAvailabilityUseCase } from '../../../application/use-cases/define-availability.use-case';
import {
  GetProfessionalAvailabilityUseCase,
  type GetProfessionalAvailabilityOutput,
} from '../../../application/use-cases/get-professional-availability.use-case';
import { DefineAvailabilityDto } from '../dto/define-availability.dto';
import { AvailabilitySlotResponseDto } from '../dto/get-availability-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';

/**
 * ARCHITECTURAL DECISION:
 * - What: HTTP controller for availability management endpoints
 * - Why: Exposes availability functionality to the outside world (HTTP)
 * - Responsibilities: Receive requests, validate DTOs, transform to use case input, call use cases
 *
 * CLEAN ARCHITECTURE:
 * - Is in Interfaces layer (outermost layer)
 * - Is THIN: only orchestrates, no business logic
 * - Transforms HTTP DTOs to use case inputs
 * - Handles errors and converts them to appropriate HTTP responses
 *
 * SECURITY:
 * - All endpoints are protected by JWT authentication
 * - Users can only modify their own availability (extracted from JWT token)
 */
@ApiTags('availability')
@ApiBearerAuth()
@Controller('availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(
    private readonly defineAvailabilityUseCase: DefineAvailabilityUseCase,
    private readonly getProfessionalAvailabilityUseCase: GetProfessionalAvailabilityUseCase,
  ) {}

  /**
   * Endpoint to define weekly availability for the authenticated professional
   * POST /availability/me
   *
   * The professionalId is extracted from the JWT token
   * Only professionals can define availability
   *
   * @param req - Authenticated request with user info from JWT
   * @param dto - The schedule configuration from frontend
   */
  @Post('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Define my availability',
    description:
      'Sets or updates the weekly availability schedule for the authenticated professional. Professional ID is taken from the JWT. Only enabled days with time slots are stored. Time format: HH:mm (24h).',
  })
  @ApiBody({ type: DefineAvailabilityDto })
  @ApiOkResponse({
    description: 'Availability schedule updated successfully',
    schema: {
      example: {
        success: true,
        data: {
          message: 'Availability schedule updated successfully',
          createdSlots: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid time format, invalid day of week, invalid range, or overlapping slots',
  })
  @ApiResponse({
    status: 403,
    description: 'Only professionals can define availability',
  })
  @ApiResponse({
    status: 401,
    description: 'No authentication token provided or invalid token',
  })
  async defineAvailability(
    @Req() req: any,
    @Body() dto: DefineAvailabilityDto,
  ) {
    try {
      // Get professionalId from authenticated user (JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const professionalId = authenticatedReq.user.userId;

      // Transform DTO to use case input
      // Filter only enabled days and flatten time slots
      const slots = dto.schedule
        .filter((day) => day.enabled)
        .flatMap((day) =>
          day.timeSlots.map((slot) => ({
            dayOfWeek: day.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        );

      const result = await this.defineAvailabilityUseCase.execute({
        professionalId,
        slots,
      });

      return {
        success: true,
        data: {
          message: 'Availability schedule updated successfully',
          createdSlots: result.createdSlots,
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Map domain errors to HTTP responses
      if (errorMessage === 'User is not a professional') {
        throw new ForbiddenException(
          'Only professionals can define availability',
        );
      }

      if (
        errorMessage.includes('Invalid time format') ||
        errorMessage.includes('Invalid day of week') ||
        errorMessage.includes('Invalid availability range') ||
        errorMessage.includes('Overlapping availability slots')
      ) {
        throw new BadRequestException(errorMessage);
      }

      // Unexpected error
      throw new BadRequestException('Failed to define availability');
    }
  }

  /**
   * Endpoint to retrieve weekly availability for the authenticated professional
   * GET /availability/me
   *
   * The professionalId is extracted from the JWT token
   * Only professionals can retrieve their availability
   *
   * @param req - Authenticated request with user info from JWT
   * @returns Array of availability slots and professional information
   * @example
   * GET /availability/me
   * {
   *   "success": true,
   *   "data": {
   *     "availabilities": [...],
   *     "professional": {
   *       "firstName": "John",
   *       "lastName": "Doe"
   *     }
   *   }
   * }
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get my availability',
    description:
      'Returns the weekly availability schedule of the authenticated professional. Professional ID is taken from the JWT. Only professionals can call this endpoint.',
  })
  @ApiOkResponse({
    description: 'Availability slots and professional info',
    schema: {
      example: {
        success: true,
        data: {
          availabilities: [
            {
              id: 'uuid-slot-1',
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '17:00',
            },
          ],
          professional: { firstName: 'John', lastName: 'Doe' },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Only professionals can retrieve availability',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 401,
    description: 'No authentication token provided or invalid token',
  })
  async getMyAvailability(@Req() req: any) {
    try {
      // Get professionalId from authenticated user (JWT token)
      const authenticatedReq = req as AuthenticatedRequest;
      const professionalId = authenticatedReq.user.userId;

      // Call use case to retrieve availability (same use case as GET /:professionalId)
      const result: GetProfessionalAvailabilityOutput =
        await this.getProfessionalAvailabilityUseCase.execute({
          professionalId,
        });

      // Transform domain entities to response DTO
      const availabilities: AvailabilitySlotResponseDto[] =
        result.availabilities.map((availability) => ({
          id: availability.id,
          dayOfWeek: availability.dayOfWeek,
          startTime: availability.startTime,
          endTime: availability.endTime,
        }));

      // Extract professional information
      const { professional } = result;

      return {
        success: true,
        data: {
          availabilities,
          professional: {
            firstName: professional.firstName,
            lastName: professional.lastName,
          },
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Map domain errors to HTTP responses
      if (errorMessage === 'User not found') {
        throw new NotFoundException('User not found');
      }

      if (errorMessage === 'User is not a professional') {
        throw new ForbiddenException(
          'Only professionals can retrieve availability',
        );
      }

      // Unexpected error
      throw new BadRequestException('Failed to retrieve availability');
    }
  }

  /**
   * Endpoint to retrieve weekly availability for a specific professional
   * GET /availability/:professionalId
   *
   * The professionalId is extracted from the URL parameter
   * Any authenticated user can query any professional's availability
   * Only professionals can have availability (validated in use case)
   *
   * @param professionalId - The ID of the professional whose availability is being queried
   * @returns Array of availability slots and professional information
   * @example
   * GET /availability/123
   * {
   *   "success": true,
   *   "data": {
   *     "availabilities": [...],
   *     "professional": {
   *       "firstName": "John",
   *       "lastName": "Doe"
   *     }
   *   }
   * }
   */
  @Get(':professionalId')
  @ApiOperation({
    summary: 'Get professional availability',
    description:
      'Returns the weekly availability schedule of a given professional by ID. Any authenticated user can query any professional. Useful for clients when booking an appointment.',
  })
  @ApiParam({
    name: 'professionalId',
    description: 'UUID of the professional',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Availability slots and professional info',
    schema: {
      example: {
        success: true,
        data: {
          availabilities: [
            {
              id: 'uuid-slot-1',
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '17:00',
            },
          ],
          professional: { firstName: 'John', lastName: 'Doe' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'The requested user is not a professional',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 401,
    description: 'No authentication token provided or invalid token',
  })
  async getProfessionalAvailability(
    @Param('professionalId') professionalId: string,
  ) {
    try {
      // Call use case to retrieve availability
      const result: GetProfessionalAvailabilityOutput =
        await this.getProfessionalAvailabilityUseCase.execute({
          professionalId,
        });

      // Transform domain entities to response DTO
      const availabilities: AvailabilitySlotResponseDto[] =
        result.availabilities.map((availability) => ({
          id: availability.id,
          dayOfWeek: availability.dayOfWeek,
          startTime: availability.startTime,
          endTime: availability.endTime,
        }));

      // Extract professional information
      const { professional } = result;

      return {
        success: true,
        data: {
          availabilities,
          professional: {
            firstName: professional.firstName,
            lastName: professional.lastName,
          },
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Map domain errors to HTTP responses
      if (errorMessage === 'User not found') {
        throw new NotFoundException('User not found');
      }

      if (errorMessage === 'User is not a professional') {
        throw new BadRequestException(
          'The requested user is not a professional',
        );
      }

      // Unexpected error
      throw new BadRequestException('Failed to retrieve availability');
    }
  }
}
