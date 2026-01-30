// src/application/use-cases/get-my-appointments.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity';
import { type IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { APPOINTMENT_REPOSITORY } from '../../interfaces/providers';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case to list appointments for the authenticated client
 * - Why: Keeps controller thin; single responsibility (fetch by client id)
 */
@Injectable()
export class GetMyAppointmentsUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(clientId: string): Promise<Appointment[]> {
    return this.appointmentRepository.findByClientId(clientId);
  }
}
