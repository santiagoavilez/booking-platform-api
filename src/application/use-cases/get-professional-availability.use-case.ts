// src/application/use-cases/get-professional-availability.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { Availability } from '../../domain/entities/availability.entity';
import { type IAvailabilityRepository } from '../../domain/repositories/availability.repository';
import { EnsureProfessionalExistsUseCase } from './ensure-professional-exists.use-case';
import { AVAILABILITY_REPOSITORY } from '../../interfaces/providers';

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
 * - Single use case for "get availability by professional ID" used by both
 *   GET /availability/me (professionalId from JWT) and GET /availability/:professionalId
 * - Reuses IAvailabilityRepository.findByProfessionalId() method
 *
 * SECURITY:
 * - This use case does NOT validate authentication (handled by JWT guard in controller)
 * - Any authenticated user can query any professional's availability
 * - Only validates that the queried user exists and is a professional (via EnsureProfessionalExistsUseCase)
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
    private readonly ensureProfessionalExistsUseCase: EnsureProfessionalExistsUseCase,
  ) {}

  async execute(
    input: GetProfessionalAvailabilityInput,
  ): Promise<GetProfessionalAvailabilityOutput> {
    // 1. Validate that user exists and is a professional (DRY: shared use case)
    const user = await this.ensureProfessionalExistsUseCase.execute(
      input.professionalId,
    );

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
