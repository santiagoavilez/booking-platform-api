# CircleCI y Coveralls - Guía de configuración paso a paso

## Resumen de cambios realizados

- **Archivo corregido**: `.circleci/config.yml` (antes estaba como `config,yml` con coma)
- **COVERALLS_REPO_TOKEN**: Eliminado de `.env` por seguridad. Debe configurarse solo en CircleCI
- **Coverage**: Ya funciona correctamente con `pnpm run test:cov` → genera `coverage/lcov.info`
- **Build job**: Simplificado para verificar el build sin ejecutar la app (no hay DB en ese job)

---

## Paso a paso: Configurar CircleCI

### 1. Crear cuenta en CircleCI

1. Ve a [circleci.com](https://circleci.com)
2. Haz clic en **"Sign Up"** o **"Log In"**
3. Elige **"Sign up with GitHub"** (o GitLab/Bitbucket según tu VCS)
4. Autoriza el acceso a tu cuenta de GitHub

### 2. Agregar el proyecto a CircleCI

1. Una vez dentro, haz clic en **"Projects"** en el menú lateral
2. Busca tu repositorio `booking-platform-api` en la lista
3. Haz clic en **"Set Up Project"** junto a tu repo
4. CircleCI detectará automáticamente el archivo `.circleci/config.yml`
5. Selecciona la rama principal (ej: `main` o `master`)
6. Haz clic en **"Set Up Project"**

El primer pipeline se ejecutará automáticamente.

### 3. Configurar variables de entorno en CircleCI

1. En el proyecto, ve a **"Project Settings"** (icono de engranaje)
2. En el menú lateral, haz clic en **"Environment Variables"**
3. Haz clic en **"Add Environment Variable"**
4. Agrega:

| Name                   | Value                     | Sensitive |
| ---------------------- | ------------------------- | --------- |
| `COVERALLS_REPO_TOKEN` | _(tu token de Coveralls)_ | ✅ Sí     |

El token lo obtienes en el paso de Coveralls (abajo).

---

## Paso a paso: Configurar Coveralls

### 1. Crear cuenta en Coveralls

1. Ve a [coveralls.io](https://coveralls.io)
2. Haz clic en **"Sign in with GitHub"**
3. Autoriza el acceso

### 2. Agregar el repositorio

1. En Coveralls, haz clic en **"Add Repos"**
2. Busca `booking-platform-api` y actívalo (toggle ON)
3. Si no aparece, verifica que el repo esté en GitHub y que hayas dado acceso

### 3. Obtener el Repo Token

1. Haz clic en tu repositorio en Coveralls
2. Ve a **"Settings"** (icono de engranaje)
3. En **"Repo Token"**, copia el valor (ej: `ojRCpC6mCeQV6pPwy9BprnmPq6I0D0evv`)
4. **Pega este valor** en CircleCI como variable `COVERALLS_REPO_TOKEN` (paso 3 de CircleCI)

> **Nota**: Repos privados requieren plan de pago en Coveralls. Repos públicos son gratuitos.

---

## Flujo del pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  Job: test                                                  │
│  1. Checkout código                                         │
│  2. Habilitar pnpm                                          │
│  3. Instalar dependencias (con caché)                       │
│  4. Esperar 5s a que PostgreSQL esté listo                  │
│  5. Ejecutar migraciones (drizzle-kit migrate)              │
│  6. Unit tests con coverage (pnpm run test:cov)             │
│  7. E2E tests (pnpm run test:e2e)                          │
│  8. Subir coverage a Coveralls                               │
│  9. Persistir workspace para el siguiente job               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Job: build_and_run (solo si test pasa)                      │
│  1. Adjuntar workspace                                      │
│  2. Habilitar pnpm                                          │
│  3. Build (pnpm run build)                                   │
│  4. Verificar que dist/src/main.js existe                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Badges para el README (opcional)

### CircleCI

```markdown
[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/LJRmAhaxKHfGNP9ixXPEW7/H1wYzKzRDxEguLd5ym9xyf/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/circleci/LJRmAhaxKHfGNP9ixXPEW7/H1wYzKzRDxEguLd5ym9xyf/tree/main)
```

### Coveralls

```markdown
[![Coverage Status](https://coveralls.io/repos/github/santiagoavilez/booking-platform-api/badge.svg?branch=main)](https://coveralls.io/github/santiagoavilez/booking-platform-api?branch=main)
```

Reemplaza `TU_ORG` por tu usuario u organización de GitHub.

---

## Solución de problemas

### El job "test" falla en migraciones

- **Causa**: PostgreSQL no está listo a tiempo
- **Solución**: Aumenta el `sleep 5` a `sleep 10` en el paso "Wait for PostgreSQL"

### Coveralls no recibe el coverage

- Verifica que `COVERALLS_REPO_TOKEN` esté configurado en CircleCI (Project Settings → Environment Variables)
- El token debe marcarse como **Sensitive**
- El archivo `coverage/lcov.info` se genera con `pnpm run test:cov`

### El build falla en "Build application"

- Verifica que `pnpm run build` funcione localmente
- Revisa que no haya errores de TypeScript o dependencias faltantes
