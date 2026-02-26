#!/bin/sh
set -e
cd "$(dirname "$0")/.."
echo "Running tests..."
docker compose -f docker-compose.yml -f docker-compose.test.yml --profile test up --build --abort-on-container-exit test
docker compose -f docker-compose.yml -f docker-compose.test.yml --profile test down
