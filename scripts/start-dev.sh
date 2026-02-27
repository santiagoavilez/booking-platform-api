#!/bin/sh
set -e
cd "$(dirname "$0")/.."
echo "Starting in dev mode (watch)..."
docker compose -f docker-compose.dev.yml up --build
