// src/interfaces/http/dto/refresh-token.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * ARCHITECTURAL DECISION:
 * - What: DTO for refresh token request
 * - Why: Validates HTTP request data before it reaches use case
 * - Responsibilities: Input validation using class-validator
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
