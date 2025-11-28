# ETS Events - Docker Deployment Script  (PowerShell)
# For Docker Swarm with Nginx Proxy Manager

$ErrorActionPreference = "Stop"

Write-Host "🚀 ETS Events Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found" -ForegroundColor Red
    Write-Host "Please create .env file with VITE_MAPBOX_TOKEN" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

$MAPBOX_TOKEN = $env:VITE_MAPBOX_TOKEN

if ([string]::IsNullOrEmpty($MAPBOX_TOKEN)) {
    Write-Host "❌ Error: VITE_MAPBOX_TOKEN not set in .env" -ForegroundColor Red
    exit 1
}

# Build the image
Write-Host ""
Write-Host "📦 Building Docker image..." -ForegroundColor Yellow
docker build --build-arg VITE_MAPBOX_TOKEN=$MAPBOX_TOKEN -t ets-events:latest .

Write-Host ""
Write-Host "✅ Build complete!" -ForegroundColor Green

# Check if stack is already deployed
$null = docker stack ps ets-events 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🔄 Updating existing stack..." -ForegroundColor Yellow
    docker service update --force ets-events_ets-events
} else {
    Write-Host ""
    Write-Host "🆕 Deploying new stack..." -ForegroundColor Yellow
    docker stack deploy -c docker-compose.ets-events.yml ets-events
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Tag and push to GHCR:"
Write-Host "   docker tag ets-events:latest ghcr.io/dlarsen395/ets-events:latest"
Write-Host "   docker push ghcr.io/dlarsen395/ets-events:latest"
Write-Host ""
Write-Host "2. Update in Portainer:"
Write-Host "   - Go to Stacks → ets-events"
Write-Host "   - Update service with 'Pull latest image'"
Write-Host ""
Write-Host "📊 Monitor deployment:" -ForegroundColor Cyan
Write-Host "   docker service ps ets-events_ets-events"
Write-Host "   docker service logs -f ets-events_ets-events"
