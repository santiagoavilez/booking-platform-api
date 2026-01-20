# Desafío Técnico – Full Stack
## Sistema de Reserva de Citas para Profesionales

### Descripción General

Desarrollar un MVP funcional de una plataforma de reservas de citas para profesionales (psicólogos, psiquiatras, terapeutas, abogados, etc.).

El sistema permitirá que profesionales se registren, definan sus horarios de atención y reciban reservas de citas por parte de usuarios clientes. Cada reserva generará notificaciones automáticas por Email, SMS y Push, y creará eventos sincronizados en Google Calendar tanto para el cliente como para el profesional.

El proyecto debe priorizar simplicidad, claridad arquitectónica y extensibilidad futura.

## Roles del Sistema

### 1. Usuario Cliente

- Puede registrarse y autenticarse.
- Puede buscar profesionales.
- Puede reservar citas.
- Puede recibir notificaciones y eventos de calendario.

### 2. Profesional

- Puede registrarse y autenticarse.
- Puede configurar sus horarios de atención.
- Puede recibir reservas de citas.
- Puede reservar citas con otros profesionales (actúa también como cliente).
- Puede recibir notificaciones y eventos de calendario.

## Requerimientos Funcionales

### 1. Autenticación y Autorización

- Registro e inicio de sesión con email y contraseña.
- Emisión de token de acceso.
- Todos los endpoints protegidos deben requerir autenticación.
- El sistema debe distinguir roles (cliente / profesional).

### 2. Gestión de Profesionales

- Un usuario puede registrarse como profesional.
- Un profesional debe poder:
  - Definir su información básica (nombre, especialidad).
  - Configurar sus horarios de atención semanales.
  - Los horarios deben considerarse disponibles para reservas.

### 3. Gestión de Disponibilidad

- Un profesional define bloques de disponibilidad (día + rango horario).
- El sistema debe:
  - Exponer los horarios disponibles.
  - Evitar reservas en horarios ocupados.
- No se requiere gestión avanzada de excepciones (feriados, ausencias).

### 4. Reservas de Citas

- Un usuario cliente puede:
  - Seleccionar un profesional.
  - Ver horarios disponibles.
  - Reservar una cita en un horario libre.
- Un profesional puede reservar citas con otros profesionales.
- Al reservar:
  - Se crea una cita persistida en la base de datos.
  - El horario queda bloqueado.

### 5. Integración con Google Calendar

- Cada reserva debe generar:
  - Un evento en el Google Calendar del cliente.
  - Un evento en el Google Calendar del profesional.
- El evento debe contener:
  - Fecha y hora.
  - Nombre del profesional.
  - Nombre del cliente.
- No se requiere manejo avanzado de permisos ni revocaciones.

### 6. Sistema de Notificaciones

- Cada vez que se crea una reserva, se deben enviar notificaciones por:
  - Email
  - SMS
  - Push Notification
- Las notificaciones deben enviarse a:
  - Usuario cliente.
  - Profesional.
- Cada canal debe tener lógica independiente de envío.
- El sistema debe permitir agregar nuevos canales sin modificar lógica existente.

### 7. Gestión de Notificaciones

- Cada notificación debe:
  - Persistirse en la base de datos.
  - Registrar canal, destinatario y estado.
- No se requiere reintentos ni colas.

## Requerimientos de Arquitectura

- Arquitectura basada en Clean Architecture:
  - Dominio
  - Casos de uso
  - Infraestructura
  - Interfaces (API)
- Sistema de notificaciones implementado con Strategy Pattern:
  - Una estrategia por canal (Email, SMS, Push).
- El dominio no debe depender de frameworks ni servicios externos.

## Requerimientos Técnicos

### Backend:

- API RESTful.
- Persistencia en base de datos relacional.

### Frontend:

- Interfaz simple para:
  - Registro / Login.
  - Selección de profesional.
  - Visualización de horarios.
  - Reserva de cita.
- La aplicación debe ser funcional, no estética.

## Alcance del MVP (Explícitamente Fuera)

- ❌ Pagos
- ❌ Cancelación o reprogramación de citas
- ❌ Recordatorios automáticos previos
- ❌ Chats entre usuarios
- ❌ Panel administrativo
- ❌ Manejo avanzado de calendarios (feriados, excepciones, buffers)
- ❌ Multimoneda o internacionalización

## Criterios de Evaluación

- Claridad del dominio y casos de uso.
- Separación correcta de responsabilidades.
- Correcta aplicación de Clean Architecture.
- Extensibilidad del sistema de notificaciones.
- Simplicidad y foco en lo esencial.
