# PramanMitra - Quick Start Script
# Simple and reliable startup for both frontend and backend

Write-Host ""
Write-Host "PramanMitra - Quick Start" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow

if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python not found. Please install Python 3.7+ and try again." -ForegroundColor Red
    exit 1
}

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Please install Node.js 14+ and try again." -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Dependencies found!" -ForegroundColor Green

# Setup virtual environment if needed
if (!(Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
.\venv\Scripts\python.exe -m pip install -r requirements.txt --quiet

# Install root npm dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install --silent

# Install frontend dependencies if needed
if (!(Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install --silent
    Set-Location ..
}

# Initialize database if needed
if (!(Test-Path "certificate_validator.db")) {
    Write-Host "Initializing database..." -ForegroundColor Yellow
    .\venv\Scripts\python.exe init_db.py
}

Write-Host ""
Write-Host "Setup complete! Starting servers..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend (Flask): http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend (React): http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Gray
Write-Host ""

# Start both servers
try {
    npm start
} catch {
    Write-Host "ERROR: Failed to start servers. Check error messages above." -ForegroundColor Red
    exit 1
}
