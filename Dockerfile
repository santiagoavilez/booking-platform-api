# ========== Builder stage: install deps and build ==========
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm via Corepack (bundled with Node 16.9+)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lockfile and package.json first (better layer caching)
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Rebuild native modules (e.g. bcrypt) when pnpm ignores build scripts
RUN pnpm rebuild

# Copy source and config
COPY . .

# Build the application
RUN pnpm run build

# ========== Production stage: run API ==========
FROM node:20-alpine AS production

WORKDIR /app

# Enable pnpm for running migrate and start commands
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only what's needed to run and migrate
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Migrations and config required for drizzle-kit migrate
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./

EXPOSE 3000

# Migrate then start (override in compose if needed)
CMD ["sh", "-c", "pnpm exec drizzle-kit migrate && pnpm run start:prod"]
