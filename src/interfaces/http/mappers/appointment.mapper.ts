// src/interfaces/http/mappers/appointment.mapper.ts

import type { CreateAppointmentDto } from '../dto/create-appointment.dto';
import type { CreateAppointmentInput } from '../../../application/use-cases/create-appointment.use-case';
import type { Appointment } from '../../../domain/entities/appointment.entity';
import type { AppointmentWithParties } from '../../../application/dtos/appointment-with-parties.dto';

/**
 * ARCHITECTURAL DECISION:
 * - What: Mapper between HTTP DTOs and domain/use case inputs/outputs
 * - Why: Keeps transformation logic in the Interfaces layer; domain stays unaware of HTTP shape
 * - Date/time: API uses date (YYYY-MM-DD) + startTime/endTime (HH:mm); domain uses Date (stored as UTC)
 */

/**
 * Party name for professional or client in appointment response.
 */
export interface AppointmentPartyDto {
  firstName: string;
  lastName: string;
}

/**
 * Response shape for appointment: date + times + audit fields + party names.
 * professional/client allow the front to show names by role; professionalId/clientId kept for compatibility.
 */
export interface AppointmentResponseDto {
  id: string;
  professionalId: string;
  clientId: string;
  professional: AppointmentPartyDto;
  client: AppointmentPartyDto;
  date: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
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

const EMPTY_PARTY: AppointmentPartyDto = { firstName: '', lastName: '' };

/**
 * Maps domain appointment to API response (date + startTime/endTime).
 * Uses UTC from stored timestamps so round-trip is consistent.
 * When parties is omitted (e.g. POST create), professional/client are empty.
 */
export function toAppointmentResponseDto(
  appointment: Appointment,
  parties?: { professional: AppointmentPartyDto; client: AppointmentPartyDto },
): AppointmentResponseDto {
  const dto: AppointmentResponseDto = {
    id: appointment.id,
    professionalId: appointment.professionalId,
    clientId: appointment.clientId,
    professional: parties?.professional ?? EMPTY_PARTY,
    client: parties?.client ?? EMPTY_PARTY,
    date: formatDateUtc(appointment.startsAt),
    startTime: formatTimeUtc(appointment.startsAt),
    endTime: formatTimeUtc(appointment.endsAt),
  };
  if (appointment.createdAt != null) {
    dto.createdAt = appointment.createdAt.toISOString();
  }
  if (appointment.updatedAt != null) {
    dto.updatedAt = appointment.updatedAt.toISOString();
  }
  return dto;
}

/**
 * Maps enriched "my appointments" result to API response with party names.
 */
export function toAppointmentResponseDtoFromEnriched(
  item: AppointmentWithParties,
): AppointmentResponseDto {
  return toAppointmentResponseDto(item.appointment, {
    professional: item.professional,
    client: item.client,
  });
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
