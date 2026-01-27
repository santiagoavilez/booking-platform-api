// src/application/use-cases/auth/login.use-case.spec.ts

/**
 * UNIT TESTS FOR LoginUseCase
 *
 * ESTRATEGIA DE TESTING:
 * Usamos MOCKS en lugar de una base de datos real porque:
 * 1. Los tests unitarios deben ser AISLADOS - solo probamos el use case
 * 2. Los tests deben ser RAPIDOS - no hay conexion a BD
 * 3. Los tests deben ser DETERMINISTAS - controlamos exactamente que devuelven los mocks
 * 4. Seguimos Clean Architecture - el use case depende de INTERFACES, no implementaciones
 *
 * PATRON AAA (Arrange-Act-Assert):
 * - ARRANGE: Preparar los datos y configurar los mocks
 * - ACT: Ejecutar el metodo que estamos probando
 * - ASSERT: Verificar que el resultado es el esperado
 */

import { LoginUseCase, LoginInput, LoginOutput } from './login.use-case';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository';
import { IJwtTokenGenerator } from '../../../domain/services/jwt-token-generator.interface';
import { IPasswordHasher } from '../../../domain/services/password-hasher.interface';
import { IIdGenerator } from '../../../domain/services/id-generator.interface';
import { JwtConfig } from '../../../interfaces/providers/config.providers';
import { User } from '../../../domain/entities/user.entity';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { Role } from '../../../domain/enums/role.enum';

/**
 * EXPLICACION DE MOCKS:
 *
 * Un MOCK es un objeto "falso" que simula el comportamiento de una dependencia real.
 *
 * Por ejemplo, en lugar de tener un UserRepository real que se conecta a PostgreSQL,
 * creamos un objeto con los mismos metodos pero que devuelve datos que nosotros controlamos.
 *
 * jest.fn() crea una "funcion espia" que:
 * 1. Registra cuantas veces fue llamada
 * 2. Registra con que argumentos fue llamada
 * 3. Permite definir que valor debe retornar (con mockResolvedValue o mockReturnValue)
 */
