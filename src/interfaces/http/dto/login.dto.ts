import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * @param email - User email
 * @param password - User password
 * @returns LoginDto
 * @example
 * {
 *   email: 'test@example.com',
 *   password: 'password123'
 * }
 */
export class LoginDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password (6-20 characters)',
    example: 'password123',
    minLength: 6,
    maxLength: 20,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(20, { message: 'Password must be less than 20 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
