// src/application/use-cases/auth/register-user.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { Role } from '../../../domain/enums/role.enum';
import { type IUserRepository } from '../../../domain/repositories/user.repository';
import { type IPasswordHasher } from '../../../domain/services/password-hasher.interface';
import { type IIdGenerator } from '../../../domain/services/id-generator.interface';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
  ID_GENERATOR,
} from '../../../interfaces/providers';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case for user registration
 * - Why: Centralizes registration logic, validations and user creation
 * - Alternatives: Logic in controller, but would violate Single Responsibility
 *
 * RESPONSIBILITIES:
 * - Validate that email does not exist
 * - Hash password using IPasswordHasher (injected from Infrastructure)
 * - Generate unique ID using IIdGenerator (injected from Infrastructure)
 * - Create user with appropriate role
 * - Persist to database using IUserRepository (interface)
 *
 * CLEAN ARCHITECTURE:
 * - Depends ONLY on Domain interfaces (IUserRepository, IPasswordHasher, IIdGenerator)
 * - Does NOT know concrete implementations (Drizzle ORM, bcrypt, UUID, etc.)
 * - Implementations are injected via Dependency Injection in Infrastructure layer
 */
export interface RegisterUserInput {
  email: string;
  password: string;
  role: Role;
}

export interface RegisterUserOutput {
  id: string;
  email: string;
  role: Role;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // 1. Validate basic email format
    if (!this.isValidEmail(input.email)) {
      throw new Error('Invalid email format');
    }

    // 2. Validate that email does not exist
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // 3. Validate minimum password length
    if (input.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // 4. Hash password using injected service (implemented in Infrastructure)
    const passwordHash = await this.passwordHasher.hash(input.password);

    // 5. Generate unique ID using injected service (implemented in Infrastructure)
    const userId = this.idGenerator.generate();

    // 6. Create domain entity
    const user = new User(userId, input.email, passwordHash, input.role);

    // 7. Persist using repository (interface, implementation in Infrastructure)
    const savedUser = await this.userRepository.create(user);

    // 8. Return result (without exposing passwordHash for security)
    return {
      id: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };
  }

  /**
   * Basic email format validation
   * For more robust validation, an Email Value Object could be created in Domain
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
