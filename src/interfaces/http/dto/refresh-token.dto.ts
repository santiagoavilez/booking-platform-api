// src/interfaces/http/dto/refresh-token.dto.ts

import { IsString, IsNotEmpty } from 'class-validator';

/**
 * ARCHITECTURAL DECISION:
 * - What: DTO for refresh token request
 * - Why: Validates HTTP request data before it reaches use case
 * - Responsibilities: Input validation using class-validator
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