describe('LoginUseCase', () => {
  // ============================================================
  // ARRANGE GLOBAL - Variables que usaremos en todos los tests
  // ============================================================

  /**
   * El use case que vamos a probar
   */
  let loginUseCase: LoginUseCase;

  /**
   * Mocks de las dependencias del use case
   *
   * jest.Mocked<T> es un tipo que indica que es una version mockeada de T
   * Esto nos da autocompletado y type safety
   */
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockRefreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;
  let mockJwtTokenGenerator: jest.Mocked<IJwtTokenGenerator>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockIdGenerator: jest.Mocked<IIdGenerator>;
  let mockUserRepositoryFindByEmail: jest.MockedFunction<
    IUserRepository['findByEmail']
  >;
  let mockPasswordHasherCompare: jest.MockedFunction<
    IPasswordHasher['compare']
  >;
  let mockJwtTokenGeneratorGenerateToken: jest.MockedFunction<
    IJwtTokenGenerator['generateToken']
  >;
  let mockRefreshTokenRepositoryCreate: jest.MockedFunction<
    IRefreshTokenRepository['create']
  >;
  let mockIdGeneratorGenerate: jest.MockedFunction<IIdGenerator['generate']>;
  let mockJwtConfig: JwtConfig;

  /**
   * Datos de prueba que reutilizaremos
   */
  const testUserId = 'user-123';
  const testEmail = 'test@example.com';
  const testPassword = 'password123';
  const testPasswordHash = 'hashed_password_123';
  const testJwtToken = 'jwt.token.here';
  const testRefreshTokenId = 'refresh-token-id-123';
  const testRefreshTokenValue = 'refresh-token-value-456';
  const testExpirationTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hora desde ahora

  /**
   * Usuario de prueba que simula lo que devolveria la BD
   */
  const createTestUser = (): User => {
    return new User(
      testUserId,
      testEmail,
      testPasswordHash,
      Role.CLIENT,
      'John',
      'Doe',
    );
  };

  // ============================================================
  // beforeEach - Se ejecuta ANTES de cada test
  // ============================================================
  /**
   * beforeEach:
   * - Se ejecuta antes de CADA test (it)
   * - Aqui reiniciamos todos los mocks para que cada test empiece "limpio"
   * - Esto evita que un test afecte a otro
   */
  beforeEach(() => {
    /**
     * Creamos los mocks de cada dependencia
     *
     * Para cada metodo del interface, usamos jest.fn() que crea una funcion espia
     * mockResolvedValue() define que valor devuelve la Promise cuando se resuelve
     * mockReturnValue() define que valor devuelve (para funciones sincronas)
     */

    mockUserRepositoryFindByEmail = jest.fn();
    // Mock del UserRepository
    mockUserRepository = {
      findByEmail: mockUserRepositoryFindByEmail,
      findById: jest.fn(),
      create: jest.fn(),
    };

    mockRefreshTokenRepositoryCreate = jest.fn();
    // Mock del RefreshTokenRepository
    mockRefreshTokenRepository = {
      create: mockRefreshTokenRepositoryCreate,
      findByToken: jest.fn(),
      findByUserId: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
      deleteExpired: jest.fn(),
    };

    mockJwtTokenGeneratorGenerateToken = jest
      .fn()
      .mockResolvedValue(testJwtToken);
    // Mock del JwtTokenGenerator
    mockJwtTokenGenerator = {
      generateToken: mockJwtTokenGeneratorGenerateToken,
      getExpirationTimestamp: jest
        .fn()
        .mockReturnValue(testExpirationTimestamp),
    };

    mockPasswordHasherCompare = jest.fn();
    // Mock del PasswordHasher
    mockPasswordHasher = {
      hash: jest.fn(),
      compare: mockPasswordHasherCompare,
    };

    // Mock del IdGenerator - genera IDs secuenciales para los tests
    let idCounter = 0;
    mockIdGeneratorGenerate = jest.fn().mockImplementation(() => {
      idCounter++;
      return idCounter === 1 ? testRefreshTokenId : testRefreshTokenValue;
    });
    mockIdGenerator = {
      generate: mockIdGeneratorGenerate,
    };

    // Mock de la configuracion JWT
    mockJwtConfig = {
      secret: 'test-secret',
      expirationTime: '1h',
      refreshTokenExpirationTime: '7d',
    };

    /**
     * Creamos la instancia del use case CON los mocks inyectados
     *
     * Normalmente NestJS hace esto automaticamente con DI (Dependency Injection)
     * En los tests, lo hacemos manualmente pasando los mocks
     */
    loginUseCase = new LoginUseCase(
      mockUserRepository,
      mockJwtTokenGenerator,
      mockPasswordHasher,
      mockRefreshTokenRepository,
      mockIdGenerator,
      mockJwtConfig,
    );
  });

  // ============================================================
  // TESTS
  // ============================================================

  /**
   * describe() agrupa tests relacionados
   * Usamos describe anidados para organizar mejor los tests
   */
  describe('execute', () => {
    // ----------------------------------------------------------
    // TEST 1: Happy Path - Login exitoso
    // ----------------------------------------------------------
    /**
     * it() define un test individual
     * El string describe QUE deberia pasar si el codigo funciona correctamente
     */
    it('should return tokens and user data when credentials are valid', async () => {
      // ========== ARRANGE ==========
      // Preparamos el escenario: usuario existe y password es correcto

      const testUser = createTestUser();
      const loginInput: LoginInput = {
        email: testEmail,
        password: testPassword,
      };

      /**
       * Configuramos que debe devolver cada mock cuando sea llamado
       *
       * mockResolvedValue: Para funciones async que devuelven Promises
       * El valor que pasamos es lo que devolvera cuando se llame al metodo
       */
      mockUserRepositoryFindByEmail.mockResolvedValue(testUser);
      mockPasswordHasherCompare.mockResolvedValue(true); // Password correcto

      // Mock de create que devuelve el token creado
      mockRefreshTokenRepositoryCreate.mockResolvedValue(
        new RefreshToken(
          testRefreshTokenId,
          testRefreshTokenValue,
          testUserId,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
          new Date(),
        ),
      );

      // ========== ACT ==========
      // Ejecutamos el metodo que queremos probar
      const result: LoginOutput = await loginUseCase.execute(loginInput);

      // ========== ASSERT ==========
      // Verificamos que el resultado es el esperado

      /**
       * expect() crea una "expectativa"
       * .toBe() verifica igualdad estricta (===)
       * .toEqual() verifica igualdad profunda (para objetos)
       */

      // Verificamos el token JWT
      expect(result.token).toBe(testJwtToken);
      expect(result.expiresAt).toBe(testExpirationTimestamp);

      // Verificamos el refresh token
      expect(result.refreshToken).toBe(testRefreshTokenValue);
      expect(result.refreshTokenExpiresAt).toBeGreaterThan(
        Math.floor(Date.now() / 1000),
      );

      // Verificamos los datos del usuario
      expect(result.user).toEqual({
        id: testUserId,
        email: testEmail,
        role: Role.CLIENT,
        firstName: 'John',
        lastName: 'Doe',
      });

      /**
       * toHaveBeenCalled() verifica que el mock fue llamado
       * toHaveBeenCalledWith() verifica que fue llamado con argumentos especificos
       *
       * Esto es importante para verificar que el use case interactua
       * correctamente con sus dependencias
       */
      expect(mockUserRepositoryFindByEmail).toHaveBeenCalledWith(testEmail);
      expect(mockPasswordHasherCompare).toHaveBeenCalledWith(
        testPassword,
        testPasswordHash,
      );
      expect(mockJwtTokenGeneratorGenerateToken).toHaveBeenCalledWith(
        testUserId,
        Role.CLIENT,
      );
      expect(mockRefreshTokenRepositoryCreate).toHaveBeenCalled();
    });

    // ----------------------------------------------------------
    // TEST 2: Error - Usuario no encontrado
    // ----------------------------------------------------------
    it('should throw error when user is not found', async () => {
      // ========== ARRANGE ==========
      const loginInput: LoginInput = {
        email: 'nonexistent@example.com',
        password: testPassword,
      };

      /**
       * Configuramos el mock para que devuelva null
       * Esto simula que el usuario no existe en la BD
       */
      mockUserRepositoryFindByEmail.mockResolvedValue(null);

      // ========== ACT & ASSERT ==========
      /**
       * Para probar que una funcion lanza un error, usamos:
       * expect(async () => ...).rejects.toThrow('mensaje')
       *
       * rejects: indica que esperamos que la Promise sea rechazada
       * toThrow: verifica que se lanza un Error con el mensaje especificado
       */
      await expect(loginUseCase.execute(loginInput)).rejects.toThrow(
        'Invalid credentials',
      );

      // Verificamos que NO se llamo a passwordHasher.compare
      // (porque el flujo se detuvo antes)
      expect(mockPasswordHasherCompare).not.toHaveBeenCalled();

      // Verificamos que NO se genero ningun token
      expect(mockJwtTokenGeneratorGenerateToken).not.toHaveBeenCalled();
    });

    // ----------------------------------------------------------
    // TEST 3: Error - Password incorrecto
    // ----------------------------------------------------------
    it('should throw error when password is invalid', async () => {
      // ========== ARRANGE ==========
      const testUser = createTestUser();
      const loginInput: LoginInput = {
        email: testEmail,
        password: 'wrong_password',
      };

      // Usuario existe
      mockUserRepositoryFindByEmail.mockResolvedValue(testUser);
      // Pero el password es incorrecto
      mockPasswordHasherCompare.mockResolvedValue(false);

      // ========== ACT & ASSERT ==========
      await expect(loginUseCase.execute(loginInput)).rejects.toThrow(
        'Invalid credentials',
      );

      // Verificamos que SI se llamo a compare (para verificar el password)
      expect(mockPasswordHasherCompare).toHaveBeenCalledWith(
        'wrong_password',
        testPasswordHash,
      );

      // Verificamos que NO se genero ningun token
      expect(mockJwtTokenGeneratorGenerateToken).not.toHaveBeenCalled();
    });

    // ----------------------------------------------------------
    // TEST 4: Verificar que se crea el refresh token correctamente
    // ----------------------------------------------------------
    it('should create refresh token with correct data', async () => {
      // ========== ARRANGE ==========
      const testUser = createTestUser();
      const loginInput: LoginInput = {
        email: testEmail,
        password: testPassword,
      };

      mockUserRepositoryFindByEmail.mockResolvedValue(testUser);
      mockPasswordHasherCompare.mockResolvedValue(true);
      mockRefreshTokenRepositoryCreate.mockResolvedValue(
        new RefreshToken(
          testRefreshTokenId,
          testRefreshTokenValue,
          testUserId,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          new Date(),
        ),
      );

      // ========== ACT ==========
      await loginUseCase.execute(loginInput);

      // ========== ASSERT ==========
      /**
       * Verificamos que create() fue llamado con un RefreshToken valido
       *
       * toHaveBeenCalledWith() con expect.any() permite verificar
       * que el argumento sea de un tipo especifico sin verificar
       * el valor exacto
       */
      expect(mockRefreshTokenRepositoryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: testRefreshTokenId,
          token: testRefreshTokenValue,
          userId: testUserId,
        }),
      );
    });

    // ----------------------------------------------------------
    // TEST 5: Verificar estructura completa del output
    // ----------------------------------------------------------
    it('should return output with correct structure', async () => {
      // ========== ARRANGE ==========
      const testUser = createTestUser();
      const loginInput: LoginInput = {
        email: testEmail,
        password: testPassword,
      };

      mockUserRepositoryFindByEmail.mockResolvedValue(testUser);
      mockPasswordHasherCompare.mockResolvedValue(true);
      mockRefreshTokenRepositoryCreate.mockResolvedValue(
        new RefreshToken(
          testRefreshTokenId,
          testRefreshTokenValue,
          testUserId,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          new Date(),
        ),
      );

      // ========== ACT ==========
      const result = await loginUseCase.execute(loginInput);

      // ========== ASSERT ==========
      /**
       * Verificamos que el resultado tiene todas las propiedades esperadas
       *
       * toHaveProperty() verifica que existe una propiedad en el objeto
       */
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('refreshTokenExpiresAt');
      expect(result).toHaveProperty('user');

      // Verificamos la estructura del usuario
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('role');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).toHaveProperty('lastName');

      // Verificamos tipos
      expect(typeof result.token).toBe('string');
      expect(typeof result.expiresAt).toBe('number');
      expect(typeof result.refreshToken).toBe('string');
      expect(typeof result.refreshTokenExpiresAt).toBe('number');
    });

    // ----------------------------------------------------------
    // TEST 6: Verificar que se genera el ID del refresh token
    // ----------------------------------------------------------
    it('should use idGenerator to create refresh token id and value', async () => {
      // ========== ARRANGE ==========
      const testUser = createTestUser();
      const loginInput: LoginInput = {
        email: testEmail,
        password: testPassword,
      };

      mockUserRepositoryFindByEmail.mockResolvedValue(testUser);
      mockPasswordHasherCompare.mockResolvedValue(true);
      mockRefreshTokenRepositoryCreate.mockResolvedValue(
        new RefreshToken(
          testRefreshTokenId,
          testRefreshTokenValue,
          testUserId,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          new Date(),
        ),
      );

      // ========== ACT ==========
      await loginUseCase.execute(loginInput);

      // ========== ASSERT ==========
      /**
       * Verificamos que idGenerator.generate() fue llamado 2 veces:
       * 1. Para generar el ID del refresh token
       * 2. Para generar el valor/token del refresh token
       */
      expect(mockIdGeneratorGenerate).toHaveBeenCalledTimes(2);
    });
  });
});
