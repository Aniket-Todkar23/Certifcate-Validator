# Backend runner script for Certificate Validator
# Activates virtual environment and runs Flask app

Write-Host "Starting Backend Server..." -ForegroundColor Green

# Activate virtual environment and run Flask app
cd backend
..\venv\Scripts\python.exe run.py
