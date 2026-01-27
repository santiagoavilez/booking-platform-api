¿El test de Login es Unitario o E2E?
Es un TEST UNITARIO. Aquí está la diferencia:
Test Unitario (lo que creamos)

```typescript
// login.use-case.spec.ts
// ✅ Usa MOCKS - objetos falsos que simulan dependencias
mockUserRepository = { findByEmail: jest.fn() };
mockPasswordHasher = { compare: jest.fn() };
// ✅ Prueba UNA UNIDAD en aislamiento (el use case)
// ✅ No hay conexión a BD, no hay HTTP, no hay servicios reales
// ✅ Es RÁPIDO (milisegundos)
// ✅ Es DETERMINISTA (siempre mismo resultado)
```

Test E2E (End-to-End)
```typescript
// test/auth.e2e-spec.ts (ejemplo de cómo sería)
// ❌ NO usa mocks - usa servicios REALES
// ❌ Requiere BD real corriendo
// ❌ Hace peticiones HTTP reales a la API
// ❌ Es más LENTO (segundos)
// ❌ Puede fallar por factores externos

describe('Auth E2E', () => {
  it('POST /auth/login should return token', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@test.com', password: '123456' })
      .expect(200)
      .expect((res) => {
        expect(res.body.token).toBeDefined();
      });
  });
});
```

Comparación Visual

┌─────────────────────────────────────────────────────────────┐
│                    TEST UNITARIO                            │
│                                                             │
│   [Test] ──mock──> [Use Case] ──mock──> [Repository]        │
│                         │                                   │
│                    (código real)                            │
│                                                             │
│   Solo probamos el Use Case, todo lo demás es falso         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      TEST E2E                               │
│                                                             │
│   [Test] ──HTTP──> [Controller] ──> [Use Case] ──> [Repo]   │
│                         │               │            │      │
│                    (todo real)     (todo real)  (BD real)   │
│                                                             │
│   Probamos todo el flujo completo, de principio a fin       │
└─────────────────────────────────────────────────────────────┘

        /\
       /  \        Tests E2E (pocos, lentos, costosos)
      /────\       └─ Prueban flujos completos
     /      \
    /        \     Tests de Integración (algunos)
   /──────────\    └─ Prueban componentes conectados
  /            \
 /              \  Tests Unitarios (muchos, rápidos, baratos)
/________________\ └─ Prueban unidades aisladas ← ESTO ES LO QUE CREAMOS

Resumen
Pregunta	Respuesta
¿Por qué en src/ y no en test/?	Convención de co-located tests para unitarios
¿Viola Clean Architecture?	No, los tests no son código de producción
¿Es unitario o E2E?	Unitario - usa mocks, prueba en aislamiento
¿Dónde irían los E2E?	En test/ con extensión .e2e-spec.ts
