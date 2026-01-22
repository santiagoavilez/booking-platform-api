// src/application/use-cases/auth/login.use-case.ts

import { Injectable } from '@nestjs/common';
import { type IUserRepository } from '../../../domain/repositories/user.repository';
import * as bcrypt from 'bcrypt';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case for user authentication
 * - Why: Separates authentication logic from HTTP controller
 * - Responsibilities: Validate credentials and generate JWT token
 */
export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    // JWT service will come from infrastructure
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Verify password (will be implemented with infrastructure service)
    const isValidPassword = await this.verifyPassword(
      input.password,
      user['passwordHash'], // Temporary access, will be improved with method in User
    );
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // 3. Generate JWT token (will be implemented in infrastructure)
    const token = await this.generateToken(user.id, user.role);

    // 4. Return token and user data
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // Placeholder - will be implemented in infrastructure
  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    // TODO: Implement with bcrypt.compare
    return bcrypt.compare(password, hash);
  }

  // Placeholder - will be implemented in infrastructure
  private async generateToken(userId: string, role: string): Promise<string> {
    // TODO: Implement with JWT service
    return Promise.resolve('token' + userId + role);
  }
}
