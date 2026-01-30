// src/application/use-cases/search-professionals.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { type IUserRepository } from '../../domain/repositories/user.repository';
import { USER_REPOSITORY } from '../../interfaces/providers';
import type {
  SearchProfessionalsResult,
  ProfessionalListItem,
} from '../dtos/search-professionals-result.dto';

const MAX_LIMIT = 50;

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case to search professionals with optional name filter and pagination
 * - Why: Single responsibility; available to any authenticated user (clients and professionals)
 *   so that professionals can book appointments with other professionals
 * - Normalizes page/limit (page >= 1, limit clamped to 1..MAX_LIMIT)
 */
@Injectable()
export class SearchProfessionalsUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    search: string | undefined,
    page: number,
    limit: number,
  ): Promise<SearchProfessionalsResult> {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
    const normalizedSearch =
      search !== undefined && search !== null && String(search).trim() !== ''
        ? String(search).trim()
        : undefined;

    const { items: users, total } =
      await this.userRepository.findProfessionalsPaginated(
        normalizedSearch,
        safePage,
        safeLimit,
      );

    const items: ProfessionalListItem[] = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.getFullName(),
    }));

    const totalPages = Math.ceil(total / safeLimit);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    };
  }
}
