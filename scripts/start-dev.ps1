$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..
Write-Host "Starting in dev mode (watch)..."
docker compose -f docker-compose.dev.yml up --build
