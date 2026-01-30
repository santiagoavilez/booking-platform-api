// src/interfaces/http/mappers/professional.mapper.ts

import type { User } from '../../../domain/entities/user.entity';
import type { ProfessionalListItemDto } from '../dto/professional-list-item.dto';
import type { ProfessionalListItem } from '../../../application/dtos/search-professionals-result.dto';

/**
 * Maps User entity to HTTP response item (id, firstName, lastName, fullName).
 */
export function toProfessionalListItemDto(user: User): ProfessionalListItemDto {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.getFullName(),
  };
}

/**
 * Maps application ProfessionalListItem to HTTP DTO (same shape; for consistency).
 */
export function toProfessionalListItemDtoFromApp(
  item: ProfessionalListItem,
): ProfessionalListItemDto {
  return {
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    fullName: item.fullName,
  };
}
