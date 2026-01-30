// src/interfaces/providers/appointment.providers.ts

import { Provider } from '@nestjs/common';
import { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { DrizzleAppointmentRepository } from '../../infrastructure/database/repositories/drizzle-appointment.repository';
import { DRIZZLE_CLIENT } from './database.providers';
import type { DrizzleClient } from '../../infrastructure/database/drizzle';

/**
 * Token for appointment repository injection
 */
export const APPOINTMENT_REPOSITORY = Symbol('AppointmentRepository');

/**
 * Provider for appointment repository
 * Connects IAppointmentRepository interface with DrizzleAppointmentRepository implementation
 */
export const appointmentRepositoryProvider: Provider<IAppointmentRepository> = {
  provide: APPOINTMENT_REPOSITORY,
  useFactory: (drizzleClient: DrizzleClient): IAppointmentRepository => {
    return new DrizzleAppointmentRepository(drizzleClient);
  },
  inject: [DRIZZLE_CLIENT],
};
