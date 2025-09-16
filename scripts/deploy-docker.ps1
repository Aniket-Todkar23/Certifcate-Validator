# PramanMitra Docker Deployment Script
# PowerShell version for Windows Docker deployment

param(
    [string]$Environment = "production",
    [switch]$Build,
    [switch]$Stop,
    [switch]$Clean,
    [switch]$Logs
)

Write-Host "🐳 PramanMitra Docker Deployment Manager" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check Docker installation
function Check-Docker {
    $dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $dockerInstalled) {
        Write-Host "❌ Docker is not installed. Please install Docker Desktop." -ForegroundColor Red
        exit 1
    }
    
    $dockerComposeInstalled = Get-Command docker-compose -ErrorAction SilentlyContinue
    if (-not $dockerComposeInstalled) {
        Write-Host "⚠️  docker-compose not found, trying 'docker compose'..." -ForegroundColor Yellow
        $script:dockerCompose = "docker compose"
    } else {
        $script:dockerCompose = "docker-compose"
    }
    
    # Check if Docker is running
    try {
        docker ps | Out-Null
    }
    catch {
        Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Docker is ready" -ForegroundColor Green
}

# Build and start containers
function Start-Deployment {
    Write-Host "`n📦 Starting deployment..." -ForegroundColor Yellow
    
    if ($Build) {
        Write-Host "Building containers..." -ForegroundColor Yellow
        & $script:dockerCompose build --no-cache
    }
    
    Write-Host "Starting containers..." -ForegroundColor Yellow
    & $script:dockerCompose up -d
    
    Write-Host "`n✅ Deployment started successfully!" -ForegroundColor Green
    Write-Host "`nServices running at:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost" -ForegroundColor White
    Write-Host "  Backend API: http://localhost:5000" -ForegroundColor White
    
    if ($Logs) {
        Write-Host "`nShowing logs (Ctrl+C to exit)..." -ForegroundColor Yellow
        & $script:dockerCompose logs -f
    }
}

# Stop containers
function Stop-Deployment {
    Write-Host "`n🛑 Stopping containers..." -ForegroundColor Yellow
    & $script:dockerCompose down
    Write-Host "✅ Containers stopped" -ForegroundColor Green
}

# Clean up everything
function Clean-Deployment {
    Write-Host "`n🧹 Cleaning up..." -ForegroundColor Yellow
    Write-Host "This will remove:" -ForegroundColor Red
    Write-Host "  - All containers" -ForegroundColor White
    Write-Host "  - All volumes" -ForegroundColor White
    Write-Host "  - All images" -ForegroundColor White
    
    $confirm = Read-Host "`nAre you sure? (y/n)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        return
    }
    
    & $script:dockerCompose down -v --rmi all
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}

# Show container status
function Show-Status {
    Write-Host "`n📊 Container Status:" -ForegroundColor Cyan
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Show logs
function Show-Logs {
    Write-Host "`n📜 Showing logs (Ctrl+C to exit)..." -ForegroundColor Yellow
    & $script:dockerCompose logs -f
}

# Health check
function Check-Health {
    Write-Host "`n🏥 Health Check:" -ForegroundColor Cyan
    
    # Check frontend
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 5
        if ($frontendResponse.StatusCode -eq 200) {
            Write-Host "  ✅ Frontend: Healthy" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ❌ Frontend: Not responding" -ForegroundColor Red
    }
    
    # Check backend
    try {
        $backendResponse = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
        if ($backendResponse.StatusCode -eq 200) {
            Write-Host "  ✅ Backend: Healthy" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ❌ Backend: Not responding" -ForegroundColor Red
    }
}

# Main function
function Main {
    Check-Docker
    
    if ($Stop) {
        Stop-Deployment
    }
    elseif ($Clean) {
        Clean-Deployment
    }
    elseif ($Logs) {
        Show-Logs
    }
    else {
        Start-Deployment
        Show-Status
        
        # Wait for services to be ready
        Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        Check-Health
        
        Write-Host "`n📝 Quick Commands:" -ForegroundColor Cyan
        Write-Host "  View logs: .\scripts\deploy-docker.ps1 -Logs" -ForegroundColor White
        Write-Host "  Stop: .\scripts\deploy-docker.ps1 -Stop" -ForegroundColor White
        Write-Host "  Rebuild: .\scripts\deploy-docker.ps1 -Build" -ForegroundColor White
        Write-Host "  Clean up: .\scripts\deploy-docker.ps1 -Clean" -ForegroundColor White
    }
}

# Run main function
Main