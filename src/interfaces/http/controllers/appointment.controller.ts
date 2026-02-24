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
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateAppointmentUseCase } from '../../../application/use-cases/create-appointment.use-case';
import { GetMyAppointmentsUseCase } from '../../../application/use-cases/get-my-appointments.use-case';
import { GetAppointmentsByProfessionalAndDateUseCase } from '../../../application/use-cases/get-appointments-by-professional-and-date.use-case';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import {
  type AppointmentResponseDto,
  toCreateAppointmentInput,
  toAppointmentResponseDto,
  toAppointmentResponseDtoFromEnriched,
} from '../mappers/appointment.mapper';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import type { AppointmentWithParties } from '../../../application/dtos/appointment-with-parties.dto';

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
@ApiTags('appointments')
@ApiBearerAuth()
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
  @ApiOperation({
    summary: 'Create appointment',
    description:
      'Creates a new appointment. clientId is taken from the authenticated user (JWT). Date and times are in UTC.',
  })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiCreatedResponse({
    description: 'Appointment created successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-appointment-1',
          professionalId: '123e4567-e89b-12d3-a456-426614174000',
          clientId: 'uuid-client-1',
          professional: { firstName: 'John', lastName: 'Doe' },
          client: { firstName: 'Jane', lastName: 'Smith' },
          date: '2026-02-25',
          startTime: '09:00',
          endTime: '10:00',
          createdAt: '2026-02-23T12:00:00.000Z',
          updatedAt: '2026-02-23T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid input, past date, invalid duration, slot not available, or professional cannot book with themselves',
  })
  @ApiResponse({ status: 404, description: 'Client or professional not found' })
  @ApiResponse({
    status: 401,
    description: 'No authentication token provided or invalid token',
  })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAppointmentDto,
  ): Promise<{ success: true; data: AppointmentResponseDto }> {
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
   * Returns appointments for the authenticated user (as client or professional).
   * Response includes professional and client firstName/lastName for the front to show by role.
   */
  @Get()
  @ApiOperation({
    summary: 'Get my appointments',
    description:
      'Returns all appointments for the authenticated user (as client or professional). Response includes professional and client names.',
  })
  @ApiOkResponse({
    description: 'List of appointments for the current user',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'uuid-appointment-1',
            professionalId: 'uuid-prof-1',
            clientId: 'uuid-client-1',
            professional: { firstName: 'John', lastName: 'Doe' },
            client: { firstName: 'Jane', lastName: 'Smith' },
            date: '2026-02-25',
            startTime: '09:00',
            endTime: '10:00',
            createdAt: '2026-02-23T12:00:00.000Z',
            updatedAt: '2026-02-23T12:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No authentication token provided or invalid token',
  })
  async findMyAppointments(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: true; data: AppointmentResponseDto[] }> {
    const appointments: AppointmentWithParties[] =
      await this.getMyAppointmentsUseCase.execute(
        req.user.userId,
        req.user.role,
      );
    const data = appointments.map(
      (item: AppointmentWithParties): AppointmentResponseDto =>
        // Mapper return type is AppointmentResponseDto; resolver may not see it across layers

        toAppointmentResponseDtoFromEnriched(item),
    );
    return { success: true, data };
  }

  /**
   * GET /appointments/professional/:professionalId?date=YYYY-MM-DD
   * Returns appointments for a professional on the given date (UTC).
   * Response shape: array of { id, professionalId, clientId, date, startTime, endTime, createdAt, updatedAt }.
   */
  @Get('professional/:professionalId')
  @ApiOperation({
    summary: 'Get professional appointments by date',
    description:
      'Returns appointments for a given professional on the specified date (UTC). Query param date is required in YYYY-MM-DD format.',
  })
  @ApiParam({
    name: 'professionalId',
    description: 'UUID of the professional',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'date',
    description: 'Date in YYYY-MM-DD format (required)',
    example: '2026-02-25',
    required: true,
  })
  @ApiOkResponse({
    description: 'List of appointments for the professional on the given date',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'uuid-appointment-1',
            professionalId: 'uuid-prof-1',
            clientId: 'uuid-client-1',
            professional: { firstName: '', lastName: '' },
            client: { firstName: 'Jane', lastName: 'Smith' },
            date: '2026-02-25',
            startTime: '09:00',
            endTime: '10:00',
            createdAt: '2026-02-23T12:00:00.000Z',
            updatedAt: '2026-02-23T12:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Query parameter "date" is required and must be YYYY-MM-DD',
  })
  @ApiResponse({
    status: 401,
    description: 'No authentication token provided or invalid token',
  })
  async findByProfessionalAndDate(
    @Param('professionalId') professionalId: string,
    @Query('date') date: string | undefined,
  ): Promise<{ success: true; data: AppointmentResponseDto[] }> {
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
      data: appointments.map((a) => toAppointmentResponseDto(a)),
    };
  }
}
