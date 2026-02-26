#!/bin/sh
set -e
cd "$(dirname "$0")/.."
echo "Starting PostgreSQL and API..."
docker compose up -d db
sleep 5
docker compose up -d --build api
echo "API: http://localhost:3000  |  Swagger: http://localhost:3000/api"
