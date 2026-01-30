// src/application/use-cases/get-appointments-by-professional-and-date.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity';
import { type IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { APPOINTMENT_REPOSITORY } from '../../interfaces/providers';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case to list appointments for a professional on a given date
 * - Why: Single responsibility; enables GET /appointments/professional/:id?date= for calendars/availability views
 * - date: YYYY-MM-DD (UTC day used for filtering)
 */
@Injectable()
export class GetAppointmentsByProfessionalAndDateUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(professionalId: string, date: string): Promise<Appointment[]> {
    return await this.appointmentRepository.findByProfessionalIdAndDate(
      professionalId,
      date,
    );
  }
}
