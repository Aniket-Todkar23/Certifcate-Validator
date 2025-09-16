# PramanMitra Deployment Script - Vercel (Full-Stack) + Neon Database
# PowerShell version for Windows users

Write-Host "🚀 PramanMitra Deployment to Vercel + Neon" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check for required tools
function Check-Requirements {
    Write-Host "`n📋 Checking requirements..." -ForegroundColor Yellow
    
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
    if (-not $vercelInstalled) {
        Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
        npm install -g vercel
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
            exit 1
        }
    }
    
    $nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeInstalled) {
        Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
    
    $pythonInstalled = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonInstalled) {
        Write-Host "❌ Python not found. Please install Python 3.9+" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ All requirements met" -ForegroundColor Green
}

# Install dependencies
function Install-Dependencies {
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Cyan
    
    # Install backend dependencies
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    Set-Location backend
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
    
    # Install frontend dependencies
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
    
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}

# Environment setup
function Setup-Environment {
    Write-Host "`n🔧 Environment setup..." -ForegroundColor Cyan
    
    Write-Host "Before deploying, please ensure you have:" -ForegroundColor Yellow
    Write-Host "1. Created a Neon database at https://neon.tech" -ForegroundColor White
    Write-Host "2. Copied your Neon connection string" -ForegroundColor White
    Write-Host "3. Prepared your environment variables" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "Have you completed the above steps? (y/n)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-Host "Please complete the setup first:" -ForegroundColor Yellow
        Write-Host "1. Go to https://neon.tech and create a project" -ForegroundColor White
        Write-Host "2. Get your connection string (looks like: postgresql://...)" -ForegroundColor White
        Write-Host "3. Come back and run this script again" -ForegroundColor White
        exit 0
    }
    
    $databaseUrl = Read-Host "Enter your Neon DATABASE_URL"
    if (-not $databaseUrl) {
        Write-Host "❌ DATABASE_URL is required" -ForegroundColor Red
        exit 1
    }
    
    # Generate secure JWT secret
    $jwtSecret = -join ((1..50) | ForEach-Object { (Get-Random -InputObject "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") })
    $flaskSecret = -join ((1..50) | ForEach-Object { (Get-Random -InputObject "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") })
    
    Write-Host "✅ Environment variables prepared" -ForegroundColor Green
    
    return @{
        DATABASE_URL = $databaseUrl
        JWT_SECRET_KEY = $jwtSecret
        FLASK_SECRET_KEY = $flaskSecret
    }
}

# Deploy to Vercel
function Deploy-To-Vercel {
    param($envVars)
    
    Write-Host "`n🚀 Deploying to Vercel..." -ForegroundColor Cyan
    
    # Deploy with environment variables
    Write-Host "Setting up Vercel project..." -ForegroundColor Yellow
    vercel --prod --env DATABASE_URL="$($envVars.DATABASE_URL)" --env JWT_SECRET_KEY="$($envVars.JWT_SECRET_KEY)" --env FLASK_SECRET_KEY="$($envVars.FLASK_SECRET_KEY)" --env VERCEL=true --env FLASK_ENV=production
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
}

# Initialize database
function Initialize-Database {
    param($envVars)
    
    Write-Host "`n🗄️ Initializing database..." -ForegroundColor Cyan
    
    # Set environment variables for local script
    $env:DATABASE_URL = $envVars.DATABASE_URL
    $env:JWT_SECRET_KEY = $envVars.JWT_SECRET_KEY
    $env:FLASK_SECRET_KEY = $envVars.FLASK_SECRET_KEY
    
    # Run database initialization
    Write-Host "Creating database schema and initial data..." -ForegroundColor Yellow
    python backend/init_production_db.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database initialized successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Database initialization had issues - check logs" -ForegroundColor Yellow
        Write-Host "You can run the script manually later: python backend/init_production_db.py" -ForegroundColor White
    }
}

# Main deployment flow
function Main {
    try {
        Check-Requirements
        Install-Dependencies
        
        $envVars = Setup-Environment
        
        Write-Host "`nDeployment Summary:" -ForegroundColor White
        Write-Host "  - Frontend: React app served by Vercel" -ForegroundColor Gray
        Write-Host "  - Backend: Flask API serverless functions on Vercel" -ForegroundColor Gray
        Write-Host "  - Database: PostgreSQL on Neon" -ForegroundColor Gray
        Write-Host ""
        
        $continue = Read-Host "Proceed with deployment? (y/n)"
        if ($continue -ne 'y' -and $continue -ne 'Y') {
            Write-Host "Deployment cancelled." -ForegroundColor Yellow
            exit 0
        }
        
        Deploy-To-Vercel $envVars
        Initialize-Database $envVars
        
        Write-Host "`n=============================================" -ForegroundColor Green
        Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
        Write-Host "`nYour application is now live!" -ForegroundColor Yellow
        Write-Host "`nNext Steps:" -ForegroundColor Yellow
        Write-Host "1. Test your deployed application" -ForegroundColor White
        Write-Host "2. Change the default admin password (admin/admin123)" -ForegroundColor White
        Write-Host "3. Upload your certificate data via the admin panel" -ForegroundColor White
        Write-Host "4. Configure any custom domain if needed" -ForegroundColor White
        Write-Host "`nDashboards:" -ForegroundColor Cyan
        Write-Host "• Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Blue
        Write-Host "• Neon Dashboard: https://console.neon.tech/" -ForegroundColor Blue
        
    } catch {
        Write-Host "`n❌ Deployment failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Run main function
Main