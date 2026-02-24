import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { RegisterUserDto } from '../../src/interfaces/http/dto/register-user.dto';

export interface AuthResponseData {
  token: string;
  refreshToken: string;
  expiresAt: number;
  refreshTokenExpiresAt: number;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export interface AuthResponse {
  success: boolean;
  data: AuthResponseData;
}

/**
 * Registers a user and returns the auth data (token, refreshToken, user).
 * Reusable helper to avoid DRY violations in E2E tests that need a bearer token.
 *
 * @param app - NestJS application instance (from test context)
 * @param dto - RegisterUserDto with email, password, role, firstName, lastName
 * @returns AuthResponseData with token, refreshToken, and user
 */
export async function registerAndGetToken(
  app: INestApplication,
  dto: RegisterUserDto,
): Promise<AuthResponseData> {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send(dto)
    .expect(201);

  const body = response.body as AuthResponse;
  return body.data;
}
