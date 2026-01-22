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
- **Authentication**: JWT

## Technical Decisions

### Drizzle vs Prisma

**Drizzle** was chosen over Prisma as the ORM for the following reasons:

- **SQL-like syntax**: Drizzle exposes an API very close to standard SQL, making it easier to write complex queries and leverage existing SQL knowledge.
- **Better performance**: Lower runtime overhead and more efficient queries compared to alternatives like Prisma.
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
```

## Development

The project follows Clean Architecture to keep the domain independent of frameworks and external services.
