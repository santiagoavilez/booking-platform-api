// src/interfaces/http/dto/professional-list-item.dto.ts

/**
 * Response item shape for GET /professionals
 * One professional in the paginated list
 */
export interface ProfessionalListItemDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}
