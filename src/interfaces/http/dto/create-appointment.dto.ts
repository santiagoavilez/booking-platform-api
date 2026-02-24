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
 * @example
 * {
 *   professionalId: '123e4567-e89b-12d3-a456-426614174000',
 *   date: '2026-02-25',
 *   startTime: '09:00',
 *   endTime: '10:00',
 * }
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
