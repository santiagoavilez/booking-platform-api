booking-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── domain/                     # 🔒 PURO dominio
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   ├── professional.entity.ts
│   │   │   ├── availability.entity.ts
│   │   │   ├── appointment.entity.ts
│   │   │   └── notification.entity.ts
│   │   │
│   │   ├── value-objects/
│   │   │   ├── email.vo.ts
│   │   │   ├── datetime.vo.ts
│   │   │   └── role.vo.ts
│   │   │
│   │   ├── repositories/           # Interfaces
│   │   │   ├── user.repository.ts
│   │   │   ├── appointment.repository.ts
│   │   │   └── notification.repository.ts
│   │   │
│   │   └── services/
│   │       └── notification-strategy.interface.ts
│   │
│   ├── application/                # 🧠 Casos de uso
│   │   ├── use-cases/
│   │   │   ├── create-user.usecase.ts
│   │   │   ├── login-user.usecase.ts
│   │   │   ├── define-availability.usecase.ts
│   │   │   ├── create-appointment.usecase.ts
│   │   │   └── send-notifications.usecase.ts
│   │   │
│   │   └── dtos/                   # DTOs internos
│   │
│   ├── infrastructure/             # 🧱 Implementaciones
│   │   ├── database/
│   │   │   ├── drizzle/
│   │   │   │   ├── schema.ts
│   │   │   │   └── index.ts
│   │   │   └── repositories/
│   │   │       ├── drizzle-user.repository.ts
│   │   │       └── drizzle-appointment.repository.ts
│   │   │
│   │   ├── services/
│   │   │   ├── bcrypt-password-hasher.ts
│   │   │   └── uuid-id-generator.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── email.strategy.ts
│   │   │   ├── sms.strategy.ts
│   │   │   ├── push.strategy.ts
│   │   │   └── notification-strategy.factory.ts
│   │   │
│   │   └── calendar/
│   │       └── google-calendar.service.ts
│   │
│   ├── interfaces/                 # 🌐 Adaptadores (HTTP)
│   │   ├── http/
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── professional.controller.ts
│   │   │   │   └── appointment.controller.ts
│   │   │   │
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   │
│   │   │   └── mappers/             # DTO <-> Domain
│   │   │
│   │   └── providers.ts             # Inyección de dependencias
│   │
│   └── shared/                     # helpers internos
│
├── test/
├── drizzle/
├── package.json
├── tsconfig.json
└── README.md