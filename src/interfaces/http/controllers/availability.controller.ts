// src/interfaces/http/controllers/availability.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DefineAvailabilityUseCase } from '../../../application/use-cases/define-availability.use-case';
import { DefineAvailabilityDto } from '../dto/define-availability.dto';
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
@Controller('availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(
    private readonly defineAvailabilityUseCase: DefineAvailabilityUseCase,
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
}
