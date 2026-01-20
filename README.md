# Booking Platform API

Backend API para la plataforma de reserva de citas, desarrollado con NestJS.

## Descripción

API RESTful que permite gestionar usuarios, profesionales, disponibilidades y reservas de citas, con integración de notificaciones y Google Calendar.

## Stack Tecnológico

- **Framework**: NestJS
- **Lenguaje**: TypeScript
- **Arquitectura**: Clean Architecture
- **Base de datos**: PostgreSQL (MVP)
- **Autenticación**: JWT

## Estructura del Proyecto

```
src/
├── domain/           # Capa de dominio (framework-agnostic)
│   ├── entities/     # Entidades del dominio
│   ├── enums/        # Enumeraciones del dominio
│   └── services/     # Interfaces de servicios
├── application/      # Casos de uso
├── infrastructure/   # Implementaciones concretas
└── interfaces/       # Adaptadores HTTP (controllers)
```

## Instalación

```bash
npm install
# o
pnpm install
```

## Scripts

```bash
# Desarrollo
npm run start:dev

# Build
npm run build

# Producción
npm run start:prod

# Tests
npm run test
npm run test:e2e

# Linting
npm run lint
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto con las variables de entorno necesarias:

```env
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

## Desarrollo

El proyecto sigue Clean Architecture para mantener el dominio independiente de frameworks y servicios externos.
