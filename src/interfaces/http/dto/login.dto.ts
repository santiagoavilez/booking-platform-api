import { IsEmail } from 'class-validator';
import { IsNotEmpty } from 'class-validator';
import { IsString } from 'class-validator';
import { MinLength } from 'class-validator';
import { MaxLength } from 'class-validator';

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
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(20, { message: 'Password must be less than 20 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
