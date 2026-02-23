// src/interfaces/http/dto/create-appointment.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

/**
 * DTO for creating an appointment
 * Request body for POST /appointments
 *
 * ARCHITECTURAL DECISION:
 * - What: Frontend sends date and time separately (date, startTime, endTime)
 * - Why: Aligns with UI (date picker + time slots), no client-side datetime parsing
 * - clientId is taken from the authenticated user (JWT), not from body
 */
export class CreateAppointmentDto {
  @ApiProperty({
    description: 'UUID of the professional to book with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  professionalId: string;

  @ApiProperty({
    description: 'Date in YYYY-MM-DD format (UTC)',
    example: '2026-02-25',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Start time in HH:mm format (UTC)',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time in HH:mm format (UTC)',
    example: '10:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;
}
