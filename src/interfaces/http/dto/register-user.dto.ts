// src/interfaces/http/dto/register-user.dto.ts

import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../../domain/enums/role.enum';

/**
 * ARCHITECTURAL DECISION:
 * - What: DTO to validate the input of the register endpoint
 * - Why: Validate HTTP data before passing it to the use case
 * - Uses class-validator for automatic validation with NestJS
 *
 * CLEAN ARCHITECTURE:
 * - Is in Interfaces layer (HTTP adapter)
 * - Is transformed to RegisterUserInput before calling the use case
 */
export class RegisterUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsEnum(Role, { message: 'Role must be either CLIENT or PROFESSIONAL' })
  role: Role;
}
