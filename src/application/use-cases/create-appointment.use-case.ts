// src/application/use-cases/create-appointment.use-case.ts

import { Injectable } from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity';
import { type IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { type IAvailabilityRepository } from '../../domain/repositories/availability.repository';
import { type IUserRepository } from '../../domain/repositories/user.repository';
import { EnsureProfessionalExistsUseCase } from './ensure-professional-exists.use-case';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case for creating an appointment reservation
 * - Why: This is the CORE use case of the system, centralizes all complex logic
 * - Responsibilities:
 *   - Validate that professional exists
 *   - Validate that client exists
 *   - Validate real-time availability
 *   - Verify there are no conflicts with existing appointments
 *   - Create the appointment
 *   - Trigger notifications (will be done in another use case or event)
 */
export interface CreateAppointmentInput {
  professionalId: string;
  clientId: string;
  startsAt: Date;
  endsAt: Date;
}

export interface CreateAppointmentOutput {
  id: string;
  professionalId: string;
  clientId: string;
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly availabilityRepository: IAvailabilityRepository,
    private readonly userRepository: IUserRepository,
    private readonly ensureProfessionalExistsUseCase: EnsureProfessionalExistsUseCase,
  ) {}

  async execute(
    input: CreateAppointmentInput,
  ): Promise<CreateAppointmentOutput> {
    // 1. Validate that professional exists (DRY: shared use case)
    await this.ensureProfessionalExistsUseCase.execute(input.professionalId);

    // 2. Validate that client exists
    const client = await this.userRepository.findById(input.clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // 3. Validate that it's not the same person
    if (input.professionalId === input.clientId) {
      throw new Error(
        'Professional cannot book an appointment with themselves',
        {
          cause: 'Professional cannot book an appointment with themselves',
        },
      );
    }

    // 4. Validate that date is not in the past
    const now = new Date();
    if (input.startsAt < now) {
      throw new Error('Cannot book appointments in the past');
    }

    // 5. Validate that startsAt < endsAt
    if (input.startsAt >= input.endsAt) {
      throw new Error('Invalid appointment duration');
    }

    // 6. Validate professional availability for that day and time
    const dayOfWeek = input.startsAt.getDay();
    const startTime = this.formatTime(input.startsAt);
    const endTime = this.formatTime(input.endsAt);

    const availableSlots =
      await this.availabilityRepository.findByProfessionalIdAndDay(
        input.professionalId,
        dayOfWeek,
      );

    if (availableSlots.length === 0) {
      throw new Error('Professional is not available on this day');
    }

    // Verify that requested time is within an available slot
    const isWithinAvailableSlot = availableSlots.some(
      (slot) => startTime >= slot.startTime && endTime <= slot.endTime,
    );

    if (!isWithinAvailableSlot) {
      throw new Error('Requested time is not within professional availability');
    }

    // 7. Validate that there is no overlap with existing appointments
    const overlappingAppointments =
      await this.appointmentRepository.findOverlapping(
        input.professionalId,
        input.startsAt,
        input.endsAt,
      );

    if (overlappingAppointments.length > 0) {
      throw new Error('Professional already has an appointment at this time');
    }

    // 8. Create appointment (domain entity)
    const appointment = new Appointment(
      this.generateId(),
      input.professionalId,
      input.clientId,
      input.startsAt,
      input.endsAt,
    );

    // 9. Persist
    const savedAppointment =
      await this.appointmentRepository.create(appointment);

    // 10. Return result
    return {
      id: savedAppointment.id,
      professionalId: savedAppointment.professionalId,
      clientId: savedAppointment.clientId,
      startsAt: savedAppointment.startsAt,
      endsAt: savedAppointment.endsAt,
    };
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private generateId(): string {
    // TODO: Implement unique ID generation
    throw new Error('ID generation not implemented');
  }
}
