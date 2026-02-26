# Docker – resumen de la dockerización

## Cómo levantar la app (solo con Docker instalado)

**Windows (PowerShell):**
```powershell
.\scripts\start-app.ps1
```

**Linux/Mac/Git Bash:**
```bash
bash scripts/start-app.sh
```

La API queda en http://localhost:3000 y Swagger en http://localhost:3000/api.

---

## Cómo correr los tests

**Windows:**
```powershell
.\scripts\run-tests.ps1
```

**Linux/Mac/Git Bash:**
```bash
bash scripts/run-tests.sh
```

---

## Cambios hechos de punta a punta

### 1. Dockerfile (multi-stage)

- **Stage `builder`:** Instala dependencias con **pnpm** (Corepack), hace `pnpm rebuild` (módulos nativos como bcrypt), copia el código y ejecuta `pnpm run build`. Resultado: `dist/` y `node_modules/` listos.
- **Stage `production`:** Imagen mínima solo para ejecutar. Se copian `package.json`, `pnpm-lock.yaml`, `node_modules`, `dist`, la carpeta **drizzle** (migraciones) y **drizzle.config.ts**. El arranque es: migrar y luego iniciar la API con `pnpm run start:prod`.

### 2. docker-compose.yml

- **api:** Se construye con `target: production`. Recibe `DATABASE_URL` apuntando al servicio `db`. Al iniciar ejecuta `pnpm exec drizzle-kit migrate` y después `pnpm run start:prod` (migraciones + arranque en un solo comando).
- **db:** PostgreSQL 16 Alpine, con healthcheck. Volumen para persistir datos.

### 3. docker-compose.test.yml (perfil `test`)

- **test:** Usa el stage **builder** del Dockerfile (tiene código fuente y deps de desarrollo). Conecta a **db-test**. Comando: migrar y luego `pnpm test`.
- **db-test:** PostgreSQL solo para tests, sin puertos expuestos.

### 4. Scripts

- Todo está en **scripts/**: `start-app.ps1`, `run-tests.ps1` (Windows) y `start-app.sh`, `run-tests.sh` (Linux/Mac/Git Bash).
- En Windows se usan los `.ps1` para no depender de WSL ni de `/bin/bash` (evita el error con la distro `docker-desktop`).

### 5. .dockerignore

- Se excluyen `node_modules`, `dist`, `.env*`, `coverage`, `.cursor`, `.vscode` para que el build sea más rápido y no suba secretos.

---

## Por qué el error con `bash scripts/start-app.sh`

En Windows, `bash` suele resolverse con WSL. Si la distro por defecto es **docker-desktop**, es una imagen mínima para el motor de Docker y **no trae `/bin/bash`**. Por eso falla `execvpe(/bin/bash) failed`.  
Solución: en Windows usar los scripts PowerShell (`.\scripts\start-app.ps1` y `.\scripts\run-tests.ps1`).
