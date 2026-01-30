// src/application/dtos/appointment-with-parties.dto.ts

import type { Appointment } from '../../domain/entities/appointment.entity';

/**
 * Application-level result for "my appointments": appointment plus party names.
 * Used by GetMyAppointmentsUseCase; mapper converts to HTTP DTO.
 */
export interface AppointmentWithParties {
  appointment: Appointment;
  professional: { firstName: string; lastName: string };
  client: { firstName: string; lastName: string };
}
