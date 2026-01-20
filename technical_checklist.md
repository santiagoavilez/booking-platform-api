# Checklist Técnico

> **Nota**: Pensado para columnas: Backlog → To Do → Doing → Review → Done

## 🟦 FASE 0 — Setup

- Crear monorepo (apps/web, apps/api, packages/shared)
- Inicializar NestJS (API)
- Inicializar React.js (Web)
- Configurar Tailwind + shadcn/ui
- Configurar DB y variables de entorno
- Setup linting y scripts básicos

## 🟦 FASE 1 — Dominio (API)

- Definir entidad User
- Definir entidad ProfessionalProfile
- Definir entidad AvailabilitySlot
- Definir entidad Appointment
- Definir entidad Notification
- Definir enums compartidos (Role, NotificationChannel)
- Crear interfaces de repositorios
- Definir casos de uso principales

## 🟦 FASE 2 — Autenticación

- Endpoint de registro
- Endpoint de login
- JWT auth guard
- Manejo de roles (CLIENT / PROFESSIONAL)
- DTOs de auth compartidos (shared)

## 🟦 FASE 3 — Profesionales

- Endpoint crear perfil profesional
- Endpoint obtener perfil profesional
- Endpoint listar profesionales
- Validaciones mínimas

## 🟦 FASE 4 — Disponibilidad

- Endpoint definir disponibilidad semanal
- Persistir availability slots
- Endpoint consultar disponibilidad pública
- Validar solapamientos

## 🟦 FASE 5 — Reservas (CORE)

- Endpoint crear appointment
- Validar disponibilidad en tiempo real
