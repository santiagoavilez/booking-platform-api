# Booking Platform API

Backend API for the appointment booking platform, built with NestJS.

## Description

RESTful API for managing users, professionals, availability, and appointment bookings, with notifications and Google Calendar integration.

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Architecture**: Clean Architecture
- **Database**: PostgreSQL (MVP)
- **ORM**: Drizzle
- **Authentication**:

## Badges

### CircleCI

[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/LJRmAhaxKHfGNP9ixXPEW7/H1wYzKzRDxEguLd5ym9xyf/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/circleci/LJRmAhaxKHfGNP9ixXPEW7/H1wYzKzRDxEguLd5ym9xyf/tree/main)

### Coveralls

[![Coverage Status](https://coveralls.io/repos/github/santiagoavilez/booking-platform-api/badge.svg?branch=main)](https://coveralls.io/github/santiagoavilez/booking-platform-api?branch=main)

Says 75% coverage, but it's actually 90% in the latest build (click on the badge to see the latest build).

Badges reflect the latest build on `main`.

## Running with Docker

Only Docker is required. From the project root:

| Mode                             | Windows (PowerShell)      | Linux / Mac / Git Bash      |
| -------------------------------- | ------------------------- | --------------------------- |
| **Dev** (watch mode, hot reload) | `.\scripts\start-dev.ps1` | `bash scripts/start-dev.sh` |
| **Prod** (production build)      | `.\scripts\start-app.ps1` | `bash scripts/start-app.sh` |
| **Test** (unit + E2E)            | `.\scripts\run-tests.ps1` | `bash scripts/run-tests.sh` |

API: http://localhost:3000 | Swagger: http://localhost:3000/api

## Technical Decisions

### NestJS vs Express vs Fastify

**NestJS** was chosen as the framework for the following reasons:

- **Structure and conventions**: Built-in modular architecture, dependency injection, and clear separation of concerns reduce boilerplate and enforce consistency.
- **TypeScript-first**: Native TypeScript support with decorators, making it ideal for large-scale applications.
- **Enterprise-ready**: Guards, interceptors, pipes, and middleware out of the box simplify authentication, validation, and error handling.

### TypeScript vs JavaScript

**TypeScript** was chosen for the following reasons:

- **Type safety**: Catches errors at compile time, reducing runtime bugs and improving refactoring confidence.
- **Better tooling**: Enhanced IDE support, autocomplete, and documentation through type definitions.
- **Maintainability**: Self-documenting code and clearer contracts between modules, especially in a layered architecture.

### Clean Architecture

**Clean Architecture** was adopted for the following reasons:

- **Framework independence**: The domain layer has no dependencies on NestJS, Drizzle, or external services, making it testable and portable.
- **Testability**: Use cases depend on interfaces (repositories, services), allowing easy mocking in unit tests.
- **Flexibility**: Swapping ORMs, databases, or HTTP frameworks requires changes only in the infrastructure and interfaces layers, not in business logic.

### Drizzle vs Prisma vs TypeORM

**Drizzle** was chosen over Prisma and TypeORM as the ORM for the following reasons:

- **SQL-like syntax**: Drizzle exposes an API very close to standard SQL, making it easier to write complex queries and leverage existing SQL knowledge.
- **Better performance**: Lower runtime overhead and more efficient queries compared to alternatives like Prisma and TypeORM.
- **Lighter weight**: Fewer dependencies and a smaller bundle, resulting in faster builds and lower resource usage.

## Project Structure

```
src/
├── domain/           # Domain layer (framework-agnostic)
│   ├── entities/     # Domain entities
│   ├── enums/        # Domain enums
│   └── services/     # Service interfaces
├── application/      # Use cases
├── infrastructure/   # Concrete implementations
└── interfaces/       # HTTP adapters (controllers)
```

## Installation

```bash
npm install
# or
pnpm install
```

## Scripts

```bash
# Development
pnpm run start:dev

# Build
pnpm run build

# Production
pnpm run start:prod

# Tests
pnpm run test
pnpm run test:e2e

# Linting
pnpm run lint
```

## Configuration

Create a `.env` file in the project root with the required environment variables:

```env
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGIN=http://localhost:5173
```
