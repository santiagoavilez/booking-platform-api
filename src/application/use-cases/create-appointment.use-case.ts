// src/application/use-cases/create-appointment.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity';
import { type IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { type IAvailabilityRepository } from '../../domain/repositories/availability.repository';
import { type IUserRepository } from '../../domain/repositories/user.repository';
import { type IIdGenerator } from '../../domain/services/id-generator.interface';
import { Time } from '../../domain/value-objects/time.vo';
import {
  APPOINTMENT_REPOSITORY,
  AVAILABILITY_REPOSITORY,
  USER_REPOSITORY,
  ID_GENERATOR,
} from '../../interfaces/providers';
import { EnsureProfessionalExistsUseCase } from './ensure-professional-exists.use-case';
import { SendNotificationsUseCase } from './send-notifications.use-case';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum';

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

/**
 * CreateAppointmentInput - The input for the use case
 * @property professionalId - The ID of the professional
 * @property clientId - The ID of the client
 * @property startsAt - The start time of the appointment
 * @property endsAt - The end time of the appointment
 */
export interface CreateAppointmentInput {
  professionalId: string;
  clientId: string;
  startsAt: Date;
  endsAt: Date;
}

/**
 * CreateAppointmentOutput - The output for the use case
 * @property id - The ID of the appointment
 * @property professionalId - The ID of the professional
 * @property clientId - The ID of the client
 * @property startsAt - The start time of the appointment
 * @property endsAt - The end time of the appointment
 */
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
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IIdGenerator,
    private readonly ensureProfessionalExistsUseCase: EnsureProfessionalExistsUseCase,
    private readonly sendNotificationsUseCase: SendNotificationsUseCase,
  ) {}

  /**
   * Create an appointment
   * @param input - The input for the use case CreateAppointmentInput {
   * - professionalId: The ID of the professional
   * - clientId: The ID of the client
   * - startsAt: The start time of the appointment
   * - endsAt: The end time of the appointment
   * }
   * @returns The output of the use case CreateAppointmentOutput {
   * - id: The ID of the appointment
   * - professionalId: The ID of the professional
   * - clientId: The ID of the client
   * - startsAt: The start time of the appointment
   * - endsAt: The end time of the appointment
   * }
   */
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
    // Use UTC: API sends date + time as UTC; availability slots are stored as HH:mm (UTC)
    const dayOfWeek = input.startsAt.getUTCDay();
    const startTime = Time.fromDateUtc(input.startsAt).toString();
    const endTime = Time.fromDateUtc(input.endsAt).toString();

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
      this.idGenerator.generate(),
      input.professionalId,
      input.clientId,
      input.startsAt,
      input.endsAt,
    );

    // 9. Persist
    const savedAppointment =
      await this.appointmentRepository.create(appointment);

    const professional = await this.userRepository.findById(
      savedAppointment.professionalId,
    );
    const clientUser = await this.userRepository.findById(
      savedAppointment.clientId,
    );
    const messageToClient = `Appointment scheduled: ${savedAppointment.startsAt.toISOString()} - ${savedAppointment.endsAt.toISOString()} with ${professional?.firstName ?? ''} ${professional?.lastName ?? ''}`;
    const messageToProfessional = `Appointment scheduled: ${savedAppointment.startsAt.toISOString()} - ${savedAppointment.endsAt.toISOString()} with ${clientUser?.firstName ?? ''} ${clientUser?.lastName ?? ''}`;
    const channels = [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP];
    await this.sendNotificationsUseCase.execute({
      recipientId: savedAppointment.clientId,
      message: messageToClient,
      channels,
    });

    await this.sendNotificationsUseCase.execute({
      recipientId: savedAppointment.professionalId,
      message: messageToProfessional,
      channels,
    });

    // 10. Return result
    return {
      id: savedAppointment.id,
      professionalId: savedAppointment.professionalId,
      clientId: savedAppointment.clientId,
      startsAt: savedAppointment.startsAt,
      endsAt: savedAppointment.endsAt,
    };
  }
}
