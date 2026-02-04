// src/application/use-cases/get-my-appointments.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { type IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { type IUserRepository } from '../../domain/repositories/user.repository';
import { Role } from '../../domain/enums/role.enum';
import {
  APPOINTMENT_REPOSITORY,
  USER_REPOSITORY,
} from '../../interfaces/providers';
import type { AppointmentWithParties } from '../dtos/appointment-with-parties.dto';
import type { Appointment } from '../../domain/entities/appointment.entity';

export type { AppointmentWithParties };

const UNKNOWN_PARTY = { firstName: 'Unknown', lastName: '' };

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case to list appointments for the authenticated user (client or professional)
 * - Why: Single responsibility; returns "my" appointments with party names for the front
 * - If user is professional: appointments where they are the professional or the client (e.g. when they booked with another professional); if client: where they are the client.
 */
@Injectable()
export class GetMyAppointmentsUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    userId: string,
    role: string,
  ): Promise<AppointmentWithParties[]> {
    const isProfessional =
      role?.toUpperCase() === (Role.PROFESSIONAL as string);

    let appointments: Appointment[];

    if (isProfessional) {
      const asProfessional =
        await this.appointmentRepository.findByProfessionalId(userId);
      const asClient = await this.appointmentRepository.findByClientId(userId);
      appointments = [...asProfessional, ...asClient];
    } else {
      appointments = await this.appointmentRepository.findByClientId(userId);
    }
    if (appointments.length === 0) {
      return [];
    }

    const professionalIds = new Set(appointments.map((a) => a.professionalId));
    const clientIds = new Set(appointments.map((a) => a.clientId));
    const userIds = new Set([...professionalIds, ...clientIds]);

    const userMap = new Map<string, { firstName: string; lastName: string }>();
    for (const id of userIds) {
      const user = await this.userRepository.findById(id);
      userMap.set(
        id,
        user
          ? { firstName: user.firstName, lastName: user.lastName }
          : UNKNOWN_PARTY,
      );
    }
    // order appointments by startsAt
    const orderedAppointments = [...appointments].sort(
      (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
    );
    return orderedAppointments.map((appointment) => ({
      appointment,
      professional: userMap.get(appointment.professionalId) ?? UNKNOWN_PARTY,
      client: userMap.get(appointment.clientId) ?? UNKNOWN_PARTY,
    }));
  }
}
