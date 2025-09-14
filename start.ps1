# PramanMitra - Start Script
# This script starts both the Flask backend and React frontend concurrently

Write-Host "🚀 Starting PramanMitra Full Stack Application..." -ForegroundColor Green
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.7+ and try again." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 14+ and try again." -ForegroundColor Red
    exit 1
}

# Install Python dependencies if needed
Write-Host ""
Write-Host "📦 Checking Python dependencies..." -ForegroundColor Yellow
if (!(Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Install/update Python packages
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r backend/requirements.txt

# Check if frontend dependencies are installed
Write-Host ""
Write-Host "📦 Checking Frontend dependencies..." -ForegroundColor Yellow
if (!(Test-Path "frontend/node_modules")) {
    Write-Host "Installing Frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Install concurrently for running both servers
Write-Host ""
Write-Host "📦 Installing development tools..." -ForegroundColor Yellow
npm install concurrently --save-dev

Write-Host ""
Write-Host "🎉 All dependencies installed!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host "Backend (Flask): http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend (React): http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Gray
Write-Host ""

# Start both servers concurrently
npx concurrently --kill-others-on-fail --names "BACKEND,FRONTEND" --prefix-colors "red,blue" "powershell -File run-backend.ps1" "powershell -File run-frontend.ps1"
