/* eslint-disable @typescript-eslint/no-unsafe-assignment -- supertest response.body is untyped */
/* eslint-disable @typescript-eslint/no-unsafe-argument -- app.getHttpServer() type from Nest/supertest */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  closeTestApp,
  initTestApp,
  resetTestApp,
  TestAppContext,
} from './helpers/test-app.helper';
import { registerAndGetToken, type AuthResponse } from './helpers/auth.helper';
import { Role } from '../src/domain/enums/role.enum';
import { SearchProfessionalsQueryDto } from 'src/interfaces/http/dto/search-professionals-query.dto';
import type { RegisterUserDto } from 'src/interfaces/http/dto/register-user.dto';
import { DefineAvailabilityDto } from 'src/interfaces/http/dto/define-availability.dto';
import { CreateAppointmentDto } from 'src/interfaces/http/dto/create-appointment.dto';
import { AppointmentResponseDto } from 'src/interfaces/http/mappers/appointment.mapper';

/**
 * Returns the next Monday in YYYY-MM-DD format.
 * Used for appointment tests to ensure the date is in the future and matches availability (dayOfWeek: 1 = Monday).
 */
function getNextMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntilMonday);
  return next.toISOString().slice(0, 10);
}

describe('E2E', () => {
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

  describe('App', () => {
    it('GET / returns Hello World!', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Auth', () => {
    it('POST /auth/register - registers new user and returns tokens', async () => {
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

    it('POST /auth/login - logs in with valid credentials', async () => {
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

    it('POST /auth/refresh - refreshes tokens with valid refresh token', async () => {
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

  describe('Professional', () => {
    it('GET /professionals - returns list of professionals', async () => {
      const DTO: SearchProfessionalsQueryDto = {
        search: 'John Doe',
        page: 1,
        limit: 10,
      };

      const registerProfessionalDto: RegisterUserDto = {
        email: 'john.doe@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.PROFESSIONAL,
      };
      const { token } = await registerAndGetToken(app, registerProfessionalDto);

      const response = await request(app.getHttpServer())
        .get('/professionals')
        .query(DTO)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const body = response.body as {
        success: boolean;
        data: { items: { firstName: string; lastName: string }[] };
      };
      expect(body.success).toBe(true);
      expect(body.data.items).toBeDefined();
      expect(body.data.items.length).toBe(1);
      expect(body.data.items[0].firstName).toBe('John');
      expect(body.data.items[0].lastName).toBe('Doe');
    });
  });

  // availability
  describe('Availability', () => {
    // define availability
    it('POST /availability/me - defines availability for a professional', async () => {
      const registerProfessionalDto: RegisterUserDto = {
        email: 'john.doe@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.PROFESSIONAL,
      };
      const { token } = await registerAndGetToken(app, registerProfessionalDto);

      const defineAvailabilityDto: DefineAvailabilityDto = {
        schedule: [
          {
            dayOfWeek: 1,
            enabled: true,
            timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
          },
        ],
      };
      const defineAvailabilityResponse = await request(app.getHttpServer())
        .post('/availability/me')
        .send(defineAvailabilityDto)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const defineAvailabilityBody = defineAvailabilityResponse.body as {
        success: boolean;
        data: { createdSlots: number };
      };
      const { createdSlots } = defineAvailabilityBody.data;
      expect(createdSlots).toBe(1);
    });

    // get availability
    it('GET /availability/me - returns availability of the authenticated professional', async () => {
      const registerProfessionalDto: RegisterUserDto = {
        email: 'john.doe@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.PROFESSIONAL,
      };
      const { token } = await registerAndGetToken(app, registerProfessionalDto);

      // define availability
      const defineAvailabilityDto: DefineAvailabilityDto = {
        schedule: [
          {
            dayOfWeek: 1,
            enabled: true,
            timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
          },
        ],
      };
      const defineAvailabilityResponse = await request(app.getHttpServer())
        .post('/availability/me')
        .send(defineAvailabilityDto)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const defineAvailabilityBody = defineAvailabilityResponse.body as {
        success: boolean;
        data: { createdSlots: number };
      };
      const { createdSlots } = defineAvailabilityBody.data;
      expect(createdSlots).toBe(1);

      const response = await request(app.getHttpServer())
        .get('/availability/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const body = response.body as {
        success: boolean;
        data: {
          availabilities: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
          }[];
          professional: {
            firstName: string;
            lastName: string;
          };
        };
      };
      expect(body.success).toBe(true);
      expect(body.data.availabilities).toBeDefined();
      expect(body.data.availabilities.length).toBe(1);
      expect(body.data.availabilities[0].dayOfWeek).toBe(1);
      expect(body.data.availabilities[0].startTime).toBe('09:00');
      expect(body.data.availabilities[0].endTime).toBe('17:00');
      expect(body.data.professional.firstName).toBe('John');
      expect(body.data.professional.lastName).toBe('Doe');
    });
  });

  // get professional availability
  it('GET /availability/:professionalId - returns availability of a professional', async () => {
    const registerProfessionalDto: RegisterUserDto = {
      email: 'john.doe@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: Role.PROFESSIONAL,
    };
    const { token, user } = await registerAndGetToken(
      app,
      registerProfessionalDto,
    );

    const defineAvailabilityDto: DefineAvailabilityDto = {
      schedule: [
        {
          dayOfWeek: 1,
          enabled: true,
          timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
        },
      ],
    };
    const defineAvailabilityResponse = await request(app.getHttpServer())
      .post('/availability/me')
      .send(defineAvailabilityDto)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const defineAvailabilityBody = defineAvailabilityResponse.body as {
      success: boolean;
      data: { createdSlots: number };
    };
    const { createdSlots } = defineAvailabilityBody.data;
    expect(createdSlots).toBe(1);

    const response = await request(app.getHttpServer())
      .get(`/availability/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const body = response.body as {
      success: boolean;
      data: {
        availabilities: {
          dayOfWeek: number;
          startTime: string;
          endTime: string;
        }[];
        professional: {
          firstName: string;
          lastName: string;
        };
      };
    };
    expect(body.success).toBe(true);
    expect(body.data.availabilities).toBeDefined();
    expect(body.data.availabilities.length).toBe(1);
    expect(body.data.availabilities[0].dayOfWeek).toBe(1);
    expect(body.data.availabilities[0].startTime).toBe('09:00');
    expect(body.data.availabilities[0].endTime).toBe('17:00');
  });

  // appointments
  describe('Appointments', () => {
    // create appointment
    it('POST /appointments - creates an appointment', async () => {
      const registerProfessionalDto: RegisterUserDto = {
        email: 'john.doe@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.PROFESSIONAL,
      };
      const registerClientDto: RegisterUserDto = {
        email: 'jane.smith@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: Role.CLIENT,
      };
      const clientAuth = await registerAndGetToken(app, registerClientDto);
      const professionalAuth = await registerAndGetToken(
        app,
        registerProfessionalDto,
      );
      const { token: clientToken } = clientAuth;
      const { token: professionalToken } = professionalAuth;
      // define availability
      const defineAvailabilityDto: DefineAvailabilityDto = {
        schedule: [
          {
            dayOfWeek: 1,
            enabled: true,
            timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
          },
        ],
      };
      const defineAvailabilityResponse = await request(app.getHttpServer())
        .post('/availability/me')
        .send(defineAvailabilityDto)
        .set('Authorization', `Bearer ${professionalToken}`)
        .expect(200);

      const defineAvailabilityBody = defineAvailabilityResponse.body as {
        success: boolean;
        data: { createdSlots: number };
      };
      const { createdSlots } = defineAvailabilityBody.data;
      expect(createdSlots).toBe(1);

      const nextMonday = getNextMonday();
      const createAppointmentDto: CreateAppointmentDto = {
        professionalId: professionalAuth.user.id,
        date: nextMonday,
        startTime: '09:00',
        endTime: '10:00',
      };
      const createAppointmentResponse = await request(app.getHttpServer())
        .post('/appointments')
        .send(createAppointmentDto)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(201);
      const createAppointmentBody = createAppointmentResponse.body as {
        success: boolean;
        data: AppointmentResponseDto;
      };
      const appointment = createAppointmentBody.data;
      expect(appointment.professionalId).toBe(professionalAuth.user.id);
      expect(appointment.clientId).toBe(clientAuth.user.id);
      expect(appointment.date).toBe(nextMonday);
      expect(appointment.startTime).toBe('09:00');
      expect(appointment.endTime).toBe('10:00');
    });
    // get my appointments
    it('GET /appointments - returns appointments of the authenticated client', async () => {
      const registerProfessionalDto: RegisterUserDto = {
        email: 'john.doe@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.PROFESSIONAL,
      };
      const registerClientDto: RegisterUserDto = {
        email: 'jane.smith@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: Role.CLIENT,
      };
      const clientAuth = await registerAndGetToken(app, registerClientDto);
      const professionalAuth = await registerAndGetToken(
        app,
        registerProfessionalDto,
      );
      const { token: clientToken } = clientAuth;
      const { token: professionalToken } = professionalAuth;
      // define availability
      const defineAvailabilityDto: DefineAvailabilityDto = {
        schedule: [
          {
            dayOfWeek: 1,
            enabled: true,
            timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
          },
        ],
      };
      const defineAvailabilityResponse = await request(app.getHttpServer())
        .post('/availability/me')
        .send(defineAvailabilityDto)
        .set('Authorization', `Bearer ${professionalToken}`)
        .expect(200);

      const defineAvailabilityBody = defineAvailabilityResponse.body as {
        success: boolean;
        data: { createdSlots: number };
      };
      const { createdSlots } = defineAvailabilityBody.data;
      expect(createdSlots).toBe(1);

      const nextMonday = getNextMonday();
      const createAppointmentDto: CreateAppointmentDto = {
        professionalId: professionalAuth.user.id,
        date: nextMonday,
        startTime: '09:00',
        endTime: '10:00',
      };
      const createAppointmentResponse = await request(app.getHttpServer())
        .post('/appointments')
        .send(createAppointmentDto)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(201);
      const createAppointmentBody = createAppointmentResponse.body as {
        success: boolean;
        data: AppointmentResponseDto;
      };
      const appointment = createAppointmentBody.data;
      expect(appointment.professionalId).toBe(professionalAuth.user.id);
      expect(appointment.clientId).toBe(clientAuth.user.id);
      expect(appointment.date).toBe(nextMonday);
      expect(appointment.startTime).toBe('09:00');
      expect(appointment.endTime).toBe('10:00');

      const response = await request(app.getHttpServer())
        .get('/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);
      const body = response.body as {
        success: boolean;
        data: AppointmentResponseDto[];
      };
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.length).toBe(1);
      expect(body.data[0].professionalId).toBe(professionalAuth.user.id);
      expect(body.data[0].clientId).toBe(clientAuth.user.id);
      expect(body.data[0].date).toBe(nextMonday);
      expect(body.data[0].startTime).toBe('09:00');
      expect(body.data[0].endTime).toBe('10:00');
      expect(body.data[0].professional.firstName).toBe('John');
      expect(body.data[0].professional.lastName).toBe('Doe');
      expect(body.data[0].client.firstName).toBe('Jane');
      expect(body.data[0].client.lastName).toBe('Smith');
    });
  });
});
