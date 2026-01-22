// src/interfaces/providers/services.providers.ts

import { Provider } from '@nestjs/common';
import { IPasswordHasher } from '../../domain/services/password-hasher.interface';
import { IIdGenerator } from '../../domain/services/id-generator.interface';
import { BcryptPasswordHasher } from '../../infrastructure/services/bcrypt-password-hasher';
import { UuidIdGenerator } from '../../infrastructure/services/uuid-id-generator';

/**
 * Token for password hashing service injection
 */
export const PASSWORD_HASHER = Symbol('PasswordHasher');

/**
 * Token for ID generator injection
 */
export const ID_GENERATOR = Symbol('IdGenerator');

/**
 * Provider for password hashing service
 */
export const passwordHasherProvider: Provider<IPasswordHasher> = {
  provide: PASSWORD_HASHER,
  useClass: BcryptPasswordHasher,
};

/**
 * Provider for ID generator
 */
export const idGeneratorProvider: Provider<IIdGenerator> = {
  provide: ID_GENERATOR,
  useClass: UuidIdGenerator,
};
