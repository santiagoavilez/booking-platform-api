// src/application/use-cases/ensure-professional-exists.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { type IUserRepository } from '../../domain/repositories/user.repository';
import { USER_REPOSITORY } from '../../interfaces/providers';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case that validates a user exists and is a professional; returns the User or throws.
 * - Why: DRY - multiple use cases (get availability, define availability, create appointment)
 *   require the same precondition. Extracting to a single use case avoids duplication.
 * - Layer: Application (orchestration + precondition for other use cases).
 *
 * CLEAN ARCHITECTURE:
 * - Depends only on domain interface IUserRepository.
 * - Does not contain business rules; delegates "is professional?" to domain (User.isProfessional()).
 *
 * Usage: Other use cases inject this and call execute(professionalId) before their main logic.
 */
@Injectable()
export class EnsureProfessionalExistsUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Resolves the user by ID and ensures they are a professional.
   *
   * @param professionalId - User ID to validate
   * @returns The User entity if found and is a professional
   * @throws Error with message "User not found" or "User is not a professional"
   */
  async execute(professionalId: string): Promise<User> {
    const user = await this.userRepository.findById(professionalId);
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.isProfessional()) {
      throw new Error('User is not a professional');
    }
    return user;
  }
}
