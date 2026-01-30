// src/interfaces/http/controllers/professional.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchProfessionalsUseCase } from '../../../application/use-cases/search-professionals.use-case';
import { SearchProfessionalsQueryDto } from '../dto/search-professionals-query.dto';
import { toProfessionalListItemDtoFromApp } from '../mappers/professional.mapper';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 6;

/**
 * ARCHITECTURAL DECISION:
 * - What: HTTP controller for professional listing (search)
 * - Why: Exposes search professionals to any authenticated user (clients and professionals)
 * - Responsibilities: Receive query params, validate DTO, call use case, return paginated list
 *
 * CLEAN ARCHITECTURE:
 * - Is in Interfaces layer (outermost)
 * - Is THIN: only orchestrates, no business logic
 */
@Controller('professionals')
@UseGuards(JwtAuthGuard)
export class ProfessionalController {
  constructor(
    private readonly searchProfessionalsUseCase: SearchProfessionalsUseCase,
  ) {}

  /**
   * GET /professionals?search=...&page=1&limit=6
   * Returns paginated list of professionals, optionally filtered by full name.
   * Available to any authenticated user (clients and professionals).
   */
  @Get()
  async search(@Query() query: SearchProfessionalsQueryDto): Promise<{
    success: true;
    data: {
      items: Array<{
        id: string;
        firstName: string;
        lastName: string;
        fullName: string;
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const result = await this.searchProfessionalsUseCase.execute(
      query.search,
      page,
      limit,
    );
    const items = result.items.map(toProfessionalListItemDtoFromApp);
    return {
      success: true,
      data: {
        items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}
