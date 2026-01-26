// src/application/use-cases/define-availability.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { Availability } from '../../domain/entities/availability.entity';
import { type IAvailabilityRepository } from '../../domain/repositories/availability.repository';
import { type IUserRepository } from '../../domain/repositories/user.repository';
import { type IIdGenerator } from '../../domain/services/id-generator.interface';
import {
  AVAILABILITY_REPOSITORY,
  USER_REPOSITORY,
  ID_GENERATOR,
} from '../../interfaces/providers';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case for defining weekly availability of professionals
 * - Why: Orchestrates the business flow without containing business logic
 * - Responsibilities:
 *   - Validate that user is a professional
 *   - Create domain entities (which validate themselves)
 *   - Delegate overlap validation to domain
 *   - Persist through repository interface
 *
 * CLEAN ARCHITECTURE:
 * - Depends ONLY on Domain interfaces (IAvailabilityRepository, IUserRepository, IIdGenerator)
 * - Does NOT know concrete implementations
 * - Business logic (validation) is in Domain layer (Availability entity)
 * - Implementations are injected via Dependency Injection
 *
 * SOLID - Single Responsibility:
 * - This use case ONLY orchestrates the flow
 * - Validation logic is delegated to domain entities
 */
export interface AvailabilitySlotInput {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface DefineAvailabilityInput {
  professionalId: string;
  slots: AvailabilitySlotInput[];
}

export interface DefineAvailabilityOutput {
  createdSlots: number;
}

@Injectable()
export class DefineAvailabilityUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    input: DefineAvailabilityInput,
  ): Promise<DefineAvailabilityOutput> {
    // 1. Validate that user exists and is a professional
    const user = await this.userRepository.findById(input.professionalId);
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.isProfessional()) {
      throw new Error('User is not a professional');
    }

    // 2. Delete existing availability (replace completely)
    await this.availabilityRepository.deleteByProfessionalId(
      input.professionalId,
    );

    // 3. Create domain entities for each slot
    // The Availability entity validates:
    // - Day of week range (0-6)
    // - Time format (HH:mm) via Time VO
    // - Time range (startTime < endTime)
    const availabilitySlots: Availability[] = input.slots.map((slot) => {
      const id = this.idGenerator.generate();
      return new Availability(
        id,
        input.professionalId,
        slot.dayOfWeek,
        slot.startTime,
        slot.endTime,
      );
    });

    // 4. Validate no overlaps using domain logic
    // This validation is in the domain because it's a business rule
    Availability.validateNoOverlaps(availabilitySlots);

    // 5. Persist all slots
    await this.availabilityRepository.createMany(availabilitySlots);

    return {
      createdSlots: availabilitySlots.length,
    };
  }
}
