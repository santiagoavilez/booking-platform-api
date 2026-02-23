/* eslint-disable @typescript-eslint/no-unsafe-assignment -- supertest response.body is untyped */
/* eslint-disable @typescript-eslint/no-unsafe-argument -- app.getHttpServer() type from Nest/supertest */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  initTestApp,
  closeTestApp,
  resetTestApp,
  TestAppContext,
} from './helpers/test-app.helper';
import { Role } from '../src/domain/enums/role.enum';

interface AuthResponseData {
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

interface AuthResponse {
  success: boolean;
  data: AuthResponseData;
}

describe('AuthController (e2e)', () => {
  let testContext: TestAppContext;
  let app: INestApplication;

  beforeAll(async () => {
    testContext = await initTestApp();
    app = testContext.app;
  });

  afterAll(async () => {
    await closeTestApp(testContext);
  });

  beforeEach(async () => {
    await resetTestApp(testContext);
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return tokens (happy path)', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        role: Role.CLIENT,
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const body = response.body as AuthResponse;
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.token).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      expect(body.data.expiresAt).toBeDefined();
      expect(body.data.refreshTokenExpiresAt).toBeDefined();
      expect(body.data.user).toEqual({
        id: expect.any(String),
        email: 'newuser@example.com',
        role: Role.CLIENT,
        firstName: 'John',
        lastName: 'Doe',
      });
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials (happy path)', async () => {
      const registerDto = {
        email: 'loginuser@example.com',
        password: 'password123',
        role: Role.PROFESSIONAL,
        firstName: 'Jane',
        lastName: 'Smith',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: 'password123',
        })
        .expect(200);

      const body = response.body as AuthResponse;
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.token).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      expect(body.data.user).toEqual({
        id: expect.any(String),
        email: 'loginuser@example.com',
        role: Role.PROFESSIONAL,
        firstName: 'Jane',
        lastName: 'Smith',
      });
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with valid refresh token (happy path)', async () => {
      const registerDto = {
        email: 'refreshuser@example.com',
        password: 'password123',
        role: Role.CLIENT,
        firstName: 'Refresh',
        lastName: 'User',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const registerBody = registerResponse.body as AuthResponse;
      const { refreshToken } = registerBody.data;

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const body = response.body as AuthResponse;
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.token).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      // Refresh token is always new (UUID); access token may match if generated in same second
      expect(body.data.refreshToken).not.toBe(refreshToken);
      expect(body.data.user).toEqual({
        id: expect.any(String),
        email: 'refreshuser@example.com',
        role: Role.CLIENT,
        firstName: 'Refresh',
        lastName: 'User',
      });
    });
  });
});
