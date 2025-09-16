# PramanMitra Deployment Script - Vercel (Frontend) + Railway (Backend)
# PowerShell version for Windows users

Write-Host "🚀 Starting PramanMitra deployment..." -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check for required tools
function Check-Requirements {
    Write-Host "`n📋 Checking requirements..." -ForegroundColor Yellow
    
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
    if (-not $vercelInstalled) {
        Write-Host "❌ Vercel CLI not found. Please install it:" -ForegroundColor Red
        Write-Host "npm install -g vercel" -ForegroundColor Yellow
        exit 1
    }
    
    $railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
    if (-not $railwayInstalled) {
        Write-Host "❌ Railway CLI not found. Please install it:" -ForegroundColor Red
        Write-Host "npm install -g @railway/cli" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ All requirements met" -ForegroundColor Green
}

# Deploy backend to Railway
function Deploy-Backend {
    Write-Host "`n📦 Deploying backend to Railway..." -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    
    Set-Location backend
    
    # Check if Railway is initialized
    if (-not (Test-Path ".railway/config.json")) {
        Write-Host "Initializing new Railway project..." -ForegroundColor Yellow
        railway init
    }
    
    # Deploy to Railway
    railway up
    
    # Try to get the deployment URL
    try {
        $status = railway status --json | ConvertFrom-Json
        $script:backendUrl = $status.url
        Write-Host "✅ Backend deployed to: $backendUrl" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Could not automatically retrieve Railway URL" -ForegroundColor Yellow
        Write-Host "Please get your Railway URL from: https://railway.app" -ForegroundColor Yellow
        $script:backendUrl = Read-Host "Enter your Railway backend URL"
    }
    
    Set-Location ..
}

# Deploy frontend to Vercel
function Deploy-Frontend {
    Write-Host "`n📦 Deploying frontend to Vercel..." -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    
    Set-Location frontend
    
    # Create production environment file
    @"
REACT_APP_API_URL=$($script:backendUrl)/api
REACT_APP_ENVIRONMENT=production
"@ | Out-File -FilePath .env.production -Encoding UTF8
    
    # Build the frontend
    Write-Host "Building frontend..." -ForegroundColor Yellow
    npm run build
    
    # Deploy to Vercel
    Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod
    
    Write-Host "✅ Frontend deployed successfully" -ForegroundColor Green
    
    Set-Location ..
}

# Main deployment flow
function Main {
    Check-Requirements
    
    Write-Host "`nThis script will deploy:" -ForegroundColor White
    Write-Host "  - Backend to Railway" -ForegroundColor Gray
    Write-Host "  - Frontend to Vercel" -ForegroundColor Gray
    Write-Host ""
    
    $continue = Read-Host "Continue? (y/n)"
    
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    Deploy-Backend
    Deploy-Frontend
    
    Write-Host "`n==================================" -ForegroundColor Green
    Write-Host "🎉 Deployment complete!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Configure environment variables in Railway dashboard" -ForegroundColor White
    Write-Host "2. Configure environment variables in Vercel dashboard" -ForegroundColor White
    Write-Host "3. Set up custom domains if needed" -ForegroundColor White
    Write-Host "4. Test your deployed application" -ForegroundColor White
    Write-Host "`nRailway Dashboard: https://railway.app/dashboard" -ForegroundColor Cyan
    Write-Host "Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
}

# Run main function
Main