// src/interfaces/http/dto/register-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../domain/enums/role.enum';

/**
 * DTO to validate the input of the register endpoint
 *
 * @example
 * {
 *   email: 'user@example.com',
 *   password: 'password123',
 *   role: Role.CLIENT,
 *   firstName: 'John',
 *   lastName: 'Doe',
 * }
 */
export class RegisterUserDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Password (min 6 characters)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.CLIENT,
  })
  @IsEnum(Role, { message: 'Role must be either CLIENT or PROFESSIONAL' })
  role: Role;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;
}
