// src/interfaces/http/dto/create-appointment.dto.ts

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
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  professionalId: string;

  /** Date in YYYY-MM-DD format (e.g. "2026-02-02") */
  @IsDateString()
  @IsNotEmpty()
  date: string;

  /** Time in HH:mm format (e.g. "09:00"). Interpreted as UTC. */
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  /** Time in HH:mm format (e.g. "10:00"). Interpreted as UTC. */
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;
}
