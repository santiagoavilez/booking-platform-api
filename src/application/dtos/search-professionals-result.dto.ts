// src/application/dtos/search-professionals-result.dto.ts

/**
 * Application-level result for search professionals use case.
 * Used by SearchProfessionalsUseCase; mapper converts items to HTTP DTO.
 */
export interface ProfessionalListItem {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface SearchProfessionalsResult {
  items: ProfessionalListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
