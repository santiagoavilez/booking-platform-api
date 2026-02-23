// src/interfaces/http/dto/search-professionals-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Query DTO for GET /professionals
 * search: optional name filter (firstName + lastName)
 * page: 1-based, default 1
 * limit: page size, default 6, max 50
 */
export class SearchProfessionalsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by full name (firstName + lastName)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page (max 50)',
    example: 6,
    default: 6,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'limit must be at least 1' })
  @Max(50, { message: 'limit must be at most 50' })
  limit?: number;
}
