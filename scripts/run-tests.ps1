# Run tests with Docker (run from project root or with path to project)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Running tests..."
docker compose -f docker-compose.yml -f docker-compose.test.yml --profile test up --build --abort-on-container-exit test
docker compose -f docker-compose.yml -f docker-compose.test.yml --profile test down
