// src/infrastructure/services/uuid-id-generator.ts

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IIdGenerator } from '../../domain/services/id-generator.interface';

/**
 * ARCHITECTURAL DECISION:
 * - What: IIdGenerator implementation using UUID v4
 * - Why: UUID is standard for distributed unique IDs
 * - Allows changing strategy (nanoid, cuid, etc.) without affecting use cases
 *
 * CLEAN ARCHITECTURE:
 * - Implements Domain interface (IIdGenerator)
 * - Located in Infrastructure layer (technical details)
 * - Injected into use cases via Dependency Injection
 */
@Injectable()
export class UuidIdGenerator implements IIdGenerator {
  generate(): string {
    return uuidv4();
  }
}
