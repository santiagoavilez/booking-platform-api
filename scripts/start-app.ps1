# Start app + PostgreSQL (run from project root or with path to project)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Starting PostgreSQL and API..."
docker compose up -d db
Start-Sleep -Seconds 5
docker compose up -d --build api
Write-Host "API: http://localhost:3000  |  Swagger: http://localhost:3000/api"
