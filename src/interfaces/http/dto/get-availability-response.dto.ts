// src/interfaces/http/dto/get-availability-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Slot ID', example: 'uuid-slot-123' })
  id: string;

  @ApiProperty({
    description: 'Day of week (0 = Sunday, 6 = Saturday)',
    example: 1,
  })
  dayOfWeek: number;

  @ApiProperty({ description: 'Start time (HH:mm)', example: '09:00' })
  startTime: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '17:00' })
  endTime: string;
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
  @ApiProperty({ description: 'Professional first name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Professional last name', example: 'Doe' })
  lastName: string;
}
