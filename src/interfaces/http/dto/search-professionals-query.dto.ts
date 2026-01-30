// src/interfaces/http/dto/search-professionals-query.dto.ts

import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Query DTO for GET /professionals
 * search: optional name filter (firstName + lastName)
 * page: 1-based, default 1
 * limit: page size, default 6, max 50
 */
export class SearchProfessionalsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'limit must be at least 1' })
  @Max(50, { message: 'limit must be at most 50' })
  limit?: number;
}
