// src/interfaces/http/mappers/appointment.mapper.ts

import type { CreateAppointmentDto } from '../dto/create-appointment.dto';
import type { CreateAppointmentInput } from '../../../application/use-cases/create-appointment.use-case';
import type { Appointment } from '../../../domain/entities/appointment.entity';

/**
 * ARCHITECTURAL DECISION:
 * - What: Mapper between HTTP DTOs and domain/use case inputs/outputs
 * - Why: Keeps transformation logic in the Interfaces layer; domain stays unaware of HTTP shape
 * - Date/time: API uses date (YYYY-MM-DD) + startTime/endTime (HH:mm); domain uses Date (stored as UTC)
 */

/** Response shape for appointment: same as frontend sends (date + times), for consistent UI consumption */
export interface AppointmentResponseDto {
  id: string;
  professionalId: string;
  clientId: string;
  date: string;
  startTime: string;
  endTime: string;
}

/**
 * Builds use case input from create DTO and authenticated client id.
 * Interprets date + startTime/endTime as UTC.
 */
export function toCreateAppointmentInput(
  dto: CreateAppointmentDto,
  clientId: string,
): CreateAppointmentInput {
  const startsAt = parseDateAndTimeAsUtc(dto.date, dto.startTime);
  const endsAt = parseDateAndTimeAsUtc(dto.date, dto.endTime);
  return {
    professionalId: dto.professionalId,
    clientId,
    startsAt,
    endsAt,
  };
}

/**
 * Maps domain appointment to API response (date + startTime/endTime).
 * Uses UTC from stored timestamps so round-trip is consistent.
 */
export function toAppointmentResponseDto(
  appointment: Appointment,
): AppointmentResponseDto {
  return {
    id: appointment.id,
    professionalId: appointment.professionalId,
    clientId: appointment.clientId,
    date: formatDateUtc(appointment.startsAt),
    startTime: formatTimeUtc(appointment.startsAt),
    endTime: formatTimeUtc(appointment.endsAt),
  };
}

function parseDateAndTimeAsUtc(date: string, time: string): Date {
  return new Date(`${date}T${time}:00.000Z`);
}

function formatDateUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatTimeUtc(d: Date): string {
  return d.toISOString().slice(11, 16);
}
