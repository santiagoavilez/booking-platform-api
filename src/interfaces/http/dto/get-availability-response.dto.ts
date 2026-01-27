// src/interfaces/http/dto/get-availability-response.dto.ts

/**
 * ARCHITECTURAL DECISION:
 * - What: DTO for availability slot response
 * - Why: Defines the structure of availability data returned to the client
 * - Structure: Matches domain entity structure but excludes professionalId (user is requesting their own)
 *
 * CLEAN ARCHITECTURE:
 * - Is in Interfaces layer (HTTP adapter)
 * - Transforms domain entities to HTTP response format
 * - Does not contain business logic
 */
export class AvailabilitySlotResponseDto {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

/**
 * ARCHITECTURAL DECISION:
 * - What: DTO for professional information in availability responses
 * - Why: Provides professional identification data along with availability slots
 * - Structure: Contains only public information (firstName, lastName)
 *
 * CLEAN ARCHITECTURE:
 * - Is in Interfaces layer (HTTP adapter)
 * - Transforms domain entities to HTTP response format
 * - Does not contain business logic
 */
export class ProfessionalInfoDto {
  firstName: string;
  lastName: string;
}
