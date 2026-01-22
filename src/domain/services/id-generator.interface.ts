// src/domain/services/id-generator.interface.ts

/**
 * ARCHITECTURAL DECISION:
 * - What: Interface for unique ID generation
 * - Why: Separates ID generation from technical implementation (UUID, nanoid, etc.)
 * - Allows changing generation strategy without modifying use cases
 * - Implementation will be in Infrastructure layer
 */
export interface IIdGenerator {
  /**
    * Generates a unique ID
    @returns Unique ID as string
    */
  generate(): string;
}
