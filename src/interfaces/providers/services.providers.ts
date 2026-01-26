// src/interfaces/providers/services.providers.ts

import { Provider } from '@nestjs/common';
import { IPasswordHasher } from '../../domain/services/password-hasher.interface';
import { IIdGenerator } from '../../domain/services/id-generator.interface';
import { IJwtTokenGenerator } from '../../domain/services/jwt-token-generator.interface';
import { IJwtTokenVerifier } from '../../domain/services/jwt-token-verifier.interface';
import { BcryptPasswordHasher } from '../../infrastructure/services/bcrypt-password-hasher';
import { UuidIdGenerator } from '../../infrastructure/services/uuid-id-generator';
import { JwtTokenGenerator } from '../../infrastructure/services/jwt-token-generator';
import { JwtTokenVerifier } from '../../infrastructure/services/jwt-token-verifier';

/**
 * Token for password hashing service injection
 */
export const PASSWORD_HASHER = Symbol('PasswordHasher');

/**
 * Token for ID generator injection
 */
export const ID_GENERATOR = Symbol('IdGenerator');

/**
 * Token for JWT token generator injection
 */
export const JWT_TOKEN_GENERATOR = Symbol('JwtTokenGenerator');

/**
 * Token for JWT token verifier injection
 */
export const JWT_TOKEN_VERIFIER = Symbol('JwtTokenVerifier');

/**
 * Provider for password hashing service
 */
export const passwordHasherProvider: Provider<IPasswordHasher> = {
  provide: PASSWORD_HASHER,
  useClass: BcryptPasswordHasher,
};

/**
 * Provider for JWT token generator service
 * Uses useClass to let NestJS handle dependency injection
 * JwtTokenGenerator will receive JWT_CONFIG via constructor injection
 */
export const jwtTokenGeneratorProvider: Provider<IJwtTokenGenerator> = {
  provide: JWT_TOKEN_GENERATOR,
  useClass: JwtTokenGenerator,
};

/**
 * Provider for JWT token verifier service
 * Used by guards to verify incoming JWT tokens
 */
export const jwtTokenVerifierProvider: Provider<IJwtTokenVerifier> = {
  provide: JWT_TOKEN_VERIFIER,
  useClass: JwtTokenVerifier,
};

/**
 * Provider for ID generator
 */
export const idGeneratorProvider: Provider<IIdGenerator> = {
  provide: ID_GENERATOR,
  useClass: UuidIdGenerator,
};
