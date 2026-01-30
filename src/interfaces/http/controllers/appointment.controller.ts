// src/interfaces/http/controllers/appointment.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { CreateAppointmentUseCase } from '../../../application/use-cases/create-appointment.use-case';
import { GetMyAppointmentsUseCase } from '../../../application/use-cases/get-my-appointments.use-case';
import { GetAppointmentsByProfessionalAndDateUseCase } from '../../../application/use-cases/get-appointments-by-professional-and-date.use-case';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import {
  toCreateAppointmentInput,
  toAppointmentResponseDto,
} from '../mappers/appointment.mapper';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';

/**
 * ARCHITECTURAL DECISION:
 * - What: HTTP controller for appointment endpoints
 * - Why: Exposes appointment creation and listing to the outside world (HTTP)
 * - Responsibilities: Receive requests, validate DTOs, transform via mapper, call use cases
 * - clientId comes from authenticated user (JWT), not from body
 *
 * CLEAN ARCHITECTURE:
 * - Is in Interfaces layer (outermost layer)
 * - Is THIN: only orchestrates, no business logic
 */
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly getMyAppointmentsUseCase: GetMyAppointmentsUseCase,
    private readonly getAppointmentsByProfessionalAndDateUseCase: GetAppointmentsByProfessionalAndDateUseCase,
  ) {}

  /**
   * POST /appointments
   * Creates a new appointment. clientId is taken from the authenticated user.
   * Body: { professionalId, date, startTime, endTime }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAppointmentDto,
  ) {
    const clientId = req.user.userId;

    try {
      const input = toCreateAppointmentInput(dto, clientId);
      const result = await this.createAppointmentUseCase.execute(input);

      return {
        success: true,
        data: toAppointmentResponseDto(result),
      };
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Client not found') {
        throw new NotFoundException('Client not found');
      }

      if (
        errorMessage ===
        'Professional cannot book an appointment with themselves'
      ) {
        throw new BadRequestException(
          'Professional cannot book an appointment with themselves',
        );
      }

      if (errorMessage === 'Cannot book appointments in the past') {
        throw new BadRequestException('Cannot book appointments in the past');
      }

      if (errorMessage === 'Invalid appointment duration') {
        throw new BadRequestException('Invalid appointment duration');
      }

      if (errorMessage === 'Professional is not available on this day') {
        throw new BadRequestException(
          'Professional is not available on this day',
        );
      }

      if (
        errorMessage ===
        'Requested time is not within professional availability'
      ) {
        throw new BadRequestException(
          'Requested time is not within professional availability',
        );
      }

      if (
        errorMessage === 'Professional already has an appointment at this time'
      ) {
        throw new BadRequestException(
          'Professional already has an appointment at this time',
        );
      }

      if (errorMessage === 'User not found') {
        throw new NotFoundException('Professional not found');
      }

      if (errorMessage === 'User is not a professional') {
        throw new BadRequestException('User is not a professional');
      }

      throw new BadRequestException('Failed to create appointment');
    }
  }

  /**
   * GET /appointments
   * Returns appointments for the authenticated user (as client).
   * Response shape: { id, professionalId, clientId, date, startTime, endTime, createdAt?, updatedAt? }.
   */
  @Get()
  async findMyAppointments(@Req() req: AuthenticatedRequest) {
    const clientId = req.user.userId;
    const appointments = await this.getMyAppointmentsUseCase.execute(clientId);
    return {
      success: true,
      data: appointments.map(toAppointmentResponseDto),
    };
  }

  /**
   * GET /appointments/professional/:professionalId?date=YYYY-MM-DD
   * Returns appointments for a professional on the given date (UTC).
   * Response shape: array of { id, professionalId, clientId, date, startTime, endTime, createdAt, updatedAt }.
   */
  @Get('professional/:professionalId')
  async findByProfessionalAndDate(
    @Param('professionalId') professionalId: string,
    @Query('date') date: string | undefined,
  ) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException(
        'Query parameter "date" is required and must be YYYY-MM-DD',
      );
    }
    const appointments =
      await this.getAppointmentsByProfessionalAndDateUseCase.execute(
        professionalId,
        date,
      );
    return {
      success: true,
      data: appointments.map(toAppointmentResponseDto),
    };
  }
}
