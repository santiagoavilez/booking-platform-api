// src/interfaces/providers/availability.providers.ts

import { Provider } from '@nestjs/common';
import { IAvailabilityRepository } from '../../domain/repositories/availability.repository';
import { DrizzleAvailabilityRepository } from '../../infrastructure/database/repositories/drizzle-availability.repository';
import { DRIZZLE_CLIENT } from './database.providers';
import type { DrizzleClient } from '../../infrastructure/database/drizzle';

/**
 * Token for availability repository injection
 * Used in dependency injection to decouple interface from implementation
 */
export const AVAILABILITY_REPOSITORY = Symbol('AvailabilityRepository');

/**
 * Provider for availability repository
 * Connects IAvailabilityRepository interface with DrizzleAvailabilityRepository implementation
 *
 * ARCHITECTURAL DECISION:
 * - What: Maps interface to concrete implementation via DI
 * - Why: Follows DIP - use cases depend on interface, not implementation
 * - Location: Interfaces layer (outermost, connects everything)
 */
export const availabilityRepositoryProvider: Provider<IAvailabilityRepository> =
  {
    provide: AVAILABILITY_REPOSITORY,
    useFactory: (drizzleClient: DrizzleClient): IAvailabilityRepository => {
      return new DrizzleAvailabilityRepository(drizzleClient);
    },
    inject: [DRIZZLE_CLIENT],
  };
