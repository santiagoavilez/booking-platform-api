// src/infrastructure/services/bcrypt-password-hasher.ts

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../domain/services/password-hasher.interface';

/**
 * ARCHITECTURAL DECISION:
 * - What: IPasswordHasher implementation using bcrypt
 * - Why: bcrypt is standard for password hashing
 * - Allows changing implementation without affecting use cases
 *
 * CLEAN ARCHITECTURE:
 * - Implements Domain interface (IPasswordHasher)
 * - Located in Infrastructure layer (technical details)
 * - Injected into use cases via Dependency Injection
 */
@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
