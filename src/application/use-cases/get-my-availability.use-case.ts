// src/application/use-cases/get-my-availability.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { Availability } from '../../domain/entities/availability.entity';
import { type IAvailabilityRepository } from '../../domain/repositories/availability.repository';
import { type IUserRepository } from '../../domain/repositories/user.repository';
import {
  AVAILABILITY_REPOSITORY,
  USER_REPOSITORY,
} from '../../interfaces/providers';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case for retrieving availability slots of the authenticated professional
 * - Why: Orchestrates the business flow without containing business logic
 * - Responsibilities:
 *   - Validate that user exists and is a professional
 *   - Fetch availability slots from repository
 *   - Return domain entities
 *
 * CLEAN ARCHITECTURE:
 * - Depends ONLY on Domain interfaces (IAvailabilityRepository, IUserRepository)
 * - Does NOT know concrete implementations
 * - Business logic (validation) is in Domain layer
 * - Implementations are injected via Dependency Injection
 *
 * SOLID - Single Responsibility:
 * - This use case ONLY orchestrates the retrieval flow
 * - Validation logic is delegated to domain entities (User.isProfessional())
 *
 * DRY:
 * - Reuses professional validation pattern from DefineAvailabilityUseCase
 * - Reuses IAvailabilityRepository.findByProfessionalId() method
 */
export interface GetMyAvailabilityInput {
  professionalId: string;
}

export interface GetMyAvailabilityOutput {
  availabilities: Availability[];
}

@Injectable()
export class GetMyAvailabilityUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    input: GetMyAvailabilityInput,
  ): Promise<GetMyAvailabilityOutput> {
    // 1. Validate that user exists and is a professional
    // This validation ensures only professionals can have availability
    const user = await this.userRepository.findById(input.professionalId);
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.isProfessional()) {
      throw new Error('User is not a professional');
    }

    // 2. Fetch availability slots from repository
    const availabilities =
      await this.availabilityRepository.findByProfessionalId(
        input.professionalId,
      );

    return {
      availabilities,
    };
  }
}
