// src/application/use-cases/get-professional-availability.use-case.ts

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
 * - What: Use case for retrieving availability slots of a specific professional
 * - Why: Orchestrates the business flow without containing business logic
 * - Responsibilities:
 *   - Validate that the professional exists and is a professional
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
 * - Reuses professional validation pattern from GetMyAvailabilityUseCase
 * - Reuses IAvailabilityRepository.findByProfessionalId() method
 *
 * SECURITY:
 * - This use case does NOT validate authentication (handled by JWT guard in controller)
 * - Any authenticated user can query any professional's availability
 * - Only validates that the queried user exists and is a professional
 */
export interface GetProfessionalAvailabilityInput {
  professionalId: string;
}

export interface GetProfessionalAvailabilityOutput {
  availabilities: Availability[];
  professional: {
    firstName: string;
    lastName: string;
  };
}

@Injectable()
export class GetProfessionalAvailabilityUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    input: GetProfessionalAvailabilityInput,
  ): Promise<GetProfessionalAvailabilityOutput> {
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
      professional: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}
