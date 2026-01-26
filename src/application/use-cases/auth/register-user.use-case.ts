// src/application/use-cases/auth/register-user.use-case.ts

import { Injectable, Inject, forwardRef } from '@nestjs/common';
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
import { LoginUseCase, type LoginOutput } from './login.use-case';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case for user registration with automatic login
 * - Why: Centralizes registration logic and automatically authenticates the user
 * - Alternatives: Logic in controller, but would violate Single Responsibility
 *
 * COMPOSITION PATTERN:
 * - This use case composes LoginUseCase to generate tokens after registration
 * - This is a VALID Clean Architecture pattern: use cases can compose other use cases
 * - Avoids code duplication and reuses tested login logic
 *
 * RESPONSIBILITIES:
 * - Validate that email does not exist
 * - Hash password using IPasswordHasher (injected from Infrastructure)
 * - Generate unique ID using IIdGenerator (injected from Infrastructure)
 * - Create user with appropriate role
 * - Persist to database using IUserRepository (interface)
 * - Auto-login: Generate tokens using LoginUseCase
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
  firstName: string;
  lastName: string;
}

/**
 * ARCHITECTURAL DECISION:
 * - What: RegisterUserOutput now includes authentication tokens
 * - Why: Auto-login after registration improves UX - user doesn't need to login separately
 * - Pattern: Returns same structure as LoginOutput for consistency
 */
export type RegisterUserOutput = LoginOutput;

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IIdGenerator,
    @Inject(forwardRef(() => LoginUseCase))
    private readonly loginUseCase: LoginUseCase,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // 1. Validate that email does not exist
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // 2. Hash password using injected service (implemented in Infrastructure)
    const passwordHash = await this.passwordHasher.hash(input.password);

    // 3. Generate unique ID using injected service (implemented in Infrastructure)
    const userId = this.idGenerator.generate();

    // 4. Create domain entity
    const user = new User(
      userId,
      input.email,
      passwordHash,
      input.role,
      input.firstName,
      input.lastName,
    );

    // 5. Persist using repository (interface, implementation in Infrastructure)
    await this.userRepository.create(user);

    /**
     * 6. Auto-login: Generate tokens by calling LoginUseCase
     *
     * ARCHITECTURAL DECISION:
     * - What: Compose LoginUseCase instead of duplicating token generation logic
     * - Why: Follows DRY principle and reuses tested login logic
     * - Pattern: Use case composition is valid in Clean Architecture
     *
     * We pass the plaintext password (from input) which LoginUseCase
     * will verify against the just-saved hash - this will always succeed
     * since we just created the user with that password.
     */
    const loginResult = await this.loginUseCase.execute({
      email: input.email,
      password: input.password,
    });

    return loginResult;
  }
}
