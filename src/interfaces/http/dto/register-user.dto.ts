// src/interfaces/http/dto/register-user.dto.ts

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
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

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;
}
